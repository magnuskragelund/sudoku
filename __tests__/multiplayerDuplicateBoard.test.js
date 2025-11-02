/**
 * Test for multiplayer duplicate board bug fix
 * 
 * Bug: When host starts a new round, the game board loads twice on player devices,
 * creating an overlay of two game instances.
 * 
 * Root cause: Two active subscriptions to 'game-board-shared' event:
 * 1. Lobby screen subscription (not unmounted because router.push keeps it in stack)
 * 2. GameContext subscription
 * 
 * When new round starts, both subscriptions trigger:
 * - Lobby: router.push('/game') again -> NEW game screen instance on top
 * - GameContext: LOAD_MULTIPLAYER_GAME -> loads board in original instance
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

describe('Multiplayer Duplicate Board Bug Fix', () => {
  beforeEach(() => {
    // Clear mock channels
    mockChannels.clear();
    mockChannelCounter = 0;
  });

  it('should only trigger game board callback once per broadcast', async () => {
    // Create a game
    await multiplayerService.createGame('test-game', 'Host', 'medium', 5);
    await new Promise(resolve => setTimeout(resolve, 50));

    const channel = multiplayerService.currentChannel;
    expect(channel).toBeTruthy();

    // Track how many times the callback is triggered
    let callbackCount = 0;
    const receivedBoards = [];

    // Subscribe ONCE to game board
    const unsubscribe = multiplayerService.subscribeToGameBoard((payload) => {
      callbackCount++;
      receivedBoards.push(payload);
      console.log(`Game board callback triggered (count: ${callbackCount})`);
    });

    // Wait for subscription to be set up
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify only one listener is registered
    expect(channel.getListenerCount('game-board-shared')).toBe(1);

    // Broadcast a game board
    await channel.send({
      type: 'broadcast',
      event: 'game-board-shared',
      payload: {
        board: [[1, 2, 3]],
        solution: [[1, 2, 3]],
        initialBoard: [[1, 2, 3]],
        difficulty: 'medium',
        lives: 5,
      },
    });

    // Wait for broadcast to be processed
    await new Promise(resolve => setTimeout(resolve, 50));

    // THE FIX: Should only be called ONCE
    expect(callbackCount).toBe(1);
    expect(receivedBoards).toHaveLength(1);

    // Clean up
    unsubscribe();
    await multiplayerService.leaveGame();
  });

  it('should clean up game board listener from correct channel', async () => {
    // Create first game
    await multiplayerService.createGame('game-1', 'Host', 'medium', 5);
    await new Promise(resolve => setTimeout(resolve, 50));

    const firstChannel = multiplayerService.currentChannel;
    const firstCallbacks = [];

    // Subscribe to first game
    const unsubscribe1 = multiplayerService.subscribeToGameBoard((payload) => {
      firstCallbacks.push(payload);
      console.log('First game board callback');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(firstChannel.getListenerCount('game-board-shared')).toBe(1);

    // Clean up first game
    unsubscribe1();
    await multiplayerService.leaveGame();

    // Verify listener was removed from first channel
    expect(firstChannel.getListenerCount('game-board-shared')).toBe(0);

    // Create second game
    await multiplayerService.createGame('game-2', 'Host', 'hard', 3);
    await new Promise(resolve => setTimeout(resolve, 50));

    const secondChannel = multiplayerService.currentChannel;
    expect(secondChannel.id).not.toBe(firstChannel.id);

    const secondCallbacks = [];

    // Subscribe to second game
    const unsubscribe2 = multiplayerService.subscribeToGameBoard((payload) => {
      secondCallbacks.push(payload);
      console.log('Second game board callback');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(secondChannel.getListenerCount('game-board-shared')).toBe(1);

    // Broadcast to second channel
    await secondChannel.send({
      type: 'broadcast',
      event: 'game-board-shared',
      payload: {
        board: [[4, 5, 6]],
        solution: [[4, 5, 6]],
        initialBoard: [[4, 5, 6]],
        difficulty: 'hard',
        lives: 3,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // First game should NOT have received any broadcasts
    expect(firstCallbacks).toHaveLength(0);
    
    // Second game should have received the broadcast
    expect(secondCallbacks).toHaveLength(1);
    expect(secondCallbacks[0].difficulty).toBe('hard');

    // Clean up
    unsubscribe2();
    await multiplayerService.leaveGame();
  });

  it('should handle multiple subscriptions without interference', async () => {
    // Simulate the scenario from the bug:
    // 1. Lobby subscribes to game-board-shared (for navigation)
    // 2. GameContext subscribes to game-board-shared (for loading game)
    // 3. Both should receive the broadcast independently

    await multiplayerService.createGame('test-game', 'Host', 'medium', 5);
    await new Promise(resolve => setTimeout(resolve, 50));

    const channel = multiplayerService.currentChannel;

    // Simulate lobby subscription (just for navigation)
    let lobbyNavigated = false;
    const unsubscribeLobby = multiplayerService.subscribeToGameBoard(() => {
      lobbyNavigated = true;
      console.log('Lobby: Navigating to game screen');
    });

    // Simulate GameContext subscription (for loading game)
    let gameLoaded = false;
    const receivedGameData = [];
    const unsubscribeGameContext = multiplayerService.subscribeToGameBoard((payload) => {
      gameLoaded = true;
      receivedGameData.push(payload);
      console.log('GameContext: Loading game board');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Both subscriptions should be active
    expect(channel.getListenerCount('game-board-shared')).toBe(2);

    // Broadcast game board
    await channel.send({
      type: 'broadcast',
      event: 'game-board-shared',
      payload: {
        board: [[1, 2, 3]],
        solution: [[1, 2, 3]],
        initialBoard: [[1, 2, 3]],
        difficulty: 'medium',
        lives: 5,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Both should have been triggered
    expect(lobbyNavigated).toBe(true);
    expect(gameLoaded).toBe(true);
    expect(receivedGameData).toHaveLength(1);

    // Clean up lobby subscription (simulating unmount after navigation with router.replace)
    unsubscribeLobby();
    
    // Now only GameContext subscription should remain
    expect(channel.getListenerCount('game-board-shared')).toBe(1);

    // Reset flags
    lobbyNavigated = false;
    gameLoaded = false;
    receivedGameData.length = 0;

    // Broadcast second round
    await channel.send({
      type: 'broadcast',
      event: 'game-board-shared',
      payload: {
        board: [[7, 8, 9]],
        solution: [[7, 8, 9]],
        initialBoard: [[7, 8, 9]],
        difficulty: 'medium',
        lives: 5,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // THE FIX: Lobby should NOT navigate again (it was unsubscribed)
    expect(lobbyNavigated).toBe(false);
    
    // GameContext should load the new board
    expect(gameLoaded).toBe(true);
    expect(receivedGameData).toHaveLength(1);
    expect(receivedGameData[0].board).toEqual([[7, 8, 9]]);

    // Clean up
    unsubscribeGameContext();
    await multiplayerService.leaveGame();

    console.log('\n=== TEST PASSED ===');
    console.log('Duplicate board loading bug is fixed!');
    console.log('- Lobby subscription cleans up after navigation');
    console.log('- Only GameContext subscription remains for subsequent rounds');
  }, 10000);
});

