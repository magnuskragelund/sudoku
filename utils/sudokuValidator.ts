/**
 * Sudoku Rule Validator
 * Provides validation functions for Sudoku gameplay rules
 */

import { checkSudokuRules, isCellOccupied } from './sudokuRules';

/**
 * Check if placing a number at a specific position violates Sudoku rules
 * @param board - The current Sudoku board
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @param num - Number to place (1-9)
 * @returns true if the move is valid, false if it violates rules
 */
export function isValidMove(board: number[][], row: number, col: number, num: number): boolean {
  // Check if cell is already occupied
  if (isCellOccupied(board, row, col)) return false;

  // Check Sudoku rules (skip current cell since we're checking if we can place a number)
  return checkSudokuRules(board, row, col, num, { skipCurrentCell: true });
}

/**
 * Check if a Sudoku board is in a valid state (no rule violations)
 * @param board - The Sudoku board to validate
 * @returns true if the board is valid, false if there are rule violations
 */
export function isBoardValid(board: number[][]): boolean {
  // Check each filled cell
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      
      // Skip empty cells
      if (num === 0) continue;
      
      // Check if this number violates any rules (skip current cell since it's already filled)
      if (!checkSudokuRules(board, row, col, num, { skipCurrentCell: true })) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Get all valid numbers that can be placed at a specific position
 * @param board - The current Sudoku board
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @returns Array of valid numbers (1-9) that can be placed at the position
 */
export function getValidNumbers(board: number[][], row: number, col: number): number[] {
  const validNumbers: number[] = [];
  
  for (let num = 1; num <= 9; num++) {
    if (isValidMove(board, row, col, num)) {
      validNumbers.push(num);
    }
  }
  
  return validNumbers;
}
