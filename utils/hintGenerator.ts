/**
 * Hint Generator
 * Generates educational hints that teach solving techniques instead of just revealing answers
 */

import { SolvingTechnique, getCandidates } from './sudokuTechniqueAnalyzer';

export interface Hint {
  technique: SolvingTechnique;
  explanation: string;
  cell?: { row: number; col: number };
  value?: number;
  guidance: string; // Step-by-step guidance
}

/**
 * Get technique explanations
 */
function getTechniqueExplanation(technique: SolvingTechnique): string {
  const explanations: Record<SolvingTechnique, string> = {
    naked_single: 'Naked Single: A cell has only one possible number.',
    hidden_single: 'Hidden Single: A number appears only once in a row, column, or box.',
    naked_pair: 'Naked Pair: Two cells in the same unit share the same two candidates.',
    hidden_pair: 'Hidden Pair: Two numbers appear only in two cells of a unit.',
    naked_triple: 'Naked Triple: Three cells in the same unit share three candidates.',
    hidden_triple: 'Hidden Triple: Three numbers appear only in three cells of a unit.',
    x_wing: 'X-Wing: A number forms a rectangle pattern across two rows and two columns.',
    swordfish: 'Swordfish: A number forms a pattern across three rows and three columns.',
    xy_wing: 'XY-Wing: A cell with candidates XY connects two cells with XZ and YZ.',
    backtracking: 'This puzzle requires trial and error or advanced logic.',
  };
  
  return explanations[technique];
}

/**
 * Get step-by-step guidance for a technique
 */
function getTechniqueGuidance(technique: SolvingTechnique, cell?: { row: number; col: number }, value?: number): string {
  if (technique === 'naked_single' && cell && value) {
    return `Look at row ${cell.row + 1}, column ${cell.col + 1}. This cell has only one possible number: ${value}.`;
  }
  
  if (technique === 'hidden_single' && cell && value) {
    return `Check row ${cell.row + 1}, column ${cell.col + 1}, or its 3x3 box. The number ${value} can only go in one cell.`;
  }
  
  if (technique === 'naked_pair') {
    return 'Look for two empty cells in the same row, column, or box that have exactly the same two candidates. These numbers can be eliminated from other cells in that unit.';
  }
  
  if (technique === 'hidden_pair') {
    return 'Look for a row, column, or box where two numbers appear only in two cells. Those cells must contain those two numbers.';
  }
  
  if (technique === 'x_wing') {
    return 'Look for a number that appears exactly twice in two rows, and those positions form a rectangle. You can eliminate that number from the corresponding columns.';
  }
  
  if (technique === 'swordfish') {
    return 'Look for a number that appears exactly twice in three rows, forming a pattern. You can eliminate that number from the corresponding columns.';
  }
  
  if (technique === 'xy_wing') {
    return 'Look for a cell with two candidates (XY) that connects two other cells (one with XZ, one with YZ). This creates a chain that eliminates candidates.';
  }
  
  return 'Try scanning the grid systematically. Look for cells with few candidates or numbers that appear rarely in a unit.';
}

/**
 * Find the next applicable technique and generate a hint
 * If selectedCell is provided, prioritizes hints related to that cell
 */
export function generateHint(board: number[][], selectedCell?: { row: number; col: number } | null): Hint | null {
  const candidates = getCandidates(board);
  
  // If a cell is selected, prioritize hints for that cell
  if (selectedCell) {
    const { row, col } = selectedCell;
    const key = `${row}-${col}`;
    
    // Check if selected cell is empty
    if (board[row][col] === 0 && candidates.has(key)) {
      const candidateSet = candidates.get(key)!;
      
      // Check for naked single in selected cell
      if (candidateSet.size === 1) {
        const value = Array.from(candidateSet)[0];
        return {
          technique: 'naked_single',
          explanation: getTechniqueExplanation('naked_single'),
          cell: { row, col },
          value,
          guidance: `The selected cell (row ${row + 1}, column ${col + 1}) has only one possible number: ${value}.`,
        };
      }
      
      // Check for hidden single in selected cell's row
      for (let num = 1; num <= 9; num++) {
        if (candidateSet.has(num)) {
          let count = 0;
          for (let c = 0; c < 9; c++) {
            const cellKey = `${row}-${c}`;
            if (candidates.has(cellKey) && candidates.get(cellKey)!.has(num)) {
              count++;
            }
          }
          if (count === 1) {
            return {
              technique: 'hidden_single',
              explanation: getTechniqueExplanation('hidden_single'),
              cell: { row, col },
              value: num,
              guidance: `In row ${row + 1}, the number ${num} can only go in the selected cell (column ${col + 1}).`,
            };
          }
        }
      }
      
      // Check for hidden single in selected cell's column
      for (let num = 1; num <= 9; num++) {
        if (candidateSet.has(num)) {
          let count = 0;
          for (let r = 0; r < 9; r++) {
            const cellKey = `${r}-${col}`;
            if (candidates.has(cellKey) && candidates.get(cellKey)!.has(num)) {
              count++;
            }
          }
          if (count === 1) {
            return {
              technique: 'hidden_single',
              explanation: getTechniqueExplanation('hidden_single'),
              cell: { row, col },
              value: num,
              guidance: `In column ${col + 1}, the number ${num} can only go in the selected cell (row ${row + 1}).`,
            };
          }
        }
      }
      
      // Check for hidden single in selected cell's box
      const boxRow = Math.floor(row / 3);
      const boxCol = Math.floor(col / 3);
      for (let num = 1; num <= 9; num++) {
        if (candidateSet.has(num)) {
          let count = 0;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              const r = boxRow * 3 + i;
              const c = boxCol * 3 + j;
              const cellKey = `${r}-${c}`;
              if (candidates.has(cellKey) && candidates.get(cellKey)!.has(num)) {
                count++;
              }
            }
          }
          if (count === 1) {
            return {
              technique: 'hidden_single',
              explanation: getTechniqueExplanation('hidden_single'),
              cell: { row, col },
              value: num,
              guidance: `In the 3x3 box containing the selected cell, the number ${num} can only go in row ${row + 1}, column ${col + 1}.`,
            };
          }
        }
      }
      
      // Check for naked pair involving selected cell
      if (candidateSet.size === 2) {
        const nums = Array.from(candidateSet);
        // Check same row
        for (let c = 0; c < 9; c++) {
          if (c !== col) {
            const cellKey = `${row}-${c}`;
            if (candidates.has(cellKey)) {
              const otherSet = candidates.get(cellKey)!;
              if (otherSet.size === 2 && Array.from(otherSet).every(n => candidateSet.has(n))) {
                return {
                  technique: 'naked_pair',
                  explanation: getTechniqueExplanation('naked_pair'),
                  cell: { row, col },
                  guidance: `The selected cell and the cell in row ${row + 1}, column ${c + 1} form a naked pair with candidates ${nums.join(' and ')}. These numbers can be eliminated from other cells in row ${row + 1}.`,
                };
              }
            }
          }
        }
        // Check same column
        for (let r = 0; r < 9; r++) {
          if (r !== row) {
            const cellKey = `${r}-${col}`;
            if (candidates.has(cellKey)) {
              const otherSet = candidates.get(cellKey)!;
              if (otherSet.size === 2 && Array.from(otherSet).every(n => candidateSet.has(n))) {
                return {
                  technique: 'naked_pair',
                  explanation: getTechniqueExplanation('naked_pair'),
                  cell: { row, col },
                  guidance: `The selected cell and the cell in row ${r + 1}, column ${col + 1} form a naked pair with candidates ${nums.join(' and ')}. These numbers can be eliminated from other cells in column ${col + 1}.`,
                };
              }
            }
          }
        }
        // Check same box
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = boxRow * 3 + i;
            const c = boxCol * 3 + j;
            if (r !== row || c !== col) {
              const cellKey = `${r}-${c}`;
              if (candidates.has(cellKey)) {
                const otherSet = candidates.get(cellKey)!;
                if (otherSet.size === 2 && Array.from(otherSet).every(n => candidateSet.has(n))) {
                  return {
                    technique: 'naked_pair',
                    explanation: getTechniqueExplanation('naked_pair'),
                    cell: { row, col },
                    guidance: `The selected cell and another cell in the same 3x3 box form a naked pair with candidates ${nums.join(' and ')}. These numbers can be eliminated from other cells in that box.`,
                  };
                }
              }
            }
          }
        }
      }
      
      // If selected cell has multiple candidates, provide general guidance
      if (candidateSet.size > 1) {
        const candidatesList = Array.from(candidateSet).sort().join(', ');
        return {
          technique: 'naked_single',
          explanation: `The selected cell has ${candidateSet.size} possible candidates: ${candidatesList}.`,
          cell: { row, col },
          guidance: `Look at row ${row + 1}, column ${col + 1}, and its 3x3 box. Try to eliminate candidates by checking where numbers already appear or where they must go.`,
        };
      }
    }
  }
  
  // Fall back to general hints if no cell selected or nothing applies to selected cell
  // Try to find a naked single first (easiest)
  for (const [key, candidateSet] of candidates.entries()) {
    if (candidateSet.size === 1) {
      const [row, col] = key.split('-').map(Number);
      const value = Array.from(candidateSet)[0];
      return {
        technique: 'naked_single',
        explanation: getTechniqueExplanation('naked_single'),
        cell: { row, col },
        value,
        guidance: getTechniqueGuidance('naked_single', { row, col }, value),
      };
    }
  }
  
  // Try to find a hidden single
  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      let foundCell: { row: number; col: number } | null = null;
      for (let col = 0; col < 9; col++) {
        const key = `${row}-${col}`;
        if (candidates.has(key) && candidates.get(key)!.has(num)) {
          count++;
          foundCell = { row, col };
        }
      }
      if (count === 1 && foundCell) {
        return {
          technique: 'hidden_single',
          explanation: getTechniqueExplanation('hidden_single'),
          cell: foundCell,
          value: num,
          guidance: getTechniqueGuidance('hidden_single', foundCell, num),
        };
      }
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      let foundCell: { row: number; col: number } | null = null;
      for (let row = 0; row < 9; row++) {
        const key = `${row}-${col}`;
        if (candidates.has(key) && candidates.get(key)!.has(num)) {
          count++;
          foundCell = { row, col };
        }
      }
      if (count === 1 && foundCell) {
        return {
          technique: 'hidden_single',
          explanation: getTechniqueExplanation('hidden_single'),
          cell: foundCell,
          value: num,
          guidance: getTechniqueGuidance('hidden_single', foundCell, num),
        };
      }
    }
  }
  
  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        let count = 0;
        let foundCell: { row: number; col: number } | null = null;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow * 3 + i;
            const col = boxCol * 3 + j;
            const key = `${row}-${col}`;
            if (candidates.has(key) && candidates.get(key)!.has(num)) {
              count++;
              foundCell = { row, col };
            }
          }
        }
        if (count === 1 && foundCell) {
          return {
            technique: 'hidden_single',
            explanation: getTechniqueExplanation('hidden_single'),
            cell: foundCell,
            value: num,
            guidance: getTechniqueGuidance('hidden_single', foundCell, num),
          };
        }
      }
    }
  }
  
  // Check for naked pairs
  const candidateArray = Array.from(candidates.entries());
  for (let i = 0; i < candidateArray.length; i++) {
    const [key1, set1] = candidateArray[i];
    if (set1.size !== 2) continue;
    
    const [row1, col1] = key1.split('-').map(Number);
    
    for (let j = i + 1; j < candidateArray.length; j++) {
      const [key2, set2] = candidateArray[j];
      const [row2, col2] = key2.split('-').map(Number);
      
      // Check if same row, column, or box
      const sameRow = row1 === row2;
      const sameCol = col1 === col2;
      const sameBox = Math.floor(row1 / 3) === Math.floor(row2 / 3) && 
                      Math.floor(col1 / 3) === Math.floor(col2 / 3);
      
      if ((sameRow || sameCol || sameBox) && 
          set1.size === 2 && set2.size === 2 &&
          Array.from(set1).every(n => set2.has(n))) {
        const nums = Array.from(set1);
        return {
          technique: 'naked_pair',
          explanation: getTechniqueExplanation('naked_pair'),
          guidance: getTechniqueGuidance('naked_pair'),
        };
      }
    }
  }
  
  // If no simple technique found, provide general guidance
  return {
    technique: 'backtracking',
    explanation: 'This position requires more advanced techniques or careful analysis.',
    guidance: getTechniqueGuidance('backtracking'),
  };
}
