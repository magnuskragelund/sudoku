import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '../components/Modal';
import { useGame } from '../context/GameContext';
import { multiplayerService, Player } from '../utils/multiplayerService';

export default function LobbyScreen() {
  const router = useRouter();
  const { multiplayer, startMultiplayerGame, leaveMultiplayerGame } = useGame();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    // Redirect to home if not in a multiplayer game
    if (!multiplayer) {
      router.replace('/');
      return;
    }

    console.log('Lobby screen: Setting up player subscription');

    // Subscribe immediately to get updates
    const unsubscribe = multiplayerService.subscribeToPlayers((updatedPlayers) => {
      console.log('Lobby received player update:', updatedPlayers);
      setPlayers(updatedPlayers);
      setPlayerCount(updatedPlayers.length);
    });

    // Subscribe to game board shared events to auto-navigate when game starts
    const unsubscribeGameBoard = multiplayerService.subscribeToGameBoard(() => {
      console.log('Game board received in lobby, navigating to game screen');
      // Wait a moment for the game to load, then navigate
      setTimeout(() => {
        router.push('/game');
      }, 500);
    });

    return () => {
      // Cleanup subscription on unmount
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (typeof unsubscribeGameBoard === 'function') {
        unsubscribeGameBoard();
      }
    };
  }, [router, multiplayer]);

  const isHost = multiplayer?.hostId === multiplayerService.getPlayerId();

  const handleStartGame = async () => {
    try {
      // Start the game - this will generate puzzle and broadcast it
      await startMultiplayerGame?.();
      
      // Wait a moment for the game to load, then navigate
      setTimeout(() => {
        router.push('/game');
      }, 500);
    } catch (error) {
      console.error('Error starting game:', error);
      setShowErrorModal(true);
    }
  };

  const handleLeave = async () => {
    await leaveMultiplayerGame?.();
    router.replace('/');
  };

  if (!multiplayer) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lobby</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game: {multiplayer.channelName}</Text>
          <Text style={styles.playerCount}>{playerCount} player{playerCount !== 1 ? 's' : ''} connected</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.playersList}>
            {players.map((player) => {
              const currentPlayerId = multiplayerService.getPlayerId();
              const isCurrentPlayer = player.id === currentPlayerId;
              
              return (
                <View key={player.id} style={styles.playerItem}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {isCurrentPlayer && <Text style={styles.guestBadge}>(You)</Text>}
                    {player.isHost && <Text style={styles.hostBadge}>(Host)</Text>}
                    {!isCurrentPlayer && !player.isHost && <Text style={styles.guestBadge}>(Player)</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {isHost && (
          <View style={styles.hostSection}>
            <Text style={styles.hostNote}>
              You are the host. Start the game when all players have joined.
            </Text>
            <TouchableOpacity
              style={[
                styles.startButton,
                playerCount < 2 && styles.startButtonDisabled,
              ]}
              onPress={handleStartGame}
              disabled={playerCount < 2}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isHost && (
          <View style={styles.guestSection}>
            <Text style={styles.waitNote}>
              Waiting for the host to start the game...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Leave Game</Text>
        </TouchableOpacity>
      </View>
      
      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        title="Error"
        subtitle="Failed to start the game"
        primaryButton={{
          text: 'OK',
          onPress: () => setShowErrorModal(false),
        }}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2939',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2939',
    marginBottom: 8,
  },
  playerCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  playersList: {
    gap: 12,
  },
  playerItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2939',
  },
  hostBadge: {
    fontSize: 12,
    color: '#2B7FFF',
    fontWeight: '600',
  },
  guestBadge: {
    fontSize: 12,
    color: '#6B7280',
  },
  hostSection: {
    marginTop: 8,
  },
  hostNote: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestSection: {
    marginTop: 8,
  },
  waitNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DC',
  },
  leaveButton: {
    backgroundColor: '#FB2C36',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
