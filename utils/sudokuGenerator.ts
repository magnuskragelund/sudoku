/**
 * Sudoku Puzzle Generator
 * Generates Sudoku puzzles with guaranteed unique solutions
 * Now includes technique-based difficulty rating
 */

import { Difficulty } from '../types/game';
import { countSolutions, isValid } from './sudokuSolver';
import { analyzeTechniques, getDifficultyFromTechniques, SolvingTechnique } from './sudokuTechniqueAnalyzer';

// Difficulty mapping: number of clues (filled cells) for each difficulty
const DIFFICULTY_CLUES = {
  easy: { min: 36, max: 40 },    // More clues = easier
  medium: { min: 32, max: 35 },
  hard: { min: 28, max: 31 },
  master: { min: 24, max: 27 }   // Fewer clues = harder
};

// Expected techniques for each difficulty level
const DIFFICULTY_TECHNIQUES: Record<Difficulty, SolvingTechnique[]> = {
  easy: ['naked_single', 'hidden_single'],
  medium: ['naked_single', 'hidden_single', 'naked_pair', 'hidden_pair'],
  hard: ['naked_single', 'hidden_single', 'naked_pair', 'hidden_pair', 'x_wing'],
  master: ['x_wing', 'swordfish', 'xy_wing', 'backtracking']
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
 * Yield control to the event loop to allow UI updates
 * Uses multiple mechanisms to ensure control is actually yielded
 */
function yieldControl(): Promise<void> {
  return new Promise(resolve => {
    // Use setImmediate if available (Node.js/React Native), otherwise setTimeout
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      // Use requestAnimationFrame + setTimeout for maximum compatibility
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Double setTimeout to ensure we yield
          setTimeout(resolve, 0);
        }, 0);
      });
    }
  });
}

/**
 * Generate a complete Sudoku puzzle with guaranteed unique solution
 * Now validates that puzzles require appropriate techniques for their difficulty
 * @param difficulty - The desired difficulty level
 * @returns Object containing the puzzle and its solution
 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: number[][], solution: number[][] } {
  const maxAttempts = 50; // Limit attempts to prevent infinite loops
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Generate a complete solution
    const solution = generateCompleteSolution();
    
    // Generate puzzle by removing numbers
    const puzzle = generatePuzzleFromSolution(solution, difficulty);
    
    // Verify the puzzle has a unique solution (safety check)
    const solutionCount = countSolutions(puzzle, 2);
    if (solutionCount !== 1) {
      attempts++;
      continue; // Try again
    }
    
    // Analyze techniques required to solve this puzzle
    const analysis = analyzeTechniques(puzzle);
    const techniqueDifficulty = getDifficultyFromTechniques(analysis);
    
    // Check if puzzle requires appropriate techniques for its difficulty
    const expectedTechniques = DIFFICULTY_TECHNIQUES[difficulty];
    const hasRequiredTechnique = expectedTechniques.some(tech => 
      analysis.techniques.includes(tech) || analysis.maxDifficulty === tech
    );
    
    // For easy/medium, ensure it doesn't require advanced techniques
    // For hard/master, ensure it requires at least some advanced techniques
    if (difficulty === 'easy' || difficulty === 'medium') {
      if (analysis.requiresAdvanced) {
        attempts++;
        continue; // Too hard, try again
      }
    }
    
    if (difficulty === 'hard' || difficulty === 'master') {
      if (!hasRequiredTechnique && !analysis.requiresAdvanced) {
        attempts++;
        continue; // Too easy, try again
      }
    }
    
    // If we get here, puzzle matches difficulty requirements
    return { puzzle, solution };
  }
  
  // If we've exhausted attempts, return a valid puzzle anyway
  // (better than failing completely)
  const solution = generateCompleteSolution();
  const puzzle = generatePuzzleFromSolution(solution, difficulty);
  return { puzzle, solution };
}

/**
 * Async version that yields control periodically to allow UI updates
 * @param difficulty - The desired difficulty level
 * @returns Promise resolving to object containing the puzzle and its solution
 */
export async function generatePuzzleAsync(difficulty: Difficulty): Promise<{ puzzle: number[][], solution: number[][] }> {
  const maxAttempts = 50; // Limit attempts to prevent infinite loops
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Yield control before starting each attempt
    await yieldControl();
    
    // Generate a complete solution
    const solution = generateCompleteSolution();
    
    // Yield control after generating solution
    await yieldControl();
    
    // Generate puzzle by removing numbers (this is the expensive part)
    const puzzle = await generatePuzzleFromSolutionAsync(solution, difficulty);
    
    // Yield control after generating puzzle
    await yieldControl();
    
    // Verify the puzzle has a unique solution (safety check)
    const solutionCount = countSolutions(puzzle, 2);
    if (solutionCount !== 1) {
      attempts++;
      continue; // Try again
    }
    
    // Yield control before analysis
    await yieldControl();
    
    // Analyze techniques required to solve this puzzle
    const analysis = analyzeTechniques(puzzle);
    const techniqueDifficulty = getDifficultyFromTechniques(analysis);
    
    // Check if puzzle requires appropriate techniques for its difficulty
    const expectedTechniques = DIFFICULTY_TECHNIQUES[difficulty];
    const hasRequiredTechnique = expectedTechniques.some(tech => 
      analysis.techniques.includes(tech) || analysis.maxDifficulty === tech
    );
    
    // For easy/medium, ensure it doesn't require advanced techniques
    // For hard/master, ensure it requires at least some advanced techniques
    if (difficulty === 'easy' || difficulty === 'medium') {
      if (analysis.requiresAdvanced) {
        attempts++;
        continue; // Too hard, try again
      }
    }
    
    if (difficulty === 'hard' || difficulty === 'master') {
      if (!hasRequiredTechnique && !analysis.requiresAdvanced) {
        attempts++;
        continue; // Too easy, try again
      }
    }
    
    // If we get here, puzzle matches difficulty requirements
    return { puzzle, solution };
  }
  
  // If we've exhausted attempts, return a valid puzzle anyway
  // (better than failing completely)
  await yieldControl();
  const solution = generateCompleteSolution();
  await yieldControl();
  const puzzle = await generatePuzzleFromSolutionAsync(solution, difficulty);
  return { puzzle, solution };
}

/**
 * Async version of generatePuzzleFromSolution that yields control periodically
 */
async function generatePuzzleFromSolutionAsync(solution: number[][], difficulty: Difficulty): Promise<number[][]> {
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
  
  for (let i = 0; i < positions.length; i++) {
    const [row, col] = positions[i];
    
    if (cluesRemaining <= targetClues) break;
    if (attempts >= maxAttempts) break;
    
    // Yield BEFORE processing each cell to maximize UI update opportunities
    await yieldControl();
    
    // Store the current number
    const originalNumber = puzzle[row][col];
    
    // Remove the number
    puzzle[row][col] = 0;
    
    // Yield again before expensive countSolutions call
    await yieldControl();
    
    // Check if the puzzle still has a unique solution
    // This is expensive and blocks - we yield before and after
    const solutionCount = countSolutions(puzzle, 2);
    
    // Yield AFTER expensive countSolutions call - CRITICAL for UI updates
    await yieldControl();
    
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
