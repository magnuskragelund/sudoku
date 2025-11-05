import { Difficulty, GameResult, HighScoreData } from '../types/game';
import { logger } from './logger';
import { storage } from './storage';

const STORAGE_KEY = '@sudoku_high_scores';
const MAX_HISTORY_SIZE = 1000;

function getComboKey(difficulty: Difficulty, lives: number): string {
  return `${difficulty}-${lives}`;
}

export async function saveGameResult(result: GameResult): Promise<void> {
  try {
    // Validate that lives is a valid number
    if (typeof result.lives !== 'number' || isNaN(result.lives)) {
      logger.error('Invalid lives value:', result.lives);
      return;
    }

    // Only save won games to high scores
    if (!result.won) {
      return;
    }

    // Get existing data
    const dataString = await storage.getItem(STORAGE_KEY);
    let data: HighScoreData = dataString 
      ? JSON.parse(dataString) 
      : { results: [], bestTimes: {} };

    // Add new result to history
    data.results.push(result);
    
    // Filter out any invalid results (with NaN or undefined lives)
    data.results = data.results.filter(r => typeof r.lives === 'number' && !isNaN(r.lives));
    
    // Keep only the most recent MAX_HISTORY_SIZE games
    if (data.results.length > MAX_HISTORY_SIZE) {
      data.results = data.results.slice(-MAX_HISTORY_SIZE);
    }

    // Update best time if applicable (only for won games)
    if (result.won) {
      const comboKey = getComboKey(result.difficulty, result.lives);
      const currentBest = data.bestTimes[comboKey];
      
      if (!currentBest || result.completionTime < currentBest) {
        data.bestTimes[comboKey] = result.completionTime;
      }
    }

    // Save updated data
    await storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('Error saving game result:', error);
  }
}

export async function getHighScores(): Promise<HighScoreData> {
  try {
    const dataString = await storage.getItem(STORAGE_KEY);
    if (!dataString) {
      return { results: [], bestTimes: {} };
    }
    const data = JSON.parse(dataString);
    
    // Clean up any invalid results and filter out lost games
    if (data.results) {
      data.results = data.results.filter((r: GameResult) => 
        typeof r.lives === 'number' && !isNaN(r.lives) && r.won === true
      );
    }
    
    return data;
  } catch (error) {
    logger.error('Error loading high scores:', error);
    return { results: [], bestTimes: {} };
  }
}

export async function getBestTime(difficulty: Difficulty, lives: number): Promise<number | null> {
  try {
    const data = await getHighScores();
    const comboKey = getComboKey(difficulty, lives);
    return data.bestTimes[comboKey] || null;
  } catch (error) {
    logger.error('Error getting best time:', error);
    return null;
  }
}

export async function getGameHistory(
  difficulty?: Difficulty, 
  lives?: number
): Promise<GameResult[]> {
  try {
    const data = await getHighScores();
    let results = data.results;

    // Filter by difficulty if provided
    if (difficulty) {
      results = results.filter(r => r.difficulty === difficulty);
    }

    // Filter by lives if provided
    if (lives !== undefined) {
      results = results.filter(r => r.lives === lives);
    }

    // Sort by date (most recent first)
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    logger.error('Error getting game history:', error);
    return [];
  }
}

export async function clearHighScores(): Promise<void> {
  try {
    await storage.removeItem(STORAGE_KEY);
    logger.log('High scores cleared');
  } catch (error) {
    logger.error('Error clearing high scores:', error);
  }
}

export async function debugHighScores(): Promise<void> {
  try {
    const dataString = await storage.getItem(STORAGE_KEY);
    if (dataString) {
      const data = JSON.parse(dataString);
      logger.log('Current high scores data:', JSON.stringify(data, null, 2));
    } else {
      logger.log('No high scores data found');
    }
  } catch (error) {
    logger.error('Error reading high scores:', error);
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if same day
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Format as date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

