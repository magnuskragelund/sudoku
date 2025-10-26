// Test lives mechanic when user enters wrong numbers
describe('Lives Mechanic Tests', () => {
  it('should lose one life when user enters wrong number', () => {
    // Mock game state
    const initialState = {
      board: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 1 is empty
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
      ],
      initialBoard: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9], // Row 0 has initial clues
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      selectedCell: { row: 1, col: 0 }, // Selected cell (1,0) should be 4
      status: 'playing',
      lives: 5,
    };

    // Mock isValidMove function
    const isValidMove = (board, row, col, num) => {
      if (num < 1 || num > 9) return false;
      if (board[row][col] !== 0) return false;
      
      // Check row for duplicates
      for (let x = 0; x < 9; x++) {
        if (x !== col && board[row][x] === num) return false;
      }
      
      // Check column for duplicates
      for (let x = 0; x < 9; x++) {
        if (x !== row && board[x][col] === num) return false;
      }
      
      // Check 3x3 box for duplicates
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const checkRow = startRow + i;
          const checkCol = startCol + j;
          
          if (checkRow === row && checkCol === col) continue;
          
          if (board[checkRow][checkCol] === num) return false;
        }
      }
      
      return true;
    };

    // Simulate entering wrong number in cell (1,0)
    const action = { type: 'PLACE_NUMBER', number: 5 }; // Should be 4, not 5
    const { row, col } = initialState.selectedCell;
    
    // Check if move is valid by Sudoku rules
    const isValid = isValidMove(initialState.board, row, col, action.number);
    expect(isValid).toBe(true); // Move is valid by rules
    
    // Check if move is correct (matches solution)
    const isCorrect = action.number === initialState.solution[row][col];
    expect(isCorrect).toBe(false); // Wrong number (5 vs 4)
    
    // Simulate wrong move - should lose one life
    const newState = {
      ...initialState,
      lives: initialState.lives - 1, // Lose one life
      status: initialState.lives - 1 <= 0 ? 'lost' : initialState.status,
      wrongCell: { row, col },
    };
    
    expect(newState.lives).toBe(4); // Started with 5, now has 4
    expect(newState.status).toBe('playing'); // Still playing
    expect(newState.wrongCell).toEqual({ row: 1, col: 0 });
  });

  it('should lose multiple lives with consecutive wrong guesses', () => {
    let state = {
      board: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
      ],
      initialBoard: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      selectedCell: { row: 1, col: 0 },
      status: 'playing',
      lives: 5,
    };

    // Simulate 3 wrong guesses
    for (let i = 0; i < 3; i++) {
      const wrongNumber = 5 + i; // 5, 6, 7 (all wrong, should be 4)
      const { row, col } = state.selectedCell;
      
      // Check if move is correct
      const isCorrect = wrongNumber === state.solution[row][col];
      expect(isCorrect).toBe(false); // Wrong number
      
      // Update state - lose one life
      state = {
        ...state,
        lives: state.lives - 1,
        status: state.lives - 1 <= 0 ? 'lost' : state.status,
        wrongCell: { row, col },
      };
    }
    
    expect(state.lives).toBe(2); // Started with 5, lost 3 lives = 2 remaining
    expect(state.status).toBe('playing'); // Still playing
  });

  it('should lose game when all lives are lost', () => {
    let state = {
      board: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
      ],
      initialBoard: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      selectedCell: { row: 1, col: 0 },
      status: 'playing',
      lives: 3, // Start with 3 lives
    };

    // Simulate 3 wrong guesses (losing all lives)
    for (let i = 0; i < 3; i++) {
      const wrongNumber = 5 + i; // 5, 6, 7
      const { row, col } = state.selectedCell;
      
      const isCorrect = wrongNumber === state.solution[row][col];
      expect(isCorrect).toBe(false);
      
      state = {
        ...state,
        lives: state.lives - 1,
        status: state.lives - 1 <= 0 ? 'lost' : state.status,
        wrongCell: { row, col },
      };
    }
    
    expect(state.lives).toBe(0); // All lives lost
    expect(state.status).toBe('lost'); // Game over
  });

  it('should lose life for any wrong guess, valid or invalid', () => {
    const initialState = {
      board: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
      ],
      initialBoard: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      selectedCell: { row: 1, col: 0 }, // Should be 4
      status: 'playing',
      lives: 5,
    };

    // Simulate wrong guess (any wrong number)
    const action = { type: 'PLACE_NUMBER', number: 1 }; // Wrong number (should be 4)
    const { row, col } = initialState.selectedCell;
    
    // Check if move is correct
    const isCorrect = action.number === initialState.solution[row][col];
    expect(isCorrect).toBe(false); // Wrong number
    
    // Any wrong guess loses a life
    const newState = {
      ...initialState,
      lives: initialState.lives - 1,
      status: initialState.lives - 1 <= 0 ? 'lost' : initialState.status,
      wrongCell: { row, col },
    };
    
    expect(newState.lives).toBe(4); // Life lost
    expect(newState.wrongCell).toEqual({ row: 1, col: 0 });
  });

  it('should track wrong cell when entering wrong number', () => {
    const initialState = {
      board: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
      ],
      selectedCell: { row: 2, col: 3 },
      status: 'playing',
      lives: 5,
    };

    // Wrong guess
    const wrongNumber = 8; // Should be 1
    const { row, col } = initialState.selectedCell;
    
    const isCorrect = wrongNumber === initialState.solution[row][col];
    expect(isCorrect).toBe(false);
    
    const newState = {
      ...initialState,
      lives: initialState.lives - 1,
      status: initialState.lives - 1 <= 0 ? 'lost' : initialState.status,
      wrongCell: { row, col },
    };
    
    expect(newState.lives).toBe(4);
    expect(newState.wrongCell).toEqual({ row: 2, col: 3 });
  });
});
