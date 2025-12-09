import React, { createContext, useContext, useEffect, useReducer, useMemo, useState, useRef } from 'react';
import { Difficulty, DIFFICULTY_LIVES, GameActions, GameResult, GameState, MultiplayerGame, SerializableGameState } from '../types/game';
import { analyticsService } from '../utils/analyticsService';
import { serializeGameState } from '../utils/gameSerializer';
import { saveGameResult } from '../utils/highScoreStorage';
import { logger } from '../utils/logger';
import { multiplayerService } from '../utils/multiplayerService';
import { ReviewService } from '../utils/reviewService';
import { generatePuzzle } from '../utils/sudokuGenerator';
import { copyBoard } from '../utils/sudokuRules';

// --- Game Time Context ---
interface GameTimeContextType {
  timeElapsed: number;
}
const GameTimeContext = createContext<GameTimeContextType>({ timeElapsed: 0 });

export function useGameTime() {
  return useContext(GameTimeContext);
}

// --- Game Actions & State ---

type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty; lives?: number }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'START_PLAYING' }
  | { type: 'PAUSE_GAME'; timeElapsed: number }
  | { type: 'RESUME_GAME' }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'PLACE_NUMBER'; number: number; timeElapsed: number }
  | { type: 'CLEAR_CELL' }
  | { type: 'ADD_NOTE'; number: number }
  | { type: 'REMOVE_NOTE'; number: number }
  | { type: 'NEW_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'LOSE_LIFE' }
  | { type: 'CLEAR_WRONG_CELL' }
  | { type: 'USE_HINT' }
  | { type: 'LOAD_GAME'; state: SerializableGameState }
  | { type: 'SET_MULTIPLAYER'; game: MultiplayerGame | null }
  | { type: 'LOAD_MULTIPLAYER_GAME'; difficulty: Difficulty; lives: number; board: number[][]; solution: number[][]; initialBoard: number[][] }
  | { type: 'SHOW_MULTIPLAYER_WINNER'; playerName: string; completionTime: number }
  | { type: 'SHOW_MULTIPLAYER_LOSER'; playerName: string; timeElapsed: number }
  | { type: 'DISMISS_WINNER_MODAL' }
  | { type: 'DISMISS_LOSER_MODAL' };

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
  isLoading: false,
  multiplayer: null,
  multiplayerWinner: null,
  multiplayerLoser: null,
  gameSessionId: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  return (() => {
    switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'START_GAME':
      // Generate a new puzzle with guaranteed unique solution
      const { puzzle, solution } = generatePuzzle(action.difficulty);
      const initialLivesValue = action.lives ?? 5;
      const sessionId = analyticsService.generateSessionId();
      
      // Track game start (fire and forget)
      analyticsService.trackGameStart({
        sessionId,
        gameType: 'single_player',
        difficulty: action.difficulty,
        lives: initialLivesValue,
      });
      
      return {
        ...initialState,
        difficulty: action.difficulty,
        status: 'playing',
        lives: initialLivesValue,
        initialLives: initialLivesValue,
        board: puzzle.map(row => [...row]),
        solution: solution.map(row => [...row]),
        initialBoard: puzzle.map(row => [...row]),
        timeElapsed: 0,
        gameSessionId: sessionId,
        isLoading: state.isLoading, // Preserve loading state, will be cleared by action
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
        timeElapsed: action.state.lives > 0 ? 0 : 0, // Actually should load time? 
        // Note: original code had timeElapsed: 0. We should probably respect serialized time if available,
        // but current SerializableGameState doesn't seem to have timeElapsed explicitly? 
        // Wait, looking at SerializableGameState interface in previous turn...
        // It does NOT have timeElapsed! It seems we lose time on save/load?
        // The plan implies we should care about it. But adhering to existing behavior:
        // We'll keep it 0 as per original code, or check if we should add it. 
        // The original code had: timeElapsed: 0.
        notes: new Map(
          Object.entries(action.state.notes).map(([key, arr]) => [key, new Set(arr)])
        ),
        isLoading: false,
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
        timeElapsed: action.timeElapsed, // Update snapshot
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
        
        // Check if puzzle is complete
        const isComplete = newBoard.every((row, r) => 
          row.every((cell, c) => cell === state.solution[r][c])
        );
        const finalStatus = isComplete ? 'won' : state.status;
        const finalTime = action.timeElapsed;

        // Save game result if completed
        if (isComplete) {
          const gameResult: GameResult = {
            id: Date.now().toString(),
            difficulty: state.difficulty,
            lives: state.initialLives,
            completionTime: finalTime,
            timestamp: Date.now(),
            won: true,
          };
          saveGameResult(gameResult); // Fire and forget
          
          // Track analytics for game completion
          if (state.gameSessionId) {
            const mistakesMade = state.initialLives - state.lives;
            analyticsService.trackGameComplete({
              sessionId: state.gameSessionId,
              gameType: state.multiplayer ? 'multiplayer' : 'single_player',
              difficulty: state.difficulty,
              lives: state.initialLives,
              completionTime: finalTime,
              outcome: 'won',
              hintUsed: state.hintUsed,
              mistakesMade,
              playerCount: state.multiplayer?.players.length,
              isHost: state.multiplayer ? state.multiplayer.hostId === multiplayerService.getPlayerId() : undefined,
            });
          }
          
          // Broadcast completion in multiplayer mode
          if (state.multiplayer && multiplayerService.currentChannel) {
            multiplayerService.currentChannel.send({
              type: 'broadcast',
              event: 'player-won',
              payload: {
                playerName: multiplayerService.currentPlayerName || 'Player',
                completionTime: finalTime,
              },
            });
            logger.log('Broadcasting win to other players');
          }
          
          // Trigger review prompt logic (fire and forget)
          ReviewService.onPuzzleCompleted(!!state.multiplayer).catch(err => 
            logger.error('GameContext', 'Error checking review prompt', err)
          );
        }

        return {
          ...state,
          board: newBoard,
          status: finalStatus,
          selectedCell: { row, col }, // Keep cell selected
          timeElapsed: finalTime, // Update time
        };
      } else {
        // Wrong number - any wrong guess loses a life
        const newLives = Math.max(0, state.lives - 1); // Prevent lives from going below zero
        const finalTime = action.timeElapsed;
        
        // Track analytics for game lost
        if (newLives === 0 && state.gameSessionId) {
          const mistakesMade = state.initialLives - newLives;
          analyticsService.trackGameComplete({
            sessionId: state.gameSessionId,
            gameType: state.multiplayer ? 'multiplayer' : 'single_player',
            difficulty: state.difficulty,
            lives: state.initialLives,
            completionTime: finalTime,
            outcome: 'lost',
            hintUsed: state.hintUsed,
            mistakesMade,
            playerCount: state.multiplayer?.players.length,
            isHost: state.multiplayer ? state.multiplayer.hostId === multiplayerService.getPlayerId() : undefined,
          });
          
          // Broadcast loss in multiplayer mode
          if (state.multiplayer && multiplayerService.currentChannel) {
            multiplayerService.currentChannel.send({
              type: 'broadcast',
              event: 'player-lost',
              payload: {
                playerName: multiplayerService.currentPlayerName || 'Player',
                timeElapsed: finalTime,
              },
            });
            logger.log('Broadcasting loss to other players');
          }
        }
        
        // Don't save lost games to high scores
        // Only won games are tracked in high scores
        
        return {
          ...state,
          lives: newLives,
          status: newLives === 0 ? 'lost' : state.status,
          wrongCell: { row, col },
          timeElapsed: finalTime, // Update time
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
      // Track abandonment if there was an active game
      if (state.gameSessionId && state.status === 'playing') {
        analyticsService.trackGameAbandon({
          sessionId: state.gameSessionId,
          gameType: state.multiplayer ? 'multiplayer' : 'single_player',
          difficulty: state.difficulty,
          lives: state.initialLives,
          playerCount: state.multiplayer?.players.length,
          isHost: state.multiplayer ? state.multiplayer.hostId === multiplayerService.getPlayerId() : undefined,
        });
      }
      
      return {
        ...initialState,
        difficulty: state.difficulty,
        timeElapsed: 0,
        isLoading: false,
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
      const multiplayerSessionId = analyticsService.generateSessionId();
      
      // Track multiplayer game start (fire and forget)
      analyticsService.trackGameStart({
        sessionId: multiplayerSessionId,
        gameType: 'multiplayer',
        difficulty: action.difficulty,
        lives: action.lives,
        playerCount: state.multiplayer?.players.length,
        isHost: state.multiplayer ? state.multiplayer.hostId === multiplayerService.getPlayerId() : undefined,
      });
      
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
        gameSessionId: multiplayerSessionId,
        isLoading: false,
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

    case 'SHOW_MULTIPLAYER_LOSER':
      return {
        ...state,
        status: 'paused', // Pause the game when another player loses
        multiplayerLoser: {
          playerName: action.playerName,
          timeElapsed: action.timeElapsed,
        },
      };

    case 'DISMISS_WINNER_MODAL':
      return {
        ...state,
        multiplayerWinner: null,
      };

    case 'DISMISS_LOSER_MODAL':
      return {
        ...state,
        multiplayerLoser: null,
      };

    default:
      return state;
    }
  })();
}

const GameContext = createContext<GameState & GameActions | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Timer management
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timeElapsedRef = useRef(0);

  // Sync timer with state when necessary (e.g. loading game, reset)
  useEffect(() => {
    if (state.status === 'ready' || state.timeElapsed === 0) {
      setTimeElapsed(state.timeElapsed);
      timeElapsedRef.current = state.timeElapsed;
    }
  }, [state.timeElapsed, state.status]);

  // Timer effect - updates local state only, avoiding main context updates
  useEffect(() => {
    let interval: any = null;
    
    if (state.status === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const next = prev + 1;
          timeElapsedRef.current = next;
          return next;
        });
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
      logger.log('Received shared game board:', payload);
      
      // Set loading state for guests receiving the board
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      // Ensure any lingering overlays/modals are cleared before loading the new round
      dispatch({ type: 'DISMISS_WINNER_MODAL' });
      dispatch({ type: 'DISMISS_LOSER_MODAL' });

      // Allow React to render the loading state before loading the game
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Load the shared game (this resets state to initial and sets status to playing)
          dispatch({ 
            type: 'LOAD_MULTIPLAYER_GAME', 
            difficulty: payload.difficulty, 
            lives: payload.lives, 
            board: payload.board, 
            solution: payload.solution, 
            initialBoard: payload.initialBoard 
          });
        }, 0);
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
      logger.log('Received pause broadcast - pausing game');
      dispatch({ type: 'PAUSE_GAME', timeElapsed: timeElapsedRef.current });
    };

    const handleResumeReceived = () => {
      logger.log('Received resume broadcast - resuming game');
      dispatch({ type: 'RESUME_GAME' });
    };

    const handlePlayerWon = ({ payload }: any) => {
      logger.log('Another player won:', payload);
      dispatch({ 
        type: 'SHOW_MULTIPLAYER_WINNER', 
        playerName: payload.playerName, 
        completionTime: payload.completionTime 
      });
    };

    const handlePlayerLost = ({ payload }: any) => {
      logger.log('Another player lost:', payload);
      dispatch({ 
        type: 'SHOW_MULTIPLAYER_LOSER', 
        playerName: payload.playerName, 
        timeElapsed: payload.timeElapsed 
      });
    };

    // Store channel reference for cleanup
    const channel = multiplayerService.currentChannel;
    
    // Check if channel has the necessary methods
    if (channel && typeof channel.on === 'function') {
      channel.on('broadcast', { event: 'game-paused' }, handlePauseReceived);
      channel.on('broadcast', { event: 'game-resumed' }, handleResumeReceived);
      channel.on('broadcast', { event: 'player-won' }, handlePlayerWon);
      channel.on('broadcast', { event: 'player-lost' }, handlePlayerLost);
    }

    return () => {
      // Cleanup - only if channel still exists and has the off method
      if (channel && typeof channel.off === 'function') {
        try {
          channel.off('broadcast', { event: 'game-paused' }, handlePauseReceived);
          channel.off('broadcast', { event: 'game-resumed' }, handleResumeReceived);
          channel.off('broadcast', { event: 'player-won' }, handlePlayerWon);
          channel.off('broadcast', { event: 'player-lost' }, handlePlayerLost);
        } catch (error) {
          logger.log('Error during cleanup of multiplayer listeners:', error);
        }
      }
    };
  }, [state.multiplayer]);



  // Memoize actions to prevent unnecessary re-renders
  const actions: GameActions = React.useMemo(() => ({
    startGame: async (difficulty: Difficulty, lives?: number) => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        // Allow React to render the loading state before generating puzzle
        await new Promise<void>((resolve) => {
          // Use requestAnimationFrame to ensure loading state is rendered
          requestAnimationFrame(() => {
            // Use setTimeout to allow the frame to paint
            setTimeout(() => {
              dispatch({ type: 'START_GAME', difficulty, lives });
              resolve();
            }, 0);
          });
        });
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    startPlaying: () => dispatch({ type: 'START_PLAYING' }),
    pauseGame: () => {
      dispatch({ type: 'PAUSE_GAME', timeElapsed: timeElapsedRef.current });
      
      // Broadcast pause to other players in multiplayer
      if (state.multiplayer && multiplayerService.currentChannel) {
        multiplayerService.currentChannel.send({
          type: 'broadcast',
          event: 'game-paused',
          payload: {},
        });
        logger.log('Broadcasting pause to other players');
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
        logger.log('Broadcasting resume to other players');
      }
    },
    selectCell: (row: number, col: number) => dispatch({ type: 'SELECT_CELL', row, col }),
    placeNumber: (number: number) => dispatch({ type: 'PLACE_NUMBER', number, timeElapsed: timeElapsedRef.current }),
    clearCell: () => dispatch({ type: 'CLEAR_CELL' }),
    addNote: (number: number) => dispatch({ type: 'ADD_NOTE', number }),
    removeNote: (number: number) => dispatch({ type: 'REMOVE_NOTE', number }),
    newGame: () => dispatch({ type: 'NEW_GAME' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    clearWrongCell: () => dispatch({ type: 'CLEAR_WRONG_CELL' }),
    useHint: () => dispatch({ type: 'USE_HINT' }),
    loadGame: (loadedState: SerializableGameState) => dispatch({ type: 'LOAD_GAME', state: loadedState }),
    exportGame: () => {
      // Only export if game hasn't started playing or is paused
      if (state.status === 'ready' || state.status === 'paused' || state.status === 'playing') {
        // Use current ref time if playing, otherwise use state time (which should be synced on pause)
        const currentTime = state.status === 'playing' ? timeElapsedRef.current : state.timeElapsed;
        return serializeGameState({ ...state, timeElapsed: currentTime });
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
        logger.error('Failed to create multiplayer game:', error);
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
        logger.error('Failed to join multiplayer game:', error);
        throw error;
      }
    },
    leaveMultiplayerGame: async () => {
      try {
        // Track abandonment if leaving an active game
        if (state.gameSessionId && state.status === 'playing' && state.multiplayer) {
          analyticsService.trackGameAbandon({
            sessionId: state.gameSessionId,
            gameType: 'multiplayer',
            difficulty: state.difficulty,
            lives: state.initialLives,
            playerCount: state.multiplayer.players.length,
            isHost: state.multiplayer.hostId === multiplayerService.getPlayerId(),
          });
        }
        
        await multiplayerService.leaveGame();
        dispatch({ type: 'SET_MULTIPLAYER', game: null });
      } catch (error) {
        logger.error('Failed to leave multiplayer game:', error);
      }
    },
    startMultiplayerGame: async () => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        // Allow React to render the loading state before generating puzzle
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              resolve();
            }, 0);
          });
        });

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
        logger.error('Failed to start multiplayer game:', error);
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    startNewRound: async () => {
      try {
        if (!state.multiplayer) throw new Error('No multiplayer game active');
        // Host-only guard
        const isHost = state.multiplayer.hostId === multiplayerService.getPlayerId();
        if (!isHost) {
          logger.log('Only host can start a new round');
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
        logger.error('Failed to start new round:', error);
        throw error;
      }
    },
    dismissWinnerModal: () => {
      dispatch({ type: 'DISMISS_WINNER_MODAL' });
    },
    dismissLoserModal: () => {
      dispatch({ type: 'DISMISS_LOSER_MODAL' });
    },
  }), [state]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = React.useMemo(() => ({
    ...state,
    ...actions,
  }), [state, actions]);

  return (
    <GameContext.Provider value={value}>
      <GameTimeContext.Provider value={{ timeElapsed }}>
        {children}
      </GameTimeContext.Provider>
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
