import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Difficulty } from '../types/game';
import { logger } from './logger';
import { supabase } from './supabaseClient';

export type GameType = 'single_player' | 'multiplayer';
export type EventType = 'start' | 'complete' | 'abandon';
export type GameOutcome = 'won' | 'lost' | 'abandoned';

export interface GameAnalyticsEvent {
  sessionId: string;
  gameType: GameType;
  eventType: EventType;
  difficulty: Difficulty;
  lives: number;
  completionTime?: number; // in seconds
  outcome?: GameOutcome;
  hintUsed?: boolean;
  mistakesMade?: number;
  playerCount?: number; // for multiplayer
  isHost?: boolean; // for multiplayer
}

class AnalyticsService {
  private appVersion: string;
  private isDevelopment: boolean;

  constructor() {
    this.appVersion = Constants.expoConfig?.version || 'unknown';
    
    // Check if we're in development/local environment
    // For web: check if running on localhost
    // For native: check __DEV__ flag
    if (Platform.OS === 'web') {
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '');
      this.isDevelopment = isLocalhost || __DEV__;
    } else {
      this.isDevelopment = __DEV__ || false;
    }
  }

  /**
   * Generate a unique session ID for a game
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Track a game event (start, complete, or abandon)
   * This is a fire-and-forget operation that won't block gameplay
   */
  private async trackEvent(event: GameAnalyticsEvent): Promise<void> {
    // Skip analytics in development/local environment
    if (this.isDevelopment) {
      logger.log('Analytics skipped (development mode):', event.eventType, event.gameType);
      return;
    }

    try {
      const { error } = await supabase.from('game_analytics').insert({
        session_id: event.sessionId,
        game_type: event.gameType,
        event_type: event.eventType,
        difficulty: event.difficulty,
        lives: event.lives,
        completion_time: event.completionTime,
        outcome: event.outcome,
        hint_used: event.hintUsed,
        mistakes_made: event.mistakesMade,
        player_count: event.playerCount,
        is_host: event.isHost,
        app_version: this.appVersion,
      });

      if (error) {
        logger.error('Failed to track analytics event:', error);
      } else {
        logger.log('Analytics event tracked:', event.eventType, event.gameType);
      }
    } catch (error) {
      logger.error('Exception tracking analytics event:', error);
    }
  }

  /**
   * Track when a game starts
   */
  async trackGameStart(params: {
    sessionId: string;
    gameType: GameType;
    difficulty: Difficulty;
    lives: number;
    playerCount?: number;
    isHost?: boolean;
  }): Promise<void> {
    await this.trackEvent({
      sessionId: params.sessionId,
      gameType: params.gameType,
      eventType: 'start',
      difficulty: params.difficulty,
      lives: params.lives,
      playerCount: params.playerCount,
      isHost: params.isHost,
    });
  }

  /**
   * Track when a game is completed (won or lost)
   */
  async trackGameComplete(params: {
    sessionId: string;
    gameType: GameType;
    difficulty: Difficulty;
    lives: number;
    completionTime: number;
    outcome: 'won' | 'lost';
    hintUsed: boolean;
    mistakesMade: number;
    playerCount?: number;
    isHost?: boolean;
  }): Promise<void> {
    await this.trackEvent({
      sessionId: params.sessionId,
      gameType: params.gameType,
      eventType: 'complete',
      difficulty: params.difficulty,
      lives: params.lives,
      completionTime: params.completionTime,
      outcome: params.outcome,
      hintUsed: params.hintUsed,
      mistakesMade: params.mistakesMade,
      playerCount: params.playerCount,
      isHost: params.isHost,
    });
  }

  /**
   * Track when a game is abandoned (player leaves before finishing)
   */
  async trackGameAbandon(params: {
    sessionId: string;
    gameType: GameType;
    difficulty: Difficulty;
    lives: number;
    playerCount?: number;
    isHost?: boolean;
  }): Promise<void> {
    await this.trackEvent({
      sessionId: params.sessionId,
      gameType: params.gameType,
      eventType: 'abandon',
      difficulty: params.difficulty,
      lives: params.lives,
      outcome: 'abandoned',
      playerCount: params.playerCount,
      isHost: params.isHost,
    });
  }
}

export const analyticsService = new AnalyticsService();

