import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle, ChevronLeft, Trophy, XCircle, XSquare } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { Difficulty, GameResult } from '../types/game';
import { clearHighScores, formatDate, formatTime, getHighScores } from '../utils/highScoreStorage';

export default function HighScoresScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const [scores, setScores] = useState<GameResult[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const { width } = useWindowDimensions();
  
  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    const data = await getHighScores();
    setScores(data.results);
  };

  const clearScores = async () => {
    await clearHighScores();
    setScores([]);
    setShowClearModal(false);
  };

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
    { label: 'Master', value: 'master' },
  ];

  const groupedScores = scores.reduce((acc, score) => {
    const key = `${score.difficulty}-${score.lives}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(score);
    return acc;
  }, {} as Record<string, GameResult[]>);

  const sortedGroupedScores = Object.entries(groupedScores)
    .filter(([key]) => {
      if (selectedDifficulty === null) return true;
      return key.startsWith(selectedDifficulty);
    })
    .map(([key, results]) => {
      const [difficulty, lives] = key.split('-');
      return {
        key,
        difficulty: difficulty as Difficulty,
        lives: parseInt(lives),
        results: results.sort((a, b) => a.timestamp - b.timestamp).reverse(),
      };
    })
    .sort((a, b) => {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3, master: 4 };
      const aOrder = difficultyOrder[a.difficulty];
      const bOrder = difficultyOrder[b.difficulty];
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.lives - a.lives;
    });

  const getBestTime = (results: GameResult[]): number | null => {
    const wonResults = results.filter(r => r.won);
    if (wonResults.length === 0) return null;
    return Math.min(...wonResults.map(r => r.completionTime));
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
        <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
          {/* Masthead */}
          <View style={[styles.masthead, { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
            
            <View style={styles.mastheadCenter}>
              <Text 
                style={[
                  styles.mastheadLabel, 
                  { 
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                    marginBottom: spacing.xs,
                  }
                ]}
              >
                LEADERBOARD
              </Text>
              <Text 
                style={[
                  styles.mastheadTitle, 
                  { 
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text5xl,
                    letterSpacing: typography.text5xl * typography.trackingTight,
                    lineHeight: typography.text5xl * typography.leadingTight,
                    color: colors.textPrimary,
                  }
                ]}
              >
                Highscores
              </Text>
            </View>
            
            <View style={styles.backButtonPlaceholder} />
          </View>

          <Divider />

          {/* Difficulty Tabs */}
          <View style={[styles.tabs, { borderBottomColor: colors.borderThin, borderBottomWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
            {difficulties.map((difficulty) => (
              <TouchableOpacity
                key={difficulty.value}
                style={[
                  styles.tab,
                  { 
                    backgroundColor: selectedDifficulty === difficulty.value ? colors.primary : colors.buttonBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  if (selectedDifficulty === difficulty.value) {
                    setSelectedDifficulty(null);
                  } else {
                    setSelectedDifficulty(difficulty.value);
                  }
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { 
                      fontFamily: typography.fontBody,
                      fontSize: typography.textXs,
                      letterSpacing: typography.textXs * typography.trackingNormal,
                      color: selectedDifficulty === difficulty.value 
                        ? (colors.primary === '#000000' ? '#FFFFFF' : colors.cardBackground)
                        : colors.textSecondary,
                    }
                  ]}
                >
                  {difficulty.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scores List */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {sortedGroupedScores.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Trophy size={48} color={colors.borderThin} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { fontFamily: typography.fontSerif, fontSize: typography.textXl, color: colors.textTertiary, marginTop: spacing.lg }]}>
                  No high scores yet
                </Text>
                <Text style={[styles.emptySubtext, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textTertiary, marginTop: spacing.xs }]}>
                  Start playing to see your progress!
                </Text>
              </View>
            ) : (
              sortedGroupedScores.map(({ key, difficulty, lives, results }) => {
                const bestTime = getBestTime(results);
                const isExpanded = expandedCombo === key;

                return (
                  <View key={key} style={[styles.scoreGroup, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, shadowColor: colors.cardShadow }]}>
                    <TouchableOpacity
                      style={styles.scoreGroupHeader}
                      onPress={() => setExpandedCombo(isExpanded ? null : key)}
                    >
                      <View style={styles.scoreGroupTitle}>
                        <Text style={[styles.scoreGroupDifficulty, { fontFamily: typography.fontSerif, fontSize: typography.textLg, color: colors.textPrimary, marginBottom: spacing.xs }]}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </Text>
                        <Text style={[styles.scoreGroupLives, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textTertiary }]}>
                          {lives} {lives === 1 ? 'life' : 'lives'}
                        </Text>
                      </View>
                      <View style={styles.scoreGroupStats}>
                        {bestTime !== null && (
                          <View style={styles.bestTimeContainer}>
                            <Trophy size={14} color={colors.primary} fill={colors.primary} strokeWidth={1.5} />
                            <Text style={[styles.bestTime, { fontFamily: typography.fontSerif, fontSize: typography.textBase, color: colors.primary, marginLeft: spacing.xs }]}>
                              {formatTime(bestTime)}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.gamesCount, { fontFamily: typography.fontBody, fontSize: typography.textXs, color: colors.textTertiary }]}>
                          {results.length} {results.length === 1 ? 'game' : 'games'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={[styles.historyContainer, { borderTopColor: colors.borderThin, borderTopWidth: 1 }]}>
                        {results.map((result, index) => (
                          <View key={result.id} style={[styles.historyItem, index < results.length - 1 && { borderBottomColor: colors.borderThin, borderBottomWidth: 1 }]}>
                            <View style={styles.historyLeft}>
                              {result.won ? (
                                <CheckCircle size={14} color={colors.success} fill={colors.success} strokeWidth={1.5} />
                              ) : (
                                <XCircle size={14} color={colors.error} fill={colors.error} strokeWidth={1.5} />
                              )}
                              <Text style={[styles.historyDate, { fontFamily: typography.fontBody, fontSize: typography.textXs, color: colors.textTertiary, marginLeft: spacing.sm }]}>
                                {formatDate(result.timestamp)}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.historyTime,
                                { 
                                  fontFamily: typography.fontSerif,
                                  fontSize: typography.textSm,
                                  color: result.won ? colors.success : colors.error,
                                }
                              ]}
                            >
                              {formatTime(result.completionTime)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Clear Button */}
          {sortedGroupedScores.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.borderThin, borderTopWidth: 1, backgroundColor: colors.backgroundElevated, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl }]}>
              <TouchableOpacity style={styles.clearButton} onPress={() => setShowClearModal(true)}>
                <XSquare size={16} color={colors.error} strokeWidth={1.5} />
                <Text style={[styles.clearButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.error, marginLeft: spacing.sm }]}>
                  CLEAR ALL SCORES
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Clear Confirmation Modal */}
          <Modal
            visible={showClearModal}
            title="Clear All Scores"
            subtitle="Are you sure you want to delete all high score data? This action cannot be undone."
            primaryButton={{
              text: 'Clear',
              onPress: clearScores,
            }}
            secondaryButton={{
              text: 'Cancel',
              onPress: () => setShowClearModal(false),
            }}
            onClose={() => setShowClearModal(false)}
          />
        </View>
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
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 32,
  },
  mastheadCenter: {
    alignItems: 'center',
    flex: 1,
  },
  mastheadLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  mastheadTitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  dividerContainer: {
    width: 96,
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontWeight: '400',
  },
  emptySubtext: {
    fontWeight: '400',
  },
  scoreGroup: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  scoreGroupTitle: {
    flex: 1,
  },
  scoreGroupDifficulty: {
    fontWeight: '400',
  },
  scoreGroupLives: {
    fontWeight: '400',
  },
  scoreGroupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestTime: {
    fontWeight: '600',
  },
  gamesCount: {
    fontWeight: '400',
  },
  historyContainer: {
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontWeight: '400',
  },
  historyTime: {
    fontWeight: '600',
  },
  footer: {
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
