import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NumberPad from '../components/NumberPad';
import SudokuBoard from '../components/SudokuBoard';
import { useGame } from '../context/GameContext';

export default function GameScreen() {
  const router = useRouter();
  const { 
    difficulty, 
    status, 
    lives, 
    timeElapsed, 
    selectedCell,
    pauseGame,
    resumeGame,
    newGame 
  } = useGame();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewGame = () => {
    newGame();
    router.push('/');
  };

  const handlePauseResume = () => {
    if (status === 'playing') {
      pauseGame();
    } else if (status === 'paused') {
      resumeGame();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNewGame} style={styles.newGameButton}>
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>
        
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyText}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.mistakesContainer}>
          <Text style={styles.mistakesText}>{lives}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>↶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>💡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📝</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <SudokuBoard />
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
      </View>

      {/* Number Pad */}
      <View style={styles.numberPadContainer}>
        <NumberPad />
      </View>

      {/* Game Status Overlay */}
      {status === 'won' && (
        <View style={styles.overlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusTitle}>Congratulations!</Text>
            <Text style={styles.statusSubtitle}>You solved the puzzle!</Text>
            <TouchableOpacity style={styles.statusButton} onPress={handleNewGame}>
              <Text style={styles.statusButtonText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {status === 'lost' && (
        <View style={styles.overlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusTitle}>Game Over</Text>
            <Text style={styles.statusSubtitle}>You ran out of lives!</Text>
            <TouchableOpacity style={styles.statusButton} onPress={handleNewGame}>
              <Text style={styles.statusButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {status === 'paused' && (
        <View style={styles.overlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusTitle}>Paused</Text>
            <TouchableOpacity style={styles.statusButton} onPress={resumeGame}>
              <Text style={styles.statusButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
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
    fontFamily: 'Inter',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 16,
    color: '#1E2939',
    fontWeight: '600',
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
  },
  mistakesText: {
    fontSize: 16,
    color: '#FB2C36',
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
  actionButtonText: {
    fontSize: 16,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DC',
  },
  timerText: {
    fontSize: 16,
    color: '#4A5565',
    fontFamily: 'Inter',
  },
  numberPadContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 24,
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
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  statusButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
