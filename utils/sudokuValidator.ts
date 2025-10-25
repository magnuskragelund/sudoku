/**
 * Sudoku Rule Validator
 * Provides validation functions for Sudoku gameplay rules
 */

/**
 * Check if placing a number at a specific position violates Sudoku rules
 * @param board - The current Sudoku board
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @param num - Number to place (1-9)
 * @returns true if the move is valid, false if it violates rules
 */
export function isValidMove(board: number[][], row: number, col: number, num: number): boolean {
  // Check if number is in valid range
  if (num < 1 || num > 9) return false;

  // Check if position is within bounds
  if (row < 0 || row >= 9 || col < 0 || col >= 9) return false;

  // Check if cell is already occupied
  if (board[row][col] !== 0) return false;

  // Check row for duplicates
  for (let x = 0; x < 9; x++) {
    if (x !== col && board[row][x] === num) return false;
  }

  // Check column for duplicates
  for (let x = 0; x < 9; x++) {
    if (x !== row && board[x][col] === num) return false;
  }

  // Check 3x3 box for duplicates
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const checkRow = startRow + i;
      const checkCol = startCol + j;
      
      // Skip the current cell
      if (checkRow === row && checkCol === col) continue;
      
      if (board[checkRow][checkCol] === num) return false;
    }
  }

  return true;
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
      
      // Check if this number violates any rules
      if (!isValidMove(board, row, col, num)) {
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
