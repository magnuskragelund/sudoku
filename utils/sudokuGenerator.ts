/**
 * Sudoku Puzzle Generator
 * Generates Sudoku puzzles with guaranteed unique solutions
 */

import { Difficulty } from '../types/game';
import { countSolutions, isValid } from './sudokuSolver';

// Difficulty mapping: number of clues (filled cells) for each difficulty
const DIFFICULTY_CLUES = {
  easy: { min: 36, max: 40 },    // More clues = easier
  medium: { min: 32, max: 35 },
  hard: { min: 28, max: 31 },
  master: { min: 24, max: 27 }   // Fewer clues = harder
};

/**
 * Generate a complete, valid Sudoku solution using backtracking with randomization
 * @returns A complete 9x9 Sudoku solution
 */
function generateCompleteSolution(): number[][] {
  // Create empty 9x9 grid
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  
  // Fill the grid using backtracking with randomization
  function fillGrid(board: number[][], row: number = 0, col: number = 0): boolean {
    // If we've filled all cells, we're done
    if (row === 9) return true;
    
    // Calculate next position
    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = col === 8 ? 0 : col + 1;
    
    // If current cell is already filled, move to next
    if (board[row][col] !== 0) {
      return fillGrid(board, nextRow, nextCol);
    }
    
    // Create array of numbers 1-9 and shuffle it for randomness
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);
    
    // Try each number
    for (const num of numbers) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        
        if (fillGrid(board, nextRow, nextCol)) {
          return true;
        }
        
        // Backtrack if no solution found
        board[row][col] = 0;
      }
    }
    
    return false;
  }
  
  fillGrid(solution);
  return solution;
}

/**
 * Generate a Sudoku puzzle by removing numbers from a complete solution
 * @param solution - The complete Sudoku solution
 * @param difficulty - The desired difficulty level
 * @returns A Sudoku puzzle with guaranteed unique solution
 */
function generatePuzzleFromSolution(solution: number[][], difficulty: Difficulty): number[][] {
  // Create a copy of the solution
  const puzzle = solution.map(row => [...row]);
  
  // Get target number of clues for this difficulty
  const { min, max } = DIFFICULTY_CLUES[difficulty];
  const targetClues = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Create array of all cell positions and shuffle them
  const positions: [number, number][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  shuffleArray(positions);
  
  // Remove numbers one by one, ensuring uniqueness is maintained
  let cluesRemaining = 81;
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loops
  
  for (const [row, col] of positions) {
    if (cluesRemaining <= targetClues) break;
    if (attempts >= maxAttempts) break;
    
    // Store the current number
    const originalNumber = puzzle[row][col];
    
    // Remove the number
    puzzle[row][col] = 0;
    
    // Check if the puzzle still has a unique solution
    const solutionCount = countSolutions(puzzle, 2);
    
    if (solutionCount === 1) {
      // Unique solution maintained, keep the removal
      cluesRemaining--;
    } else {
      // Multiple solutions or no solution, restore the number
      puzzle[row][col] = originalNumber;
    }
    
    attempts++;
  }
  
  return puzzle;
}

/**
 * Generate a complete Sudoku puzzle with guaranteed unique solution
 * @param difficulty - The desired difficulty level
 * @returns Object containing the puzzle and its solution
 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: number[][], solution: number[][] } {
  // Generate a complete solution
  const solution = generateCompleteSolution();
  
  // Generate puzzle by removing numbers
  const puzzle = generatePuzzleFromSolution(solution, difficulty);
  
  // Verify the puzzle has a unique solution (safety check)
  const solutionCount = countSolutions(puzzle, 2);
  if (solutionCount !== 1) {
    // If generation failed, try again with a new solution
    return generatePuzzle(difficulty);
  }
  
  return { puzzle, solution };
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @param array - The array to shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Count the number of filled cells (clues) in a puzzle
 * @param puzzle - The Sudoku puzzle
 * @returns Number of filled cells
 */
export function countClues(puzzle: number[][]): number {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) count++;
    }
  }
  return count;
}

/**
 * Get difficulty information for a puzzle based on number of clues
 * @param clueCount - Number of clues in the puzzle
 * @returns Difficulty level or 'unknown' if not in standard ranges
 */
export function getDifficultyFromClues(clueCount: number): Difficulty | 'unknown' {
  if (clueCount >= 36 && clueCount <= 40) return 'easy';
  if (clueCount >= 32 && clueCount <= 35) return 'medium';
  if (clueCount >= 28 && clueCount <= 31) return 'hard';
  if (clueCount >= 24 && clueCount <= 27) return 'master';
  return 'unknown';
}
