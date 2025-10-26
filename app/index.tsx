import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Download, Star, Trophy } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Difficulty } from '../types/game';
import { deserializeGameState, validateGameState } from '../utils/gameSerializer';

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

  const handleImportPuzzle = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      
      // Try to extract JSON from clipboard (might have extra text)
      const jsonMatch = clipboardContent.match(/\{.*\}/s);
      const jsonString = jsonMatch ? jsonMatch[0] : clipboardContent;
      
      const gameState = deserializeGameState(jsonString);
      
      if (!gameState) {
        Alert.alert('Invalid Data', 'The clipboard does not contain a valid puzzle.');
        return;
      }
      
      // Validate puzzle has unique solution
      if (!validateGameState(gameState)) {
        Alert.alert('Invalid Puzzle', 'The puzzle does not have a valid unique solution.');
        return;
      }
      
      loadGame(gameState);
      router.push('/game');
    } catch (error) {
      console.error('Error importing game:', error);
      Alert.alert('Import Failed', 'Could not import the puzzle. Please try again.');
    }
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
        
        <TouchableOpacity 
          style={styles.highScoresButton}
          onPress={() => router.push('/highscores')}
        >
          <Trophy size={20} color="#2B7FFF" />
          <Text style={styles.highScoresButtonText}>View High Scores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportPuzzle}
        >
          <Download size={20} color="#6B7280" />
          <Text style={styles.importButtonText}>Import from Clipboard</Text>
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
    marginBottom: 24,
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
  highScoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    marginBottom: 20,
    gap: 8,
  },
  highScoresButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B7FFF',
    fontFamily: 'Inter',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    width: '90%',
  },
  importButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  livesLabel: {
    fontSize: 16,
    color: '#4A5565',
    marginBottom: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  livesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
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
    fontSize: 16,
    color: '#4A5565',
    marginBottom: 20,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  difficultyContainer: {
    width: '90%',
    maxWidth: 400,
  },
  difficultyButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
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
