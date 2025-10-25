import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';

export default function NumberPad() {
  const { placeNumber, clearCell, selectedCell } = useGame();

  const handleNumberPress = (number: number) => {
    if (selectedCell) {
      placeNumber(number);
    }
  };

  const handleClear = () => {
    if (selectedCell) {
      clearCell();
    }
  };

  return (
    <View style={styles.container}>
      {/* Number buttons 1-9 */}
      <View style={styles.numberRow}>
        {Array.from({ length: 9 }, (_, i) => (
          <TouchableOpacity
            key={i + 1}
            style={styles.numberButton}
            onPress={() => handleNumberPress(i + 1)}
            disabled={!selectedCell}
          >
            <Text style={[
              styles.numberText,
              { opacity: selectedCell ? 1 : 0.5 }
            ]}>
              {i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Clear button */}
      <View style={styles.clearRow}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          disabled={!selectedCell}
        >
          <Text style={[
            styles.clearText,
            { opacity: selectedCell ? 1 : 0.5 }
          ]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 30,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 24,
    color: '#2B7FFF',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  clearRow: {
    alignItems: 'center',
  },
  clearButton: {
    width: 86,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    color: '#4A5565',
    fontFamily: 'Inter',
  },
});
