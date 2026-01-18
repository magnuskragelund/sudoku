import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import WebReturnBanner from '../components/WebReturnBanner';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLoadingMessages } from '../hooks/useLoadingMessages';
import { Difficulty } from '../types/game';

export default function DifficultyScreen() {
  const router = useRouter();
  const { startGame, isLoading } = useGame();
  const { colors, typography, spacing } = useTheme();
  const [selectedLives, setSelectedLives] = useState(5);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;

  const difficulties: {
    label: string;
    value: Difficulty;
    edition: string;
    description: string;
  }[] = [
      { label: 'Master', value: 'master', edition: 'WEEKEND EDITION', description: 'Requires advanced techniques like X-Wing, Swordfish, and XY-Wing' },
      { label: 'Hard', value: 'hard', edition: 'EVENING EDITION', description: 'May require advanced techniques like X-Wing' },
      { label: 'Medium', value: 'medium', edition: 'AFTERNOON EDITION', description: 'Uses basic techniques like pairs and singles' },
      { label: 'Easy', value: 'easy', edition: 'MORNING EDITION', description: 'Uses only basic techniques like singles' },
    ];

  const livesOptions = [1, 2, 3, 4, 5];
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const { currentMessage, messageOpacity } = useLoadingMessages(
    selectedDifficulty,
    isStartingGame || isLoading
  );

  const handleStartGame = async (difficulty: Difficulty) => {
    if (isStartingGame || isLoading) return;

    setSelectedDifficulty(difficulty);
    setIsStartingGame(true);

    try {
      await startGame(difficulty, selectedLives);
      router.push('/game');
    } finally {
      setIsStartingGame(false);
      setSelectedDifficulty(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.backgroundGradientFrom, colors.backgroundGradientTo]}
        style={styles.gradient}
      >
        <WebReturnBanner />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
            <ScreenHeader
              label="TODAY'S CHALLENGE"
              title="Select Difficulty"
              subtitle="CHOOSE YOUR PREFERRED LEVEL"
            />

            {/* Difficulty Cards */}
            <View style={[styles.difficultiesContainer, { marginBottom: spacing.xl2 }]}>
              {difficulties.map((difficulty, index) => (
                <TouchableOpacity
                  key={difficulty.value}
                  style={[
                    styles.difficultyCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      shadowColor: colors.cardShadow,
                      marginBottom: spacing.lg,
                    }
                  ]}
                  onPress={() => handleStartGame(difficulty.value)}
                  disabled={isStartingGame}
                  activeOpacity={0.7}
                >
                  <View style={styles.difficultyCardContent}>
                    <View style={styles.difficultyCardLeft}>
                      <Text
                        style={[
                          styles.difficultyNumber,
                          {
                            fontFamily: typography.fontSerif,
                            fontSize: 60,
                            color: colors.borderThin,
                            marginRight: spacing.xl,
                          }
                        ]}
                      >
                        {index + 1}
                      </Text>
                      <View style={styles.difficultyInfo}>
                        <Text
                          style={[
                            styles.difficultyLabel,
                            {
                              fontFamily: typography.fontSerif,
                              fontSize: 36,
                              lineHeight: 40,
                              color: colors.textPrimary,
                              marginBottom: spacing.xs,
                              textTransform: 'capitalize',
                            }
                          ]}
                        >
                          {difficulty.label.toLowerCase()}
                        </Text>
                        <Text
                          style={[
                            styles.editionLabel,
                            {
                              fontFamily: typography.fontBody,
                              fontSize: typography.textXs,
                              letterSpacing: typography.textXs * typography.trackingNormal,
                              color: colors.textLabel,
                              marginBottom: spacing.md,
                            }
                          ]}
                        >
                          {difficulty.edition}
                        </Text>
                        <Text
                          style={[
                            styles.difficultyDescription,
                            {
                              fontFamily: typography.fontBody,
                              fontSize: typography.textLg,
                              lineHeight: typography.textLg * typography.leadingRelaxed,
                              color: colors.textSecondary,
                            }
                          ]}
                        >
                          {difficulty.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lives Selector */}
            <View style={styles.livesSection}>
              <Text
                style={[
                  styles.livesLabel,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                    marginBottom: spacing.md,
                  }
                ]}
              >
                LIVES
              </Text>
              <View style={styles.livesContainer}>
                {livesOptions.map((lives) => (
                  <TouchableOpacity
                    key={lives}
                    style={[
                      styles.livesButton,
                      {
                        backgroundColor: selectedLives === lives ? colors.primary : colors.buttonBackground,
                        borderColor: colors.cardBorder,
                      }
                    ]}
                    onPress={() => setSelectedLives(lives)}
                  >
                    <Text
                      style={[
                        styles.livesButtonText,
                        {
                          fontFamily: typography.fontSerif,
                          fontSize: typography.textLg,
                          color: selectedLives === lives
                            ? (colors.primary === '#000000' ? '#FFFFFF' : colors.cardBackground)
                            : colors.textPrimary,
                        }
                      ]}
                    >
                      {lives}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Loading Overlay */}
      {(isStartingGame || isLoading) && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
            <View style={[styles.loadingCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Animated.Text
                style={[
                  styles.loadingText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textBase,
                    color: colors.textSecondary,
                    marginTop: spacing.md,
                    opacity: messageOpacity,
                  }
                ]}
              >
                {currentMessage}
              </Animated.Text>
            </View>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  difficultiesContainer: {
    width: '100%',
  },
  difficultyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  difficultyCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  difficultyCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  difficultyNumber: {
    fontWeight: '400',
    lineHeight: 60,
  },
  difficultyInfo: {
    flex: 1,
  },
  difficultyLabel: {
    fontWeight: '500',
  },
  editionLabel: {
    textTransform: 'uppercase',
  },
  difficultyDescription: {
    fontWeight: '400',
  },
  livesSection: {
    width: '100%',
    alignItems: 'center',
  },
  livesLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  livesButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  livesButtonText: {
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
  },
  loadingText: {
    textAlign: 'center',
    fontWeight: '400',
  },
});



