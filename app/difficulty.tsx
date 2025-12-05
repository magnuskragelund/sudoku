import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { Difficulty } from '../types/game';

export default function DifficultyScreen() {
  const router = useRouter();
  const { startGame } = useGame();
  const { colors, typography, spacing } = useTheme();
  const [selectedLives, setSelectedLives] = useState(5);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const { width } = useWindowDimensions();
  
  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;

  const difficulties: { 
    label: string; 
    value: Difficulty; 
    edition: string;
    description: string;
  }[] = [
    { label: 'Easy', value: 'easy', edition: 'MORNING EDITION', description: 'Suitable for newcomers and casual solvers' },
    { label: 'Medium', value: 'medium', edition: 'AFTERNOON EDITION', description: 'A balanced challenge for regular players' },
    { label: 'Hard', value: 'hard', edition: 'EVENING EDITION', description: 'For seasoned puzzle enthusiasts' },
    { label: 'Master', value: 'master', edition: 'WEEKEND EDITION', description: 'The ultimate test of skill and patience' },
  ];

  const livesOptions = [1, 2, 3, 4, 5];

  const handleStartGame = async (difficulty: Difficulty) => {
    if (isStartingGame) return;
    
    setIsStartingGame(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    startGame(difficulty, selectedLives);
    
    setTimeout(() => {
      router.push('/game');
      setIsStartingGame(false);
    }, 100);
  };

  const Divider = () => (
    <View style={styles.dividerContainer}>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.backgroundGradientFrom, colors.backgroundGradientTo]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
            {/* Back Button */}
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backButton, { marginBottom: spacing.xl2 }]}
            >
              <ChevronLeft size={16} color={colors.textPrimary} strokeWidth={1.5} />
              <Text 
                style={[
                  styles.backButtonText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textSm,
                    letterSpacing: typography.textSm * typography.trackingNormal,
                    color: colors.textPrimary,
                    marginLeft: spacing.xs,
                  }
                ]}
              >
                RETURN TO MENU
              </Text>
            </TouchableOpacity>

            {/* Masthead */}
            <View style={[styles.masthead, { marginBottom: spacing.xl3 }]}>
              <Text 
                style={[
                  styles.challengeLabel,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                    marginBottom: spacing.sm,
                  }
                ]}
              >
                TODAY'S CHALLENGE
              </Text>
              
              <Text 
                style={[
                  styles.mainTitle,
                  {
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text5xl * 1.5, // 57px (slightly larger for this screen)
                    letterSpacing: (typography.text5xl * 1.5) * typography.trackingTight,
                    lineHeight: (typography.text5xl * 1.5) * typography.leadingTight,
                    color: colors.textPrimary,
                    marginBottom: spacing.md,
                  }
                ]}
              >
                Select Difficulty
              </Text>
              
              <Divider />
              
              <Text 
                style={[
                  styles.subtitle,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textSm,
                    letterSpacing: typography.textSm * typography.trackingNormal,
                    color: colors.textSubtitle,
                    marginTop: spacing.md,
                  }
                ]}
              >
                CHOOSE YOUR PREFERRED LEVEL
              </Text>
            </View>

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
    </SafeAreaView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    textTransform: 'uppercase',
  },
  masthead: {
    alignItems: 'center',
  },
  challengeLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  mainTitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  dividerContainer: {
    width: 96,
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
  },
  subtitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
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
});

