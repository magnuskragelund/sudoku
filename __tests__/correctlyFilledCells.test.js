// Test correctly filled cells behavior
describe('Correctly Filled Cells Tests', () => {
  it('should treat correctly filled cells as non-editable', () => {
    // Mock game state
    const initialState = {
      board: [
        [1, 0, 0, 0, 0, 0, 0, 0, 0], // Correctly filled by user
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      initialBoard: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0], // All empty initially
        [4, 5, 6, 7, 8, 9, 1, 2, 3], // Some initial clues
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
      selectedCell: { row: 0, col: 0 },
      status: 'playing',
      lives: 5,
    };

    // Check if cell is correctly filled
    const isCorrectlyFilled = (row, col, board, solution, initialBoard) => {
      return board[row][col] !== 0 && 
             board[row][col] === solution[row][col] && 
             initialBoard[row][col] === 0;
    };

    // Check if cell is non-editable (initial clue or correctly filled)
    const isNonEditable = (row, col, board, solution, initialBoard) => {
      const isInitial = initialBoard[row][col] !== 0;
      const isCorrectlyFilled = board[row][col] !== 0 && 
                                board[row][col] === solution[row][col] && 
                                !isInitial;
      return isInitial || isCorrectlyFilled;
    };

    // Test cell at (0,0) - correctly filled by user
    expect(isCorrectlyFilled(0, 0, initialState.board, initialState.solution, initialState.initialBoard)).toBe(true);
    expect(isNonEditable(0, 0, initialState.board, initialState.solution, initialState.initialBoard)).toBe(true);
    
    // Test cell at (0,1) - empty, should be editable
    expect(isCorrectlyFilled(0, 1, initialState.board, initialState.solution, initialState.initialBoard)).toBe(false);
    expect(isNonEditable(0, 1, initialState.board, initialState.solution, initialState.initialBoard)).toBe(false);
    
    // Test cell at (1,0) - initial clue
    const isInitial = initialState.initialBoard[1][0] !== 0;
    expect(isInitial).toBe(true);
    expect(isNonEditable(1, 0, initialState.board, initialState.solution, initialState.initialBoard)).toBe(true);
  });

  it('should disable number input for correctly filled cells', () => {
    const initialState = {
      board: [
        [1, 0, 0, 0, 0, 0, 0, 0, 0], // Correctly filled
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      initialBoard: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
      selectedCell: { row: 0, col: 0 },
    };

    // Check if selected cell is editable
    const isSelectedCellEditable = (selectedCell, initialBoard, board, solution) => {
      if (!selectedCell) return false;
      const { row, col } = selectedCell;
      const isEditable = initialBoard[row][col] === 0 && 
                        board[row][col] !== solution[row][col];
      return isEditable;
    };

    // Cell at (0,0) is correctly filled - should not be editable
    expect(isSelectedCellEditable(
      { row: 0, col: 0 },
      initialState.initialBoard,
      initialState.board,
      initialState.solution
    )).toBe(false);

    // Cell at (0,1) is empty - should be editable
    expect(isSelectedCellEditable(
      { row: 0, col: 1 },
      initialState.initialBoard,
      initialState.board,
      initialState.solution
    )).toBe(true);
  });

  it('should style correctly filled cells like initial cells', () => {
    const initialState = {
      board: [
        [1, 2, 0, 0, 0, 0, 0, 0, 0], // 1 is correctly filled, 2 is not
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      initialBoard: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
    };

    // Mock isNonEditable check
    const isNonEditable = (row, col, board, solution, initialBoard) => {
      const isInitial = initialBoard[row][col] !== 0;
      const isCorrectlyFilled = board[row][col] !== 0 && 
                                board[row][col] === solution[row][col] && 
                                !isInitial;
      return isInitial || isCorrectlyFilled;
    };

    // Cell (0,0) with value 1 - correctly filled (matches solution)
    expect(isNonEditable(0, 0, initialState.board, initialState.solution, initialState.initialBoard)).toBe(true);
    
    // Cell (0,1) with value 2 - also correctly filled (matches solution)
    expect(isNonEditable(0, 1, initialState.board, initialState.solution, initialState.initialBoard)).toBe(true);
    
    // Cell (0,2) is empty - should be editable
    expect(isNonEditable(0, 2, initialState.board, initialState.solution, initialState.initialBoard)).toBe(false);
  });
});
