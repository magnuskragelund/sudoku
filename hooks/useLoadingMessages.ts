import { Difficulty } from '../types/game';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

const LOADING_MESSAGES: Record<Difficulty, string[]> = {
  easy: [
    'Finding the perfect starter puzzle...',
    'Placing numbers with care...',
    'Double-checking every clue...',
    'Making sure it\'s solvable...',
    'Almost ready to play!',
  ],
  medium: [
    'Crafting a balanced challenge...',
    'Testing logical patterns...',
    'Ensuring unique solution...',
    'Fine-tuning the difficulty...',
    'Preparing your puzzle...',
  ],
  hard: [
    'Forging a formidable puzzle...',
    'Analyzing advanced techniques...',
    'Validating complex patterns...',
    'Ensuring it requires skill...',
    'Creating a true challenge...',
  ],
  master: [
    'Mastering the ultimate puzzle...',
    'Exploring advanced strategies...',
    'Validating expert-level techniques...',
    'Crafting perfection...',
    'This may take a moment...',
    'Master puzzles require extra time...',
    'Analyzing complex patterns...',
  ],
};

export function useLoadingMessages(difficulty: Difficulty | null, isLoading: boolean) {
  const loadingMessages = useMemo(() => {
    if (!difficulty) return LOADING_MESSAGES.easy;
    return LOADING_MESSAGES[difficulty] || LOADING_MESSAGES.easy;
  }, [difficulty]);

  const [randomIndex, setRandomIndex] = useState(0);
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const lastDifficultyRef = useRef<Difficulty | null>(null);

  // Pick a random message when loading starts
  useEffect(() => {
    if (!isLoading) {
      messageOpacity.setValue(1);
      lastDifficultyRef.current = null;
      return;
    }

    // Pick a new random message when loading starts or difficulty changes
    if (lastDifficultyRef.current !== difficulty) {
      const randomMessageIndex = Math.floor(Math.random() * loadingMessages.length);
      setRandomIndex(randomMessageIndex);
      lastDifficultyRef.current = difficulty;
      messageOpacity.setValue(1);
    }
  }, [isLoading, difficulty, loadingMessages.length]);

  return {
    currentMessage: loadingMessages[randomIndex] ?? loadingMessages[0] ?? 'Generating puzzle...',
    messageOpacity: messageOpacity,
    messageIndex: randomIndex,
  };
}
