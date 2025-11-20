/**
 * Integration tests for complete game flows
 * Tests end-to-end scenarios: start-play-win, start-play-lose, reset, save/load
 */

// Mock dependencies
jest.mock('../utils/analyticsService', () => ({
  analyticsService: {
    generateSessionId: jest.fn(() => 'test-session-id'),
    trackGameStart: jest.fn(),
    trackGameComplete: jest.fn(),
    trackGameAbandon: jest.fn(),
  },
}));

jest.mock('../utils/multiplayerService', () => ({
  multiplayerService: {
    getPlayerId: jest.fn(() => 'test-player-id'),
    currentChannel: null,
    currentPlayerName: 'Test Player',
  },
}));

jest.mock('../utils/highScoreStorage', () => ({
  saveGameResult: jest.fn(),
}));

jest.mock('../utils/sudokuGenerator', () => ({
  generatePuzzle: jest.fn(() => {
    const puzzle = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];
    const solution = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];
    return { puzzle, solution };
  }),
}));

const { gameReducer } = require('../context/GameContext');
const { serializeGameState, deserializeGameState } = require('../utils/gameSerializer');

describe('Game Flow Integration Tests', () => {
  const createInitialState = () => ({
    difficulty: 'medium',
    status: 'paused',
    lives: 3,
    initialLives: 3,
    timeElapsed: 0,
    board: Array(9).fill(null).map(() => Array(9).fill(0)),
    solution: Array(9).fill(null).map(() => Array(9).fill(0)),
    initialBoard: Array(9).fill(null).map(() => Array(9).fill(0)),
    selectedCell: null,
    notes: new Map(),
    wrongCell: null,
    hintUsed: false,
    multiplayer: null,
    multiplayerWinner: null,
    multiplayerLoser: null,
    gameSessionId: null,
  });

  describe('Complete game flow: start → play → win', () => {
    it('should complete a full game flow from start to win', () => {
      let state = createInitialState();
      
      // 1. Start game
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy', lives: 5 });
      expect(state.status).toBe('playing');
      expect(state.lives).toBe(5);
      
      // 2. Select a cell
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      expect(state.selectedCell).toEqual({ row: 0, col: 2 });
      
      // 3. Place correct number
      state = gameReducer(state, { type: 'PLACE_NUMBER', number: 4, timeElapsed: 10 });
      expect(state.board[0][2]).toBe(4);
      
      // 4. Simulate completing the puzzle by filling all cells
      // Fill all remaining empty cells with correct numbers
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (state.board[row][col] === 0) {
            state = gameReducer(state, { 
              type: 'SELECT_CELL', 
              row, 
              col 
            });
            state = gameReducer(state, { 
              type: 'PLACE_NUMBER', 
              number: state.solution[row][col],
              timeElapsed: 100 // arbitrary time
            });
          }
        }
      }
      
      // 5. Verify game is won
      expect(state.status).toBe('won');
    });
  });

  describe('Complete game flow: start → play → lose', () => {
    it('should lose game when lives reach 0', () => {
      let state = createInitialState();
      
      // 1. Start game
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy', lives: 3 });
      expect(state.lives).toBe(3);
      
      // 2. Select a cell
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      
      // 3. Make wrong moves until lives reach 0
      for (let i = 0; i < 3; i++) {
        state = gameReducer(state, { type: 'PLACE_NUMBER', number: 99 }); // Wrong number
      }
      
      // 4. Verify game is lost
      expect(state.lives).toBe(0);
      expect(state.status).toBe('lost');
    });

    it('should handle losing life action', () => {
      let state = createInitialState();
      
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy', lives: 5 });
      
      // Lose lives one by one
      for (let i = 5; i > 0; i--) {
        expect(state.lives).toBe(i);
        state = gameReducer(state, { type: 'LOSE_LIFE' });
      }
      
      expect(state.lives).toBe(0);
      expect(state.status).toBe('lost');
    });
  });

  describe('Game reset functionality', () => {
    it('should reset game to initial board state', () => {
      let state = createInitialState();
      
      // Start game and make some moves
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy' });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      state = gameReducer(state, { type: 'PLACE_NUMBER', number: 4 });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 3 });
      state = gameReducer(state, { type: 'PLACE_NUMBER', number: 6 });
      
      const initialBoard = state.initialBoard.map(row => [...row]);
      const modifiedBoard = state.board.map(row => [...row]);
      
      // Verify board was modified
      expect(modifiedBoard).not.toEqual(initialBoard);
      
      // Reset game
      state = gameReducer(state, { type: 'RESET_GAME' });
      
      // Verify board is reset
      expect(state.board).toEqual(initialBoard);
      expect(state.selectedCell).toBeNull();
      expect(state.notes.size).toBe(0);
      expect(state.timeElapsed).toBe(0);
      expect(state.status).toBe('playing');
    });

    it('should reset lives to difficulty default on reset', () => {
      let state = createInitialState();
      
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy', lives: 5 });
      state = gameReducer(state, { type: 'LOSE_LIFE' });
      expect(state.lives).toBe(4);
      
      state = gameReducer(state, { type: 'RESET_GAME' });
      expect(state.lives).toBe(5); // Reset to difficulty default
    });
  });

  describe('Save/load game state integration', () => {
    it('should save and load game state correctly', () => {
      let state = createInitialState();
      
      // Start game and make progress
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'hard', lives: 4 });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      state = gameReducer(state, { type: 'PLACE_NUMBER', number: 4 });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 1, col: 1 });
      state = gameReducer(state, { type: 'ADD_NOTE', number: 7 });
      
      // Save game state
      const serialized = serializeGameState(state);
      expect(typeof serialized).toBe('string');
      
      // Load game state
      const deserialized = deserializeGameState(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized.difficulty).toBe('hard');
      expect(deserialized.lives).toBe(4);
      
      // Load into new game state
      const newState = gameReducer(createInitialState(), {
        type: 'LOAD_GAME',
        state: deserialized,
      });
      
      expect(newState.difficulty).toBe('hard');
      expect(newState.lives).toBe(4);
      expect(newState.board).toEqual(state.board);
      expect(newState.notes.has('1-1')).toBe(true);
    });

    it('should maintain game progress through save/load cycle', () => {
      let state = createInitialState();
      
      // Make significant progress
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      
      // Fill several cells
      const moves = [
        { row: 0, col: 2, num: 4 },
        { row: 0, col: 3, num: 6 },
        { row: 1, col: 1, num: 7 },
      ];
      
      moves.forEach(move => {
        state = gameReducer(state, { type: 'SELECT_CELL', row: move.row, col: move.col });
        state = gameReducer(state, { type: 'PLACE_NUMBER', number: move.num });
      });
      
      // Save and load
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      const loadedState = gameReducer(createInitialState(), {
        type: 'LOAD_GAME',
        state: deserialized,
      });
      
      // Verify progress is maintained
      moves.forEach(move => {
        expect(loadedState.board[move.row][move.col]).toBe(move.num);
      });
    });
  });

  describe('Hint system integration', () => {
    it('should use hint to fill empty cell', () => {
      let state = createInitialState();
      
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy' });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      
      const solutionValue = state.solution[0][2];
      expect(state.board[0][2]).toBe(0); // Empty
      
      state = gameReducer(state, { type: 'USE_HINT' });
      
      expect(state.board[0][2]).toBe(solutionValue);
      expect(state.hintUsed).toBe(true);
    });

    it('should not allow using hint twice', () => {
      let state = createInitialState();
      
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy' });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      
      state = gameReducer(state, { type: 'USE_HINT' });
      expect(state.hintUsed).toBe(true);
      
      // Try to use hint again
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 3 });
      const beforeBoard = state.board.map(row => [...row]);
      state = gameReducer(state, { type: 'USE_HINT' });
      
      // Should not change (hint already used)
      expect(state.board).toEqual(beforeBoard);
    });
  });

  describe('Pause/resume functionality', () => {
    it('should pause and resume game correctly', () => {
      let state = createInitialState();
      
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy' });
      expect(state.status).toBe('playing');
      
      // Pause
      const timeAtPause = 123;
      state = gameReducer(state, { type: 'PAUSE_GAME', timeElapsed: timeAtPause });
      expect(state.status).toBe('paused');
      expect(state.timeElapsed).toBe(timeAtPause);
      
      // Resume
      state = gameReducer(state, { type: 'RESUME_GAME' });
      expect(state.status).toBe('playing');
      // Time should be preserved
      expect(state.timeElapsed).toBe(timeAtPause);
    });
  });

  describe('Notes system integration', () => {
    it('should add and remove notes during gameplay', () => {
      let state = createInitialState();
      
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'easy' });
      state = gameReducer(state, { type: 'SELECT_CELL', row: 0, col: 2 });
      
      // Add notes
      state = gameReducer(state, { type: 'ADD_NOTE', number: 1 });
      state = gameReducer(state, { type: 'ADD_NOTE', number: 2 });
      state = gameReducer(state, { type: 'ADD_NOTE', number: 3 });
      
      expect(state.notes.get('0-2').has(1)).toBe(true);
      expect(state.notes.get('0-2').has(2)).toBe(true);
      expect(state.notes.get('0-2').has(3)).toBe(true);
      
      // Remove a note
      state = gameReducer(state, { type: 'REMOVE_NOTE', number: 2 });
      
      expect(state.notes.get('0-2').has(1)).toBe(true);
      expect(state.notes.get('0-2').has(2)).toBe(false);
      expect(state.notes.get('0-2').has(3)).toBe(true);
    });
  });
});

