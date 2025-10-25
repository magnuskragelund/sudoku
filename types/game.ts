export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';
export type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'lost';

export interface GameState {
  difficulty: Difficulty;
  status: GameStatus;
  lives: number;
  timeElapsed: number;
  board: number[][];
  solution: number[][];
  initialBoard: number[][];
  selectedCell: { row: number; col: number } | null;
  notes: Map<string, Set<number>>;
  wrongCell: { row: number; col: number } | null;
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
}

export const DIFFICULTY_LIVES: Record<Difficulty, number> = {
  easy: 5,
  medium: 5,
  hard: 5,
  master: 5,
};
