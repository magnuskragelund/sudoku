import { useRouter } from 'expo-router';
import { CheckCircle, ChevronLeft, Database, Trophy, XCircle, XSquare } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Difficulty, GameResult } from '../types/game';
import { clearHighScores, formatDate, formatTime, getHighScores, saveGameResult } from '../utils/highScoreStorage';

const __DEV__ = true; // Use dev environment check if available

export default function HighScoresScreen() {
  const router = useRouter();
  const [scores, setScores] = useState<GameResult[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    const data = await getHighScores();
    setScores(data.results);
  };

  const clearScores = () => {
    Alert.alert(
      'Clear All Scores',
      'Are you sure you want to delete all high score data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearHighScores();
            setScores([]);
          },
        },
      ]
    );
  };

  const generateDummyData = async () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'master'];
    const livesOptions = [1, 2, 3, 4, 5];
    const now = Date.now();
    
      for (const difficulty of difficulties) {
        for (const lives of livesOptions) {
          // Generate 5-10 random games for each combo (only won games)
          const numGames = Math.floor(Math.random() * 6) + 5;
          
          for (let i = 0; i < numGames; i++) {
            // Only generate won games for high scores
            const baseTime = 60 + Math.random() * 1200; // 1-21 minutes
            
            const gameResult: GameResult = {
              id: `dummy-${difficulty}-${lives}-${i}-${Date.now()}`,
              difficulty,
              lives,
              completionTime: Math.floor(baseTime),
              timestamp: now - (Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
              won: true, // Only generate won games
            };
            
            await saveGameResult(gameResult);
          }
        }
      }
    
    await loadScores();
  };

  const addDummyData = () => {
    Alert.alert(
      'Add Dummy Data',
      'This will populate the high scores with sample data for testing purposes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: generateDummyData,
        },
      ]
    );
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1E2939" />
        </TouchableOpacity>
        <Text style={styles.title}>High Scores</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Difficulty Tabs */}
      <View style={styles.tabs}>
        {difficulties.map((difficulty) => (
          <TouchableOpacity
            key={difficulty.value}
            style={[
              styles.tab,
              selectedDifficulty === difficulty.value && styles.tabSelected,
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
            <Trophy size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No high scores yet</Text>
            <Text style={styles.emptySubtext}>Start playing to see your progress!</Text>
          </View>
        ) : (
          sortedGroupedScores.map(({ key, difficulty, lives, results }) => {
            const bestTime = getBestTime(results);
            const isExpanded = expandedCombo === key;

            return (
              <View key={key} style={styles.scoreGroup}>
                <TouchableOpacity
                  style={styles.scoreGroupHeader}
                  onPress={() => setExpandedCombo(isExpanded ? null : key)}
                >
                  <View style={styles.scoreGroupTitle}>
                    <Text style={styles.scoreGroupDifficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                    <Text style={styles.scoreGroupLives}>{lives} lives</Text>
                  </View>
                  <View style={styles.scoreGroupStats}>
                    {bestTime !== null && (
                      <View style={styles.bestTimeContainer}>
                        <Trophy size={14} color="#2B7FFF" fill="#2B7FFF" />
                        <Text style={styles.bestTime}>{formatTime(bestTime)}</Text>
                      </View>
                    )}
                    <Text style={styles.gamesCount}>{results.length} games</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.historyContainer}>
                    {results.map((result, index) => (
                      <View key={result.id} style={styles.historyItem}>
                        <View style={styles.historyLeft}>
                          {result.won ? (
                            <CheckCircle size={16} color="#22C55E" fill="#22C55E" />
                          ) : (
                            <XCircle size={16} color="#EF4444" fill="#EF4444" />
                          )}
                          <Text style={styles.historyDate}>{formatDate(result.timestamp)}</Text>
                        </View>
                        <Text
                          style={[
                            styles.historyTime,
                            result.won && styles.historyTimeWon,
                            !result.won && styles.historyTimeLost,
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
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={clearScores}>
            <XSquare size={16} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear All Scores</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dev Mode: Add Dummy Data Button */}
      {__DEV__ && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.devButton} onPress={addDummyData}>
            <Database size={16} color="#2B7FFF" />
            <Text style={styles.devButtonText}>Add Dummy Data (Dev)</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#1E2939',
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
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 4,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: '#2B7FFF',
  },
  tabText: {
    fontSize: 14,
    color: '#4A5565',
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
    color: '#6B7280',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  scoreGroup: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#1E2939',
    fontFamily: 'Inter',
  },
  scoreGroupLives: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#2B7FFF',
    fontFamily: 'Inter',
  },
  gamesCount: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  historyContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  historyTimeWon: {
    color: '#22C55E',
  },
  historyTimeLost: {
    color: '#EF4444',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
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
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    gap: 8,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B7FFF',
    fontFamily: 'Inter',
  },
});

