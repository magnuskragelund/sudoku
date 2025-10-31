import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Clock, Heart, Lightbulb, Moon, Pause, Play, Sun } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NumberPad from '../components/NumberPad';
import SudokuBoard from '../components/SudokuBoard';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { getBestTime } from '../utils/highScoreStorage';
import { multiplayerService } from '../utils/multiplayerService';

export default function GameScreen() {
  const router = useRouter();
  const { theme, setTheme, colors, colorScheme } = useTheme();
  const { 
    difficulty, 
    status, 
    lives,
    initialLives, 
    timeElapsed, 
    selectedCell,
    hintUsed,
    multiplayer,
    multiplayerWinner,
    pauseGame,
    resumeGame,
    newGame,
    startPlaying,
    useHint,
    exportGame,
    dismissWinnerModal,
    leaveMultiplayerGame,
    startNewRound
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

  const handleNewGame = async () => {
    if (status === 'playing') {
      pauseGame();
    } else {
      // If in a multiplayer session, disconnect before returning home
      if (multiplayer) {
        try { await leaveMultiplayerGame?.(); } catch {}
      }
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

  const isHost = !!multiplayer && multiplayer.hostId === multiplayerService.getPlayerId();

  const toggleTheme = () => {
    if (theme === 'system') {
      // From system, switch to opposite of current scheme
      setTheme(colorScheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Multiplayer Banner */}
      {multiplayer && (
        <View style={[styles.multiplayerBanner, { backgroundColor: colors.primary }]}>
          <View style={styles.multiplayerBannerContent}>
            <Text style={styles.multiplayerText}>Multiplayer Game: {multiplayer.channelName}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderThin }]}>
        {multiplayer && isHost ? (
          <TouchableOpacity onPress={startNewRound} style={styles.newGameButton}>
            <Text style={[styles.newGameText, { color: colors.textSecondary }]}>New Round</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNewGame} style={styles.newGameButton}>
            <Text style={[styles.newGameText, { color: colors.textSecondary }]}>New Game</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.timerContainer}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.timerTextHeader, { color: colors.textSecondary }]}>{formatTime(timeElapsed)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { backgroundColor: colors.buttonBackground }]}>
            {colorScheme === 'dark' ? (
              <Moon size={16} color={colors.textSecondary} />
            ) : (
              <Sun size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { borderBottomColor: colors.borderThin }]}>
        <View style={styles.mistakesContainer}>
          <Heart size={16} color={heartColor} fill={heartColor} />
          <Text style={[styles.mistakesText, { color: heartColor }]}>{lives}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBackground }]} onPress={handlePauseResume}>
            {status === 'playing' ? (
              <Pause size={16} color={colors.textSecondary} />
            ) : (
              <Play size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.buttonBackground }]} 
            onPress={useHint}
            disabled={hintUsed || !selectedCell || status !== 'playing'}
          >
            <Lightbulb 
              size={16} 
              color={hintUsed ? colors.textTertiary : selectedCell && status === 'playing' ? colors.primary : colors.textSecondary} 
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

      {/* Multiplayer Winner Modal */}
      {multiplayerWinner && (
        <View style={styles.overlay}>
          <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
            <View style={[styles.statusModal, { backgroundColor: colors.modalBackground }]}>
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>🎉 Someone Won!</Text>
              <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>A connected player has completed the puzzle</Text>
              <View style={[styles.winnerInfoSection, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.winnerName, { color: colors.primary }]}>{multiplayerWinner.playerName}</Text>
                <Text style={[styles.winnerTime, { color: colors.textPrimary }]}>Time: {formatTime(multiplayerWinner.completionTime)}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: colors.primary, marginBottom: 12 }]} 
                onPress={() => {
                  dismissWinnerModal?.();
                  resumeGame();
                }}
              >
                <Text style={styles.statusButtonText}>Continue Playing</Text>
              </TouchableOpacity>
              {multiplayer && isHost && (
                <TouchableOpacity 
                  style={[styles.statusButton, { backgroundColor: colors.primary, marginBottom: 12 }]}
                  onPress={async () => {
                    try {
                      await startNewRound?.();
                    } catch {}
                  }}
                >
                  <Text style={styles.statusButtonText}>Start New Round</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.quitButton, { backgroundColor: colors.error }]} onPress={handleNewGame}>
                <Text style={styles.quitButtonText}>End Game</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}

      {/* Game Status Overlay with Blur */}
      {(status === 'won' || status === 'lost' || (status === 'paused' && !multiplayerWinner)) && (
        <View style={styles.overlay}>
          <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
            <View style={[styles.statusModal, { backgroundColor: colors.modalBackground }]}>
            {status === 'won' && (
              <>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Congratulations!</Text>
                <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>You solved the puzzle!</Text>
                <Text style={[styles.completionTime, { color: colors.textPrimary }]}>
                  Time: {formatTime(timeElapsed)}
                </Text>
                {bestTime !== null && timeElapsed < bestTime && (
                  <Text style={[styles.newRecord, { color: colors.success }]}>🎉 New Record!</Text>
                )}
                {bestTime !== null && (
                  <Text style={[styles.bestTime, { color: colors.textTertiary }]}>
                    Best: {formatTime(bestTime)}
                  </Text>
                )}
                {multiplayer && isHost && (
                  <TouchableOpacity 
                    style={[styles.statusButton, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                      try {
                        await startNewRound?.();
                      } catch {}
                    }}
                  >
                    <Text style={styles.statusButtonText}>Start New Round</Text>
                  </TouchableOpacity>
                )}
                {multiplayer && !isHost ? (
                  <TouchableOpacity style={[styles.quitButton, { backgroundColor: colors.error }]} onPress={handleNewGame}>
                    <Text style={styles.quitButtonText}>End Game</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.statusButton, { backgroundColor: colors.primary }]} onPress={handleNewGame}>
                    <Text style={styles.statusButtonText}>New Game</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {status === 'lost' && (
              <>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Game Over</Text>
                <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>You ran out of lives!</Text>
                <TouchableOpacity style={[styles.statusButton, { backgroundColor: colors.primary }]} onPress={handleNewGame}>
                  <Text style={styles.statusButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
            
            {status === 'paused' && (
              <>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Paused</Text>
                <TouchableOpacity style={[styles.statusButton, { backgroundColor: colors.primary }]} onPress={resumeGame}>
                  <Text style={styles.statusButtonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quitButton, { backgroundColor: colors.error }]} onPress={handleNewGame}>
                  <Text style={styles.quitButtonText}>End Current Game</Text>
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
  },
  multiplayerBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  multiplayerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  multiplayerIcon: {
    fontSize: 16,
  },
  multiplayerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  newGameButton: {
    paddingVertical: 8,
  },
  newGameText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerTextHeader: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    paddingHorizontal: 0,
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
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  statusSubtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  gameInfoSection: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  quitButton: {
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
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  newRecord: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  bestTime: {
    fontSize: 14,
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  winnerInfoSection: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  winnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  winnerTime: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
