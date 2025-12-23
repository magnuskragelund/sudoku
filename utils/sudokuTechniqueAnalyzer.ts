/**
 * Sudoku Technique Analyzer
 * Analyzes puzzles to determine what solving techniques are required
 */

import { checkSudokuRules } from './sudokuRules';

export type SolvingTechnique = 
  | 'naked_single'
  | 'hidden_single'
  | 'naked_pair'
  | 'hidden_pair'
  | 'naked_triple'
  | 'hidden_triple'
  | 'x_wing'
  | 'swordfish'
  | 'xy_wing'
  | 'backtracking'; // Fallback when no human technique works

export interface TechniqueAnalysis {
  techniques: SolvingTechnique[];
  maxDifficulty: SolvingTechnique;
  requiresAdvanced: boolean;
}

/**
 * Get all candidates (possible numbers) for each empty cell
 */
export function getCandidates(board: number[][]): Map<string, Set<number>> {
  const candidates = new Map<string, Set<number>>();
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const cellCandidates = new Set<number>();
        for (let num = 1; num <= 9; num++) {
          if (checkSudokuRules(board, row, col, num, { skipCurrentCell: true })) {
            cellCandidates.add(num);
          }
        }
        candidates.set(`${row}-${col}`, cellCandidates);
      }
    }
  }
  
  return candidates;
}

/**
 * Check if puzzle can be solved using only naked singles (only one candidate in a cell)
 */
function hasNakedSingle(candidates: Map<string, Set<number>>): boolean {
  for (const candidateSet of candidates.values()) {
    if (candidateSet.size === 1) {
      return true;
    }
  }
  return false;
}

/**
 * Check if puzzle can be solved using hidden singles
 * (a candidate appears only once in a row, column, or box)
 */
function hasHiddenSingle(board: number[][], candidates: Map<string, Set<number>>): boolean {
  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      for (let col = 0; col < 9; col++) {
        const key = `${row}-${col}`;
        if (candidates.has(key) && candidates.get(key)!.has(num)) {
          count++;
        }
      }
      if (count === 1) return true;
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      for (let row = 0; row < 9; row++) {
        const key = `${row}-${col}`;
        if (candidates.has(key) && candidates.get(key)!.has(num)) {
          count++;
        }
      }
      if (count === 1) return true;
    }
  }
  
  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        let count = 0;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow * 3 + i;
            const col = boxCol * 3 + j;
            const key = `${row}-${col}`;
            if (candidates.has(key) && candidates.get(key)!.has(num)) {
              count++;
            }
          }
        }
        if (count === 1) return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if puzzle requires naked pairs (two cells in same unit with same two candidates)
 */
function hasNakedPair(candidates: Map<string, Set<number>>): boolean {
  const candidateArray = Array.from(candidates.entries());
  
  // Check pairs
  for (let i = 0; i < candidateArray.length; i++) {
    const [key1, set1] = candidateArray[i];
    if (set1.size !== 2) continue;
    
    const [row1, col1] = key1.split('-').map(Number);
    
    // Check same row
    for (let j = i + 1; j < candidateArray.length; j++) {
      const [key2, set2] = candidateArray[j];
      const [row2, col2] = key2.split('-').map(Number);
      
      if (row1 === row2 && set1.size === 2 && set2.size === 2) {
        if (set1.size === set2.size && Array.from(set1).every(n => set2.has(n))) {
          return true;
        }
      }
      
      // Check same column
      if (col1 === col2 && set1.size === 2 && set2.size === 2) {
        if (set1.size === set2.size && Array.from(set1).every(n => set2.has(n))) {
          return true;
        }
      }
      
      // Check same box
      if (Math.floor(row1 / 3) === Math.floor(row2 / 3) && 
          Math.floor(col1 / 3) === Math.floor(col2 / 3) &&
          set1.size === 2 && set2.size === 2) {
        if (set1.size === set2.size && Array.from(set1).every(n => set2.has(n))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check if puzzle requires hidden pairs
 * (two candidates appear only in two cells of a unit)
 */
function hasHiddenPair(candidates: Map<string, Set<number>>): boolean {
  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num1 = 1; num1 <= 8; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        const cells: string[] = [];
        for (let col = 0; col < 9; col++) {
          const key = `${row}-${col}`;
          if (candidates.has(key)) {
            const cellCandidates = candidates.get(key)!;
            if (cellCandidates.has(num1) || cellCandidates.has(num2)) {
              cells.push(key);
            }
          }
        }
        if (cells.length === 2) {
          // Check if both numbers appear in both cells
          const cell1 = candidates.get(cells[0])!;
          const cell2 = candidates.get(cells[1])!;
          if (cell1.has(num1) && cell1.has(num2) && cell2.has(num1) && cell2.has(num2)) {
            return true;
          }
        }
      }
    }
  }
  
  // Similar checks for columns and boxes would go here
  // Simplified for now - can be expanded
  
  return false;
}

/**
 * Check if puzzle requires X-wing pattern
 */
function hasXWing(candidates: Map<string, Set<number>>): boolean {
  // X-wing: a number appears exactly twice in two rows (or columns)
  // and those positions form a rectangle
  
  // Check rows
  for (let num = 1; num <= 9; num++) {
    const rowPositions: number[][] = [];
    
    for (let row = 0; row < 9; row++) {
      const positions: number[] = [];
      for (let col = 0; col < 9; col++) {
        const key = `${row}-${col}`;
        if (candidates.has(key) && candidates.get(key)!.has(num)) {
          positions.push(col);
        }
      }
      if (positions.length === 2) {
        rowPositions.push([row, ...positions]);
      }
    }
    
    // Check if we have two rows with same column positions
    for (let i = 0; i < rowPositions.length; i++) {
      for (let j = i + 1; j < rowPositions.length; j++) {
        const [row1, col1a, col1b] = rowPositions[i];
        const [row2, col2a, col2b] = rowPositions[j];
        
        if ((col1a === col2a && col1b === col2b) || 
            (col1a === col2b && col1b === col2a)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Analyze a puzzle to determine what solving techniques are required
 */
export function analyzeTechniques(board: number[][]): TechniqueAnalysis {
  const candidates = getCandidates(board);
  const techniques: SolvingTechnique[] = [];
  
  // Check techniques in order of difficulty
  if (hasNakedSingle(candidates)) {
    techniques.push('naked_single');
  }
  
  if (hasHiddenSingle(board, candidates)) {
    techniques.push('hidden_single');
  }
  
  if (hasNakedPair(candidates)) {
    techniques.push('naked_pair');
  }
  
  if (hasHiddenPair(candidates)) {
    techniques.push('hidden_pair');
  }
  
  if (hasXWing(candidates)) {
    techniques.push('x_wing');
  }
  
  // If no human techniques found, requires backtracking
  if (techniques.length === 0) {
    techniques.push('backtracking');
  }
  
  // Determine max difficulty
  const techniqueOrder: SolvingTechnique[] = [
    'naked_single',
    'hidden_single',
    'naked_pair',
    'hidden_pair',
    'naked_triple',
    'hidden_triple',
    'x_wing',
    'swordfish',
    'xy_wing',
    'backtracking'
  ];
  
  const maxDifficulty = techniques.reduce((max, tech) => {
    const maxIndex = techniqueOrder.indexOf(max);
    const techIndex = techniqueOrder.indexOf(tech);
    return techIndex > maxIndex ? tech : max;
  }, techniques[0] || 'backtracking');
  
  const advancedTechniques: SolvingTechnique[] = ['x_wing', 'swordfish', 'xy_wing', 'backtracking'];
  const requiresAdvanced = advancedTechniques.includes(maxDifficulty);
  
  return {
    techniques,
    maxDifficulty,
    requiresAdvanced
  };
}

/**
 * Get difficulty level based on required techniques
 */
export function getDifficultyFromTechniques(analysis: TechniqueAnalysis): 'easy' | 'medium' | 'hard' | 'master' {
  const { maxDifficulty } = analysis;
  
  if (maxDifficulty === 'naked_single' || maxDifficulty === 'hidden_single') {
    return 'easy';
  }
  
  if (maxDifficulty === 'naked_pair' || maxDifficulty === 'hidden_pair') {
    return 'medium';
  }
  
  if (maxDifficulty === 'x_wing') {
    return 'hard';
  }
  
  // Advanced techniques
  return 'master';
}
