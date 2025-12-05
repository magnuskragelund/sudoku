import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '../components/Modal';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { Difficulty } from '../types/game';

export default function MultiplayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createMultiplayerGame, joinMultiplayerGame } = useGame();
  const { width } = useWindowDimensions();
  
  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;
  
  // Get deep link params
  const params = useLocalSearchParams();
  const joinGameParam = params.joinGame as string | undefined;
  
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
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

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
    { label: 'Master', value: 'master' },
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

  // Auto-suggest a short hyphenated game name like "monkey-glass"
  const WORDS: string[] = [
    'apple','bear','blue','boat','book','cake','cat','rain','cloud','coin',
    'cool','crow','deer','ball','dust','easy','fire','fish','frog','gift',
    'gold','goat','hand','hawk','heat','hill','ice','iron','jazz','kite',
    'leaf','lime','lion','luna','mint','saint','moon','mouse','nest','ant',
    'pearl','pink','pond','rain','rock','seed','ship','snow','star','tree',
    'tide','wolf','wood','hat'
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
    if (!channelName.trim() || !playerName.trim()) {
      setErrorModal({ title: 'Validation Error', message: 'Please enter both game name and your name' });
      return;
    }
    
    try {
      await createMultiplayerGame?.(channelName.trim(), playerName.trim(), difficulty, lives);
      
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Multiplayer</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'create' ? colors.primary : colors.textSecondary }]}>
            Create
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'join' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('join')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'join' ? colors.primary : colors.textSecondary }]}>
            Join
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'create' ? (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Game Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              value={channelName}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(text) => {
                const normalized = text
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z-]/g, '');
                setChannelName(normalized);
              }}
              placeholder="e.g., cool-game-123"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Your Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              value={playerName}
              onChangeText={async (val) => {
                setPlayerName(val);
                setJoinPlayerName(val);
                try { await prefStorage.setItem(PLAYER_NAME_KEY, val); } catch (e) { /* Failed to save - silently continue */ }
              }}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
            <View style={styles.difficultyContainer}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.value}
                  style={[
                    styles.difficultyButton,
                    { backgroundColor: colors.buttonBackground },
                    difficulty === diff.value && [styles.difficultyButtonSelected, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => handleSelectDifficulty(diff.value)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      { color: colors.textSecondary },
                      difficulty === diff.value && styles.difficultyButtonTextSelected,
                    ]}
                  >
                    {diff.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Lives</Text>
            <View style={styles.livesContainer}>
              {livesOptions.map((life) => (
                <TouchableOpacity
                  key={life}
                  style={[styles.lifeButton, { backgroundColor: colors.buttonBackground }, lives === life && [styles.lifeButtonSelected, { backgroundColor: colors.primary }]]}
                  onPress={() => setLives(life)}
                >
                  <Text
                    style={[
                      styles.lifeButtonText,
                      { color: colors.textSecondary },
                      lives === life && styles.lifeButtonTextSelected,
                    ]}
                  >
                    {life}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleCreateGame}>
              <Text style={styles.primaryButtonText}>Create Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Game Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
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

            <Text style={[styles.label, { color: colors.textSecondary }]}>Your Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              value={joinPlayerName}
              onChangeText={async (val) => {
                setJoinPlayerName(val);
                setPlayerName(val);
                try { await prefStorage.setItem(PLAYER_NAME_KEY, val); } catch (e) { /* Failed to save - silently continue */ }
              }}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleJoinGame}>
              <Text style={styles.primaryButtonText}>Join Game</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
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
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: 'inherit',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 24,
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  difficultyButtonSelected: {
    borderColor: 'transparent',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyButtonTextSelected: {
    color: 'white',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  lifeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lifeButtonSelected: {
    borderColor: 'transparent',
  },
  lifeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lifeButtonTextSelected: {
    color: 'white',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
