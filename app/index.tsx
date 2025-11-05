import { useRouter } from 'expo-router';
import { Moon, Star, Sun, Trophy, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { Difficulty } from '../types/game';

export default function WelcomeScreen() {
  const router = useRouter();
  const { startGame, loadGame } = useGame();
  const { theme, setTheme, colors } = useTheme();
  const [selectedLives, setSelectedLives] = useState(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const handleStartGame = async (difficulty: Difficulty) => {
    if (isStartingGame) return; // Prevent multiple presses
    
    setIsStartingGame(true);
    
    // Small delay to allow UI to update and show disabled state
    await new Promise(resolve => setTimeout(resolve, 50));
    
    startGame(difficulty, selectedLives);
    
    // Navigate after state is set
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          <View style={styles.titleContainer}>
          <Text style={[styles.titleLarge, { color: colors.textPrimary }]}>Sudoku</Text>
          <Text style={[styles.titleSmall, { color: colors.textSecondary }]}>Face Off</Text>
        </View>
        

        
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: colors.buttonBackgroundSecondary, borderColor: colors.border }]}
            onPress={() => router.push('/highscores')}
          >
            <Trophy size={18} color="#2B7FFF" />
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>High Scores</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.buttonBackgroundSecondary, borderColor: colors.border }]}
            onPress={() => router.push('/multiplayer')}
          >
            <Users size={18} color="#22C55E" />
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Multiplayer</Text>
          </TouchableOpacity>
        </View>
                {/* Theme Toggle */}
                <View style={styles.themeSection}>
          <Text style={[styles.livesLabel, { color: colors.textSecondary }]}>Theme</Text>
          <View style={styles.themeContainer}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                { backgroundColor: colors.buttonBackground, borderColor: colors.border },
                theme === 'light' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setTheme('light')}
            >
              <Sun size={16} color={theme === 'light' ? 'white' : colors.textSecondary} />
              <Text style={[
                styles.themeButtonText,
                { color: colors.textSecondary },
                theme === 'light' && { color: 'white' }
              ]}>
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeButton,
                { backgroundColor: colors.buttonBackground, borderColor: colors.border },
                theme === 'system' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setTheme('system')}
            >
              <Text style={[
                styles.themeButtonText,
                { color: colors.textSecondary },
                theme === 'system' && { color: 'white' }
              ]}>
                Auto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeButton,
                { backgroundColor: colors.buttonBackground, borderColor: colors.border },
                theme === 'dark' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setTheme('dark')}
            >
              <Moon size={16} color={theme === 'dark' ? 'white' : colors.textSecondary} />
              <Text style={[
                styles.themeButtonText,
                { color: colors.textSecondary },
                theme === 'dark' && { color: 'white' }
              ]}>
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.livesSection}>
          <Text style={[styles.livesLabel, { color: colors.textSecondary }]}>Lives</Text>
          <View style={styles.livesContainer}>
          {livesOptions.map((lives) => (
            <TouchableOpacity
              key={lives}
              style={[
                styles.livesButton,
                { backgroundColor: colors.buttonBackground },
                selectedLives === lives && [styles.livesButtonSelected, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setSelectedLives(lives)}
            >
              <Text style={[
                styles.livesButtonText,
                { color: colors.textTertiary },
                selectedLives === lives && styles.livesButtonTextSelected
              ]}>
                {lives}
              </Text>
            </TouchableOpacity>
          ))}
          </View>
        </View>

        <View style={styles.heroSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Difficulty</Text>
          <View style={styles.difficultyContainer}>
          {difficulties.map((difficulty) => {
            const isThisButtonLoading = isStartingGame && selectedDifficulty === difficulty.value;
            
            return (
              <TouchableOpacity
                key={difficulty.value}
                style={[styles.difficultyButton, isStartingGame && styles.difficultyButtonDisabled]}
                onPress={() => {
                  setSelectedDifficulty(difficulty.value);
                  handleStartGame(difficulty.value);
                }}
                disabled={isStartingGame}
              >
                {isThisButtonLoading ? (
                  <Text style={styles.difficultyText}>Loading...</Text>
                ) : (
                  <>
                    <Text style={styles.difficultyText}>{difficulty.label}</Text>
                    <View style={styles.starsContainer}>
                      {Array.from({ length: difficulty.stars }, (_, i) => (
                        <Star key={i} size={16} color="white" fill="white" />
                      ))}
                    </View>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
          </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
  },
  titleLarge: {
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  themeSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
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
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  livesSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 28,
  },
  livesLabel: {
    fontSize: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  livesButtonSelected: {
    borderColor: '#1E40AF',
  },
  livesButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
