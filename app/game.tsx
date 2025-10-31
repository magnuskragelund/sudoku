import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Clock, Heart, Lightbulb, Pause, Play } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NumberPad from '../components/NumberPad';
import SudokuBoard from '../components/SudokuBoard';
import { useGame } from '../context/GameContext';
import { getBestTime } from '../utils/highScoreStorage';
import { multiplayerService } from '../utils/multiplayerService';

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Multiplayer Banner */}
      {multiplayer && (
        <View style={styles.multiplayerBanner}>
          <View style={styles.multiplayerBannerContent}>
            <Text style={styles.multiplayerText}>Multiplayer Game: {multiplayer.channelName}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        {multiplayer && isHost ? (
          <TouchableOpacity onPress={startNewRound} style={styles.newGameButton}>
            <Text style={styles.newGameText}>New Round</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNewGame} style={styles.newGameButton}>
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>
        )}
        
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

      {/* Multiplayer Winner Modal */}
      {multiplayerWinner && (
        <View style={styles.overlay}>
          <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
            <View style={styles.statusModal}>
              <Text style={styles.statusTitle}>🎉 Someone Won!</Text>
              <Text style={styles.statusSubtitle}>A connected player has completed the puzzle</Text>
              <View style={styles.winnerInfoSection}>
                <Text style={styles.winnerName}>{multiplayerWinner.playerName}</Text>
                <Text style={styles.winnerTime}>Time: {formatTime(multiplayerWinner.completionTime)}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.statusButton, { marginBottom: 12 }]} 
                onPress={() => {
                  dismissWinnerModal?.();
                  resumeGame();
                }}
              >
                <Text style={styles.statusButtonText}>Continue Playing</Text>
              </TouchableOpacity>
              {multiplayer && isHost && (
                <TouchableOpacity 
                  style={[styles.statusButton, { marginBottom: 12 }]}
                  onPress={async () => {
                    try {
                      await startNewRound?.();
                    } catch {}
                  }}
                >
                  <Text style={styles.statusButtonText}>Start New Round</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.quitButton} onPress={handleNewGame}>
                <Text style={styles.quitButtonText}>End Game</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}

      {/* Game Status Overlay with Blur */}
      {(status === 'ready' || status === 'won' || status === 'lost' || (status === 'paused' && !multiplayerWinner)) && (
        <View style={styles.overlay}>
          <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
            <View style={styles.statusModal}>
            {status === 'ready' && (
              <>
                <Text style={styles.statusTitle}>Ready to Play?</Text>
                <View style={styles.gameInfoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Difficulty</Text>
                    <Text style={styles.infoValue}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Lives</Text>
                    <Text style={styles.infoValue}>{lives}</Text>
                  </View>
                </View>
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
                {multiplayer && isHost && (
                  <TouchableOpacity 
                    style={styles.statusButton}
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
                  <TouchableOpacity style={styles.quitButton} onPress={handleNewGame}>
                    <Text style={styles.quitButtonText}>End Game</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.statusButton} onPress={handleNewGame}>
                    <Text style={styles.statusButtonText}>New Game</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: '#F9FAFB',
  },
  multiplayerBanner: {
    backgroundColor: '#2B7FFF',
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
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#4A5565',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  gameInfoSection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
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
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  infoValue: {
    fontSize: 16,
    color: '#1E2939',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusButton: {
    backgroundColor: '#2B7FFF',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    color: '#6B7280',
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
  winnerInfoSection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  winnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B7FFF',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  winnerTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2939',
    fontFamily: 'Inter',
  },
});
