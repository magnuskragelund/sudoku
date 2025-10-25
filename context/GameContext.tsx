import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Difficulty, DIFFICULTY_LIVES, GameActions, GameState } from '../types/game';
import { generatePuzzle } from '../utils/sudokuGenerator';
import { isValidMove } from '../utils/sudokuValidator';

type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty }
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
  | { type: 'CLEAR_WRONG_CELL' };

const initialState: GameState = {
  difficulty: 'medium',
  status: 'paused',
  lives: 3,
  timeElapsed: 0,
  board: Array(9).fill(null).map(() => Array(9).fill(0)),
  solution: Array(9).fill(null).map(() => Array(9).fill(0)),
  initialBoard: Array(9).fill(null).map(() => Array(9).fill(0)),
  selectedCell: null,
  notes: new Map(),
  wrongCell: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      // Generate a new puzzle with guaranteed unique solution
      const { puzzle, solution } = generatePuzzle(action.difficulty);
      
      return {
        ...initialState,
        difficulty: action.difficulty,
        status: 'ready',
        lives: DIFFICULTY_LIVES[action.difficulty],
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
      const newBoard = state.board.map(r => [...r]);
      
      // First check if move is valid by Sudoku rules
      if (!isValidMove(state.board, row, col, action.number)) {
        // Invalid move - show feedback but don't lose life
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        return {
          ...state,
          wrongCell: { row, col },
        };
      }
      
      // Check if the move is correct (matches the solution)
      const isCorrect = action.number === state.solution[row][col];
      
      if (isCorrect) {
        newBoard[row][col] = action.number;
        
        // Trigger subtle haptic feedback for correct placement
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Check if puzzle is complete
        const isComplete = newBoard.every((row, r) => 
          row.every((cell, c) => cell === state.solution[r][c])
        );
        const finalStatus = isComplete ? 'won' : state.status;

        return {
          ...state,
          board: newBoard,
          status: finalStatus,
          selectedCell: null,
        };
      } else {
        // Wrong number - trigger haptic feedback and don't place the number
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        return {
          ...state,
          lives: state.lives - 1,
          status: state.lives - 1 <= 0 ? 'lost' : state.status,
          wrongCell: { row, col },
        };
      }

    case 'CLEAR_CELL':
      if (!state.selectedCell) return state;
      
      const { row: clearRow, col: clearCol } = state.selectedCell;
      const clearedBoard = state.board.map(r => [...r]);
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
        board: state.initialBoard.map(row => [...row]),
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
      const updatedLives = state.lives - 1;
      return {
        ...state,
        lives: updatedLives,
        status: updatedLives <= 0 ? 'lost' : state.status,
      };

    case 'CLEAR_WRONG_CELL':
      return {
        ...state,
        wrongCell: null,
      };

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
    startGame: (difficulty: Difficulty) => dispatch({ type: 'START_GAME', difficulty }),
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
