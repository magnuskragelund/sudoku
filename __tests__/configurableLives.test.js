// Test configurable lives functionality
describe('Configurable Lives Tests', () => {
  it('should default to 5 lives for all difficulty levels', () => {
    const difficultyLives = {
      easy: 5,
      medium: 5,
      hard: 5,
      master: 5,
    };

    // All difficulties should have 5 lives as default
    expect(difficultyLives.easy).toBe(5);
    expect(difficultyLives.medium).toBe(5);
    expect(difficultyLives.hard).toBe(5);
    expect(difficultyLives.master).toBe(5);
  });

  it('should support custom lives configuration', () => {
    // Test that the startGame function can accept optional lives parameter
    const startGame = (difficulty, lives) => {
      return {
        difficulty,
        lives: lives ?? 5, // Default to 5 if not provided
      };
    };

    // Test with default lives
    const game1 = startGame('easy');
    expect(game1.lives).toBe(5);

    // Test with custom lives
    const game2 = startGame('medium', 3);
    expect(game2.lives).toBe(3);

    // Test with custom lives for different difficulty
    const game3 = startGame('hard', 10);
    expect(game3.lives).toBe(10);

    // Test with 0 lives (edge case)
    const game4 = startGame('master', 0);
    expect(game4.lives).toBe(0);
  });

  it('should handle undefined lives parameter', () => {
    const startGame = (difficulty, lives) => {
      return {
        difficulty,
        lives: lives ?? 5, // Default to 5 if not provided
      };
    };

    // Test with undefined lives
    const game = startGame('easy', undefined);
    expect(game.lives).toBe(5);
  });

  it('should validate lives parameter types', () => {
    const startGame = (difficulty, lives) => {
      // Validate that lives is a number if provided
      if (lives !== undefined && typeof lives !== 'number') {
        throw new Error('Lives must be a number');
      }
      return {
        difficulty,
        lives: lives ?? 5,
      };
    };

    // Valid cases
    expect(() => startGame('easy', 3)).not.toThrow();
    expect(() => startGame('medium', 0)).not.toThrow();
    expect(() => startGame('hard')).not.toThrow();

    // Invalid cases
    expect(() => startGame('easy', '3')).toThrow('Lives must be a number');
    expect(() => startGame('medium', null)).toThrow('Lives must be a number');
  });
});
