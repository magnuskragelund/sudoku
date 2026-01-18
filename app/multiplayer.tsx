import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Modal from '../components/Modal';
import ScreenHeader from '../components/ScreenHeader';
import WebReturnBanner from '../components/WebReturnBanner';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { Difficulty } from '../types/game';
import { generateSimpleRoomShareMessage } from '../utils/shareUtils';

export default function MultiplayerScreen() {
  const router = useRouter();
  const { colors, typography, spacing, colorScheme } = useTheme();
  const { createMultiplayerGame, joinMultiplayerGame } = useGame();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;

  // Get deep link params and mode
  const params = useLocalSearchParams();
  const joinGameParam = params.joinGame as string | undefined;
  const modeParam = params.mode as 'create' | 'join' | undefined;

  const [activeTab, setActiveTab] = useState<'create' | 'join'>(modeParam || 'create');

  // Create form state
  const [channelName, setChannelName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [lives, setLives] = useState(5);

  // Join form state
  const [joinChannelName, setJoinChannelName] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');

  // Modal state
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);

  const difficulties: { label: string; edition: string; value: Difficulty }[] = [
    { label: 'Easy', edition: 'MORNING', value: 'easy' },
    { label: 'Medium', edition: 'AFTERNOON', value: 'medium' },
    { label: 'Hard', edition: 'EVENING', value: 'hard' },
    { label: 'Master', edition: 'WEEKEND', value: 'master' },
  ];

  const livesOptions = [1, 2, 3, 4, 5];

  // Persist user preference for difficulty on the create tab
  const DIFFICULTY_PREF_KEY = '@sudoku_mp_pref_difficulty';
  const PLAYER_NAME_KEY = '@sudoku_mp_pref_player_name';

  const prefStorage = Platform.OS === 'web'
    ? {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      },
    }
    : AsyncStorage;

  useEffect(() => {
    const loadDifficultyPref = async () => {
      try {
        const saved = await prefStorage.getItem(DIFFICULTY_PREF_KEY);
        if (saved === 'easy' || saved === 'medium' || saved === 'hard' || saved === 'master') {
          setDifficulty(saved as Difficulty);
        }
      } catch (e) {
        // Failed to load preference - silently continue with default
      }
    };
    const loadPlayerNames = async () => {
      try {
        const saved = await prefStorage.getItem(PLAYER_NAME_KEY);
        if (saved) {
          setPlayerName(saved);
          setJoinPlayerName(saved);
        }
      } catch (e) {
        // Failed to load player name - silently continue with empty
      }
    };
    loadDifficultyPref();
    loadPlayerNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set active tab based on mode parameter
  useEffect(() => {
    if (modeParam) {
      setActiveTab(modeParam);
    }
  }, [modeParam]);

  // Handle deep link - auto-join if player name exists, otherwise pre-fill
  useEffect(() => {
    if (joinGameParam) {
      setActiveTab('join');
      setJoinChannelName(joinGameParam);

      // Auto-join if we have a saved player name
      const autoJoin = async () => {
        try {
          const saved = await prefStorage.getItem(PLAYER_NAME_KEY);
          if (saved) {
            // Wait a moment for state to settle
            setTimeout(async () => {
              try {
                await joinMultiplayerGame?.(joinGameParam, saved);
                await new Promise(resolve => setTimeout(resolve, 300));
                router.replace('/lobby');
              } catch (error: any) {
                const errorMessage = error?.message || '';

                if (errorMessage.includes('Game is full')) {
                  setErrorModal({ title: 'Game Full', message: 'This game has reached the maximum number of players (10). Please try another game.' });
                } else if (errorMessage.includes('not found') || errorMessage.includes('already started')) {
                  setErrorModal({ title: 'Game Not Available', message: 'Game not found or has already started. Please check the game name.' });
                } else {
                  setErrorModal({ title: 'Error', message: 'Failed to join game. Please try again.' });
                }
              }
            }, 500);
          }
        } catch (e) {
          // Failed to load player name - show join form
        }
      };

      autoJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinGameParam]);

  const handleSelectDifficulty = async (value: Difficulty) => {
    setDifficulty(value);
    try {
      await prefStorage.setItem(DIFFICULTY_PREF_KEY, value);
    } catch (e) {
      // Failed to save preference - silently continue
    }
  };

  // Auto-suggest a short hyphenated game name like "grid-clue"
  const WORDS: string[] = [
    'grid', 'cell', 'row', 'col', 'box', 'clue', 'hint', 'note', 'mark', 'digit',
    'value', 'nine', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'solve', 'logic', 'rule', 'valid', 'check', 'cross', 'wing', 'fish', 'xwing',
    'sword', 'naked', 'hidden', 'pair', 'triple', 'quad', 'block', 'line', 'puzzle', 'game',
    'play', 'win', 'easy', 'hard', 'expert', 'master', 'skill', 'brain', 'think', 'smart'
  ];

  function generateGameName(): string {
    const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
    let a = pick();
    let b = pick();
    // Avoid duplicates like "apple-apple"
    let tries = 0;
    while (b === a && tries < 5) {
      b = pick();
      tries++;
    }
    return `${a}-${b}`.toLowerCase();
  }

  // Prefill suggested name when opening the create tab or on first render
  useEffect(() => {
    if (activeTab === 'create' && !channelName.trim()) {
      setChannelName(generateGameName());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setErrorModal({ title: 'Validation Error', message: 'Please enter your name' });
      return;
    }

    // Auto-generate game name if not set
    const gameName = channelName.trim() || generateGameName();

    try {
      await createMultiplayerGame?.(gameName, playerName.trim(), difficulty, lives);

      // Wait a bit for state to be set
      await new Promise(resolve => setTimeout(resolve, 300));

      router.push('/lobby');
    } catch (error) {
      setErrorModal({ title: 'Error', message: 'Failed to create game. Please try again.' });
    }
  };

  const handleJoinGame = async () => {
    if (!joinChannelName.trim() || !joinPlayerName.trim()) {
      setErrorModal({ title: 'Validation Error', message: 'Please enter both game name and your name' });
      return;
    }

    try {
      await joinMultiplayerGame?.(joinChannelName.trim(), joinPlayerName.trim());

      // Wait a bit for state to be set
      await new Promise(resolve => setTimeout(resolve, 300));

      router.push('/lobby');
    } catch (error: any) {
      const errorMessage = error?.message || '';

      if (errorMessage.includes('Game is full')) {
        setErrorModal({ title: 'Game Full', message: 'This game has reached the maximum number of players (10). Please try another game.' });
      } else if (errorMessage.includes('not found') || errorMessage.includes('already started')) {
        setErrorModal({ title: 'Game Not Available', message: 'Game not found or has already started. Please check the game name.' });
      } else {
        setErrorModal({ title: 'Error', message: 'Failed to join game. Please try again.' });
      }
    }
  };

  const handleShareRoomId = async () => {
    if (!channelName.trim()) return;

    const shareMessage = generateSimpleRoomShareMessage(channelName);

    try {
      if (Platform.OS === 'web') {
        // On web, copy to clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          alert('Room invitation copied to clipboard!');
        }
      } else {
        // On mobile, use native share
        await Share.share({
          message: shareMessage,
          title: 'Join Sudoku Face Off Game',
        });
      }
    } catch (error) {
      console.error('Error sharing room ID:', error);
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
            {activeTab === 'create' ? (
              <>
                {/* Custom Header */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { marginBottom: spacing.lg }]}
                >
                  <ChevronLeft size={16} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.backButtonText,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textSm,
                        letterSpacing: typography.textSm * typography.trackingNormal,
                        color: colors.textSecondary,
                        marginLeft: spacing.xs,
                      }
                    ]}
                  >
                    RETURN
                  </Text>
                </TouchableOpacity>

                <View style={[styles.masthead, { marginBottom: spacing.xl }]}>
                  <Text
                    style={[
                      styles.subtitleLabel,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textSm,
                        letterSpacing: typography.textSm * typography.trackingNormal,
                        color: colors.textLabel,
                        marginBottom: spacing.xs,
                      }
                    ]}
                  >
                    Host a Challenge
                  </Text>

                  <Text
                    style={[
                      styles.mainTitle,
                      {
                        fontFamily: typography.fontSerif,
                        fontSize: width < 400 ? typography.text5xl * 0.8 : typography.text5xl * 1.5,
                        letterSpacing: (width < 400 ? typography.text5xl * 0.8 : typography.text5xl * 1.5) * typography.trackingTight,
                        lineHeight: (width < 400 ? typography.text5xl * 0.8 : typography.text5xl * 1.5) * typography.leadingTight,
                        color: colors.textPrimary,
                        marginBottom: spacing.sm,
                      }
                    ]}
                  >
                    Create Game
                  </Text>

                  <View style={[styles.titleUnderline, { backgroundColor: colors.divider, marginBottom: spacing.sm }]} />

                  <Text
                    style={[
                      styles.subtitleText,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textSm,
                        letterSpacing: typography.textSm * typography.trackingNormal,
                        color: colors.textLabel,
                      }
                    ]}
                  >
                    Configure Your Match Settings
                  </Text>
                </View>

                {/* Form Card */}
                <View style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                    shadowColor: colors.cardShadow,
                    padding: width < 400 ? 20 : 32,
                  }
                ]}>
                  {/* HOST INFORMATION Section */}
                  <View style={[styles.section, { marginBottom: width < 400 ? 24 : 32 }]}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          fontFamily: typography.fontBody,
                          fontSize: typography.textXs,
                          letterSpacing: typography.textXs * typography.trackingWide,
                          color: colors.textLabel,
                          marginBottom: spacing.md,
                        }
                      ]}
                    >
                      HOST INFORMATION
                    </Text>

                    <Text style={[
                      styles.label,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textXs,
                        letterSpacing: typography.textXs * typography.trackingWide,
                        color: colors.textSecondary,
                        marginBottom: spacing.sm,
                      }
                    ]}>
                      YOUR NAME
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.borderThin,
                          color: colors.textPrimary,
                          fontFamily: typography.fontBody,
                          fontSize: typography.textBase,
                          marginBottom: spacing.lg,
                          paddingVertical: width < 400 ? 10 : 12,
                        }
                      ]}
                      value={playerName}
                      onChangeText={async (val) => {
                        setPlayerName(val);
                        setJoinPlayerName(val);
                        try { await prefStorage.setItem(PLAYER_NAME_KEY, val); } catch (e) { /* Failed to save - silently continue */ }
                      }}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>

                  {/* GAME CONFIGURATION Section */}
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          fontFamily: typography.fontBody,
                          fontSize: typography.textXs,
                          letterSpacing: typography.textXs * typography.trackingWide,
                          color: colors.textLabel,
                          marginBottom: spacing.md,
                        }
                      ]}
                    >
                      GAME CONFIGURATION
                    </Text>

                    <Text style={[
                      styles.label,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textXs,
                        letterSpacing: typography.textXs * typography.trackingWide,
                        color: colors.textSecondary,
                        marginBottom: spacing.sm,
                      }
                    ]}>
                      DIFFICULTY LEVEL
                    </Text>
                    <View style={[
                      styles.difficultyContainer,
                      width < 400 && styles.difficultyContainerMobile
                    ]}>
                      {difficulties.map((diff) => (
                        <TouchableOpacity
                          key={diff.value}
                          style={[
                            styles.difficultyButton,
                            width < 400 && styles.difficultyButtonMobile,
                            {
                              backgroundColor: difficulty === diff.value
                                ? colors.primary
                                : colors.cardBackground,
                              borderColor: difficulty === diff.value
                                ? colors.primary
                                : colors.borderThin,
                            },
                          ]}
                          onPress={() => handleSelectDifficulty(diff.value)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.difficultyButtonMainText,
                              {
                                fontFamily: typography.fontSerif,
                                fontSize: typography.textBase,
                                color: difficulty === diff.value
                                  ? '#FFFFFF'
                                  : colors.textPrimary,
                                marginBottom: 2,
                              }
                            ]}
                          >
                            {diff.label}
                          </Text>
                          {width >= 400 && (
                            <Text
                              style={[
                                styles.difficultyButtonEditionText,
                                {
                                  fontFamily: typography.fontBody,
                                  fontSize: typography.textXs,
                                  letterSpacing: typography.textXs * typography.trackingWide,
                                  color: difficulty === diff.value
                                    ? '#FFFFFF'
                                    : colors.textLabel,
                                }
                              ]}
                            >
                              {diff.edition}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[
                      styles.label,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textXs,
                        letterSpacing: typography.textXs * typography.trackingWide,
                        color: colors.textSecondary,
                        marginTop: spacing.lg,
                        marginBottom: spacing.sm,
                      }
                    ]}>
                      NUMBER OF LIVES
                    </Text>
                    <View style={styles.livesContainer}>
                      {livesOptions.map((life) => (
                        <TouchableOpacity
                          key={life}
                          style={[
                            styles.lifeButton,
                            {
                              backgroundColor: lives === life
                                ? colors.primary
                                : colors.cardBackground,
                              borderColor: lives === life
                                ? colors.primary
                                : colors.borderThin,
                              paddingVertical: width < 400 ? 10 : 14,
                            }
                          ]}
                          onPress={() => setLives(life)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.lifeButtonText,
                              {
                                fontFamily: typography.fontBody,
                                fontSize: typography.textBase,
                                fontWeight: '600',
                                color: lives === life
                                  ? '#FFFFFF'
                                  : colors.textPrimary,
                              }
                            ]}
                          >
                            {life}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text
                      style={[
                        styles.hintText,
                        {
                          fontFamily: typography.fontBody,
                          fontSize: typography.textXs,
                          color: colors.textTertiary,
                          marginTop: spacing.sm,
                        }
                      ]}
                    >
                      Players will be eliminated after making this many mistakes
                    </Text>
                  </View>

                  {/* CREATE LOBBY Button */}
                  <TouchableOpacity
                    style={[
                      styles.createLobbyButton,
                      {
                        backgroundColor: colors.primary,
                        marginTop: spacing.lg,
                      }
                    ]}
                    onPress={handleCreateGame}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.createLobbyButtonText,
                        {
                          fontFamily: typography.fontBody,
                          fontSize: typography.textSm,
                          letterSpacing: typography.textSm * typography.trackingNormal,
                          color: '#FFFFFF',
                        }
                      ]}
                    >
                      CREATE LOBBY
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.hintText,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textXs,
                        color: colors.textTertiary,
                        marginTop: spacing.md,
                        textAlign: 'center',
                      }
                    ]}
                  >
                    Your opponents will be able to join your game, once you create a lobby
                  </Text>
                </View>
              </>
            ) : (
              <>
                <ScreenHeader
                  label="COMPETITION"
                  title="Face Off"
                  subtitle="RACE AGAINST OPPONENTS IN REAL-TIME"
                />

                <View style={styles.form}>
                  <Text style={[
                    styles.label,
                    {
                      fontFamily: typography.fontBody,
                      fontSize: typography.textXs,
                      letterSpacing: typography.textXs * typography.trackingWide,
                      color: colors.textLabel,
                      marginBottom: spacing.md,
                    }
                  ]}>
                    GAME NAME
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                        fontFamily: typography.fontBody,
                        fontSize: typography.textBase,
                        marginBottom: spacing.xl,
                      }
                    ]}
                    value={joinChannelName}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(text) => {
                      const normalized = text
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z-]/g, '');
                      setJoinChannelName(normalized);
                    }}
                    placeholder="Enter game name"
                    placeholderTextColor={colors.textTertiary}
                  />

                  <Text style={[
                    styles.label,
                    {
                      fontFamily: typography.fontBody,
                      fontSize: typography.textXs,
                      letterSpacing: typography.textXs * typography.trackingWide,
                      color: colors.textLabel,
                      marginBottom: spacing.md,
                    }
                  ]}>
                    YOUR NAME
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                        fontFamily: typography.fontBody,
                        fontSize: typography.textBase,
                        marginBottom: spacing.xl,
                      }
                    ]}
                    value={joinPlayerName}
                    onChangeText={async (val) => {
                      setJoinPlayerName(val);
                      setPlayerName(val);
                      try { await prefStorage.setItem(PLAYER_NAME_KEY, val); } catch (e) { /* Failed to save - silently continue */ }
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textTertiary}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: colors.primary,
                        marginTop: spacing.xl2,
                      }
                    ]}
                    onPress={handleJoinGame}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        {
                          fontFamily: typography.fontBody,
                          fontSize: typography.textSm,
                          letterSpacing: typography.textSm * typography.trackingNormal,
                          color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF',
                        }
                      ]}
                    >
                      JOIN GAME
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>


      {/* Error Modal */}
      <Modal
        visible={errorModal !== null}
        title={errorModal?.title || ''}
        subtitle={errorModal?.message || ''}
        primaryButton={{
          text: 'OK',
          onPress: () => setErrorModal(null),
        }}
        onClose={() => setErrorModal(null)}
      />
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
  subtitleLabel: {
    textAlign: 'center',
  },
  mainTitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  titleUnderline: {
    width: 96,
    height: 1,
  },
  subtitleText: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  label: {
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyContainerMobile: {
    flexWrap: 'wrap',
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  difficultyButtonMobile: {
    flexBasis: '47%',
    minWidth: '47%',
    maxWidth: '47%',
  },
  difficultyButtonMainText: {
    fontWeight: '400',
    textAlign: 'center',
  },
  difficultyButtonEditionText: {
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  lifeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  lifeButtonText: {
    textAlign: 'center',
  },
  hintText: {
    fontWeight: '400',
  },
  createLobbyButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  createLobbyButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
