/**
 * Tests for sudokuRules.ts
 * Core Sudoku rules validation functions
 */

const { checkSudokuRules, isCellOccupied, copyBoard } = require('../utils/sudokuRules');
const { validPuzzle, fullyFilledValidBoard, invalidBoardRowDuplicate, invalidBoardColumnDuplicate, invalidBoardBoxDuplicate, emptyBoard } = require('./fixtures/testBoards');

describe('Sudoku Rules Tests', () => {
  describe('checkSudokuRules', () => {
    it('should return true for valid number placement', () => {
      const board = copyBoard(validPuzzle);
      // Place 1 at position (0, 2) - should be valid
      expect(checkSudokuRules(board, 0, 2, 1)).toBe(true);
    });

    it('should return false for duplicate in row', () => {
      const board = copyBoard(validPuzzle);
      // Row 0 already has 5, so placing 5 at (0, 2) should be invalid
      expect(checkSudokuRules(board, 0, 2, 5)).toBe(false);
    });

    it('should return false for duplicate in column', () => {
      const board = copyBoard(validPuzzle);
      // Column 0 already has 5, so placing 5 at (2, 0) should be invalid
      expect(checkSudokuRules(board, 2, 0, 5)).toBe(false);
    });

    it('should return false for duplicate in 3x3 box', () => {
      const board = copyBoard(validPuzzle);
      // Top-left box already has 5, so placing 5 at (1, 1) should be invalid
      expect(checkSudokuRules(board, 1, 1, 5)).toBe(false);
    });

    it('should return false for number out of range (too low)', () => {
      const board = copyBoard(validPuzzle);
      expect(checkSudokuRules(board, 0, 2, 0)).toBe(false);
    });

    it('should return false for number out of range (too high)', () => {
      const board = copyBoard(validPuzzle);
      expect(checkSudokuRules(board, 0, 2, 10)).toBe(false);
    });

    it('should return false for row out of bounds (negative)', () => {
      const board = copyBoard(validPuzzle);
      expect(checkSudokuRules(board, -1, 0, 5)).toBe(false);
    });

    it('should return false for row out of bounds (too high)', () => {
      const board = copyBoard(validPuzzle);
      expect(checkSudokuRules(board, 9, 0, 5)).toBe(false);
    });

    it('should return false for column out of bounds (negative)', () => {
      const board = copyBoard(validPuzzle);
      expect(checkSudokuRules(board, 0, -1, 5)).toBe(false);
    });

    it('should return false for column out of bounds (too high)', () => {
      const board = copyBoard(validPuzzle);
      expect(checkSudokuRules(board, 0, 9, 5)).toBe(false);
    });

    it('should skip current cell when skipCurrentCell is true', () => {
      const board = copyBoard(fullyFilledValidBoard);
      // Cell (0, 0) has 5, but with skipCurrentCell, it should pass
      expect(checkSudokuRules(board, 0, 0, 5, { skipCurrentCell: true })).toBe(true);
    });

    it('should not skip current cell when skipCurrentCell is false', () => {
      const board = copyBoard(fullyFilledValidBoard);
      // Cell (0, 0) has 5, without skipCurrentCell, it should fail (duplicate)
      expect(checkSudokuRules(board, 0, 0, 5, { skipCurrentCell: false })).toBe(false);
    });

    it('should check all three constraints independently', () => {
      const board = copyBoard(validPuzzle);
      
      // Test row constraint
      expect(checkSudokuRules(board, 0, 2, 3)).toBe(false); // 3 already in row 0
      
      // Test column constraint
      expect(checkSudokuRules(board, 2, 0, 6)).toBe(false); // 6 already in column 0
      
      // Test box constraint
      expect(checkSudokuRules(board, 1, 1, 9)).toBe(false); // 9 already in top-left box
    });

    it('should handle edge cases in box boundaries', () => {
      const board = copyBoard(validPuzzle);
      
      // Test box boundaries: (2, 2) is in top-left box
      expect(checkSudokuRules(board, 2, 2, 5)).toBe(false); // 5 already in top-left box
      
      // Test box boundaries: (3, 3) is in center box
      expect(checkSudokuRules(board, 3, 3, 6)).toBe(false); // 6 already in center box
      
      // Test box boundaries: (8, 8) is in bottom-right box
      expect(checkSudokuRules(board, 8, 8, 7)).toBe(false); // 7 already in bottom-right box
    });
  });

  describe('isCellOccupied', () => {
    it('should return true for occupied cell', () => {
      const board = copyBoard(validPuzzle);
      expect(isCellOccupied(board, 0, 0)).toBe(true); // Has 5
      expect(isCellOccupied(board, 0, 1)).toBe(true); // Has 3
    });

    it('should return false for empty cell', () => {
      const board = copyBoard(validPuzzle);
      expect(isCellOccupied(board, 0, 2)).toBe(false); // Has 0
      expect(isCellOccupied(board, 0, 3)).toBe(false); // Has 0
    });

    it('should handle all board positions', () => {
      const board = copyBoard(validPuzzle);
      
      // Check some occupied cells
      expect(isCellOccupied(board, 1, 0)).toBe(true); // 6
      expect(isCellOccupied(board, 1, 3)).toBe(true); // 1
      
      // Check some empty cells
      expect(isCellOccupied(board, 1, 1)).toBe(false); // 0
      expect(isCellOccupied(board, 1, 2)).toBe(false); // 0
    });
  });

  describe('copyBoard', () => {
    it('should create a deep copy of the board', () => {
      const original = copyBoard(validPuzzle);
      const copy = copyBoard(original);
      
      // Should have same values
      expect(copy).toEqual(original);
      
      // But should be different references
      expect(copy).not.toBe(original);
      expect(copy[0]).not.toBe(original[0]);
    });

    it('should allow independent modification', () => {
      const original = copyBoard(validPuzzle);
      const copy = copyBoard(original);
      
      // Modify copy
      copy[0][0] = 99;
      
      // Original should be unchanged
      expect(original[0][0]).toBe(5);
      expect(copy[0][0]).toBe(99);
    });

    it('should handle empty board', () => {
      const original = copyBoard(emptyBoard);
      const copy = copyBoard(original);
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });

    it('should handle fully filled board', () => {
      const original = copyBoard(fullyFilledValidBoard);
      const copy = copyBoard(original);
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });
  });
});

