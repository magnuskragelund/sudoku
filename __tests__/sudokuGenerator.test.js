/**
 * Tests for sudokuGenerator.ts
 * Sudoku puzzle generation functions
 */

const { generatePuzzle, countClues, getDifficultyFromClues } = require('../utils/sudokuGenerator');
const { hasUniqueSolution } = require('../utils/sudokuSolver');
const { isBoardValid } = require('../utils/sudokuValidator');

describe('Sudoku Generator Tests', () => {
  describe('generatePuzzle', () => {
    it('should generate a valid puzzle for easy difficulty', () => {
      const { puzzle, solution } = generatePuzzle('easy');
      
      expect(puzzle).toBeDefined();
      expect(solution).toBeDefined();
      expect(Array.isArray(puzzle)).toBe(true);
      expect(Array.isArray(solution)).toBe(true);
      expect(puzzle.length).toBe(9);
      expect(solution.length).toBe(9);
    });

    it('should generate a valid puzzle for medium difficulty', () => {
      const { puzzle, solution } = generatePuzzle('medium');
      
      expect(puzzle).toBeDefined();
      expect(solution).toBeDefined();
      expect(puzzle.length).toBe(9);
      expect(solution.length).toBe(9);
    });

    it('should generate a valid puzzle for hard difficulty', () => {
      const { puzzle, solution } = generatePuzzle('hard');
      
      expect(puzzle).toBeDefined();
      expect(solution).toBeDefined();
      expect(puzzle.length).toBe(9);
      expect(solution.length).toBe(9);
    });

    it('should generate a valid puzzle for master difficulty', () => {
      const { puzzle, solution } = generatePuzzle('master');
      
      expect(puzzle).toBeDefined();
      expect(solution).toBeDefined();
      expect(puzzle.length).toBe(9);
      expect(solution.length).toBe(9);
    });

    it('should generate puzzle with unique solution', () => {
      const { puzzle } = generatePuzzle('easy');
      
      expect(hasUniqueSolution(puzzle)).toBe(true);
    });

    it('should generate valid puzzle board', () => {
      const { puzzle } = generatePuzzle('easy');
      
      expect(isBoardValid(puzzle)).toBe(true);
    });

    it('should generate valid solution board', () => {
      const { solution } = generatePuzzle('easy');
      
      expect(isBoardValid(solution)).toBe(true);
      
      // Solution should be fully filled
      solution.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeGreaterThan(0);
          expect(cell).toBeLessThanOrEqual(9);
        });
      });
    });

    it('should have puzzle clues matching solution', () => {
      const { puzzle, solution } = generatePuzzle('easy');
      
      // All puzzle clues should match solution
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle[row][col] !== 0) {
            expect(puzzle[row][col]).toBe(solution[row][col]);
          }
        }
      }
    });

    it('should generate different puzzles on multiple calls', () => {
      const puzzle1 = generatePuzzle('easy');
      const puzzle2 = generatePuzzle('easy');
      
      // Puzzles should be different (very unlikely to be identical)
      expect(puzzle1.puzzle).not.toEqual(puzzle2.puzzle);
    });

    it('should generate puzzles with appropriate clue counts for difficulty', () => {
      const easy = generatePuzzle('easy');
      const medium = generatePuzzle('medium');
      const hard = generatePuzzle('hard');
      const master = generatePuzzle('master');
      
      const easyClues = countClues(easy.puzzle);
      const mediumClues = countClues(medium.puzzle);
      const hardClues = countClues(hard.puzzle);
      const masterClues = countClues(master.puzzle);
      
      // Easy should have more clues than medium
      expect(easyClues).toBeGreaterThanOrEqual(mediumClues);
      // Medium should have more clues than hard
      expect(mediumClues).toBeGreaterThanOrEqual(hardClues);
      // Hard should have more clues than master
      expect(hardClues).toBeGreaterThanOrEqual(masterClues);
    });

    it('should generate puzzles within difficulty clue ranges', () => {
      const difficulties = ['easy', 'medium', 'hard', 'master'];
      const expectedRanges = {
        easy: { min: 36, max: 40 },
        medium: { min: 32, max: 35 },
        hard: { min: 28, max: 31 },
        master: { min: 24, max: 27 }
      };
      
      difficulties.forEach(difficulty => {
        const { puzzle } = generatePuzzle(difficulty);
        const clueCount = countClues(puzzle);
        const range = expectedRanges[difficulty];
        
        expect(clueCount).toBeGreaterThanOrEqual(range.min);
        expect(clueCount).toBeLessThanOrEqual(range.max);
      });
    });
  });

  describe('countClues', () => {
    it('should count clues correctly', () => {
      const puzzle = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ];
      
      const clueCount = countClues(puzzle);
      expect(clueCount).toBeGreaterThan(0);
      expect(clueCount).toBeLessThanOrEqual(81);
    });

    it('should return 0 for empty board', () => {
      const puzzle = Array(9).fill(null).map(() => Array(9).fill(0));
      expect(countClues(puzzle)).toBe(0);
    });

    it('should return 81 for fully filled board', () => {
      const puzzle = Array(9).fill(null).map(() => Array(9).fill(1));
      expect(countClues(puzzle)).toBe(81);
    });

    it('should count only non-zero cells', () => {
      const puzzle = [
        [1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ];
      
      expect(countClues(puzzle)).toBe(1);
    });
  });

  describe('getDifficultyFromClues', () => {
    it('should return easy for 36-40 clues', () => {
      expect(getDifficultyFromClues(36)).toBe('easy');
      expect(getDifficultyFromClues(38)).toBe('easy');
      expect(getDifficultyFromClues(40)).toBe('easy');
    });

    it('should return medium for 32-35 clues', () => {
      expect(getDifficultyFromClues(32)).toBe('medium');
      expect(getDifficultyFromClues(33)).toBe('medium');
      expect(getDifficultyFromClues(35)).toBe('medium');
    });

    it('should return hard for 28-31 clues', () => {
      expect(getDifficultyFromClues(28)).toBe('hard');
      expect(getDifficultyFromClues(30)).toBe('hard');
      expect(getDifficultyFromClues(31)).toBe('hard');
    });

    it('should return master for 24-27 clues', () => {
      expect(getDifficultyFromClues(24)).toBe('master');
      expect(getDifficultyFromClues(25)).toBe('master');
      expect(getDifficultyFromClues(27)).toBe('master');
    });

    it('should return unknown for out of range clue counts', () => {
      expect(getDifficultyFromClues(0)).toBe('unknown');
      expect(getDifficultyFromClues(23)).toBe('unknown');
      expect(getDifficultyFromClues(41)).toBe('unknown');
      expect(getDifficultyFromClues(100)).toBe('unknown');
    });

    it('should handle boundary values correctly', () => {
      expect(getDifficultyFromClues(27)).toBe('master');
      expect(getDifficultyFromClues(28)).toBe('hard');
      expect(getDifficultyFromClues(31)).toBe('hard');
      expect(getDifficultyFromClues(32)).toBe('medium');
      expect(getDifficultyFromClues(35)).toBe('medium');
      expect(getDifficultyFromClues(36)).toBe('easy');
      expect(getDifficultyFromClues(40)).toBe('easy');
    });
  });

  describe('Puzzle-Solution Consistency', () => {
    it('should generate puzzles where solution solves the puzzle', () => {
      const { puzzle, solution } = generatePuzzle('easy');
      
      // Verify that the solution actually solves the puzzle
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle[row][col] === 0) {
            // Empty cell in puzzle should match solution
            expect(solution[row][col]).toBeGreaterThan(0);
            expect(solution[row][col]).toBeLessThanOrEqual(9);
          } else {
            // Filled cell in puzzle should match solution
            expect(puzzle[row][col]).toBe(solution[row][col]);
          }
        }
      }
    });

    it('should generate puzzles where all clues are valid moves', () => {
      const { puzzle, solution } = generatePuzzle('easy');
      
      // All clues in puzzle should be valid according to solution
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle[row][col] !== 0) {
            // The clue should match the solution
            expect(puzzle[row][col]).toBe(solution[row][col]);
          }
        }
      }
    });
  });
});

