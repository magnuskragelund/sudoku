import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Clock, Heart, Lightbulb, Pause, Play, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NumberPad from '../components/NumberPad';
import SudokuBoard from '../components/SudokuBoard';
import { useGame } from '../context/GameContext';
import { getBestTime } from '../utils/highScoreStorage';

export default function GameScreen() {
  const router = useRouter();
  const { 
    difficulty, 
    status, 
    lives,
    initialLives, 
    timeElapsed, 
    selectedCell,
    hintUsed,
    pauseGame,
    resumeGame,
    newGame,
    startPlaying,
    useHint,
    exportGame
  } = useGame();

  const [bestTime, setBestTime] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      loadBestTime();
    }
  }, [status, difficulty, lives]);

  const loadBestTime = async () => {
    const best = await getBestTime(difficulty, lives);
    setBestTime(best);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine heart color based on lives
  const heartColor = useMemo(() => {
    if (lives === 1) return '#FB2C36'; // Red
    if (lives === 2 || lives === 3) return '#FF8C00'; // Orange
    return '#4A5565'; // Grey
  }, [lives]);

  const handleNewGame = () => {
    if (status === 'playing') {
      pauseGame();
    } else {
      newGame();
      router.push('/');
    }
  };

  const handlePauseResume = () => {
    if (status === 'playing') {
      pauseGame();
    } else if (status === 'paused') {
      resumeGame();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNewGame} style={styles.newGameButton}>
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>
        
        <View style={styles.timerContainer}>
          <Clock size={14} color="#4A5565" />
          <Text style={styles.timerTextHeader}>{formatTime(timeElapsed)}</Text>
        </View>
        
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyText}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.mistakesContainer}>
          <Heart size={16} color={heartColor} fill={heartColor} />
          <Text style={[styles.mistakesText, { color: heartColor }]}>{lives}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePauseResume}>
            {status === 'playing' ? (
              <Pause size={16} color="#4A5565" />
            ) : (
              <Play size={16} color="#4A5565" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={useHint}
            disabled={hintUsed || !selectedCell || status !== 'playing'}
          >
            <Lightbulb 
              size={16} 
              color={hintUsed ? '#9CA3AF' : selectedCell && status === 'playing' ? '#2B7FFF' : '#4A5565'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <SudokuBoard />
      </View>

      {/* Number Pad */}
      <View style={styles.numberPadContainer}>
        <NumberPad />
      </View>

      {/* Game Status Overlay with Blur */}
      {(status === 'ready' || status === 'won' || status === 'lost' || status === 'paused') && (
        <View style={styles.overlay}>
          <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
            <View style={styles.statusModal}>
            {status === 'ready' && (
              <>
                <Text style={styles.statusTitle}>Ready to Play?</Text>
                <Text style={styles.statusSubtitle}>
                  Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Text>
                <Text style={styles.statusSubtitle}>
                  Lives: {lives}
                </Text>
                <TouchableOpacity 
                  style={styles.shareButton} 
                  onPress={async () => {
                    const gameData = exportGame();
                    if (gameData) {
                      try {
                        await Share.share({
                          message: gameData,
                          title: 'Share Sudoku Puzzle',
                        });
                      } catch (error) {
                        console.error('Error sharing:', error);
                      }
                    }
                  }}
                >
                  <Share2 size={20} color="#6B7280" />
                  <Text style={styles.shareButtonText}>Share Puzzle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={startPlaying}>
                  <Text style={styles.statusButtonText}>Start Game</Text>
                </TouchableOpacity>
              </>
            )}
            
            {status === 'won' && (
              <>
                <Text style={styles.statusTitle}>Congratulations!</Text>
                <Text style={styles.statusSubtitle}>You solved the puzzle!</Text>
                <Text style={styles.completionTime}>
                  Time: {formatTime(timeElapsed)}
                </Text>
                {bestTime !== null && timeElapsed < bestTime && (
                  <Text style={styles.newRecord}>🎉 New Record!</Text>
                )}
                {bestTime !== null && (
                  <Text style={styles.bestTime}>
                    Best: {formatTime(bestTime)}
                  </Text>
                )}
                <TouchableOpacity style={styles.statusButton} onPress={handleNewGame}>
                  <Text style={styles.statusButtonText}>New Game</Text>
                </TouchableOpacity>
              </>
            )}
            
            {status === 'lost' && (
              <>
                <Text style={styles.statusTitle}>Game Over</Text>
                <Text style={styles.statusSubtitle}>You ran out of lives!</Text>
                <TouchableOpacity style={styles.statusButton} onPress={handleNewGame}>
                  <Text style={styles.statusButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
            
            {status === 'paused' && (
              <>
                <Text style={styles.statusTitle}>Paused</Text>
                <TouchableOpacity style={styles.statusButton} onPress={resumeGame}>
                  <Text style={styles.statusButtonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quitButton} onPress={handleNewGame}>
                  <Text style={styles.quitButtonText}>New Game</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          </BlurView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DC',
  },
  newGameButton: {
    paddingVertical: 8,
  },
  newGameText: {
    fontSize: 16,
    color: '#4A5565',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 16,
    color: '#1E2939',
    fontFamily: 'Inter',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerTextHeader: {
    fontSize: 14,
    color: '#4A5565',
    fontFamily: 'Inter',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DC',
  },
  mistakesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mistakesText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  numberPadContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  overlay: {
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
  statusModal: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 24,
    minWidth: 280,
    width: '90%',
    maxWidth: 400,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2939',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#4A5565',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  statusButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  quitButton: {
    backgroundColor: '#FB2C36',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  quitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  completionTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2939',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  newRecord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  bestTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
});
