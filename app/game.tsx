import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, Heart, Lightbulb, Moon, Pause, PenSquare, Play, Sun } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NumberPad from '../components/NumberPad';
import SudokuBoard from '../components/SudokuBoard';
import { useGame, useGameTime } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { getBestTime } from '../utils/highScoreStorage';
import { multiplayerService } from '../utils/multiplayerService';

export default function GameScreen() {
  const router = useRouter();
  const { theme, setTheme, colors, typography, spacing, colorScheme } = useTheme();
  const { 
    difficulty, 
    status, 
    lives,
    initialLives, 
    selectedCell,
    hintUsed,
    isLoading,
    multiplayer,
    multiplayerWinner,
    multiplayerLoser,
    pauseGame,
    resumeGame,
    newGame,
    startPlaying,
    useHint,
    exportGame,
    dismissWinnerModal,
    dismissLoserModal,
    leaveMultiplayerGame,
    startNewRound,
    addNote,
    removeNote,
    notes
  } = useGame();

  const { timeElapsed } = useGameTime();

  const [bestTime, setBestTime] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState<boolean>(false);

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

  const heartColor = useMemo(() => {
    if (lives === 1) return '#FB2C36';
    if (lives === 2 || lives === 3) return '#FF8C00';
    return colors.textSecondary;
  }, [lives, colors]);

  const handleNewGame = async () => {
    if (status === 'playing') {
      pauseGame();
    } else {
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

  const toggleTheme = async () => {
    if (theme === 'system') {
      await setTheme(colorScheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'light') {
      await setTheme('dark');
    } else {
      await setTheme('light');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.backgroundGradientFrom, colors.backgroundGradientTo]}
        style={styles.gradient}
      >
        <View style={styles.contentWrapper}>
          {/* Multiplayer Banner */}
          {multiplayer && (
            <View style={[styles.multiplayerBanner, { backgroundColor: colors.primary }]}>
              <View style={styles.multiplayerBannerContent}>
                <Text style={[styles.multiplayerText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                  {isHost ? "YOU'RE HOSTING:" : "YOU'VE JOINED:"} {multiplayer.channelName}
                </Text>
              </View>
            </View>
          )}

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderThin, borderBottomWidth: 1 }]}>
            {multiplayer && isHost ? (
              <TouchableOpacity onPress={startNewRound} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingMedium, color: colors.textSecondary }]}>
                  NEW ROUND
                </Text>
              </TouchableOpacity>
            ) : !multiplayer ? (
              <TouchableOpacity onPress={handleNewGame} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingMedium, color: colors.textSecondary }]}>
                  {status === 'playing' ? 'PAUSE' : 'NEW GAME'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerButton} />
            )}
            
            <View style={styles.headerCenter}>
              <Text style={[styles.headerLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, letterSpacing: typography.textXs * typography.trackingWide, color: colors.textLabel, marginBottom: spacing.xs }]}>
                TODAY'S PUZZLE
              </Text>
              <Text style={[styles.headerTitle, { fontFamily: typography.fontSerif, fontSize: typography.text2xl, color: colors.textPrimary, textTransform: 'capitalize' }]}>
                {difficulty}
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={toggleTheme} 
                style={[styles.iconButton, { backgroundColor: colors.buttonBackground }]}
                activeOpacity={0.7}
              >
                {colorScheme === 'dark' ? (
                  <Moon size={16} color={colors.textSecondary} strokeWidth={1.5} />
                ) : (
                  <Sun size={16} color={colors.textSecondary} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsBar, { borderBottomColor: colors.borderThin, borderBottomWidth: 1, backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.statsLeft}>
              <View style={styles.statItem}>
                <Clock size={14} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={[styles.statText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textSecondary, marginLeft: spacing.xs }]}>
                  {formatTime(timeElapsed)}
                </Text>
              </View>
              <View style={[styles.statItem, { marginLeft: spacing.lg }]}>
                <Heart size={14} color={heartColor} fill={heartColor} strokeWidth={1.5} />
                <Text style={[styles.statText, { fontFamily: typography.fontSerif, fontSize: typography.textSm, color: heartColor, marginLeft: spacing.xs, fontWeight: '600' }]}>
                  {lives}
                </Text>
              </View>
            </View>
            
            <View style={styles.statsRight}>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: colors.buttonBackground, marginRight: spacing.sm }]} 
                onPress={handlePauseResume}
              >
                {status === 'playing' ? (
                  <Pause size={14} color={colors.textSecondary} strokeWidth={1.5} />
                ) : (
                  <Play size={14} color={colors.textSecondary} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.iconButton, 
                  { 
                    backgroundColor: noteMode && status === 'playing'
                      ? colors.primary
                      : colors.buttonBackground,
                    marginRight: spacing.sm
                  }
                ]} 
                onPress={() => setNoteMode(!noteMode)}
                disabled={status !== 'playing'}
              >
                <PenSquare 
                  size={14} 
                  color={
                    noteMode && status === 'playing'
                      ? (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                      : colors.textSecondary
                  } 
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.iconButton, 
                  { 
                    backgroundColor: hintUsed || !selectedCell || status !== 'playing' 
                      ? colors.buttonBackground 
                      : colors.primary,
                  }
                ]} 
                onPress={useHint}
                disabled={hintUsed || !selectedCell || status !== 'playing'}
              >
                <Lightbulb 
                  size={14} 
                  color={
                    hintUsed 
                      ? colors.textTertiary 
                      : selectedCell && status === 'playing' 
                        ? (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                        : colors.textSecondary
                  } 
                  strokeWidth={1.5}
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
            <NumberPad 
              noteMode={noteMode}
              addNote={addNote}
              removeNote={removeNote}
              notes={notes}
            />
          </View>

          {/* Multiplayer Winner Modal */}
          {multiplayerWinner && (
            <View style={styles.overlay}>
              <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
                <View style={[styles.modalCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.modalTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                    Someone Won! 🎉
                  </Text>
                  <Text style={[styles.modalSubtitle, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.lg }]}>
                    A connected player has completed the puzzle
                  </Text>
                  <View style={[styles.winnerInfo, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder, marginBottom: spacing.lg }]}>
                    <Text style={[styles.winnerName, { fontFamily: typography.fontSerif, fontSize: typography.textXl, color: colors.primary, marginBottom: spacing.xs }]}>
                      {multiplayerWinner.playerName}
                    </Text>
                    <Text style={[styles.winnerTime, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textPrimary }]}>
                      Time: {formatTime(multiplayerWinner.completionTime)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]} 
                    onPress={() => {
                      dismissWinnerModal?.();
                      resumeGame();
                    }}
                  >
                    <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                      CONTINUE PLAYING
                    </Text>
                  </TouchableOpacity>
                  {multiplayer && isHost && (
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]}
                      onPress={async () => {
                        try { await startNewRound?.(); } catch {}
                      }}
                    >
                      <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                        START NEW ROUND
                      </Text>
                    </TouchableOpacity>
                  )}
                  {multiplayer && !isHost && (
                    <Text style={[styles.hostHintText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textTertiary, marginBottom: spacing.sm }]}>
                      The host can start a new round for everyone
                    </Text>
                  )}
                  <TouchableOpacity 
                    style={[styles.modalButtonSecondary, { backgroundColor: colors.buttonBackground }]} 
                    onPress={handleNewGame}
                  >
                    <Text style={[styles.modalButtonSecondaryText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.textSecondary }]}>
                      LEAVE GAME
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          )}

          {/* Multiplayer Loser Modal */}
          {multiplayerLoser && (
            <View style={styles.overlay}>
              <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
                <View style={[styles.modalCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.modalTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                    Player Lost 😔
                  </Text>
                  <Text style={[styles.modalSubtitle, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.lg }]}>
                    A connected player has run out of lives
                  </Text>
                  <View style={[styles.winnerInfo, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder, marginBottom: spacing.lg }]}>
                    <Text style={[styles.winnerName, { fontFamily: typography.fontSerif, fontSize: typography.textXl, color: colors.error, marginBottom: spacing.xs }]}>
                      {multiplayerLoser.playerName}
                    </Text>
                    <Text style={[styles.winnerTime, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textPrimary }]}>
                      Time: {formatTime(multiplayerLoser.timeElapsed)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]} 
                    onPress={() => {
                      dismissLoserModal?.();
                      resumeGame();
                    }}
                  >
                    <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                      CONTINUE PLAYING
                    </Text>
                  </TouchableOpacity>
                  {multiplayer && isHost && (
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]}
                      onPress={async () => {
                        try { await startNewRound?.(); } catch {}
                      }}
                    >
                      <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                        START NEW ROUND
                      </Text>
                    </TouchableOpacity>
                  )}
                  {multiplayer && !isHost && (
                    <Text style={[styles.hostHintText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textTertiary, marginBottom: spacing.sm }]}>
                      The host can start a new round for everyone
                    </Text>
                  )}
                  <TouchableOpacity 
                    style={[styles.modalButtonSecondary, { backgroundColor: colors.buttonBackground }]} 
                    onPress={handleNewGame}
                  >
                    <Text style={[styles.modalButtonSecondaryText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.textSecondary }]}>
                      LEAVE GAME
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.overlay}>
              <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
                <View style={[styles.modalCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text 
                    style={[
                      styles.modalSubtitle,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textBase,
                        color: colors.textSecondary,
                        marginTop: spacing.md,
                      }
                    ]}
                  >
                    Generating puzzle...
                  </Text>
                </View>
              </BlurView>
            </View>
          )}

          {/* Game Status Overlay */}
          {(status === 'won' || status === 'lost' || (status === 'paused' && !multiplayerWinner && !multiplayerLoser)) && (
            <View style={styles.overlay}>
              <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
                <View style={[styles.modalCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                  {status === 'won' && (
                    <>
                      <Text style={[styles.modalTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                        Congratulations!
                      </Text>
                      <Text style={[styles.modalSubtitle, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.md }]}>
                        You solved the puzzle
                      </Text>
                      <Text style={[styles.timeDisplay, { fontFamily: typography.fontSerif, fontSize: typography.textXl, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                        Time: {formatTime(timeElapsed)}
                      </Text>
                      {bestTime !== null && timeElapsed < bestTime && (
                        <Text style={[styles.newRecord, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.success, marginBottom: spacing.sm }]}>
                          🎉 New Record!
                        </Text>
                      )}
                      {bestTime !== null && (
                        <Text style={[styles.bestTime, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textTertiary, marginBottom: spacing.lg }]}>
                          Best: {formatTime(bestTime)}
                        </Text>
                      )}
                      {multiplayer && isHost && (
                        <TouchableOpacity 
                          style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]}
                          onPress={async () => {
                            try { await startNewRound?.(); } catch {}
                          }}
                        >
                          <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                            START NEW ROUND
                          </Text>
                        </TouchableOpacity>
                      )}
                      {multiplayer && !isHost && (
                        <Text style={[styles.hostHintText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textTertiary, marginBottom: spacing.sm }]}>
                          Wait here for the host to start a new round
                        </Text>
                      )}
                      <TouchableOpacity 
                        style={[multiplayer ? styles.modalButtonSecondary : styles.modalButton, { backgroundColor: multiplayer ? colors.buttonBackground : colors.primary }]} 
                        onPress={handleNewGame}
                      >
                        <Text style={[
                          multiplayer ? styles.modalButtonSecondaryText : styles.modalButtonText, 
                          { 
                            fontFamily: typography.fontBody, 
                            fontSize: typography.textSm, 
                            letterSpacing: typography.textSm * typography.trackingNormal, 
                            color: multiplayer ? colors.textSecondary : (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                          }
                        ]}>
                          {multiplayer ? 'LEAVE GAME' : 'NEW GAME'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {status === 'lost' && (
                    <>
                      <Text style={[styles.modalTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                        Game Over
                      </Text>
                      <Text style={[styles.modalSubtitle, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.lg }]}>
                        You ran out of lives!
                      </Text>
                      {multiplayer && isHost && (
                        <TouchableOpacity 
                          style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]}
                          onPress={async () => {
                            try { await startNewRound?.(); } catch {}
                          }}
                        >
                          <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                            START NEW ROUND
                          </Text>
                        </TouchableOpacity>
                      )}
                      {multiplayer && !isHost && (
                        <Text style={[styles.hostHintText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textTertiary, marginBottom: spacing.sm }]}>
                          Wait here for the host to start a new round
                        </Text>
                      )}
                      <TouchableOpacity 
                        style={[multiplayer ? styles.modalButtonSecondary : styles.modalButton, { backgroundColor: multiplayer ? colors.buttonBackground : colors.primary }]} 
                        onPress={async () => {
                          if (multiplayer) {
                            await leaveMultiplayerGame?.();
                          }
                          newGame();
                          router.push('/');
                        }}
                      >
                        <Text style={[
                          multiplayer ? styles.modalButtonSecondaryText : styles.modalButtonText, 
                          { 
                            fontFamily: typography.fontBody, 
                            fontSize: typography.textSm, 
                            letterSpacing: typography.textSm * typography.trackingNormal, 
                            color: multiplayer ? colors.textSecondary : (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                          }
                        ]}>
                          {multiplayer ? 'LEAVE GAME' : 'TRY AGAIN'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {status === 'paused' && (
                    <>
                      <Text style={[styles.modalTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, color: colors.textPrimary, marginBottom: spacing.lg }]}>
                        Paused
                      </Text>
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: colors.primary, marginBottom: spacing.sm }]} 
                        onPress={resumeGame}
                      >
                        <Text style={[styles.modalButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                          {multiplayer ? 'RESUME FOR ALL' : 'RESUME'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButtonSecondary, { backgroundColor: colors.buttonBackground }]} 
                        onPress={handleNewGame}
                      >
                        <Text style={[styles.modalButtonSecondaryText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.textSecondary }]}>
                          {multiplayer ? 'LEAVE GAME' : 'END GAME'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </BlurView>
            </View>
          )}
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  multiplayerBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  multiplayerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplayerText: {
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerButton: {
    paddingVertical: 8,
    minWidth: 80,
  },
  headerButtonText: {
    textTransform: 'uppercase',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontWeight: '400',
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontWeight: '400',
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  numberPadContainer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
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
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    marginHorizontal: 24,
    minWidth: 280,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  modalSubtitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  timeDisplay: {
    textAlign: 'center',
    fontWeight: '600',
  },
  newRecord: {
    textAlign: 'center',
    fontWeight: '600',
  },
  bestTime: {
    textAlign: 'center',
    fontWeight: '400',
  },
  winnerInfo: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  winnerName: {
    textAlign: 'center',
    fontWeight: '600',
  },
  winnerTime: {
    textAlign: 'center',
    fontWeight: '400',
  },
  hostHintText: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  modalButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalButtonSecondary: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
