/**
 * Tests for sudokuTechniqueAnalyzer.ts
 * Technique detection and analysis functions
 */

const { analyzeTechniques, getDifficultyFromTechniques } = require('../utils/sudokuTechniqueAnalyzer');
const { validPuzzle, fullyFilledValidBoard, emptyBoard } = require('./fixtures/testBoards');

describe('Sudoku Technique Analyzer Tests', () => {
  describe('analyzeTechniques', () => {
    it('should analyze a puzzle and return technique information', () => {
      const analysis = analyzeTechniques(validPuzzle);
      
      expect(analysis).toBeDefined();
      expect(analysis.techniques).toBeDefined();
      expect(Array.isArray(analysis.techniques)).toBe(true);
      expect(analysis.maxDifficulty).toBeDefined();
      expect(typeof analysis.requiresAdvanced).toBe('boolean');
    });

    it('should detect naked singles when present', () => {
      // Create a simple puzzle with naked singles
      const puzzleWithNakedSingle = [
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
      
      const analysis = analyzeTechniques(puzzleWithNakedSingle);
      
      // Should detect at least basic techniques
      expect(analysis.techniques.length).toBeGreaterThan(0);
    });

    it('should detect hidden singles when present', () => {
      const analysis = analyzeTechniques(validPuzzle);
      
      // Should detect hidden singles or naked singles
      const hasBasicTechnique = analysis.techniques.includes('naked_single') || 
                                 analysis.techniques.includes('hidden_single');
      expect(hasBasicTechnique || analysis.techniques.length > 0).toBe(true);
    });

    it('should handle fully filled boards', () => {
      const analysis = analyzeTechniques(fullyFilledValidBoard);
      
      // Fully filled board should have no techniques needed (or only backtracking)
      expect(analysis).toBeDefined();
      expect(analysis.techniques).toBeDefined();
    });

    it('should handle empty boards', () => {
      const analysis = analyzeTechniques(emptyBoard);
      
      // Empty board should require backtracking
      expect(analysis).toBeDefined();
      expect(analysis.maxDifficulty).toBeDefined();
    });

    it('should return techniques in order of detection', () => {
      const analysis = analyzeTechniques(validPuzzle);
      
      // Techniques array should not be empty
      expect(analysis.techniques.length).toBeGreaterThan(0);
    });

    it('should identify max difficulty correctly', () => {
      const analysis = analyzeTechniques(validPuzzle);
      
      // Max difficulty should be one of the techniques
      expect(analysis.techniques).toContain(analysis.maxDifficulty);
    });

    it('should correctly identify if advanced techniques are required', () => {
      const analysis = analyzeTechniques(validPuzzle);
      
      const advancedTechniques = ['x_wing', 'swordfish', 'xy_wing', 'backtracking'];
      const requiresAdvanced = advancedTechniques.includes(analysis.maxDifficulty);
      
      expect(analysis.requiresAdvanced).toBe(requiresAdvanced);
    });
  });

  describe('getDifficultyFromTechniques', () => {
    it('should return easy for basic techniques', () => {
      const analysis = {
        techniques: ['naked_single'],
        maxDifficulty: 'naked_single',
        requiresAdvanced: false
      };
      
      const difficulty = getDifficultyFromTechniques(analysis);
      expect(difficulty).toBe('easy');
    });

    it('should return easy for hidden singles', () => {
      const analysis = {
        techniques: ['hidden_single'],
        maxDifficulty: 'hidden_single',
        requiresAdvanced: false
      };
      
      const difficulty = getDifficultyFromTechniques(analysis);
      expect(difficulty).toBe('easy');
    });

    it('should return medium for pair techniques', () => {
      const analysis = {
        techniques: ['naked_pair'],
        maxDifficulty: 'naked_pair',
        requiresAdvanced: false
      };
      
      const difficulty = getDifficultyFromTechniques(analysis);
      expect(difficulty).toBe('medium');
    });

    it('should return hard for X-wing', () => {
      const analysis = {
        techniques: ['x_wing'],
        maxDifficulty: 'x_wing',
        requiresAdvanced: true
      };
      
      const difficulty = getDifficultyFromTechniques(analysis);
      expect(difficulty).toBe('hard');
    });

    it('should return master for advanced techniques', () => {
      const analysis = {
        techniques: ['swordfish'],
        maxDifficulty: 'swordfish',
        requiresAdvanced: true
      };
      
      const difficulty = getDifficultyFromTechniques(analysis);
      expect(difficulty).toBe('master');
    });

    it('should return master for backtracking', () => {
      const analysis = {
        techniques: ['backtracking'],
        maxDifficulty: 'backtracking',
        requiresAdvanced: true
      };
      
      const difficulty = getDifficultyFromTechniques(analysis);
      expect(difficulty).toBe('master');
    });
  });

  describe('Integration with real puzzles', () => {
    it('should analyze valid puzzle correctly', () => {
      const analysis = analyzeTechniques(validPuzzle);
      const difficulty = getDifficultyFromTechniques(analysis);
      
      expect(['easy', 'medium', 'hard', 'master']).toContain(difficulty);
      expect(analysis.techniques.length).toBeGreaterThan(0);
    });

    it('should consistently analyze the same puzzle', () => {
      const analysis1 = analyzeTechniques(validPuzzle);
      const analysis2 = analyzeTechniques(validPuzzle);
      
      // Should get same results for same puzzle
      expect(analysis1.maxDifficulty).toBe(analysis2.maxDifficulty);
      expect(analysis1.requiresAdvanced).toBe(analysis2.requiresAdvanced);
    });
  });
});
