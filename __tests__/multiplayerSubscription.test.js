/**
 * Test for multiplayer subscription bug fix
 * 
 * Bug: Host couldn't see players joining lobby after creating a second game
 * 
 * Root cause: Event listeners from old channel weren't being cleaned up properly
 * because the cleanup function captured `this.currentChannel` at cleanup time
 * rather than at subscription time.
 */

// Mock Supabase
const mockChannels = new Map();
let mockChannelCounter = 0;

class MockChannel {
  constructor(name) {
    this.name = name;
    this.id = ++mockChannelCounter;
    this.listeners = new Map();
    this.subscribed = false;
  }

  on(type, config, handler) {
    const key = `${type}:${config.event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(handler);
    return this;
  }

  off(type, config, handler) {
    const key = `${type}:${config.event}`;
    const handlers = this.listeners.get(key);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  async send(message) {
    // Simulate broadcasting to all listeners on this channel
    const key = `${message.type}:${message.event}`;
    const handlers = this.listeners.get(key);
    if (handlers) {
      // Simulate async broadcast
      setTimeout(() => {
        handlers.forEach(handler => {
          handler({ payload: message.payload });
        });
      }, 10);
    }
    return 'ok';
  }

  async subscribe(callback) {
    this.subscribed = true;
    // Simulate async subscription
    setTimeout(() => {
      callback('SUBSCRIBED');
    }, 10);
    return this;
  }

  async unsubscribe() {
    this.subscribed = false;
    return 'ok';
  }

  getListenerCount(event) {
    const key = `broadcast:${event}`;
    const handlers = this.listeners.get(key);
    return handlers ? handlers.length : 0;
  }
}

const mockSupabase = {
  channel: (name) => {
    const channel = new MockChannel(name);
    mockChannels.set(name, channel);
    return channel;
  },
  from: () => ({
    upsert: () => ({ error: null }),
    select: () => ({
      eq: () => ({
        eq: () => ({
          single: () => ({
            data: {
              id: 'test-game-id',
              channel_name: 'test-channel',
              host_id: 'host-123',
              difficulty: 'medium',
              lives: 5,
              status: 'waiting',
            },
            error: null,
          }),
        }),
      }),
    }),
    update: () => ({
      eq: () => ({ error: null }),
    }),
  }),
};

// Mock the supabase client
jest.mock('../utils/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
const { multiplayerService } = require('../utils/multiplayerService');

describe('Multiplayer Subscription Bug Fix', () => {
  beforeEach(() => {
    // Clear mock channels
    mockChannels.clear();
    mockChannelCounter = 0;
  });

  it('should properly clean up event listeners when creating a second game', async () => {
    // FIRST GAME SESSION
    console.log('\n=== FIRST GAME SESSION ===');
    
    // Host creates first game
    const game1 = await multiplayerService.createGame(
      'test-game-1',
      'Host Player',
      'medium',
      5
    );
    
    expect(game1.channelName).toBe('test-game-1');
    expect(multiplayerService.currentChannel).toBeTruthy();
    
    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const firstChannel = multiplayerService.currentChannel;
    expect(firstChannel.subscribed).toBe(true);
    
    // Set up subscription to track players
    const firstGamePlayers = [];
    const unsubscribe1 = multiplayerService.subscribeToPlayers((players) => {
      console.log('First game - Players updated:', players.map(p => p.name));
      firstGamePlayers.push([...players]);
    });
    
    // Wait for initial subscription callback
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Check that listeners are registered on first channel
    expect(firstChannel.getListenerCount('player-joined')).toBe(1);
    expect(firstChannel.getListenerCount('request-player-list')).toBe(1);
    expect(firstChannel.getListenerCount('my-player-info')).toBe(1);
    
    // Player joins first game
    console.log('Simulating player join in first game...');
    await firstChannel.send({
      type: 'broadcast',
      event: 'player-joined',
      payload: { playerId: 'player-1', playerName: 'Player 1' },
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify first game received the join
    const lastPlayersInGame1 = firstGamePlayers[firstGamePlayers.length - 1];
    expect(lastPlayersInGame1).toHaveLength(2); // Host + Player 1
    expect(lastPlayersInGame1.some(p => p.name === 'Player 1')).toBe(true);
    
    // Clean up first game
    console.log('Cleaning up first game...');
    unsubscribe1();
    await multiplayerService.leaveGame();
    
    // Verify listeners were removed from first channel
    expect(firstChannel.getListenerCount('player-joined')).toBe(0);
    expect(firstChannel.getListenerCount('request-player-list')).toBe(0);
    expect(firstChannel.getListenerCount('my-player-info')).toBe(0);
    
    // SECOND GAME SESSION
    console.log('\n=== SECOND GAME SESSION ===');
    
    // Host creates second game
    const game2 = await multiplayerService.createGame(
      'test-game-2',
      'Host Player',
      'medium',
      5
    );
    
    expect(game2.channelName).toBe('test-game-2');
    expect(multiplayerService.currentChannel).toBeTruthy();
    
    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const secondChannel = multiplayerService.currentChannel;
    expect(secondChannel.subscribed).toBe(true);
    expect(secondChannel.id).not.toBe(firstChannel.id); // Different channel
    
    // Set up subscription for second game
    const secondGamePlayers = [];
    const unsubscribe2 = multiplayerService.subscribeToPlayers((players) => {
      console.log('Second game - Players updated:', players.map(p => p.name));
      secondGamePlayers.push([...players]);
    });
    
    // Wait for initial subscription callback
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Check that listeners are registered on second channel
    expect(secondChannel.getListenerCount('player-joined')).toBe(1);
    expect(secondChannel.getListenerCount('request-player-list')).toBe(1);
    expect(secondChannel.getListenerCount('my-player-info')).toBe(1);
    
    // Verify first channel still has no listeners
    expect(firstChannel.getListenerCount('player-joined')).toBe(0);
    expect(firstChannel.getListenerCount('request-player-list')).toBe(0);
    expect(firstChannel.getListenerCount('my-player-info')).toBe(0);
    
    // Player joins second game - THIS IS THE BUG TEST
    console.log('Simulating player join in second game...');
    await secondChannel.send({
      type: 'broadcast',
      event: 'player-joined',
      payload: { playerId: 'player-2', playerName: 'Player 2' },
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // THE FIX: Verify second game received the join
    const lastPlayersInGame2 = secondGamePlayers[secondGamePlayers.length - 1];
    console.log('Final players in second game:', lastPlayersInGame2);
    
    // This is the critical assertion - if the bug exists, this will fail
    // because the subscription won't be working properly
    expect(lastPlayersInGame2).toHaveLength(2); // Host + Player 2
    expect(lastPlayersInGame2.some(p => p.name === 'Player 2')).toBe(true);
    expect(lastPlayersInGame2.some(p => p.name === 'Host Player')).toBe(true);
    
    // Clean up
    unsubscribe2();
    await multiplayerService.leaveGame();
    
    console.log('\n=== TEST PASSED ===');
    console.log('Host successfully saw player join in second game session!');
  }, 10000); // Increase timeout for async operations

  it('should maintain separate player lists for each game session', async () => {
    // Create first game
    await multiplayerService.createGame('game-1', 'Host', 'medium', 5);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const players1 = [];
    const unsubscribe1 = multiplayerService.subscribeToPlayers((players) => {
      players1.push([...players]);
    });
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Add player to first game
    await multiplayerService.currentChannel.send({
      type: 'broadcast',
      event: 'player-joined',
      payload: { playerId: 'player-1', playerName: 'Alice' },
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const game1FinalPlayers = players1[players1.length - 1];
    expect(game1FinalPlayers.some(p => p.name === 'Alice')).toBe(true);
    
    // Clean up and create second game
    unsubscribe1();
    await multiplayerService.leaveGame();
    
    await multiplayerService.createGame('game-2', 'Host', 'hard', 3);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const players2 = [];
    const unsubscribe2 = multiplayerService.subscribeToPlayers((players) => {
      players2.push([...players]);
    });
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Initial players in second game should NOT include Alice from first game
    const game2InitialPlayers = players2[players2.length - 1];
    expect(game2InitialPlayers.some(p => p.name === 'Alice')).toBe(false);
    expect(game2InitialPlayers.some(p => p.name === 'Host')).toBe(true);
    
    // Add different player to second game
    await multiplayerService.currentChannel.send({
      type: 'broadcast',
      event: 'player-joined',
      payload: { playerId: 'player-2', playerName: 'Bob' },
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const game2FinalPlayers = players2[players2.length - 1];
    expect(game2FinalPlayers.some(p => p.name === 'Bob')).toBe(true);
    expect(game2FinalPlayers.some(p => p.name === 'Alice')).toBe(false);
    
    unsubscribe2();
    await multiplayerService.leaveGame();
  }, 10000);

  it('should properly handle rapid game creation and cleanup', async () => {
    const gamesCount = 3;
    
    for (let i = 0; i < gamesCount; i++) {
      console.log(`\n--- Creating game ${i + 1} ---`);
      
      await multiplayerService.createGame(`game-${i}`, 'Host', 'medium', 5);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const channel = multiplayerService.currentChannel;
      const players = [];
      
      const unsubscribe = multiplayerService.subscribeToPlayers((p) => {
        players.push([...p]);
      });
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Add a player
      await channel.send({
        type: 'broadcast',
        event: 'player-joined',
        payload: { playerId: `player-${i}`, playerName: `Player ${i}` },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify player was added
      const finalPlayers = players[players.length - 1];
      expect(finalPlayers).toHaveLength(2);
      expect(finalPlayers.some(p => p.name === `Player ${i}`)).toBe(true);
      
      // Clean up
      unsubscribe(); // With new approach, this is a no-op
      
      // Clean up the game (this will do the real cleanup)
      await multiplayerService.leaveGame();
      
      // After leaving game, listeners should be removed
      expect(channel.getListenerCount('player-joined')).toBe(0);
    }
    
    console.log('\n=== All rapid game sessions handled correctly ===');
  }, 15000);
});

