import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Difficulty } from '../types/game';

export default function MultiplayerScreen() {
  const router = useRouter();
  const { createMultiplayerGame, joinMultiplayerGame } = useGame();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create form state
  const [channelName, setChannelName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [lives, setLives] = useState(5);
  
  // Join form state
  const [joinChannelName, setJoinChannelName] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');

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
        console.log('Failed to load difficulty preference:', e);
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
        console.log('Failed to load player name:', e);
      }
    };
    loadDifficultyPref();
    loadPlayerNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectDifficulty = async (value: Difficulty) => {
    setDifficulty(value);
    try {
      await prefStorage.setItem(DIFFICULTY_PREF_KEY, value);
    } catch (e) {
      console.log('Failed to save difficulty preference:', e);
    }
  };

  // Auto-suggest a short hyphenated game name like "monkey-glass"
  const WORDS: string[] = [
    'apple','bear','blue','boat','book','cake','cat','chip','cloud','coin',
    'cool','crow','deer','dove','dust','easy','fire','fish','frog','gift',
    'gold','goat','hand','hawk','heat','hill','ice','iron','jazz','kite',
    'leaf','lime','lion','luna','mint','moss','moon','mouse','nest','note',
    'pearl','pink','pond','rain','rock','seed','ship','snow','star','tree',
    'tide','wolf','wood','zinc'
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
      Alert.alert('Validation Error', 'Please enter both game name and your name');
      return;
    }
    
    try {
      await createMultiplayerGame?.(channelName.trim(), playerName.trim(), difficulty, lives);
      
      // Wait a bit for state to be set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      router.push('/lobby');
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    }
  };

  const handleJoinGame = async () => {
    if (!joinChannelName.trim() || !joinPlayerName.trim()) {
      Alert.alert('Validation Error', 'Please enter both game name and your name');
      return;
    }
    
    try {
      await joinMultiplayerGame?.(joinChannelName.trim(), joinPlayerName.trim());
      
      // Wait a bit for state to be set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      router.push('/lobby');
    } catch (error) {
      console.error('Error joining game:', error);
      Alert.alert('Error', 'Failed to join game. Please check the game name and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1E2939" />
        </TouchableOpacity>
        <Text style={styles.title}>Multiplayer</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Game
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'join' && styles.activeTab]}
          onPress={() => setActiveTab('join')}
        >
          <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
            Join Game
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'create' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Game Name</Text>
            <TextInput
              style={styles.input}
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
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={async (val) => {
                setPlayerName(val);
                setJoinPlayerName(val);
                try { await prefStorage.setItem(PLAYER_NAME_KEY, val); } catch (e) { console.log('Failed to save player name:', e); }
              }}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultyContainer}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.value}
                  style={[
                    styles.difficultyButton,
                    difficulty === diff.value && styles.difficultyButtonSelected,
                  ]}
                  onPress={() => handleSelectDifficulty(diff.value)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      difficulty === diff.value && styles.difficultyButtonTextSelected,
                    ]}
                  >
                    {diff.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Lives</Text>
            <View style={styles.livesContainer}>
              {livesOptions.map((life) => (
                <TouchableOpacity
                  key={life}
                  style={[styles.lifeButton, lives === life && styles.lifeButtonSelected]}
                  onPress={() => setLives(life)}
                >
                  <Text
                    style={[
                      styles.lifeButtonText,
                      lives === life && styles.lifeButtonTextSelected,
                    ]}
                  >
                    {life}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGame}>
              <Text style={styles.primaryButtonText}>Create Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Game Name</Text>
            <TextInput
              style={styles.input}
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
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={joinPlayerName}
              onChangeText={async (val) => {
                setJoinPlayerName(val);
                setPlayerName(val);
                try { await prefStorage.setItem(PLAYER_NAME_KEY, val); } catch (e) { console.log('Failed to save player name:', e); }
              }}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleJoinGame}>
              <Text style={styles.primaryButtonText}>Join Game</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#2B7FFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
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
    color: '#1E2939',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E2939',
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
    borderColor: '#D1D5DC',
    backgroundColor: 'white',
  },
  difficultyButtonSelected: {
    backgroundColor: '#2B7FFF',
    borderColor: '#2B7FFF',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
    borderColor: '#D1D5DC',
    backgroundColor: 'white',
  },
  lifeButtonSelected: {
    backgroundColor: '#2B7FFF',
    borderColor: '#2B7FFF',
  },
  lifeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  lifeButtonTextSelected: {
    color: 'white',
  },
  primaryButton: {
    backgroundColor: '#2B7FFF',
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
