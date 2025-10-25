import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { Difficulty } from '../types/game';

export default function WelcomeScreen() {
  const router = useRouter();
  const { startGame } = useGame();

  const handleStartGame = (difficulty: Difficulty) => {
    startGame(difficulty);
    router.push('/game');
  };

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
    { label: 'Master', value: 'master' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sudoku</Text>
        <Text style={styles.subtitle}>Choose your difficulty</Text>
        
        <View style={styles.difficultyContainer}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.value}
              style={styles.difficultyButton}
              onPress={() => handleStartGame(difficulty.value)}
            >
              <Text style={styles.difficultyText}>{difficulty.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E2939',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 18,
    color: '#4A5565',
    marginBottom: 48,
    fontFamily: 'Inter',
  },
  difficultyContainer: {
    width: '100%',
    maxWidth: 300,
  },
  difficultyButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginBottom: 12,
    alignItems: 'center',
  },
  difficultyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
