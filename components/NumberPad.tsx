import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';

export default function NumberPad() {
  const { placeNumber, selectedCell, initialBoard, board, solution } = useGame();

  const handleNumberPress = (number: number) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      // Only allow placing numbers in editable cells (not initial and not correctly filled)
      const isEditable = initialBoard[row][col] === 0 && 
                        board[row][col] !== solution[row][col];
      if (isEditable) {
        placeNumber(number);
      }
    }
  };

  // Check if cell is editable (not initial clue and not correctly filled)
  const isSelectedCellEditable = selectedCell && 
    initialBoard[selectedCell.row][selectedCell.col] === 0 &&
    board[selectedCell.row][selectedCell.col] !== solution[selectedCell.row][selectedCell.col];

  // Check if all cells with a specific number have been filled by the user
  const isNumberComplete = (number: number): boolean => {
    // Count how many times this number appears in the solution that were NOT initial clues
    let userRequiredCount = 0;
    let userFilledCount = 0;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (solution[row][col] === number) {
          // This cell should contain this number in the solution
          if (initialBoard[row][col] === 0) {
            // This cell was empty initially, so user needs to fill it
            userRequiredCount++;
            if (board[row][col] === number) {
              // User has filled this cell with the correct number
              userFilledCount++;
            }
          }
        }
      }
    }
    
    // Number is complete if all required user-filled instances are complete
    return userRequiredCount > 0 && userFilledCount === userRequiredCount;
  };

  return (
    <View style={styles.container}>
      {/* Number buttons 1-9 */}
      <View style={styles.numberRow}>
        {Array.from({ length: 9 }, (_, i) => {
          const number = i + 1;
          const isComplete = isNumberComplete(number);
          
          // Hide the button if the number is complete
          if (isComplete) {
            return <View key={number} style={styles.hiddenButton} />;
          }
          
          return (
            <TouchableOpacity
              key={number}
              style={styles.numberButton}
              onPress={() => handleNumberPress(number)}
              disabled={!isSelectedCellEditable}
            >
              <Text style={[
                styles.numberText,
                { opacity: isSelectedCellEditable ? 1 : 0.3 }
              ]}>
                {number}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  hiddenButton: {
    width: 30,
    height: 40,
    // Invisible placeholder to maintain layout
  },
  numberText: {
    fontSize: 24,
    color: '#2B7FFF',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
});
