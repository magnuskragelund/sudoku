import { useRouter } from 'expo-router';
import { Star, Trophy } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Difficulty } from '../types/game';

export default function WelcomeScreen() {
  const router = useRouter();
  const { startGame } = useGame();
  const [selectedLives, setSelectedLives] = useState(5);

  const handleStartGame = (difficulty: Difficulty) => {
    startGame(difficulty, selectedLives);
    router.push('/game');
  };

  const difficulties: { label: string; value: Difficulty; stars: number }[] = [
    { label: 'Easy', value: 'easy', stars: 1 },
    { label: 'Medium', value: 'medium', stars: 2 },
    { label: 'Hard', value: 'hard', stars: 3 },
    { label: 'Master', value: 'master', stars: 4 },
  ];

  const livesOptions = [1, 2, 3, 4, 5];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sudoku</Text>
        <Text style={styles.subtitle}>With Friends</Text>
        
        <TouchableOpacity 
          style={styles.highScoresButton}
          onPress={() => router.push('/highscores')}
        >
          <Trophy size={20} color="#2B7FFF" />
          <Text style={styles.highScoresButtonText}>View High Scores</Text>
        </TouchableOpacity>
        
        <Text style={styles.livesLabel}>Number of Lives</Text>
        <View style={styles.livesContainer}>
          {livesOptions.map((lives) => (
            <TouchableOpacity
              key={lives}
              style={[
                styles.livesButton,
                selectedLives === lives && styles.livesButtonSelected
              ]}
              onPress={() => setSelectedLives(lives)}
            >
              <Text style={[
                styles.livesButtonText,
                selectedLives === lives && styles.livesButtonTextSelected
              ]}>
                {lives}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.difficultyLabel}>Choose your difficulty</Text>
        
        <View style={styles.difficultyContainer}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.value}
              style={styles.difficultyButton}
              onPress={() => handleStartGame(difficulty.value)}
            >
              <Text style={styles.difficultyText}>{difficulty.label}</Text>
              <View style={styles.starsContainer}>
                {Array.from({ length: difficulty.stars }, (_, i) => (
                  <Star key={i} size={16} color="white" fill="white" />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
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
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E2939',
    marginBottom: 4,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#2B7FFF',
    marginBottom: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
    fontWeight: '500',
  },
  highScoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    marginBottom: 32,
    gap: 8,
  },
  highScoresButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B7FFF',
    fontFamily: 'Inter',
  },
  livesLabel: {
    fontSize: 18,
    color: '#4A5565',
    marginBottom: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  livesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  livesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  livesButtonSelected: {
    backgroundColor: '#2B7FFF',
    borderColor: '#1E40AF',
  },
  livesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  livesButtonTextSelected: {
    color: 'white',
  },
  difficultyLabel: {
    fontSize: 18,
    color: '#4A5565',
    marginBottom: 48,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  difficultyContainer: {
    width: '90%',
  },
  difficultyButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  difficultyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
});
