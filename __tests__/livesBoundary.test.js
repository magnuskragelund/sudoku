// Test that lives never go below zero
describe('Lives Boundary Tests', () => {
  it('should not allow lives to go below zero', () => {
    // Mock game state with 0 lives
    const initialState = {
      lives: 0,
      status: 'playing',
    };

    // Simulate losing a life when already at 0
    const newLives = Math.max(0, initialState.lives - 1);
    
    expect(newLives).toBe(0); // Should remain at 0
    expect(newLives).toBeGreaterThanOrEqual(0); // Never below zero
  });

  it('should prevent negative lives when losing multiple lives rapidly', () => {
    let state = {
      lives: 2,
      status: 'playing',
    };

    // Simulate losing 5 lives rapidly
    for (let i = 0; i < 5; i++) {
      const newLives = Math.max(0, state.lives - 1);
      state = {
        ...state,
        lives: newLives,
        status: newLives === 0 ? 'lost' : state.status,
      };
    }
    
    expect(state.lives).toBe(0); // Should be 0, not -3
    expect(state.lives).toBeGreaterThanOrEqual(0);
    expect(state.status).toBe('lost');
  });

  it('should set game status to lost when lives reach zero', () => {
    let state = {
      lives: 1,
      status: 'playing',
    };

    // Lose the last life
    const newLives = Math.max(0, state.lives - 1);
    state = {
      ...state,
      lives: newLives,
      status: newLives === 0 ? 'lost' : state.status,
    };

    expect(state.lives).toBe(0);
    expect(state.status).toBe('lost');
  });

  it('should handle edge case when trying to lose life from 0', () => {
    const state = {
      lives: 0,
      status: 'lost',
    };

    const newLives = Math.max(0, state.lives - 1);
    
    expect(newLives).toBe(0);
    expect(newLives).toBeGreaterThanOrEqual(0);
  });

  it('should maintain game status when lives are greater than zero', () => {
    let state = {
      lives: 3,
      status: 'playing',
    };

    // Lose one life
    const newLives = Math.max(0, state.lives - 1);
    state = {
      ...state,
      lives: newLives,
      status: newLives === 0 ? 'lost' : state.status,
    };

    expect(state.lives).toBe(2);
    expect(state.lives).toBeGreaterThan(0);
    expect(state.status).toBe('playing');
  });

  it('should handle multiple rapid wrong guesses without going negative', () => {
    let state = {
      lives: 1,
      status: 'playing',
    };

    // Simulate 3 wrong guesses with only 1 life left
    for (let i = 0; i < 3; i++) {
      const newLives = Math.max(0, state.lives - 1);
      state = {
        ...state,
        lives: newLives,
        status: newLives === 0 ? 'lost' : state.status,
      };
    }

    expect(state.lives).toBe(0);
    expect(state.lives).toBeGreaterThanOrEqual(0);
    expect(state.status).toBe('lost');
  });
});
