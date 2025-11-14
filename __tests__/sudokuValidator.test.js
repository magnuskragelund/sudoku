/**
 * Tests for sudokuValidator.ts
 * Sudoku validation functions for gameplay
 */

const { isValidMove, isBoardValid, getValidNumbers } = require('../utils/sudokuValidator');
const { validPuzzle, fullyFilledValidBoard, invalidBoardRowDuplicate, invalidBoardColumnDuplicate, invalidBoardBoxDuplicate, emptyBoard, copyBoard } = require('./fixtures/testBoards');

describe('Sudoku Validator Tests', () => {
  describe('isValidMove', () => {
    it('should return true for valid move', () => {
      const board = copyBoard(validPuzzle);
      // Position (0, 2) is empty and 1 is valid there
      expect(isValidMove(board, 0, 2, 1)).toBe(true);
    });

    it('should return false for move to occupied cell', () => {
      const board = copyBoard(validPuzzle);
      // Position (0, 0) is already occupied with 5
      expect(isValidMove(board, 0, 0, 1)).toBe(false);
    });

    it('should return false for duplicate in row', () => {
      const board = copyBoard(validPuzzle);
      // Row 0 already has 5, so placing 5 at (0, 2) should be invalid
      expect(isValidMove(board, 0, 2, 5)).toBe(false);
    });

    it('should return false for duplicate in column', () => {
      const board = copyBoard(validPuzzle);
      // Column 0 already has 5, so placing 5 at (2, 0) should be invalid
      expect(isValidMove(board, 2, 0, 5)).toBe(false);
    });

    it('should return false for duplicate in 3x3 box', () => {
      const board = copyBoard(validPuzzle);
      // Top-left box already has 5, so placing 5 at (1, 1) should be invalid
      expect(isValidMove(board, 1, 1, 5)).toBe(false);
    });

    it('should return false for number out of range (too low)', () => {
      const board = copyBoard(validPuzzle);
      expect(isValidMove(board, 0, 2, 0)).toBe(false);
    });

    it('should return false for number out of range (too high)', () => {
      const board = copyBoard(validPuzzle);
      expect(isValidMove(board, 0, 2, 10)).toBe(false);
    });

    it('should handle edge cases in different board regions', () => {
      const board = copyBoard(validPuzzle);
      
      // Test center box - position (4,4) is empty
      // Row 4: 4,0,0,8,0,3,0,0,1 - has 4,8,3,1
      // Column 4: 7,9,0,6,0,2,0,8,8 - has 7,9,6,2,8
      // Center box (rows 3-5, cols 3-5): has 6,8,3,2
      // So available numbers: 5 (not in row, column, or box)
      expect(isValidMove(board, 4, 4, 5)).toBe(true); // Should be valid
      // Check that placing 6 would be invalid (6 is already in center box at row 3, col 4)
      expect(isValidMove(board, 4, 4, 6)).toBe(false); // 6 already in center box
      
      // Test bottom-right box - position (8,6) is empty
      // Row 8: 0,0,0,0,8,0,0,7,9 - has 8,7,9
      // Column 6: 0,0,0,0,0,0,2,0,0 - has 2
      // Bottom-right box (rows 6-8, cols 6-8): has 2,8,7,9
      // So available numbers: 1,3,4,5,6 (not in row, column, or box)
      expect(isValidMove(board, 8, 6, 1)).toBe(true); // Should be valid
      // Position (8,8) has 9, so can't place there
      expect(isValidMove(board, 8, 8, 9)).toBe(false); // Cell is occupied
    });

    it('should allow valid moves that don\'t conflict', () => {
      const board = copyBoard(validPuzzle);
      
      // Multiple valid moves
      expect(isValidMove(board, 0, 2, 1)).toBe(true);
      expect(isValidMove(board, 0, 2, 2)).toBe(true);
      expect(isValidMove(board, 0, 2, 4)).toBe(true);
    });
  });

  describe('isBoardValid', () => {
    it('should return true for valid board', () => {
      const board = copyBoard(fullyFilledValidBoard);
      expect(isBoardValid(board)).toBe(true);
    });

    it('should return true for valid puzzle with empty cells', () => {
      const board = copyBoard(validPuzzle);
      expect(isBoardValid(board)).toBe(true);
    });

    it('should return true for empty board', () => {
      const board = copyBoard(emptyBoard);
      expect(isBoardValid(board)).toBe(true);
    });

    it('should return false for board with row duplicate', () => {
      const board = copyBoard(invalidBoardRowDuplicate);
      expect(isBoardValid(board)).toBe(false);
    });

    it('should return false for board with column duplicate', () => {
      const board = copyBoard(invalidBoardColumnDuplicate);
      expect(isBoardValid(board)).toBe(false);
    });

    it('should return false for board with box duplicate', () => {
      const board = copyBoard(invalidBoardBoxDuplicate);
      expect(isBoardValid(board)).toBe(false);
    });

    it('should validate all filled cells', () => {
      const board = copyBoard(validPuzzle);
      // Add an invalid number
      board[0][2] = 5; // Duplicate 5 in row 0
      expect(isBoardValid(board)).toBe(false);
    });

    it('should skip empty cells during validation', () => {
      const board = copyBoard(validPuzzle);
      // Board has many empty cells but should still be valid
      expect(isBoardValid(board)).toBe(true);
    });
  });

  describe('getValidNumbers', () => {
    it('should return array of valid numbers for empty cell', () => {
      const board = copyBoard(validPuzzle);
      const validNumbers = getValidNumbers(board, 0, 2);
      
      expect(Array.isArray(validNumbers)).toBe(true);
      expect(validNumbers.length).toBeGreaterThan(0);
      expect(validNumbers.length).toBeLessThanOrEqual(9);
      
      // All numbers should be between 1 and 9
      validNumbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(9);
      });
    });

    it('should return empty array for occupied cell', () => {
      const board = copyBoard(validPuzzle);
      const validNumbers = getValidNumbers(board, 0, 0); // Cell is occupied
      
      expect(validNumbers).toEqual([]);
    });

    it('should return correct valid numbers', () => {
      const board = copyBoard(validPuzzle);
      const validNumbers = getValidNumbers(board, 0, 2);
      
      // Should not include numbers already in row 0
      expect(validNumbers).not.toContain(5); // 5 is in row 0
      expect(validNumbers).not.toContain(3); // 3 is in row 0
      expect(validNumbers).not.toContain(7); // 7 is in row 0
    });

    it('should handle cells with many constraints', () => {
      const board = copyBoard(validPuzzle);
      // Find a cell with many constraints
      const validNumbers = getValidNumbers(board, 4, 4);
      
      expect(Array.isArray(validNumbers)).toBe(true);
      // Should have some valid numbers (at least 1)
      expect(validNumbers.length).toBeGreaterThan(0);
    });

    it('should return all numbers 1-9 for completely empty board', () => {
      const board = copyBoard(emptyBoard);
      const validNumbers = getValidNumbers(board, 0, 0);
      
      // In an empty board, all numbers should be valid
      expect(validNumbers.length).toBe(9);
      expect(validNumbers.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should return numbers that don\'t conflict with row, column, or box', () => {
      const board = copyBoard(validPuzzle);
      const validNumbers = getValidNumbers(board, 0, 2);
      
      // Verify each number is actually valid
      validNumbers.forEach(num => {
        expect(isValidMove(board, 0, 2, num)).toBe(true);
      });
    });

    it('should handle different board positions', () => {
      const board = copyBoard(validPuzzle);
      
      // Test different positions
      const pos1 = getValidNumbers(board, 0, 2);
      const pos2 = getValidNumbers(board, 4, 4);
      const pos3 = getValidNumbers(board, 8, 8);
      
      expect(Array.isArray(pos1)).toBe(true);
      expect(Array.isArray(pos2)).toBe(true);
      expect(Array.isArray(pos3)).toBe(true);
    });

    it('should return consistent results for same position', () => {
      const board = copyBoard(validPuzzle);
      const validNumbers1 = getValidNumbers(board, 0, 2);
      const validNumbers2 = getValidNumbers(board, 0, 2);
      
      expect(validNumbers1.sort()).toEqual(validNumbers2.sort());
    });
  });
});

