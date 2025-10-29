import { useRouter } from 'expo-router';
import { Star, Trophy, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Difficulty } from '../types/game';

export default function WelcomeScreen() {
  const router = useRouter();
  const { startGame, loadGame } = useGame();
  const [selectedLives, setSelectedLives] = useState(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const handleStartGame = (difficulty: Difficulty) => {
    if (isStartingGame) return; // Prevent multiple presses
    
    setIsStartingGame(true);
    startGame(difficulty, selectedLives);
    
    // Navigate after a short delay to ensure state is set
    setTimeout(() => {
      router.push('/game');
      setIsStartingGame(false);
    }, 100);
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleContainer}>
          <Text style={styles.titleSmall}>That's</Text>
          <Text style={styles.titleLarge}>Sudoku</Text>
        </View>
        
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/highscores')}
          >
            <Trophy size={18} color="#2B7FFF" />
            <Text style={styles.secondaryButtonText}>High Scores</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/multiplayer')}
          >
            <Users size={18} color="#22C55E" />
            <Text style={styles.secondaryButtonText}>Multiplayer</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.livesSection}>
          <Text style={styles.livesLabel}>Lives</Text>
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
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.sectionTitle}>Choose Difficulty</Text>
          <View style={styles.difficultyContainer}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.value}
              style={[styles.difficultyButton, isStartingGame && styles.difficultyButtonDisabled]}
              onPress={() => {
                setSelectedDifficulty(difficulty.value);
                handleStartGame(difficulty.value);
              }}
              disabled={isStartingGame}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
    paddingBottom: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#4A5565',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
  },
  titleLarge: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1E2939',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    width: '100%',
    maxWidth: 400,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5565',
    fontFamily: 'Inter',
  },
  livesSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 28,
  },
  livesLabel: {
    fontSize: 14,
    color: '#4A5565',
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  livesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 0,
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
  heroSection: {
    width: '100%',
    maxWidth: 400,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2939',
    marginBottom: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  difficultyContainer: {
    width: '100%',
  },
  difficultyButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  difficultyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  difficultyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
});
