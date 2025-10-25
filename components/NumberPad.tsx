import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';

export default function NumberPad() {
  const { placeNumber, clearCell, selectedCell, initialBoard } = useGame();

  const handleNumberPress = (number: number) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      // Only allow placing numbers in non-initial cells
      if (initialBoard[row][col] === 0) {
        placeNumber(number);
      }
    }
  };

  const handleClear = () => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      // Only allow clearing non-initial cells
      if (initialBoard[row][col] === 0) {
        clearCell();
      }
    }
  };

  const isSelectedCellEditable = selectedCell && initialBoard[selectedCell.row][selectedCell.col] === 0;

  return (
    <View style={styles.container}>
      {/* Number buttons 1-9 */}
      <View style={styles.numberRow}>
        {Array.from({ length: 9 }, (_, i) => (
          <TouchableOpacity
            key={i + 1}
            style={styles.numberButton}
            onPress={() => handleNumberPress(i + 1)}
            disabled={!isSelectedCellEditable}
          >
            <Text style={[
              styles.numberText,
              { opacity: isSelectedCellEditable ? 1 : 0.3 }
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
          disabled={!isSelectedCellEditable}
        >
          <Text style={[
            styles.clearText,
            { opacity: isSelectedCellEditable ? 1 : 0.3 }
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
