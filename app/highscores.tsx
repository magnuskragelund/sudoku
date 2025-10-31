import { useRouter } from 'expo-router';
import { CheckCircle, ChevronLeft, Trophy, XCircle, XSquare } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { Difficulty, GameResult } from '../types/game';
import { clearHighScores, formatDate, formatTime, getHighScores } from '../utils/highScoreStorage';

export default function HighScoresScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [scores, setScores] = useState<GameResult[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

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

  // Group scores by difficulty and lives
  const groupedScores = scores.reduce((acc, score) => {
    const key = `${score.difficulty}-${score.lives}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(score);
    return acc;
  }, {} as Record<string, GameResult[]>);

  // Filter by selected difficulty and sort by difficulty and lives
  const sortedGroupedScores = Object.entries(groupedScores)
    .filter(([key]) => {
      if (selectedDifficulty === null) return true; // Show all when no filter
      return key.startsWith(selectedDifficulty);
    })
    .map(([key, results]) => {
      const [difficulty, lives] = key.split('-');
      return {
        key,
        difficulty: difficulty as Difficulty,
        lives: parseInt(lives),
        results: results.sort((a, b) => a.timestamp - b.timestamp).reverse(), // Most recent first
      };
    })
    .sort((a, b) => {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3, master: 4 };
      const aOrder = difficultyOrder[a.difficulty];
      const bOrder = difficultyOrder[b.difficulty];
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.lives - a.lives; // More lives first
    });

  // Get best time for a combo
  const getBestTime = (results: GameResult[]): number | null => {
    const wonResults = results.filter(r => r.won);
    if (wonResults.length === 0) return null;
    return Math.min(...wonResults.map(r => r.completionTime));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>High Scores</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Difficulty Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {difficulties.map((difficulty) => (
          <TouchableOpacity
            key={difficulty.value}
            style={[
              styles.tab,
              { backgroundColor: colors.buttonBackground },
              selectedDifficulty === difficulty.value && [styles.tabSelected, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              // Toggle: if already selected, deselect (show all), otherwise select
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
                { color: colors.textSecondary },
                selectedDifficulty === difficulty.value && styles.tabTextSelected,
              ]}
            >
              {difficulty.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scores List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {sortedGroupedScores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No high scores yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Start playing to see your progress!</Text>
          </View>
        ) : (
          sortedGroupedScores.map(({ key, difficulty, lives, results }) => {
            const bestTime = getBestTime(results);
            const isExpanded = expandedCombo === key;

            return (
              <View key={key} style={[styles.scoreGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.scoreGroupHeader}
                  onPress={() => setExpandedCombo(isExpanded ? null : key)}
                >
                  <View style={styles.scoreGroupTitle}>
                    <Text style={[styles.scoreGroupDifficulty, { color: colors.textPrimary }]}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                    <Text style={[styles.scoreGroupLives, { color: colors.textTertiary }]}>{lives} lives</Text>
                  </View>
                  <View style={styles.scoreGroupStats}>
                    {bestTime !== null && (
                      <View style={styles.bestTimeContainer}>
                        <Trophy size={14} color={colors.primary} fill={colors.primary} />
                        <Text style={[styles.bestTime, { color: colors.primary }]}>{formatTime(bestTime)}</Text>
                      </View>
                    )}
                    <Text style={[styles.gamesCount, { color: colors.textTertiary }]}>{results.length} games</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.historyContainer, { borderTopColor: colors.border }]}>
                    {results.map((result, index) => (
                      <View key={result.id} style={[styles.historyItem, { borderBottomColor: colors.backgroundSecondary }]}>
                        <View style={styles.historyLeft}>
                          {result.won ? (
                            <CheckCircle size={16} color={colors.success} fill={colors.success} />
                          ) : (
                            <XCircle size={16} color={colors.error} fill={colors.error} />
                          )}
                          <Text style={[styles.historyDate, { color: colors.textTertiary }]}>{formatDate(result.timestamp)}</Text>
                        </View>
                        <Text
                          style={[
                            styles.historyTime,
                            result.won && { color: colors.success },
                            !result.won && { color: colors.error },
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
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.backgroundElevated }]}>
          <TouchableOpacity style={styles.clearButton} onPress={() => setShowClearModal(true)}>
            <XSquare size={16} color={colors.error} />
            <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear All Scores</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 4,
    alignItems: 'center',
  },
  tabSelected: {
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  tabTextSelected: {
    color: 'white',
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  scoreGroup: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  scoreGroupLives: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  scoreGroupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestTime: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  gamesCount: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  historyContainer: {
    borderTopWidth: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

