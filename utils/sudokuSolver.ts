/**
 * Sudoku Solver with Backtracking Algorithm
 * Provides solving and solution counting capabilities for Sudoku puzzles
 */

/**
 * Check if placing a number at a specific position is valid according to Sudoku rules
 * @param board - The current Sudoku board
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @param num - Number to place (1-9)
 * @returns true if the placement is valid, false otherwise
 */
export function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // Check if number is in valid range
  if (num < 1 || num > 9) return false;

  // Check row for duplicates
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column for duplicates
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box for duplicates
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
}

/**
 * Solve a Sudoku puzzle using backtracking algorithm
 * @param board - The Sudoku board to solve (will be modified)
 * @returns true if a solution exists, false otherwise
 */
export function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Find empty cell
      if (board[row][col] === 0) {
        // Try numbers 1-9
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            
            // Recursively solve the rest
            if (solveSudoku(board)) {
              return true;
            }
            
            // Backtrack if no solution found
            board[row][col] = 0;
          }
        }
        return false; // No valid number found
      }
    }
  }
  return true; // All cells filled
}

/**
 * Count the number of solutions for a Sudoku puzzle
 * @param board - The Sudoku board to analyze
 * @param maxCount - Maximum number of solutions to count (default: 2)
 * @returns Number of solutions found (up to maxCount)
 */
export function countSolutions(board: number[][], maxCount: number = 2): number {
  // Create a copy of the board to avoid modifying the original
  const boardCopy = board.map(row => [...row]);
  
  let solutionCount = 0;
  
  function solve(board: number[][], row: number = 0, col: number = 0): void {
    // If we've found enough solutions, stop counting
    if (solutionCount >= maxCount) return;
    
    // If we've reached the end, we found a solution
    if (row === 9) {
      solutionCount++;
      return;
    }
    
    // Calculate next position
    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = col === 8 ? 0 : col + 1;
    
    // If current cell is already filled, move to next
    if (board[row][col] !== 0) {
      solve(board, nextRow, nextCol);
      return;
    }
    
    // Try numbers 1-9
    for (let num = 1; num <= 9; num++) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        solve(board, nextRow, nextCol);
        board[row][col] = 0; // Backtrack
        
        // If we've found enough solutions, stop
        if (solutionCount >= maxCount) return;
      }
    }
  }
  
  solve(boardCopy);
  return solutionCount;
}

/**
 * Check if a Sudoku puzzle has exactly one unique solution
 * @param board - The Sudoku board to check
 * @returns true if the puzzle has exactly one solution, false otherwise
 */
export function hasUniqueSolution(board: number[][]): boolean {
  return countSolutions(board, 2) === 1;
}

/**
 * Check if a Sudoku puzzle is solvable
 * @param board - The Sudoku board to check
 * @returns true if the puzzle has at least one solution, false otherwise
 */
export function isSolvable(board: number[][]): boolean {
  return countSolutions(board, 1) >= 1;
}
