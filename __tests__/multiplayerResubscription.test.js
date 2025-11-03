/**
 * Test for multiplayer re-subscription bug fix
 * 
 * Bug: Host couldn't see players joining lobby after creating a second game
 * 
 * Root cause: Lobby's useEffect had `multiplayer` as dependency, causing it to
 * re-run whenever the multiplayer object changed (even with same game ID).
 * Each re-run called subscribeToPlayers, which reset knownPlayers to empty array,
 * wiping out the player list.
 * 
 * Fix: 
 * 1. Lobby subscribes once on mount with empty dependency array
 * 2. Service manages subscriptions with activeSubscription pattern
 * 3. Re-subscriptions to same channel just update callback, don't reset player list
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
    const key = `${message.type}:${message.event}`;
    const handlers = this.listeners.get(key);
    if (handlers) {
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
    setTimeout(() => {
      callback('SUBSCRIBED');
    }, 10);
    return this;
  }

  async unsubscribe() {
    this.subscribed = false;
    return 'ok';
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

jest.mock('../utils/supabaseClient', () => ({
  supabase: mockSupabase,
}));

const { multiplayerService } = require('../utils/multiplayerService');

describe('Multiplayer Re-subscription Bug Fix', () => {
  beforeEach(() => {
    mockChannels.clear();
    mockChannelCounter = 0;
  });

  it('should preserve player list when subscribeToPlayers is called multiple times for same channel', async () => {
    // Create a game
    await multiplayerService.createGame('test-game', 'Host', 'medium', 5);
    await new Promise(resolve => setTimeout(resolve, 50));

    const channel = multiplayerService.currentChannel;
    const allPlayerUpdates = [];

    // First subscription (like lobby mounting)
    console.log('\n--- First subscription ---');
    const unsub1 = multiplayerService.subscribeToPlayers((players) => {
      console.log('Callback 1 received:', players.map(p => p.name));
      allPlayerUpdates.push({ subscription: 1, players: [...players] });
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    // Simulate player joining
    console.log('\n--- Player joins ---');
    await channel.send({
      type: 'broadcast',
      event: 'player-joined',
      payload: { playerId: 'player-1', playerName: 'Alice' },
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify both players are visible
    const afterJoin = allPlayerUpdates[allPlayerUpdates.length - 1];
    expect(afterJoin.players).toHaveLength(2);
    expect(afterJoin.players.some(p => p.name === 'Alice')).toBe(true);
    expect(afterJoin.players.some(p => p.name === 'Host')).toBe(true);

    // Second subscription (like multiplayer object changing in React)
    console.log('\n--- Second subscription (React re-render) ---');
    const unsub2 = multiplayerService.subscribeToPlayers((players) => {
      console.log('Callback 2 received:', players.map(p => p.name));
      allPlayerUpdates.push({ subscription: 2, players: [...players] });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // THE FIX: Second subscription should immediately receive existing players
    const afterResubscribe = allPlayerUpdates[allPlayerUpdates.length - 1];
    expect(afterResubscribe.subscription).toBe(2);
    expect(afterResubscribe.players).toHaveLength(2);
    expect(afterResubscribe.players.some(p => p.name === 'Alice')).toBe(true);
    expect(afterResubscribe.players.some(p => p.name === 'Host')).toBe(true);

    console.log('\n=== TEST PASSED ===');
    console.log('Player list preserved across multiple subscriptions!');

    // Cleanup
    unsub1();
    unsub2();
    await multiplayerService.leaveGame();
  }, 10000);

  it('should handle service-managed subscriptions correctly across game sessions', async () => {
    console.log('\n=== FIRST GAME SESSION ===');
    
    // Create first game
    await multiplayerService.createGame('game-1', 'Host', 'medium', 5);
    await new Promise(resolve => setTimeout(resolve, 50));

    const players1 = [];
    const unsub1 = multiplayerService.subscribeToPlayers((players) => {
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

    // Leave first game
    await multiplayerService.leaveGame();

    console.log('\n=== SECOND GAME SESSION ===');

    // Create second game
    await multiplayerService.createGame('game-2', 'Host', 'hard', 3);
    await new Promise(resolve => setTimeout(resolve, 50));

    const players2 = [];
    const unsub2 = multiplayerService.subscribeToPlayers((players) => {
      players2.push([...players]);
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify Alice is NOT in second game
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

    unsub2();
    await multiplayerService.leaveGame();

    console.log('\n=== Both game sessions handled correctly ===');
  }, 10000);
});

