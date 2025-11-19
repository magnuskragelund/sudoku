/**
 * Review Service
 * 
 * Manages in-app review prompts following App Store best practices.
 * Prompts users to rate the app after positive experiences (completing puzzles).
 * 
 * Strategy:
 * - Prompt after 3rd successful puzzle completion (user is engaged)
 * - Never prompt more than once per version
 * - Only prompt after successful completions (positive moment)
 * - Respect Apple's rate limiting (max 3 prompts per year)
 * - Use soft-ask pattern for better conversion
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { logger } from './logger';

const STORAGE_KEYS = {
  GAMES_COMPLETED: 'review_games_completed',
  REVIEW_REQUESTED: 'review_requested',
  REVIEW_DISMISSED_COUNT: 'review_dismissed_count',
  LAST_REVIEW_PROMPT: 'review_last_prompt_date',
  APP_VERSION: 'review_app_version',
};

const CONFIG = {
  // Prompt after this many successful completions
  GAMES_BEFORE_PROMPT: 3,
  
  // Don't prompt again if user dismissed more than this many times
  MAX_DISMISSALS: 2,
  
  // Minimum days between prompts (even across versions)
  MIN_DAYS_BETWEEN_PROMPTS: 60,
  
  // For testing: set to true to always show prompt
  DEBUG_MODE: false,
};

export class ReviewService {
  /**
   * Call this when user successfully completes a puzzle
   */
  static async onPuzzleCompleted(isMultiplayer: boolean = false): Promise<void> {
    try {
      // Don't prompt in multiplayer (too distracting)
      if (isMultiplayer) {
        return;
      }

      // Check if we should even consider prompting
      const shouldConsider = await this.shouldConsiderPrompting();
      if (!shouldConsider) {
        return;
      }

      // Increment completion count
      const completionCount = await this.incrementCompletionCount();
      
      logger.info('ReviewService', 'Puzzle completed', { 
        completionCount, 
        threshold: CONFIG.GAMES_BEFORE_PROMPT 
      });

      // Check if we've hit the threshold
      if (completionCount >= CONFIG.GAMES_BEFORE_PROMPT) {
        // Small delay to let victory animation complete
        setTimeout(() => {
          this.requestReview();
        }, 2000);
      }
    } catch (error) {
      logger.error('ReviewService', 'Error in onPuzzleCompleted', error);
    }
  }

  /**
   * Directly request a review (bypasses completion count)
   * Use this for manual testing or special occasions
   */
  static async requestReview(): Promise<void> {
    try {
      // Check if review is available on this platform
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable && !CONFIG.DEBUG_MODE) {
        logger.info('ReviewService', 'Store review not available on this platform');
        return;
      }

      // Final check before showing
      const shouldShow = await this.shouldShowReviewPrompt();
      if (!shouldShow && !CONFIG.DEBUG_MODE) {
        logger.info('ReviewService', 'Review prompt conditions not met');
        return;
      }

      // Mark that we've shown the prompt
      await this.markReviewPromptShown();

      // Show the native review prompt
      logger.info('ReviewService', 'Requesting review prompt');
      await StoreReview.requestReview();

    } catch (error) {
      logger.error('ReviewService', 'Error requesting review', error);
    }
  }

  /**
   * Check if we should even consider prompting (high-level gates)
   */
  private static async shouldConsiderPrompting(): Promise<boolean> {
    try {
      // Gate 1: Has user already been prompted in this version?
      const hasBeenPrompted = await this.hasBeenPromptedThisVersion();
      if (hasBeenPrompted) {
        return false;
      }

      // Gate 2: Has user dismissed too many times?
      const dismissalCount = await this.getDismissalCount();
      if (dismissalCount >= CONFIG.MAX_DISMISSALS) {
        logger.info('ReviewService', 'User has dismissed too many times', { dismissalCount });
        return false;
      }

      // Gate 3: Has enough time passed since last prompt?
      const daysSinceLastPrompt = await this.getDaysSinceLastPrompt();
      if (daysSinceLastPrompt !== null && daysSinceLastPrompt < CONFIG.MIN_DAYS_BETWEEN_PROMPTS) {
        logger.info('ReviewService', 'Too soon since last prompt', { daysSinceLastPrompt });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('ReviewService', 'Error in shouldConsiderPrompting', error);
      return false;
    }
  }

  /**
   * Final check before showing prompt
   */
  private static async shouldShowReviewPrompt(): Promise<boolean> {
    try {
      // All the gates from shouldConsiderPrompting apply here too
      const shouldConsider = await this.shouldConsiderPrompting();
      if (!shouldConsider) {
        return false;
      }

      // Additional check: Is review available on this device?
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('ReviewService', 'Error in shouldShowReviewPrompt', error);
      return false;
    }
  }

  /**
   * Increment and return the completion count
   */
  private static async incrementCompletionCount(): Promise<number> {
    try {
      const currentCount = await this.getCompletionCount();
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.GAMES_COMPLETED, newCount.toString());
      return newCount;
    } catch (error) {
      logger.error('ReviewService', 'Error incrementing completion count', error);
      return 0;
    }
  }

  /**
   * Get current completion count
   */
  private static async getCompletionCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.GAMES_COMPLETED);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('ReviewService', 'Error getting completion count', error);
      return 0;
    }
  }

  /**
   * Check if user has been prompted in this app version
   */
  private static async hasBeenPromptedThisVersion(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentAppVersion();
      const promptedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      
      return promptedVersion === currentVersion;
    } catch (error) {
      logger.error('ReviewService', 'Error checking prompted version', error);
      return false;
    }
  }

  /**
   * Get current app version
   */
  private static async getCurrentAppVersion(): Promise<string> {
    try {
      // In Expo, you can get this from Constants
      const Constants = await import('expo-constants');
      return Constants.default.expoConfig?.version || '1.0.0';
    } catch (error) {
      logger.error('ReviewService', 'Error getting app version', error);
      return '1.0.0';
    }
  }

  /**
   * Get number of times user has dismissed the prompt
   */
  private static async getDismissalCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_DISMISSED_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('ReviewService', 'Error getting dismissal count', error);
      return 0;
    }
  }

  /**
   * Get days since last prompt (null if never prompted)
   */
  private static async getDaysSinceLastPrompt(): Promise<number | null> {
    try {
      const lastPromptDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);
      if (!lastPromptDate) {
        return null;
      }

      const lastDate = new Date(lastPromptDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      logger.error('ReviewService', 'Error getting days since last prompt', error);
      return null;
    }
  }

  /**
   * Mark that we've shown the review prompt
   */
  private static async markReviewPromptShown(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentAppVersion();
      const now = new Date().toISOString();

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.REVIEW_REQUESTED, 'true'],
        [STORAGE_KEYS.APP_VERSION, currentVersion],
        [STORAGE_KEYS.LAST_REVIEW_PROMPT, now],
      ]);

      // Reset completion count after prompting
      await AsyncStorage.setItem(STORAGE_KEYS.GAMES_COMPLETED, '0');

      logger.info('ReviewService', 'Marked review prompt shown', { version: currentVersion, date: now });
    } catch (error) {
      logger.error('ReviewService', 'Error marking review prompt shown', error);
    }
  }

  /**
   * Increment dismissal count (call this if you implement a soft-ask)
   */
  static async onPromptDismissed(): Promise<void> {
    try {
      const currentCount = await this.getDismissalCount();
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_DISMISSED_COUNT, newCount.toString());
      
      logger.info('ReviewService', 'User dismissed review prompt', { dismissalCount: newCount });
    } catch (error) {
      logger.error('ReviewService', 'Error incrementing dismissal count', error);
    }
  }

  /**
   * Debug method: Reset all review tracking
   * Use this for testing only
   */
  static async resetReviewTracking(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.GAMES_COMPLETED,
        STORAGE_KEYS.REVIEW_REQUESTED,
        STORAGE_KEYS.REVIEW_DISMISSED_COUNT,
        STORAGE_KEYS.LAST_REVIEW_PROMPT,
        STORAGE_KEYS.APP_VERSION,
      ]);
      
      logger.info('ReviewService', 'Review tracking reset');
    } catch (error) {
      logger.error('ReviewService', 'Error resetting review tracking', error);
    }
  }

  /**
   * Debug method: Get current review status
   */
  static async getDebugInfo(): Promise<object> {
    try {
      const [
        completionCount,
        hasBeenPrompted,
        dismissalCount,
        daysSinceLastPrompt,
        currentVersion,
      ] = await Promise.all([
        this.getCompletionCount(),
        this.hasBeenPromptedThisVersion(),
        this.getDismissalCount(),
        this.getDaysSinceLastPrompt(),
        this.getCurrentAppVersion(),
      ]);

      return {
        completionCount,
        hasBeenPrompted,
        dismissalCount,
        daysSinceLastPrompt,
        currentVersion,
        threshold: CONFIG.GAMES_BEFORE_PROMPT,
        maxDismissals: CONFIG.MAX_DISMISSALS,
        minDaysBetweenPrompts: CONFIG.MIN_DAYS_BETWEEN_PROMPTS,
      };
    } catch (error) {
      logger.error('ReviewService', 'Error getting debug info', error);
      return { error: 'Failed to get debug info' };
    }
  }
}

export default ReviewService;

