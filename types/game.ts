export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';
export type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'lost';
export type MultiplayerStatus = 'waiting' | 'playing' | 'finished';

export interface WinnerInfo {
  playerName: string;
  completionTime: number;
}

export interface GameState {
  difficulty: Difficulty;
  status: GameStatus;
  lives: number;
  initialLives: number;
  timeElapsed: number;
  board: number[][];
  solution: number[][];
  initialBoard: number[][];
  selectedCell: { row: number; col: number } | null;
  notes: Map<string, Set<number>>;
  wrongCell: { row: number; col: number } | null;
  hintUsed: boolean;
  // Multiplayer state
  multiplayer: MultiplayerGame | null;
  multiplayerWinner: WinnerInfo | null; // Winner info when another player finishes
}

export interface GameResult {
  id: string;
  difficulty: Difficulty;
  lives: number;
  completionTime: number;
  timestamp: number;
  won: boolean;
}

export interface HighScoreData {
  results: GameResult[];
  bestTimes: Record<string, number>;
}

export interface SerializableGameState {
  difficulty: Difficulty;
  lives: number;
  board: number[][];
  solution: number[][];
  initialBoard: number[][];
  notes: Record<string, number[]>; // Serialized from Map<string, Set<number>>
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface MultiplayerGame {
  id: string | null;
  channelName: string | null;
  hostId: string | null;
  difficulty: Difficulty;
  lives: number;
  status: MultiplayerStatus;
  players: Player[];
  createdAt: number;
}

export interface GameActions {
  startGame: (difficulty: Difficulty, lives?: number) => void;
  startPlaying: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  selectCell: (row: number, col: number) => void;
  placeNumber: (number: number) => void;
  clearCell: () => void;
  addNote: (number: number) => void;
  removeNote: (number: number) => void;
  newGame: () => void;
  resetGame: () => void;
  clearWrongCell: () => void;
  useHint: () => void;
  devFillSolution?: () => void;
  loadGame: (serializedState: SerializableGameState) => void;
  exportGame: () => string | null;
  // Multiplayer actions
  createMultiplayerGame?: (channelName: string, playerName: string, difficulty: Difficulty, lives: number) => Promise<void>;
  joinMultiplayerGame?: (channelName: string, playerName: string) => Promise<void>;
  leaveMultiplayerGame?: () => Promise<void>;
  startMultiplayerGame?: () => Promise<void>;
  dismissWinnerModal?: () => void;
}

export const DIFFICULTY_LIVES: Record<Difficulty, number> = {
  easy: 5,
  medium: 5,
  hard: 5,
  master: 5,
};
