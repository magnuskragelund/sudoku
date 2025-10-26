/**
 * Core Sudoku Rules Validation
 * Provides shared validation logic for all Sudoku operations
 */

/**
 * Check if a number placement is valid according to Sudoku rules
 * Shared logic for both solver and validator
 */
export function checkSudokuRules(
  board: number[][], 
  row: number, 
  col: number, 
  num: number,
  options: { skipCurrentCell?: boolean } = {}
): boolean {
  const { skipCurrentCell = false } = options;

  // Check if number is in valid range
  if (num < 1 || num > 9) return false;

  // Check if position is within bounds
  if (row < 0 || row >= 9 || col < 0 || col >= 9) return false;

  // Check row for duplicates
  for (let x = 0; x < 9; x++) {
    if (skipCurrentCell && x === col) continue;
    if (board[row][x] === num) return false;
  }

  // Check column for duplicates
  for (let x = 0; x < 9; x++) {
    if (skipCurrentCell && x === row) continue;
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box for duplicates
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const checkRow = startRow + i;
      const checkCol = startCol + j;
      
      // Skip the current cell if requested
      if (skipCurrentCell && checkRow === row && checkCol === col) continue;
      
      if (board[checkRow][checkCol] === num) return false;
    }
  }

  return true;
}

/**
 * Check if a cell is already occupied
 */
export function isCellOccupied(board: number[][], row: number, col: number): boolean {
  return board[row][col] !== 0;
}

/**
 * Create a deep copy of a Sudoku board
 */
export function copyBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

