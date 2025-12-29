import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle, Clock, Heart, Lightbulb, Moon, Pause, PenSquare, Play, Sun, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Markdown from 'react-native-markdown-display';
import NumberPad from '../components/NumberPad';
import SudokuBoard from '../components/SudokuBoard';
import WebReturnBanner from '../components/WebReturnBanner';
import { useGame, useGameTime } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLoadingMessages } from '../hooks/useLoadingMessages';
import { getBestTime } from '../utils/highScoreStorage';
import { multiplayerService } from '../utils/multiplayerService';
import { elaborateHint } from '../utils/openaiService';

export default function GameScreen() {
  const router = useRouter();
  const { theme, setTheme, colors, typography, spacing, colorScheme } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768; // Tablet and desktop breakpoint
  const isExtraWideScreen = windowWidth >= 1200; // Extra wide desktop breakpoint
  const { 
    difficulty, 
    status, 
    lives,
    initialLives, 
    selectedCell,
    hintUsed,
    placeUsed,
    currentHint,
    board,
    initialBoard,
    isLoading,
    multiplayer,
    multiplayerWinner,
    multiplayerLoser,
    pauseGame,
    resumeGame,
    newGame,
    startPlaying,
    usePlace,
    useHint,
    clearHint,
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
  const [hintMode, setHintMode] = useState<boolean>(false);
  const [elaboratedHint, setElaboratedHint] = useState<string | null>(null);
  const [isElaborating, setIsElaborating] = useState<boolean>(false);
  const [elaborationError, setElaborationError] = useState<string | null>(null);
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [
    Math.round(windowHeight * 0.25), // 25% of screen height - minimized to see more board
    Math.round(windowHeight * 0.48), // 48% of screen height - initial state with button visible
    Math.round(windowHeight * 0.50), // 50% of screen height - expanded with elaboration
  ], [windowHeight]);
  
  const { currentMessage, messageOpacity } = useLoadingMessages(difficulty, isLoading);

  // Check if game state is broken (empty board after refresh) and redirect to home
  useEffect(() => {
    if (Platform.OS === 'web') {
      const isBoardEmpty = board.every(row => row.every(cell => cell === 0));
      const isInitialBoardEmpty = initialBoard.every(row => row.every(cell => cell === 0));
      
      // If both board and initialBoard are empty, we're in a broken state (page refresh)
      // Redirect to home unless we're actively loading a game or in multiplayer
      if (isBoardEmpty && isInitialBoardEmpty && !isLoading && !multiplayer) {
        router.replace('/');
      }
    }
  }, [board, initialBoard, status, isLoading, multiplayer, router]);

  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      loadBestTime();
    }
  }, [status, difficulty, lives]);

  // Ensure sheet opens at correct size when entering hint mode
  useEffect(() => {
    if (hintMode && bottomSheetRef.current) {
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1); // Start at index 1 (48%)
      }, 100);
    }
  }, [hintMode]);

  // Expand sheet when elaboration is fetched
  useEffect(() => {
    if (elaboratedHint && hintMode && bottomSheetRef.current) {
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1);
      }, 100);
    }
  }, [elaboratedHint, hintMode]);

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
    if (multiplayer) {
      try { await leaveMultiplayerGame?.(); } catch {}
    }
    newGame();
    router.push('/');
  };

  const handleExitToMenu = async () => {
    if (multiplayer) {
      try { await leaveMultiplayerGame?.(); } catch {}
    }
    router.push('/');
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

  const handleUseHint = () => {
    useHint();
    setHintMode(true);
    setElaboratedHint(null);
    setElaborationError(null);
  };

  const handleExitHintMode = () => {
    setHintMode(false);
    clearHint();
    setElaboratedHint(null);
    setElaborationError(null);
  };

  const handleElaborateHint = async () => {
    if (!currentHint || !board) return;
    
    setIsElaborating(true);
    setElaborationError(null);
    
    try {
      const elaboration = await elaborateHint({
        board,
        hint: currentHint,
      });
      setElaboratedHint(elaboration);
      // Expand sheet to 50% when elaboration is ready
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1);
      }, 100);
    } catch (error: any) {
      setElaborationError(error.message || 'Failed to elaborate hint. Please try again.');
    } finally {
      setIsElaborating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.backgroundGradientFrom, colors.backgroundGradientTo]}
        style={styles.gradient}
      >
        <WebReturnBanner />

        {/* Multiplayer Banner - Full Width */}
        {!hintMode && multiplayer && (
          <View style={[styles.multiplayerBanner, { backgroundColor: colors.primary }]}>
            <View style={styles.multiplayerBannerContent}>
              <Text style={[styles.multiplayerText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                {isHost ? "YOU'RE HOSTING:" : "YOU'VE JOINED:"} {multiplayer.channelName}
              </Text>
            </View>
          </View>
        )}

        {/* Header - Full Width */}
        {!hintMode && (
          <View style={[styles.header, { borderBottomColor: colors.borderThin, borderBottomWidth: 1, backgroundColor: colors.background }]}>
            <View style={[styles.headerContent, isLargeScreen && styles.headerContentLarge]}>
              {multiplayer && isHost ? (
                <TouchableOpacity onPress={startNewRound} style={styles.headerButton}>
                  <Text style={[styles.headerButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingMedium, color: colors.textSecondary }]}>
                    NEW ROUND
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
                  activeOpacity={0.6}
                  accessibilityLabel={
                    theme === 'dark' 
                      ? 'Switch to light mode' 
                      : theme === 'light' 
                      ? 'Switch to dark mode' 
                      : colorScheme === 'dark'
                      ? 'Switch to light mode'
                      : 'Switch to dark mode'
                  }
                  accessibilityRole="button"
                  accessibilityHint="Changes the app's color theme"
                >
                  {/* Show icon for what you'll switch TO, not current state */}
                  {(theme === 'dark' || (theme === 'system' && colorScheme === 'dark')) ? (
                    <Sun size={20} color={colors.textSecondary} strokeWidth={2} />
                  ) : (
                    <Moon size={20} color={colors.textSecondary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Stats Bar - Full Width */}
        {!hintMode && (
          <View style={[styles.statsBar, { borderBottomColor: colors.borderThin, borderBottomWidth: 1, backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.statsBarContent, isLargeScreen && styles.statsBarContentLarge]}>
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
                {/* Pause/Play Button */}
                <TouchableOpacity 
                  style={[styles.iconButton, { backgroundColor: colors.buttonBackground, marginRight: spacing.sm }]} 
                  onPress={handlePauseResume}
                  activeOpacity={0.6}
                >
                  {status === 'playing' ? (
                    <Pause size={14} color={colors.textSecondary} strokeWidth={1.5} />
                  ) : (
                    <Play size={14} color={colors.textSecondary} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
                
                {/* Note Mode Button */}
                <TouchableOpacity 
                  style={[
                    styles.iconButton, 
                    { 
                      backgroundColor: status !== 'playing'
                        ? colors.buttonBackgroundDisabled
                        : noteMode
                          ? colors.primary
                          : colors.buttonBackground,
                    marginRight: spacing.sm
                  }
                  ]} 
                  onPress={() => setNoteMode(!noteMode)}
                  disabled={status !== 'playing'}
                  activeOpacity={0.6}
                >
                  <PenSquare 
                    size={14} 
                    color={
                      status !== 'playing'
                        ? colors.textTertiary
                        : noteMode
                          ? (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                          : colors.textSecondary
                    } 
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
                
                {/* Place Button */}
                <TouchableOpacity 
                  style={[
                    styles.iconButton, 
                    { 
                      backgroundColor: (placeUsed || !selectedCell || status !== 'playing')
                        ? colors.buttonBackgroundDisabled
                        : colors.buttonBackground,
                    marginRight: spacing.sm,
                  }
                  ]} 
                  onPress={usePlace}
                  disabled={placeUsed || !selectedCell || status !== 'playing'}
                  activeOpacity={0.6}
                >
                  <CheckCircle 
                    size={14} 
                    color={
                      (placeUsed || !selectedCell || status !== 'playing')
                        ? colors.textTertiary
                        : colors.textSecondary
                    } 
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
                
                {/* Hint Button */}
                <TouchableOpacity 
                  style={[
                    styles.iconButton, 
                    { 
                      backgroundColor: (!selectedCell || status !== 'playing')
                        ? colors.buttonBackgroundDisabled
                        : colors.buttonBackground,
                  }
                  ]} 
                  onPress={handleUseHint}
                  disabled={!selectedCell || status !== 'playing'}
                  activeOpacity={0.6}
                >
                  <Lightbulb 
                    size={14} 
                    color={
                      (!selectedCell || status !== 'playing')
                        ? colors.textTertiary
                        : colors.textSecondary
                    } 
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.contentWrapper, isLargeScreen && styles.contentWrapperLarge]}>
          {/* Hint Mode - Show only board and hint */}
          {hintMode && (
            <>
              {isLargeScreen ? (
                /* Large Screen Layout: Side-by-side board and hint panel */
                <View style={[styles.hintModeContainerLarge, { backgroundColor: colors.background }]}>
                  {/* Exit Hint Mode Button */}
                  <View style={styles.hintModeExitButtonContainerLarge}>
                    <TouchableOpacity 
                      onPress={handleExitHintMode}
                      style={[styles.hintModeExitButton, { backgroundColor: colors.buttonBackground }]}
                      activeOpacity={0.6}
                    >
                      <X size={18} color={colors.textSecondary} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Board Section */}
                  <View style={styles.hintModeBoardSectionLarge}>
                    <View style={[styles.hintModeBoardContainerLarge, { width: 700, height: 700 }]}>
                      <SudokuBoard hintMode={true} currentHint={currentHint} disabled={true} />
                    </View>
                  </View>

                  {/* Hint Panel Section */}
                  <View style={styles.hintModePanelSectionLarge}>
                    {isElaborating ? (
                      <View style={[styles.hintModePanelLarge, styles.hintModePanelLoadingLarge, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.hintModeLoadingText, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginTop: spacing.md }]}>
                          Generating tips for the selected cell
                        </Text>
                      </View>
                    ) : (
                      <ScrollView 
                        style={[styles.hintModePanelLarge, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}
                        contentContainerStyle={styles.hintModePanelContentLarge}
                        showsVerticalScrollIndicator={false}
                      >
                        {currentHint ? (
                          <>
                            <View style={styles.hintPanelHeader}>
                              <View style={styles.hintPanelTitleRow}>
                                <Lightbulb size={18} color={colors.textSecondary} strokeWidth={1.5} />
                                <Text style={[styles.hintPanelTitle, { fontFamily: typography.fontSerif, fontSize: typography.textLg, color: colors.textPrimary, marginLeft: spacing.xs }]}>
                                  {currentHint.technique.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.hintPanelContent}>
                              <Text style={[styles.hintPanelExplanation, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                                {currentHint.explanation}
                              </Text>
                              <Text style={[styles.hintPanelGuidance, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textPrimary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                                {currentHint.guidance}
                              </Text>
                              {currentHint.cell && currentHint.value && (
                                <Text style={[styles.hintPanelCellInfo, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: elaboratedHint ? spacing.lg : spacing.md }]}>
                                  Placed {currentHint.value} at row {currentHint.cell.row + 1}, column {currentHint.cell.col + 1}
                                </Text>
                              )}
                              {elaboratedHint && (
                                <View style={[styles.elaboratedHintContainer, { borderTopColor: colors.borderThin, borderTopWidth: 1, paddingTop: spacing.lg, marginTop: spacing.lg }]}>
                                  <Text style={[styles.elaboratedHintLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, color: colors.textLabel, marginBottom: spacing.sm, letterSpacing: typography.textXs * typography.trackingWide }]}>
                                    ELABORATION
                                  </Text>
                                  <Markdown
                                    style={{
                                      body: {
                                        fontFamily: typography.fontBody,
                                        fontSize: typography.textBase,
                                        color: colors.textPrimary,
                                        lineHeight: typography.textBase * typography.leadingRelaxed,
                                      },
                                      paragraph: {
                                        marginBottom: spacing.md,
                                      },
                                      list_item: {
                                        marginBottom: spacing.sm,
                                      },
                                      strong: {
                                        fontWeight: '600',
                                        color: colors.textPrimary,
                                      },
                                      em: {
                                        fontStyle: 'italic',
                                      },
                                      heading1: {
                                        fontSize: typography.textLg,
                                        fontWeight: '600',
                                        marginBottom: spacing.md,
                                        marginTop: spacing.lg,
                                      },
                                      heading2: {
                                        fontSize: typography.textBase,
                                        fontWeight: '600',
                                        marginBottom: spacing.sm,
                                        marginTop: spacing.md,
                                      },
                                      code_inline: {
                                        fontFamily: typography.fontBody,
                                        backgroundColor: colors.backgroundSecondary,
                                        paddingHorizontal: 4,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                      },
                                    }}
                                  >
                                    {elaboratedHint}
                                  </Markdown>
                                </View>
                              )}
                              {elaborationError && (
                                <View style={[styles.elaborationErrorContainer, { marginTop: spacing.sm }]}>
                                  <Text style={[styles.elaborationErrorText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.error }]}>
                                    {elaborationError}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {/* Action Button */}
                            <View style={[styles.hintModeActionsLarge, { borderTopColor: colors.borderThin }]}>
                              {!elaboratedHint && (
                                <TouchableOpacity 
                                  onPress={handleElaborateHint}
                                  style={[
                                    styles.hintModeActionButton, 
                                    { 
                                      backgroundColor: colors.primary 
                                    }
                                  ]}
                                >
                                  <Text style={[
                                    styles.hintModeActionButtonText, 
                                    { 
                                      fontFamily: typography.fontBody, 
                                      fontSize: typography.textSm, 
                                      letterSpacing: typography.textSm * typography.trackingNormal, 
                                      color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF'
                                    }
                                  ]}>
                                    ELABORATE
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </>
                        ) : (
                          <View style={styles.hintPanelContent}>
                            <Text style={[styles.hintPanelExplanation, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                              Select a cell and tap "GET HINT" to see a hint
                            </Text>
                            <TouchableOpacity 
                              onPress={handleUseHint}
                              style={[
                                styles.hintModeActionButton, 
                                { 
                                  backgroundColor: (!selectedCell || status !== 'playing') 
                                    ? colors.buttonBackgroundDisabled
                                    : colors.primary,
                                  marginTop: spacing.md,
                                }
                              ]}
                              disabled={!selectedCell || status !== 'playing'}
                            >
                              <Text style={[
                                styles.hintModeActionButtonText, 
                                { 
                                  fontFamily: typography.fontBody, 
                                  fontSize: typography.textSm, 
                                  letterSpacing: typography.textSm * typography.trackingNormal, 
                                  color: (!selectedCell || status !== 'playing')
                                    ? colors.textTertiary
                                    : (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                                }
                              ]}>
                                GET HINT
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </ScrollView>
                    )}
                  </View>
                </View>
              ) : (
                /* Small Screen Layout: Bottom sheet overlay (original behavior) */
                <View style={[styles.hintModeContainer, { backgroundColor: colors.background }]}>
                  {/* Dark Overlay Background */}
                  <View 
                    style={[
                      styles.hintModeOverlay, 
                      { 
                        backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                      }
                    ]} 
                  />
                  
                  {/* Exit Hint Mode Button - Compact Icon */}
                  <View style={styles.hintModeExitButtonContainer}>
                    <TouchableOpacity 
                      onPress={handleExitHintMode}
                      style={[styles.hintModeExitButton, { backgroundColor: colors.buttonBackground }]}
                      activeOpacity={0.6}
                    >
                      <X size={18} color={colors.textSecondary} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Board - Scaled and Fixed at Top */}
                  <View style={[styles.hintModeBoardContainer, isLargeScreen && styles.hintModeBoardContainerLarge]}>
                    <View style={[styles.hintModeBoardScaled, isLargeScreen && styles.hintModeBoardScaledLarge]}>
                      <SudokuBoard hintMode={true} currentHint={currentHint} disabled={true} />
                    </View>
                  </View>

                  {/* Elaboration Loading Overlay */}
                  {isElaborating && (
                    <View style={styles.hintModeLoadingOverlay}>
                      <BlurView intensity={40} tint={colors.overlayTint} style={styles.hintModeLoadingBlur}>
                        <View style={[styles.hintModeLoadingCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={[styles.hintModeLoadingText, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginTop: spacing.md }]}>
                            Generating tips for the selected cell
                          </Text>
                        </View>
                      </BlurView>
                    </View>
                  )}

                  {/* Bottom Sheet - Draggable */}
                  <BottomSheet
                    ref={bottomSheetRef}
                    index={1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={false}
                    backgroundStyle={{ backgroundColor: colors.modalBackground }}
                    handleIndicatorStyle={{ backgroundColor: colors.borderThin }}
                    animateOnMount={true}
                    enableDynamicSizing={false}
                  >
                    <View style={styles.bottomSheetContent}>
                      <BottomSheetScrollView 
                        contentContainerStyle={[
                          styles.hintPanelScrollContent,
                          !elaboratedHint && styles.hintPanelScrollContentCompact
                        ]}
                        showsVerticalScrollIndicator={false}
                      >
                        {currentHint ? (
                          <>
                            <View style={styles.hintPanelHeader}>
                              <View style={styles.hintPanelTitleRow}>
                                <Lightbulb size={18} color={colors.textSecondary} strokeWidth={1.5} />
                                <Text style={[styles.hintPanelTitle, { fontFamily: typography.fontSerif, fontSize: typography.textLg, color: colors.textPrimary, marginLeft: spacing.xs }]}>
                                  {currentHint.technique.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.hintPanelContent}>
                              <Text style={[styles.hintPanelExplanation, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                                {currentHint.explanation}
                              </Text>
                              <Text style={[styles.hintPanelGuidance, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textPrimary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                                {currentHint.guidance}
                              </Text>
                              {currentHint.cell && currentHint.value && (
                                <Text style={[styles.hintPanelCellInfo, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: elaboratedHint ? spacing.lg : spacing.md }]}>
                                  Placed {currentHint.value} at row {currentHint.cell.row + 1}, column {currentHint.cell.col + 1}
                                </Text>
                              )}
                              {elaboratedHint && (
                                <View style={[styles.elaboratedHintContainer, { borderTopColor: colors.borderThin, borderTopWidth: 1, paddingTop: spacing.lg, marginTop: spacing.lg }]}>
                                  <Text style={[styles.elaboratedHintLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, color: colors.textLabel, marginBottom: spacing.sm, letterSpacing: typography.textXs * typography.trackingWide }]}>
                                    ELABORATION
                                  </Text>
                                  <Markdown
                                    style={{
                                      body: {
                                        fontFamily: typography.fontBody,
                                        fontSize: typography.textBase,
                                        color: colors.textPrimary,
                                        lineHeight: typography.textBase * typography.leadingRelaxed,
                                      },
                                      paragraph: {
                                        marginBottom: spacing.md,
                                      },
                                      list_item: {
                                        marginBottom: spacing.sm,
                                      },
                                      strong: {
                                        fontWeight: '600',
                                        color: colors.textPrimary,
                                      },
                                      em: {
                                        fontStyle: 'italic',
                                      },
                                      heading1: {
                                        fontSize: typography.textLg,
                                        fontWeight: '600',
                                        marginBottom: spacing.md,
                                        marginTop: spacing.lg,
                                      },
                                      heading2: {
                                        fontSize: typography.textBase,
                                        fontWeight: '600',
                                        marginBottom: spacing.sm,
                                        marginTop: spacing.md,
                                      },
                                      code_inline: {
                                        fontFamily: typography.fontBody,
                                        backgroundColor: colors.backgroundSecondary,
                                        paddingHorizontal: 4,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                      },
                                    }}
                                  >
                                    {elaboratedHint}
                                  </Markdown>
                                </View>
                              )}
                              {elaborationError && (
                                <View style={[styles.elaborationErrorContainer, { marginTop: spacing.sm }]}>
                                  <Text style={[styles.elaborationErrorText, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.error }]}>
                                    {elaborationError}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </>
                        ) : (
                          <View style={styles.hintPanelContent}>
                            <Text style={[styles.hintPanelExplanation, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                              Select a cell and tap "GET HINT" to see a hint
                            </Text>
                          </View>
                        )}
                      </BottomSheetScrollView>
                      {/* Fixed Actions Section - Always Visible */}
                      <View style={[styles.hintModeActions, { borderTopColor: colors.borderThin, backgroundColor: colors.modalBackground }]}>
                        {currentHint && !elaboratedHint && !isElaborating ? (
                          <TouchableOpacity 
                            onPress={handleElaborateHint}
                            style={[
                              styles.hintModeActionButton, 
                              { 
                                backgroundColor: colors.primary 
                              }
                            ]}
                          >
                            <Text style={[
                              styles.hintModeActionButtonText, 
                              { 
                                fontFamily: typography.fontBody, 
                                fontSize: typography.textSm, 
                                letterSpacing: typography.textSm * typography.trackingNormal, 
                                color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF'
                              }
                            ]}>
                              ELABORATE
                            </Text>
                          </TouchableOpacity>
                        ) : !currentHint ? (
                          <TouchableOpacity 
                            onPress={handleUseHint}
                            style={[
                              styles.hintModeActionButton, 
                              { 
                                backgroundColor: (!selectedCell || status !== 'playing') 
                                  ? colors.buttonBackgroundDisabled
                                  : colors.primary 
                              }
                            ]}
                            disabled={!selectedCell || status !== 'playing'}
                          >
                            <Text style={[
                              styles.hintModeActionButtonText, 
                              { 
                                fontFamily: typography.fontBody, 
                                fontSize: typography.textSm, 
                                letterSpacing: typography.textSm * typography.trackingNormal, 
                                color: (!selectedCell || status !== 'playing')
                                  ? colors.textTertiary
                                  : (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                              }
                            ]}>
                              GET HINT
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </BottomSheet>
                </View>
              )}
            </>
          )}
          {!hintMode && (
            <>

          {/* Game Board and Hint Panel Container */}
          {isLargeScreen ? (
            <View style={styles.gameLayoutLarge}>
              {/* Center: Board */}
              <View style={styles.boardSectionLarge}>
                <View style={styles.boardContainerLarge}>
                  <SudokuBoard hintMode={false} />
                </View>
              </View>
              
              {/* Right Side: Hint Panel */}
              {currentHint && (
                <View style={styles.controlsSectionLarge}>
                  <View style={[styles.hintPanelLarge, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.hintPanelHeader}>
                      <View style={styles.hintPanelTitleRow}>
                        <Lightbulb size={18} color={colors.textSecondary} strokeWidth={1.5} />
                        <Text style={[styles.hintPanelTitle, { fontFamily: typography.fontSerif, fontSize: typography.textLg, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 }]}>
                          {currentHint.technique.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={clearHint}
                        style={[styles.hintCloseButton, { backgroundColor: colors.buttonBackground }]}
                      >
                        <X size={14} color={colors.textSecondary} strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hintPanelExplanation, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                      {currentHint.explanation}
                    </Text>
                    <Text style={[styles.hintPanelGuidance, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textPrimary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                      {currentHint.guidance}
                    </Text>
                    {currentHint.cell && currentHint.value && (
                      <Text style={[styles.hintPanelCellInfo, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textSecondary, fontStyle: 'italic' }]}>
                        Placed {currentHint.value} at row {currentHint.cell.row + 1}, column {currentHint.cell.col + 1}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Game Board */}
              <View style={styles.boardContainer}>
                <SudokuBoard hintMode={false} />
              </View>

              {/* Hint Panel - Non-blocking */}
              {currentHint && (
                <View style={[styles.hintPanel, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder }]}>
                  <View style={styles.hintPanelHeader}>
                    <View style={styles.hintPanelTitleRow}>
                      <Lightbulb size={18} color={colors.textSecondary} strokeWidth={1.5} />
                      <Text style={[styles.hintPanelTitle, { fontFamily: typography.fontSerif, fontSize: typography.textLg, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 }]}>
                        {currentHint.technique.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={clearHint}
                      style={[styles.hintCloseButton, { backgroundColor: colors.buttonBackground }]}
                    >
                      <X size={14} color={colors.textSecondary} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.hintPanelExplanation, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                    {currentHint.explanation}
                  </Text>
                  <Text style={[styles.hintPanelGuidance, { fontFamily: typography.fontBody, fontSize: typography.textBase, color: colors.textPrimary, marginBottom: spacing.md, lineHeight: typography.textBase * typography.leadingRelaxed }]}>
                    {currentHint.guidance}
                  </Text>
                  {currentHint.cell && currentHint.value && (
                    <Text style={[styles.hintPanelCellInfo, { fontFamily: typography.fontBody, fontSize: typography.textSm, color: colors.textSecondary, fontStyle: 'italic' }]}>
                      Placed {currentHint.value} at row {currentHint.cell.row + 1}, column {currentHint.cell.col + 1}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}

          {/* Number Pad - Always at bottom for all screen sizes */}
          <View style={[styles.numberPadContainer, isLargeScreen && styles.numberPadContainerLarge]}>
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
                  <Animated.Text 
                    style={[
                      styles.modalSubtitle,
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
                      {!multiplayer && (
                        <TouchableOpacity 
                          style={[styles.modalButtonSecondary, { backgroundColor: colors.buttonBackground, marginBottom: spacing.sm }]} 
                          onPress={handleNewGame}
                        >
                          <Text style={[styles.modalButtonSecondaryText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.textSecondary }]}>
                            NEW GAME
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={[styles.modalButtonSecondary, { backgroundColor: colors.buttonBackground }]} 
                        onPress={handleExitToMenu}
                      >
                        <Text style={[styles.modalButtonSecondaryText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.textSecondary }]}>
                          {multiplayer ? 'LEAVE GAME' : 'EXIT TO MENU'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </BlurView>
            </View>
          )}
            </>
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
  contentWrapperLarge: {
    maxWidth: 1200,
    paddingHorizontal: 24,
  },
  gameLayoutLarge: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 16,
    minHeight: 0, // Allow flexbox to shrink
    justifyContent: 'center', // Center the layout on wide screens
    alignItems: 'center', // Center items vertically
  },
  boardSectionLarge: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0, // Allow flexbox to shrink
  },
  boardContainerLarge: {
    width: '100%',
    maxWidth: 700, // Larger board on wide screens
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Ensure board itself is centered
  },
  controlsSectionLarge: {
    width: 380, // Slightly wider for better readability
    minWidth: 360,
    justifyContent: 'center', // Center hint panel vertically
    paddingTop: 0, // Remove top padding since we're centering
    marginLeft: 32, // More spacing between board and hint panel
  },
  hintPanelLarge: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24, // More padding on large screens
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexShrink: 1, // Allow hint panel to shrink if needed
  },
  multiplayerBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
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
    width: '100%',
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  headerContentLarge: {
    maxWidth: 1200,
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
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    width: '100%',
    borderBottomWidth: 1,
  },
  statsBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  statsBarContentLarge: {
    maxWidth: 1200,
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
    minHeight: 0, // Allow flexbox to shrink
    width: '100%',
  },
  hintPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hintPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hintPanelTitle: {
    flex: 1,
    fontWeight: '600',
  },
  hintCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintPanelExplanation: {
    fontWeight: '400',
  },
  hintPanelGuidance: {
    fontWeight: '400',
  },
  hintPanelCellInfo: {
    fontWeight: '600',
    marginTop: 8,
  },
  hintModeContainer: {
    flex: 1,
    position: 'relative',
  },
  hintModeContainerLarge: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    paddingTop: 16,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-start', // Align items to start
    alignItems: 'center',
  },
  hintModeExitButtonContainerLarge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  hintModeBoardSectionLarge: {
    width: 750, // Fixed width - don't use flex
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  hintModeBoardContainerLarge: {
    width: 700,
    height: 700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintModePanelSectionLarge: {
    width: 400,
    minWidth: 400, // Fixed width, don't shrink
    flexShrink: 0, // Don't allow panel to shrink
    marginLeft: 32,
    justifyContent: 'center',
  },
  hintModePanelLarge: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    maxHeight: '90%',
  },
  hintModePanelLoadingLarge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintModePanelContentLarge: {
    paddingBottom: 16,
  },
  hintModeActionsLarge: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  hintModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hintModeExitButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  hintModeExitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hintModeBoardContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60, // Space for exit button
    paddingHorizontal: 8,
  },
  hintModeBoardContainerLarge: {
    justifyContent: 'center',
    paddingTop: 80,
  },
  hintModeBoardScaled: {
    transform: [{ scale: 0.75 }],
    width: '100%',
    maxWidth: 600,
  },
  hintModeBoardScaledLarge: {
    transform: [{ scale: 0.9 }], // Larger scale on big screens
    maxWidth: 700,
  },
  bottomSheetContent: {
    flex: 1,
  },
  hintPanelScrollContent: {
    padding: 24,
    paddingBottom: 16,
    paddingTop: 16,
  },
  hintPanelScrollContentCompact: {
    paddingBottom: 4,
  },
  hintModeActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  hintPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hintPanelContent: {
    flex: 1,
  },
  elaboratedHintContainer: {
    marginTop: 16,
  },
  elaboratedHintLabel: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  elaboratedHintText: {
    fontWeight: '400',
  },
  elaborationErrorContainer: {
    paddingTop: 8,
  },
  elaborationErrorText: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  hintModeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  hintModeLoadingBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintModeLoadingCard: {
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
  hintModeLoadingText: {
    textAlign: 'center',
    fontWeight: '400',
  },
  hintModeActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  hintModeActionButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  hintModeActionButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  numberPadContainer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    width: '100%',
    alignSelf: 'center',
  },
  numberPadContainerLarge: {
    maxWidth: 800, // Constrain number pad width on very wide screens
    alignSelf: 'center',
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
