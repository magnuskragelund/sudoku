/**
 * Tests for gameSerializer.ts
 * Game state serialization and deserialization functions
 */

const { serializeGameState, deserializeGameState, validateGameState } = require('../utils/gameSerializer');
const { validPuzzle, validPuzzleSolution, copyBoard } = require('./fixtures/testBoards');

// Mock logger to avoid console errors in tests
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('Game Serializer Tests', () => {
  const createMockGameState = (overrides = {}) => {
    const board = copyBoard(validPuzzle);
    const solution = copyBoard(validPuzzleSolution);
    const initialBoard = copyBoard(validPuzzle);
    
    return {
      difficulty: 'easy',
      status: 'playing',
      lives: 5,
      initialLives: 5,
      timeElapsed: 0,
      board,
      solution,
      initialBoard,
      selectedCell: null,
      notes: new Map(),
      wrongCell: null,
      hintUsed: false,
      multiplayer: null,
      multiplayerWinner: null,
      multiplayerLoser: null,
      gameSessionId: null,
      ...overrides,
    };
  };

  describe('serializeGameState', () => {
    it('should serialize game state to JSON string', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      
      expect(typeof serialized).toBe('string');
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it('should include all required fields', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      
      expect(parsed).toHaveProperty('difficulty');
      expect(parsed).toHaveProperty('lives');
      expect(parsed).toHaveProperty('board');
      expect(parsed).toHaveProperty('solution');
      expect(parsed).toHaveProperty('initialBoard');
      expect(parsed).toHaveProperty('notes');
    });

    it('should serialize board correctly', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      
      expect(Array.isArray(parsed.board)).toBe(true);
      expect(parsed.board.length).toBe(9);
      expect(parsed.board[0].length).toBe(9);
    });

    it('should serialize notes from Map to object', () => {
      const notes = new Map();
      notes.set('0-0', new Set([1, 2, 3]));
      notes.set('1-1', new Set([4, 5]));
      
      const state = createMockGameState({ notes });
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      
      expect(typeof parsed.notes).toBe('object');
      expect(Array.isArray(parsed.notes['0-0'])).toBe(true);
      expect(parsed.notes['0-0']).toEqual([1, 2, 3]);
      expect(parsed.notes['1-1']).toEqual([4, 5]);
    });

    it('should handle empty notes', () => {
      const state = createMockGameState({ notes: new Map() });
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      
      expect(typeof parsed.notes).toBe('object');
      expect(Object.keys(parsed.notes).length).toBe(0);
    });

    it('should serialize all difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard', 'master'];
      
      difficulties.forEach(difficulty => {
        const state = createMockGameState({ difficulty });
        const serialized = serializeGameState(state);
        const parsed = JSON.parse(serialized);
        
        expect(parsed.difficulty).toBe(difficulty);
      });
    });

    it('should use initialLives for lives field', () => {
      const state = createMockGameState({ lives: 3, initialLives: 5 });
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.lives).toBe(5); // Should use initialLives
    });
  });

  describe('deserializeGameState', () => {
    it('should deserialize valid JSON string', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(deserialized.difficulty).toBe(state.difficulty);
      expect(deserialized.lives).toBe(state.initialLives);
    });

    it('should return null for invalid JSON', () => {
      const invalid = 'not valid json';
      const result = deserializeGameState(invalid);
      
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const invalid = JSON.stringify({ difficulty: 'easy' }); // Missing other fields
      const result = deserializeGameState(invalid);
      
      expect(result).toBeNull();
    });

    it('should return null for invalid difficulty', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      parsed.difficulty = 'invalid';
      
      const result = deserializeGameState(JSON.stringify(parsed));
      expect(result).toBeNull();
    });

    it('should return null for invalid lives (out of range)', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      parsed.lives = 10; // Out of range
      
      const result = deserializeGameState(JSON.stringify(parsed));
      expect(result).toBeNull();
    });

    it('should return null for invalid board structure', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      parsed.board = [[1, 2, 3]]; // Invalid structure
      
      const result = deserializeGameState(JSON.stringify(parsed));
      expect(result).toBeNull();
    });

    it('should return null for board with invalid cell values', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const parsed = JSON.parse(serialized);
      parsed.board[0][0] = 10; // Invalid value
      
      const result = deserializeGameState(JSON.stringify(parsed));
      expect(result).toBeNull();
    });

    it('should deserialize notes correctly', () => {
      const notes = new Map();
      notes.set('0-0', new Set([1, 2, 3]));
      notes.set('1-1', new Set([4, 5]));
      
      const state = createMockGameState({ notes });
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(Array.isArray(deserialized.notes['0-0'])).toBe(true);
      expect(deserialized.notes['0-0']).toEqual([1, 2, 3]);
      expect(deserialized.notes['1-1']).toEqual([4, 5]);
    });

    it('should handle empty notes', () => {
      const state = createMockGameState({ notes: new Map() });
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(Object.keys(deserialized.notes).length).toBe(0);
    });
  });

  describe('validateGameState', () => {
    it('should return true for valid game state', () => {
      const state = createMockGameState();
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(validateGameState(deserialized)).toBe(true);
    });

    it('should return false for puzzle without unique solution', () => {
      const state = createMockGameState();
      // Create a puzzle with multiple solutions (empty board)
      state.board = Array(9).fill(null).map(() => Array(9).fill(0));
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(validateGameState(deserialized)).toBe(false);
    });

    it('should return false when solution does not match puzzle', () => {
      const state = createMockGameState();
      // Modify solution to not match puzzle - change a clue that exists in puzzle
      // First ensure puzzle has a clue at (0,0)
      if (state.board[0][0] !== 0) {
        state.solution[0][0] = state.board[0][0] + 1; // Make solution not match puzzle clue
        if (state.solution[0][0] > 9) state.solution[0][0] = 1;
      } else {
        // If (0,0) is empty, modify a cell that has a clue
        state.solution[0][1] = state.board[0][1] + 1; // Make solution not match puzzle clue
        if (state.solution[0][1] > 9) state.solution[0][1] = 1;
      }
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      // Should return false or handle gracefully
      if (deserialized) {
        expect(validateGameState(deserialized)).toBe(false);
      } else {
        // If deserialization fails due to invalid solution, that's also acceptable
        expect(deserialized).toBeNull();
      }
    });

    it('should validate that puzzle clues match solution', () => {
      const state = createMockGameState();
      // Ensure puzzle clues match solution
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (state.board[row][col] !== 0) {
            state.solution[row][col] = state.board[row][col];
          }
        }
      }
      
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(validateGameState(deserialized)).toBe(true);
    });
  });

  describe('Round-trip serialization', () => {
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      const originalState = createMockGameState();
      const serialized = serializeGameState(originalState);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(deserialized.difficulty).toBe(originalState.difficulty);
      expect(deserialized.lives).toBe(originalState.initialLives);
      expect(deserialized.board).toEqual(originalState.board);
      expect(deserialized.solution).toEqual(originalState.solution);
      expect(deserialized.initialBoard).toEqual(originalState.initialBoard);
    });

    it('should handle notes through round-trip', () => {
      const notes = new Map();
      notes.set('0-0', new Set([1, 2, 3]));
      notes.set('4-4', new Set([5, 6, 7, 8]));
      
      const originalState = createMockGameState({ notes });
      const serialized = serializeGameState(originalState);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(deserialized.notes['0-0']).toEqual([1, 2, 3]);
      expect(deserialized.notes['4-4']).toEqual([5, 6, 7, 8]);
    });

    it('should validate after round-trip', () => {
      const originalState = createMockGameState();
      const serialized = serializeGameState(originalState);
      const deserialized = deserializeGameState(serialized);
      
      expect(validateGameState(deserialized)).toBe(true);
    });

    it('should handle all difficulty levels through round-trip', () => {
      const difficulties = ['easy', 'medium', 'hard', 'master'];
      
      difficulties.forEach(difficulty => {
        const state = createMockGameState({ difficulty });
        const serialized = serializeGameState(state);
        const deserialized = deserializeGameState(serialized);
        
        expect(deserialized).not.toBeNull();
        expect(deserialized.difficulty).toBe(difficulty);
        expect(validateGameState(deserialized)).toBe(true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle game state with all cells filled', () => {
      const board = copyBoard(validPuzzleSolution);
      const state = createMockGameState({ board, initialBoard: board });
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(validateGameState(deserialized)).toBe(true);
    });

    it('should handle game state with many notes', () => {
      const notes = new Map();
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          notes.set(`${row}-${col}`, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
        }
      }
      
      const state = createMockGameState({ notes });
      const serialized = serializeGameState(state);
      const deserialized = deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(Object.keys(deserialized.notes).length).toBe(81);
    });
  });
});

