/**
 * Tests for GameContext reducer
 * Game state transitions and action handling
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
  generatePuzzle: jest.fn(() => ({
    puzzle: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  })),
}));

const { gameReducer } = require('../context/GameContext');

describe('Game State Transitions Tests', () => {
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

  describe('START_GAME', () => {
    it('should start a new game with specified difficulty', () => {
      const state = createInitialState();
      const action = { type: 'START_GAME', difficulty: 'easy', lives: 5 };
      const newState = gameReducer(state, action);
      
      expect(newState.difficulty).toBe('easy');
      expect(newState.status).toBe('playing');
      expect(newState.lives).toBe(5);
      expect(newState.initialLives).toBe(5);
      expect(newState.timeElapsed).toBe(0);
      expect(newState.gameSessionId).toBe('test-session-id');
    });

    it('should use default lives if not specified', () => {
      const state = createInitialState();
      const action = { type: 'START_GAME', difficulty: 'hard' };
      const newState = gameReducer(state, action);
      
      expect(newState.lives).toBe(5);
      expect(newState.initialLives).toBe(5);
    });

    it('should generate puzzle and solution', () => {
      const state = createInitialState();
      const action = { type: 'START_GAME', difficulty: 'easy' };
      const newState = gameReducer(state, action);
      
      expect(newState.board).toBeDefined();
      expect(newState.solution).toBeDefined();
      expect(newState.initialBoard).toBeDefined();
      expect(Array.isArray(newState.board)).toBe(true);
      expect(newState.board.length).toBe(9);
    });

    it('should reset game state', () => {
      const state = createInitialState();
      state.selectedCell = { row: 5, col: 5 };
      state.notes.set('5-5', new Set([1, 2, 3]));
      state.wrongCell = { row: 1, col: 1 };
      state.hintUsed = true;
      
      const action = { type: 'START_GAME', difficulty: 'easy' };
      const newState = gameReducer(state, action);
      
      expect(newState.selectedCell).toBeNull();
      expect(newState.notes.size).toBe(0);
      expect(newState.wrongCell).toBeNull();
      expect(newState.hintUsed).toBe(false);
    });
  });

  describe('START_PLAYING', () => {
    it('should change status to playing', () => {
      const state = createInitialState();
      state.status = 'ready';
      const action = { type: 'START_PLAYING' };
      const newState = gameReducer(state, action);
      
      expect(newState.status).toBe('playing');
    });
  });

  describe('PAUSE_GAME', () => {
    it('should change status to paused', () => {
      const state = createInitialState();
      state.status = 'playing';
      const action = { type: 'PAUSE_GAME' };
      const newState = gameReducer(state, action);
      
      expect(newState.status).toBe('paused');
    });
  });

  describe('RESUME_GAME', () => {
    it('should change status to playing', () => {
      const state = createInitialState();
      state.status = 'paused';
      const action = { type: 'RESUME_GAME' };
      const newState = gameReducer(state, action);
      
      expect(newState.status).toBe('playing');
    });
  });

  describe('SELECT_CELL', () => {
    it('should set selected cell', () => {
      const state = createInitialState();
      const action = { type: 'SELECT_CELL', row: 3, col: 4 };
      const newState = gameReducer(state, action);
      
      expect(newState.selectedCell).toEqual({ row: 3, col: 4 });
    });
  });

  describe('PLACE_NUMBER', () => {
    it('should place correct number and update board', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 2 };
      state.board[0][2] = 0;
      state.solution[0][2] = 4;
      
      const action = { type: 'PLACE_NUMBER', number: 4 };
      const newState = gameReducer(state, action);
      
      expect(newState.board[0][2]).toBe(4);
      expect(newState.selectedCell).toEqual({ row: 0, col: 2 });
    });

    it('should not place number if no cell selected', () => {
      const state = createInitialState();
      state.selectedCell = null;
      const originalBoard = state.board.map(row => [...row]);
      
      const action = { type: 'PLACE_NUMBER', number: 5 };
      const newState = gameReducer(state, action);
      
      expect(newState.board).toEqual(originalBoard);
    });

    it('should mark game as won when puzzle is complete', () => {
      const state = createInitialState();
      // Create a board with one cell missing
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (row === 0 && col === 2) {
            state.board[row][col] = 0;
          } else {
            state.board[row][col] = state.solution[row][col];
          }
        }
      }
      state.selectedCell = { row: 0, col: 2 };
      state.solution[0][2] = 4;
      
      const action = { type: 'PLACE_NUMBER', number: 4 };
      const newState = gameReducer(state, action);
      
      expect(newState.status).toBe('won');
    });

    it('should lose life on incorrect number', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 2 };
      state.board[0][2] = 0;
      state.solution[0][2] = 4;
      state.lives = 5;
      
      const action = { type: 'PLACE_NUMBER', number: 5 }; // Wrong number
      const newState = gameReducer(state, action);
      
      expect(newState.lives).toBe(4);
      expect(newState.wrongCell).toEqual({ row: 0, col: 2 });
    });

    it('should mark game as lost when lives reach 0', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 2 };
      state.board[0][2] = 0;
      state.solution[0][2] = 4;
      state.lives = 1;
      
      const action = { type: 'PLACE_NUMBER', number: 5 }; // Wrong number
      const newState = gameReducer(state, action);
      
      expect(newState.lives).toBe(0);
      expect(newState.status).toBe('lost');
    });
  });

  describe('CLEAR_CELL', () => {
    it('should clear selected cell', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 0 };
      state.board[0][0] = 5;
      
      const action = { type: 'CLEAR_CELL' };
      const newState = gameReducer(state, action);
      
      expect(newState.board[0][0]).toBe(0);
      expect(newState.selectedCell).toBeNull();
    });

    it('should not clear if no cell selected', () => {
      const state = createInitialState();
      state.selectedCell = null;
      const originalBoard = state.board.map(row => [...row]);
      
      const action = { type: 'CLEAR_CELL' };
      const newState = gameReducer(state, action);
      
      expect(newState.board).toEqual(originalBoard);
    });
  });

  describe('ADD_NOTE', () => {
    it('should add note to selected cell', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 0 };
      
      const action = { type: 'ADD_NOTE', number: 5 };
      const newState = gameReducer(state, action);
      
      const noteKey = '0-0';
      expect(newState.notes.has(noteKey)).toBe(true);
      expect(newState.notes.get(noteKey).has(5)).toBe(true);
    });

    it('should not add note if no cell selected', () => {
      const state = createInitialState();
      state.selectedCell = null;
      
      const action = { type: 'ADD_NOTE', number: 5 };
      const newState = gameReducer(state, action);
      
      expect(newState.notes.size).toBe(0);
    });

    it('should add multiple notes to same cell', () => {
      let state = createInitialState();
      state.selectedCell = { row: 0, col: 0 };
      
      state = gameReducer(state, { type: 'ADD_NOTE', number: 5 });
      state = gameReducer(state, { type: 'ADD_NOTE', number: 6 });
      
      const noteKey = '0-0';
      expect(state.notes.get(noteKey).has(5)).toBe(true);
      expect(state.notes.get(noteKey).has(6)).toBe(true);
    });
  });

  describe('REMOVE_NOTE', () => {
    it('should remove note from selected cell', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 0 };
      state.notes.set('0-0', new Set([5, 6]));
      
      const action = { type: 'REMOVE_NOTE', number: 5 };
      const newState = gameReducer(state, action);
      
      const noteKey = '0-0';
      expect(newState.notes.get(noteKey).has(5)).toBe(false);
      expect(newState.notes.get(noteKey).has(6)).toBe(true);
    });

    it('should remove note key when last note is removed', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 0 };
      state.notes.set('0-0', new Set([5]));
      
      const action = { type: 'REMOVE_NOTE', number: 5 };
      const newState = gameReducer(state, action);
      
      expect(newState.notes.has('0-0')).toBe(false);
    });

    it('should not remove note if no cell selected', () => {
      const state = createInitialState();
      state.selectedCell = null;
      state.notes.set('0-0', new Set([5]));
      
      const action = { type: 'REMOVE_NOTE', number: 5 };
      const newState = gameReducer(state, action);
      
      expect(newState.notes.has('0-0')).toBe(true);
    });
  });

  describe('NEW_GAME', () => {
    it('should reset to initial state', () => {
      const state = createInitialState();
      state.status = 'playing';
      state.selectedCell = { row: 5, col: 5 };
      state.notes.set('5-5', new Set([1, 2, 3]));
      
      const action = { type: 'NEW_GAME' };
      const newState = gameReducer(state, action);
      
      expect(newState.status).toBe('paused');
      expect(newState.selectedCell).toBeNull();
      expect(newState.notes.size).toBe(0);
      expect(newState.timeElapsed).toBe(0);
    });

    it('should preserve difficulty', () => {
      const state = createInitialState();
      state.difficulty = 'hard';
      
      const action = { type: 'NEW_GAME' };
      const newState = gameReducer(state, action);
      
      expect(newState.difficulty).toBe('hard');
    });
  });

  describe('RESET_GAME', () => {
    it('should reset board to initial state', () => {
      const state = createInitialState();
      state.board[0][0] = 5;
      state.initialBoard[0][0] = 3;
      state.selectedCell = { row: 5, col: 5 };
      state.notes.set('5-5', new Set([1, 2, 3]));
      state.timeElapsed = 100;
      
      const action = { type: 'RESET_GAME' };
      const newState = gameReducer(state, action);
      
      expect(newState.board[0][0]).toBe(3);
      expect(newState.selectedCell).toBeNull();
      expect(newState.notes.size).toBe(0);
      expect(newState.timeElapsed).toBe(0);
      expect(newState.status).toBe('playing');
    });
  });

  describe('LOSE_LIFE', () => {
    it('should decrement lives', () => {
      const state = createInitialState();
      state.lives = 5;
      
      const action = { type: 'LOSE_LIFE' };
      const newState = gameReducer(state, action);
      
      expect(newState.lives).toBe(4);
    });

    it('should not go below 0', () => {
      const state = createInitialState();
      state.lives = 0;
      
      const action = { type: 'LOSE_LIFE' };
      const newState = gameReducer(state, action);
      
      expect(newState.lives).toBe(0);
    });

    it('should mark game as lost when lives reach 0', () => {
      const state = createInitialState();
      state.lives = 1;
      
      const action = { type: 'LOSE_LIFE' };
      const newState = gameReducer(state, action);
      
      expect(newState.lives).toBe(0);
      expect(newState.status).toBe('lost');
    });
  });

  describe('CLEAR_WRONG_CELL', () => {
    it('should clear wrong cell marker', () => {
      const state = createInitialState();
      state.wrongCell = { row: 5, col: 5 };
      
      const action = { type: 'CLEAR_WRONG_CELL' };
      const newState = gameReducer(state, action);
      
      expect(newState.wrongCell).toBeNull();
    });
  });

  describe('USE_HINT', () => {
    it('should place correct number in selected empty cell', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 2 };
      state.board[0][2] = 0;
      state.initialBoard[0][2] = 0;
      state.solution[0][2] = 4;
      state.hintUsed = false;
      state.status = 'playing';
      
      const action = { type: 'USE_HINT' };
      const newState = gameReducer(state, action);
      
      expect(newState.board[0][2]).toBe(4);
      expect(newState.hintUsed).toBe(true);
    });

    it('should not use hint if already used', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 2 };
      state.hintUsed = true;
      
      const action = { type: 'USE_HINT' };
      const newState = gameReducer(state, action);
      
      expect(newState).toBe(state);
    });

    it('should not use hint if cell is not empty', () => {
      const state = createInitialState();
      state.selectedCell = { row: 0, col: 2 };
      state.board[0][2] = 5;
      
      const action = { type: 'USE_HINT' };
      const newState = gameReducer(state, action);
      
      expect(newState.board[0][2]).toBe(5);
    });
  });

  describe('LOAD_GAME', () => {
    it('should load game state', () => {
      const state = createInitialState();
      const gameState = {
        difficulty: 'hard',
        lives: 3,
        board: Array(9).fill(null).map(() => Array(9).fill(1)),
        solution: Array(9).fill(null).map(() => Array(9).fill(2)),
        initialBoard: Array(9).fill(null).map(() => Array(9).fill(3)),
        notes: { '0-0': [1, 2, 3] },
      };
      
      const action = { type: 'LOAD_GAME', state: gameState };
      const newState = gameReducer(state, action);
      
      expect(newState.difficulty).toBe('hard');
      expect(newState.lives).toBe(3);
      expect(newState.status).toBe('ready');
      expect(newState.notes.has('0-0')).toBe(true);
    });
  });
});

