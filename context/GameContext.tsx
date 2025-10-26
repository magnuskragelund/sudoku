import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Difficulty, DIFFICULTY_LIVES, GameActions, GameResult, GameState } from '../types/game';
import { saveGameResult } from '../utils/highScoreStorage';
import { generatePuzzle } from '../utils/sudokuGenerator';
import { copyBoard } from '../utils/sudokuRules';

type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty; lives?: number }
  | { type: 'START_PLAYING' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'PLACE_NUMBER'; number: number }
  | { type: 'CLEAR_CELL' }
  | { type: 'ADD_NOTE'; number: number }
  | { type: 'REMOVE_NOTE'; number: number }
  | { type: 'NEW_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'TICK' }
  | { type: 'LOSE_LIFE' }
  | { type: 'CLEAR_WRONG_CELL' }
  | { type: 'USE_HINT' };

const initialState: GameState = {
  difficulty: 'medium',
  status: 'paused',
  lives: 3,
  initialLives: 3,
  timeElapsed: 0,
  board: Array(9).fill(null).map(() => Array(9).fill(0)),
  solution: Array(9).fill(null).map(() => Array(9).fill(0)),
  initialBoard: Array(9).fill(null).map(() => Array(9).fill(0)),
  selectedCell: null,
  notes: new Map(),
  wrongCell: null,
  hintUsed: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      // Generate a new puzzle with guaranteed unique solution
      const { puzzle, solution } = generatePuzzle(action.difficulty);
      const initialLivesValue = action.lives ?? 5;
      
      return {
        ...initialState,
        difficulty: action.difficulty,
        status: 'ready',
        lives: initialLivesValue,
        initialLives: initialLivesValue,
        board: puzzle.map(row => [...row]),
        solution: solution.map(row => [...row]),
        initialBoard: puzzle.map(row => [...row]),
        timeElapsed: 0,
      };

    case 'START_PLAYING':
      return {
        ...state,
        status: 'playing',
      };

    case 'PAUSE_GAME':
      return {
        ...state,
        status: 'paused',
      };

    case 'RESUME_GAME':
      return {
        ...state,
        status: 'playing',
      };

    case 'SELECT_CELL':
      return {
        ...state,
        selectedCell: { row: action.row, col: action.col },
      };

    case 'PLACE_NUMBER':
      if (!state.selectedCell) return state;
      
      const { row, col } = state.selectedCell;
      
      // Check if the move is correct (matches the solution)
      const isCorrect = action.number === state.solution[row][col];
      
      if (isCorrect) {
        // Only create new board if the move is correct
        const newBoard = copyBoard(state.board);
        newBoard[row][col] = action.number;
        
        // Trigger subtle haptic feedback for correct placement
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Check if puzzle is complete
        const isComplete = newBoard.every((row, r) => 
          row.every((cell, c) => cell === state.solution[r][c])
        );
        const finalStatus = isComplete ? 'won' : state.status;

        // Save game result if completed
        if (isComplete) {
          const gameResult: GameResult = {
            id: Date.now().toString(),
            difficulty: state.difficulty,
            lives: state.initialLives,
            completionTime: state.timeElapsed,
            timestamp: Date.now(),
            won: true,
          };
          saveGameResult(gameResult); // Fire and forget
        }

        return {
          ...state,
          board: newBoard,
          status: finalStatus,
          selectedCell: { row, col }, // Keep cell selected
        };
      } else {
        // Wrong number - any wrong guess loses a life
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        const newLives = Math.max(0, state.lives - 1); // Prevent lives from going below zero
        
        // Don't save lost games to high scores
        // Only won games are tracked in high scores
        
        return {
          ...state,
          lives: newLives,
          status: newLives === 0 ? 'lost' : state.status,
          wrongCell: { row, col },
        };
      }

    case 'CLEAR_CELL':
      if (!state.selectedCell) return state;
      
      const { row: clearRow, col: clearCol } = state.selectedCell;
      const clearedBoard = copyBoard(state.board);
      clearedBoard[clearRow][clearCol] = 0;
      
      return {
        ...state,
        board: clearedBoard,
        selectedCell: null,
      };

    case 'ADD_NOTE':
      if (!state.selectedCell) return state;
      
      const { row: noteRow, col: noteCol } = state.selectedCell;
      const noteKey = `${noteRow}-${noteCol}`;
      const newNotes = new Map(state.notes);
      const cellNotes = newNotes.get(noteKey) || new Set();
      cellNotes.add(action.number);
      newNotes.set(noteKey, cellNotes);
      
      return {
        ...state,
        notes: newNotes,
      };

    case 'REMOVE_NOTE':
      if (!state.selectedCell) return state;
      
      const { row: removeNoteRow, col: removeNoteCol } = state.selectedCell;
      const removeNoteKey = `${removeNoteRow}-${removeNoteCol}`;
      const updatedNotes = new Map(state.notes);
      const cellNotesToUpdate = updatedNotes.get(removeNoteKey) || new Set();
      cellNotesToUpdate.delete(action.number);
      if (cellNotesToUpdate.size === 0) {
        updatedNotes.delete(removeNoteKey);
      } else {
        updatedNotes.set(removeNoteKey, cellNotesToUpdate);
      }
      
      return {
        ...state,
        notes: updatedNotes,
      };

    case 'NEW_GAME':
      return {
        ...initialState,
        difficulty: state.difficulty,
      };

    case 'RESET_GAME':
      return {
        ...state,
        board: copyBoard(state.initialBoard),
        lives: DIFFICULTY_LIVES[state.difficulty],
        status: 'playing',
        timeElapsed: 0,
        selectedCell: null,
        notes: new Map(),
      };

    case 'TICK':
      if (state.status === 'playing') {
        return {
          ...state,
          timeElapsed: state.timeElapsed + 1,
        };
      }
      return state;

    case 'LOSE_LIFE':
      const updatedLives = Math.max(0, state.lives - 1); // Prevent lives from going below zero
      return {
        ...state,
        lives: updatedLives,
        status: updatedLives === 0 ? 'lost' : state.status,
      };

    case 'CLEAR_WRONG_CELL':
      return {
        ...state,
        wrongCell: null,
      };

    case 'USE_HINT':
      if (state.hintUsed || !state.selectedCell || state.status !== 'playing') {
        return state;
      }

      const hintRow = state.selectedCell.row;
      const hintCol = state.selectedCell.col;
      const correctNumber = state.solution[hintRow][hintCol];
      
      // Only use hint if the cell is empty and not an initial clue
      if (state.board[hintRow][hintCol] === 0 && state.initialBoard[hintRow][hintCol] === 0) {
        const newBoard = copyBoard(state.board);
        newBoard[hintRow][hintCol] = correctNumber;
        
        return {
          ...state,
          board: newBoard,
          hintUsed: true,
        };
      }

      return state;

    default:
      return state;
  }
}

const GameContext = createContext<GameState & GameActions | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Timer effect
  useEffect(() => {
    if (state.status === 'playing') {
      const interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.status]);

  const actions: GameActions = {
    startGame: (difficulty: Difficulty, lives?: number) => dispatch({ type: 'START_GAME', difficulty, lives }),
    startPlaying: () => dispatch({ type: 'START_PLAYING' }),
    pauseGame: () => dispatch({ type: 'PAUSE_GAME' }),
    resumeGame: () => dispatch({ type: 'RESUME_GAME' }),
    selectCell: (row: number, col: number) => dispatch({ type: 'SELECT_CELL', row, col }),
    placeNumber: (number: number) => dispatch({ type: 'PLACE_NUMBER', number }),
    clearCell: () => dispatch({ type: 'CLEAR_CELL' }),
    addNote: (number: number) => dispatch({ type: 'ADD_NOTE', number }),
    removeNote: (number: number) => dispatch({ type: 'REMOVE_NOTE', number }),
    newGame: () => dispatch({ type: 'NEW_GAME' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    clearWrongCell: () => dispatch({ type: 'CLEAR_WRONG_CELL' }),
    useHint: () => dispatch({ type: 'USE_HINT' }),
  };

  return (
    <GameContext.Provider value={{ ...state, ...actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
