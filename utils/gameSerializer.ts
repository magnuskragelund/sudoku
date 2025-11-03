import { GameState, SerializableGameState } from '../types/game';
import { logger } from './logger';
import { countSolutions } from './sudokuSolver';

/**
 * Serialize game state to JSON string
 */
export function serializeGameState(state: GameState): string {
  const serializable: SerializableGameState = {
    difficulty: state.difficulty,
    lives: state.initialLives,
    board: state.board,
    solution: state.solution,
    initialBoard: state.initialBoard,
    notes: Object.fromEntries(
      Array.from(state.notes.entries()).map(([key, set]) => [
        key,
        Array.from(set)
      ])
    ),
  };

  return JSON.stringify(serializable);
}

/**
 * Deserialize JSON string to game state
 */
export function deserializeGameState(data: string): SerializableGameState | null {
  try {
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (!isValidSerializedState(parsed)) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    logger.error('Error deserializing game state:', error);
    return null;
  }
}

/**
 * Validate that the parsed data matches the SerializableGameState structure
 */
function isValidSerializedState(data: any): data is SerializableGameState {
  return (
    data &&
    typeof data.difficulty === 'string' &&
    ['easy', 'medium', 'hard', 'master'].includes(data.difficulty) &&
    typeof data.lives === 'number' &&
    data.lives >= 1 && data.lives <= 5 &&
    Array.isArray(data.board) &&
    data.board.length === 9 &&
    data.board.every((row: any) => 
      Array.isArray(row) && 
      row.length === 9 &&
      row.every((cell: any) => 
        typeof cell === 'number' && 
        cell >= 0 && 
        cell <= 9
      )
    ) &&
    Array.isArray(data.solution) &&
    data.solution.length === 9 &&
    data.solution.every((row: any) => 
      Array.isArray(row) && 
      row.length === 9 &&
      row.every((cell: any) => 
        typeof cell === 'number' && 
        cell >= 1 && 
        cell <= 9
      )
    ) &&
    Array.isArray(data.initialBoard) &&
    data.initialBoard.length === 9 &&
    data.initialBoard.every((row: any) => 
      Array.isArray(row) && 
      row.length === 9 &&
      row.every((cell: any) => 
        typeof cell === 'number' && 
        cell >= 0 && 
        cell <= 9
      )
    ) &&
    typeof data.notes === 'object'
  );
}

/**
 * Validate that the game state has a unique solution and the solution is correct
 */
export function validateGameState(state: SerializableGameState): boolean {
  // Verify puzzle has unique solution
  const solutionCount = countSolutions(state.board, 2);
  if (solutionCount !== 1) {
    logger.error('Puzzle does not have a unique solution');
    return false;
  }
  
  // Verify the provided solution is correct
  const boardCopy = state.board.map(row => [...row]);
  const hasValidSolution = isSolutionCorrect(boardCopy, state.solution);
  
  if (!hasValidSolution) {
    logger.error('Provided solution does not match puzzle');
    return false;
  }
  
  return true;
}

/**
 * Check if the provided solution matches the puzzle clues
 */
function isSolutionCorrect(puzzle: number[][], solution: number[][]): boolean {
  // Check that all initial clues match
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) {
        if (puzzle[row][col] !== solution[row][col]) {
          return false;
        }
      }
    }
  }
  return true;
}

