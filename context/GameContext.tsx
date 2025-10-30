import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Difficulty, DIFFICULTY_LIVES, GameActions, GameResult, GameState, MultiplayerGame, SerializableGameState } from '../types/game';
import { serializeGameState } from '../utils/gameSerializer';
import { saveGameResult } from '../utils/highScoreStorage';
import { multiplayerService } from '../utils/multiplayerService';
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
  | { type: 'USE_HINT' }
  | { type: 'LOAD_GAME'; state: SerializableGameState }
  | { type: 'SET_MULTIPLAYER'; game: MultiplayerGame | null }
  | { type: 'LOAD_MULTIPLAYER_GAME'; difficulty: Difficulty; lives: number; board: number[][]; solution: number[][]; initialBoard: number[][] }
  | { type: 'SHOW_MULTIPLAYER_WINNER'; playerName: string; completionTime: number }
  | { type: 'DISMISS_WINNER_MODAL' }
  | { type: 'DEV_FILL_SOLUTION' };

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
  multiplayer: null,
  multiplayerWinner: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  return (() => {
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

    case 'LOAD_GAME':
      return {
        ...initialState,
        difficulty: action.state.difficulty,
        status: 'ready',
        lives: action.state.lives,
        initialLives: action.state.lives,
        board: action.state.board.map(row => [...row]),
        solution: action.state.solution.map(row => [...row]),
        initialBoard: action.state.initialBoard.map(row => [...row]),
        timeElapsed: 0,
        notes: new Map(
          Object.entries(action.state.notes).map(([key, arr]) => [key, new Set(arr)])
        ),
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
          
          // Broadcast completion in multiplayer mode
          if (state.multiplayer && multiplayerService.currentChannel) {
            multiplayerService.currentChannel.send({
              type: 'broadcast',
              event: 'player-won',
              payload: {
                playerName: multiplayerService.currentPlayerName || 'Player',
                completionTime: state.timeElapsed,
              },
            });
            console.log('Broadcasting win to other players');
          }
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
        timeElapsed: 0,
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

    case 'SET_MULTIPLAYER':
      return {
        ...state,
        multiplayer: action.game,
      };

    case 'LOAD_MULTIPLAYER_GAME':
      return {
        ...initialState,
        difficulty: action.difficulty,
        status: 'playing', // Start playing immediately in multiplayer
        lives: action.lives,
        initialLives: action.lives,
        board: action.board.map(row => [...row]),
        solution: action.solution.map(row => [...row]),
        initialBoard: action.initialBoard.map(row => [...row]),
        timeElapsed: 0,
        multiplayer: state.multiplayer, // Keep multiplayer state
      };

    case 'SHOW_MULTIPLAYER_WINNER':
      return {
        ...state,
        status: 'paused', // Pause the game when another player wins
        multiplayerWinner: {
          playerName: action.playerName,
          completionTime: action.completionTime,
        },
      };

    case 'DISMISS_WINNER_MODAL':
      return {
        ...state,
        multiplayerWinner: null,
      };

    case 'DEV_FILL_SOLUTION':
      // Dev feature: Fill solution but leave 2 random cells empty
      if (state.status !== 'playing') return state;
      
      const filledBoard = copyBoard(state.board);
      const emptyCells: Array<{ row: number; col: number }> = [];
      
      // Find all cells that are currently empty (not initial clues and not already filled)
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (state.initialBoard[row][col] === 0 && state.board[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }
      
      // If we have more than 2 empty cells, randomly choose 2 to leave empty
      if (emptyCells.length > 2) {
        const cellsToLeaveEmptySet = new Set<string>();
        
        // Randomly select 2 cells to leave empty
        while (cellsToLeaveEmptySet.size < 2) {
          const randomIndex = Math.floor(Math.random() * emptyCells.length);
          const cell = emptyCells[randomIndex];
          const cellKey = `${cell.row}-${cell.col}`;
          cellsToLeaveEmptySet.add(cellKey);
        }
        
        // Fill all cells except the 2 randomly chosen ones
        for (const cell of emptyCells) {
          const cellKey = `${cell.row}-${cell.col}`;
          if (!cellsToLeaveEmptySet.has(cellKey)) {
            filledBoard[cell.row][cell.col] = state.solution[cell.row][cell.col];
          }
        }
      } else {
        // If 2 or fewer empty cells, just fill everything
        for (const cell of emptyCells) {
          filledBoard[cell.row][cell.col] = state.solution[cell.row][cell.col];
        }
      }
      
      return {
        ...state,
        board: filledBoard,
      };

    default:
      return state;
    }
  })();
}

const GameContext = createContext<GameState & GameActions | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    
    if (state.status === 'playing') {
      interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.status]);

  // Subscribe to multiplayer game events
  useEffect(() => {
    if (!state.multiplayer) return;

    // Subscribe to game board shared events
    const unsubscribeGameBoard = multiplayerService.subscribeToGameBoard((payload: any) => {
      console.log('Received shared game board:', payload);
      
      // Load the shared game
      dispatch({ 
        type: 'LOAD_MULTIPLAYER_GAME', 
        difficulty: payload.difficulty, 
        lives: payload.lives, 
        board: payload.board, 
        solution: payload.solution, 
        initialBoard: payload.initialBoard 
      });
    });

    return () => {
      unsubscribeGameBoard?.();
    };
  }, [state.multiplayer]);

  // Subscribe to pause/resume events for multiplayer
  useEffect(() => {
    if (!state.multiplayer || !multiplayerService.currentChannel) return;

    const handlePauseReceived = () => {
      console.log('Received pause broadcast - pausing game');
      dispatch({ type: 'PAUSE_GAME' });
    };

    const handleResumeReceived = () => {
      console.log('Received resume broadcast - resuming game');
      dispatch({ type: 'RESUME_GAME' });
    };

    const handlePlayerWon = ({ payload }: any) => {
      console.log('Another player won:', payload);
      dispatch({ 
        type: 'SHOW_MULTIPLAYER_WINNER', 
        playerName: payload.playerName, 
        completionTime: payload.completionTime 
      });
    };

    // Store channel reference for cleanup
    const channel = multiplayerService.currentChannel;
    
    // Check if channel has the necessary methods
    if (channel && typeof channel.on === 'function') {
      channel.on('broadcast', { event: 'game-paused' }, handlePauseReceived);
      channel.on('broadcast', { event: 'game-resumed' }, handleResumeReceived);
      channel.on('broadcast', { event: 'player-won' }, handlePlayerWon);
    }

    return () => {
      // Cleanup - only if channel still exists and has the off method
      if (channel && typeof channel.off === 'function') {
        try {
          channel.off('broadcast', { event: 'game-paused' }, handlePauseReceived);
          channel.off('broadcast', { event: 'game-resumed' }, handleResumeReceived);
          channel.off('broadcast', { event: 'player-won' }, handlePlayerWon);
        } catch (error) {
          console.log('Error during cleanup of multiplayer listeners:', error);
        }
      }
    };
  }, [state.multiplayer]);



  // Memoize actions to prevent unnecessary re-renders
  const actions: GameActions = React.useMemo(() => ({
    startGame: (difficulty: Difficulty, lives?: number) => dispatch({ type: 'START_GAME', difficulty, lives }),
    startPlaying: () => dispatch({ type: 'START_PLAYING' }),
    pauseGame: () => {
      dispatch({ type: 'PAUSE_GAME' });
      
      // Broadcast pause to other players in multiplayer
      if (state.multiplayer && multiplayerService.currentChannel) {
        multiplayerService.currentChannel.send({
          type: 'broadcast',
          event: 'game-paused',
          payload: {},
        });
        console.log('Broadcasting pause to other players');
      }
    },
    resumeGame: () => {
      dispatch({ type: 'RESUME_GAME' });
      
      // Broadcast resume to other players in multiplayer
      if (state.multiplayer && multiplayerService.currentChannel) {
        multiplayerService.currentChannel.send({
          type: 'broadcast',
          event: 'game-resumed',
          payload: {},
        });
        console.log('Broadcasting resume to other players');
      }
    },
    selectCell: (row: number, col: number) => dispatch({ type: 'SELECT_CELL', row, col }),
    placeNumber: (number: number) => dispatch({ type: 'PLACE_NUMBER', number }),
    clearCell: () => dispatch({ type: 'CLEAR_CELL' }),
    addNote: (number: number) => dispatch({ type: 'ADD_NOTE', number }),
    removeNote: (number: number) => dispatch({ type: 'REMOVE_NOTE', number }),
    newGame: () => dispatch({ type: 'NEW_GAME' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    clearWrongCell: () => dispatch({ type: 'CLEAR_WRONG_CELL' }),
    useHint: () => dispatch({ type: 'USE_HINT' }),
    devFillSolution: () => dispatch({ type: 'DEV_FILL_SOLUTION' }),
    loadGame: (loadedState: SerializableGameState) => dispatch({ type: 'LOAD_GAME', state: loadedState }),
    exportGame: () => {
      // Only export if game hasn't started playing
      if (state.status === 'ready') {
        return serializeGameState(state);
      }
      return null;
    },
    // Multiplayer actions
    createMultiplayerGame: async (channelName: string, playerName: string, difficulty: Difficulty, lives: number) => {
      try {
        const game = await multiplayerService.createGame(channelName, playerName, difficulty, lives);
        dispatch({ type: 'SET_MULTIPLAYER', game: {
          id: game.id,
          channelName: game.channelName,
          hostId: game.hostId,
          difficulty: game.difficulty,
          lives: game.lives,
          status: game.status,
          players: game.players,
          createdAt: game.createdAt,
        }});
      } catch (error) {
        console.error('Failed to create multiplayer game:', error);
        throw error;
      }
    },
    joinMultiplayerGame: async (channelName: string, playerName: string) => {
      try {
        const game = await multiplayerService.joinGame(channelName, playerName);
        dispatch({ type: 'SET_MULTIPLAYER', game: {
          id: game.id,
          channelName: game.channelName,
          hostId: game.hostId,
          difficulty: game.difficulty,
          lives: game.lives,
          status: game.status,
          players: game.players,
          createdAt: game.createdAt,
        }});
      } catch (error) {
        console.error('Failed to join multiplayer game:', error);
        throw error;
      }
    },
    leaveMultiplayerGame: async () => {
      try {
        await multiplayerService.leaveGame();
        dispatch({ type: 'SET_MULTIPLAYER', game: null });
      } catch (error) {
        console.error('Failed to leave multiplayer game:', error);
      }
    },
    startMultiplayerGame: async () => {
      try {
        // Generate puzzle for multiplayer
        if (!state.multiplayer) throw new Error('No multiplayer game active');
        
        const { puzzle, solution } = generatePuzzle(state.multiplayer.difficulty);
        
        // Broadcast the game board to all players
        await multiplayerService.currentChannel?.send({
          type: 'broadcast',
          event: 'game-board-shared',
          payload: {
            board: puzzle,
            solution: solution,
            initialBoard: puzzle,
            difficulty: state.multiplayer.difficulty,
            lives: state.multiplayer.lives,
          },
        });
        
        // Start the game on host side
        dispatch({ type: 'LOAD_MULTIPLAYER_GAME', difficulty: state.multiplayer.difficulty, lives: state.multiplayer.lives, board: puzzle, solution: solution, initialBoard: puzzle });
        
        // Update database
        await multiplayerService.startGame();
      } catch (error) {
        console.error('Failed to start multiplayer game:', error);
        throw error;
      }
    },
    startNewRound: async () => {
      try {
        if (!state.multiplayer) throw new Error('No multiplayer game active');
        // Host-only guard
        const isHost = state.multiplayer.hostId === multiplayerService.getPlayerId();
        if (!isHost) {
          console.log('Only host can start a new round');
          return;
        }

        // Dismiss winner modal if present
        if (state.multiplayerWinner) {
          dispatch({ type: 'DISMISS_WINNER_MODAL' });
        }

        // Generate new puzzle using session difficulty/lives
        const { puzzle, solution } = generatePuzzle(state.multiplayer.difficulty);

        // Broadcast the game board to all players (reuse event)
        await multiplayerService.currentChannel?.send({
          type: 'broadcast',
          event: 'game-board-shared',
          payload: {
            board: puzzle,
            solution: solution,
            initialBoard: puzzle,
            difficulty: state.multiplayer.difficulty,
            lives: state.multiplayer.lives,
          },
        });

        // Load locally for host immediately
        dispatch({
          type: 'LOAD_MULTIPLAYER_GAME',
          difficulty: state.multiplayer.difficulty,
          lives: state.multiplayer.lives,
          board: puzzle,
          solution: solution,
          initialBoard: puzzle,
        });
      } catch (error) {
        console.error('Failed to start new round:', error);
        throw error;
      }
    },
    dismissWinnerModal: () => {
      dispatch({ type: 'DISMISS_WINNER_MODAL' });
    },
  }), [state]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = React.useMemo(() => ({
    ...state,
    ...actions,
  }), [state, actions]);

  return (
    <GameContext.Provider value={value}>
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
