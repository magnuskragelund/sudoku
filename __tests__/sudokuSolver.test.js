/**
 * Tests for sudokuSolver.ts
 * Sudoku solving and solution counting functions
 */

const { solveSudoku, countSolutions, hasUniqueSolution, isSolvable } = require('../utils/sudokuSolver');
const { validPuzzle, validPuzzleSolution, emptyBoard, fullyFilledValidBoard, invalidBoardRowDuplicate, copyBoard } = require('./fixtures/testBoards');

describe('Sudoku Solver Tests', () => {
  describe('solveSudoku', () => {
    it('should solve a valid puzzle', () => {
      const board = copyBoard(validPuzzle);
      const result = solveSudoku(board);
      
      expect(result).toBe(true);
      // Check that board is fully filled
      board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeGreaterThan(0);
          expect(cell).toBeLessThanOrEqual(9);
        });
      });
    });

    it('should solve an empty board', () => {
      const board = copyBoard(emptyBoard);
      const result = solveSudoku(board);
      
      expect(result).toBe(true);
      // Check that board is fully filled
      board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeGreaterThan(0);
          expect(cell).toBeLessThanOrEqual(9);
        });
      });
    });

    it('should return true for already solved board', () => {
      const board = copyBoard(fullyFilledValidBoard);
      const result = solveSudoku(board);
      
      expect(result).toBe(true);
      // Board should remain valid
      expect(board).toEqual(fullyFilledValidBoard);
    });

    it('should return false for unsolvable puzzle', () => {
      const board = copyBoard(invalidBoardRowDuplicate);
      const result = solveSudoku(board);
      
      expect(result).toBe(false);
    });

    it('should modify the board in place when solving', () => {
      const board = copyBoard(validPuzzle);
      const originalEmptyCount = board.flat().filter(cell => cell === 0).length;
      
      solveSudoku(board);
      
      const finalEmptyCount = board.flat().filter(cell => cell === 0).length;
      expect(finalEmptyCount).toBe(0);
      expect(originalEmptyCount).toBeGreaterThan(0);
    });

    it('should produce a valid solution', () => {
      const board = copyBoard(validPuzzle);
      solveSudoku(board);
      
      // Check rows for duplicates
      for (let row = 0; row < 9; row++) {
        const rowValues = board[row].filter(v => v !== 0);
        const uniqueValues = new Set(rowValues);
        expect(uniqueValues.size).toBe(rowValues.length);
      }
      
      // Check columns for duplicates
      for (let col = 0; col < 9; col++) {
        const colValues = board.map(row => row[col]).filter(v => v !== 0);
        const uniqueValues = new Set(colValues);
        expect(uniqueValues.size).toBe(colValues.length);
      }
      
      // Check boxes for duplicates
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const boxValues = [];
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              const value = board[boxRow * 3 + i][boxCol * 3 + j];
              if (value !== 0) boxValues.push(value);
            }
          }
          const uniqueValues = new Set(boxValues);
          expect(uniqueValues.size).toBe(boxValues.length);
        }
      }
    });
  });

  describe('countSolutions', () => {
    it('should count 1 solution for valid puzzle with unique solution', () => {
      const board = copyBoard(validPuzzle);
      const count = countSolutions(board, 2);
      
      expect(count).toBe(1);
    });

    it('should count 0 solutions for unsolvable puzzle', () => {
      const board = copyBoard(invalidBoardRowDuplicate);
      const count = countSolutions(board, 2);
      
      expect(count).toBe(0);
    });

    it('should stop counting at maxCount', () => {
      const board = copyBoard(validPuzzle);
      const count = countSolutions(board, 1);
      
      expect(count).toBeLessThanOrEqual(1);
    });

    it('should not modify the original board', () => {
      const board = copyBoard(validPuzzle);
      const original = copyBoard(board);
      
      countSolutions(board, 2);
      
      expect(board).toEqual(original);
    });

    it('should handle empty board (many solutions)', () => {
      const board = copyBoard(emptyBoard);
      const count = countSolutions(board, 2);
      
      // Empty board has many solutions, should return 2 (maxCount)
      expect(count).toBe(2);
    });

    it('should handle fully filled valid board', () => {
      const board = copyBoard(fullyFilledValidBoard);
      const count = countSolutions(board, 2);
      
      expect(count).toBe(1);
    });

    it('should respect maxCount parameter', () => {
      const board = copyBoard(emptyBoard);
      
      const count1 = countSolutions(board, 1);
      expect(count1).toBeLessThanOrEqual(1);
      
      const count2 = countSolutions(board, 2);
      expect(count2).toBeLessThanOrEqual(2);
      expect(count2).toBeGreaterThanOrEqual(count1);
    });
  });

  describe('hasUniqueSolution', () => {
    it('should return true for puzzle with unique solution', () => {
      const board = copyBoard(validPuzzle);
      expect(hasUniqueSolution(board)).toBe(true);
    });

    it('should return false for unsolvable puzzle', () => {
      const board = copyBoard(invalidBoardRowDuplicate);
      expect(hasUniqueSolution(board)).toBe(false);
    });

    it('should return false for empty board (multiple solutions)', () => {
      const board = copyBoard(emptyBoard);
      expect(hasUniqueSolution(board)).toBe(false);
    });

    it('should return true for fully filled valid board', () => {
      const board = copyBoard(fullyFilledValidBoard);
      expect(hasUniqueSolution(board)).toBe(true);
    });

    it('should not modify the original board', () => {
      const board = copyBoard(validPuzzle);
      const original = copyBoard(board);
      
      hasUniqueSolution(board);
      
      expect(board).toEqual(original);
    });
  });

  describe('isSolvable', () => {
    it('should return true for solvable puzzle', () => {
      const board = copyBoard(validPuzzle);
      expect(isSolvable(board)).toBe(true);
    });

    it('should return false for unsolvable puzzle', () => {
      const board = copyBoard(invalidBoardRowDuplicate);
      expect(isSolvable(board)).toBe(false);
    });

    it('should return true for empty board', () => {
      const board = copyBoard(emptyBoard);
      expect(isSolvable(board)).toBe(true);
    });

    it('should return true for fully filled valid board', () => {
      const board = copyBoard(fullyFilledValidBoard);
      expect(isSolvable(board)).toBe(true);
    });

    it('should not modify the original board', () => {
      const board = copyBoard(validPuzzle);
      const original = copyBoard(board);
      
      isSolvable(board);
      
      expect(board).toEqual(original);
    });

    it('should return true for puzzle with multiple solutions', () => {
      const board = copyBoard(emptyBoard);
      expect(isSolvable(board)).toBe(true);
    });
  });
});

