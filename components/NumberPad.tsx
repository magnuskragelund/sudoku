import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';

function NumberPad() {
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
  const isSelectedCellEditable = React.useMemo(() => {
    if (!selectedCell) return false;
    return initialBoard[selectedCell.row][selectedCell.col] === 0 &&
           board[selectedCell.row][selectedCell.col] !== solution[selectedCell.row][selectedCell.col];
  }, [selectedCell, initialBoard, board, solution]);

  // Check if all cells with a specific number have been filled by the user
  const numberCompletionMap = React.useMemo(() => {
    const map: Record<number, boolean> = {};
    
    for (let num = 1; num <= 9; num++) {
      // Count how many times this number appears in the solution that were NOT initial clues
      let userRequiredCount = 0;
      let userFilledCount = 0;
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (solution[row][col] === num) {
            // This cell should contain this number in the solution
            if (initialBoard[row][col] === 0) {
              // This cell was empty initially, so user needs to fill it
              userRequiredCount++;
              if (board[row][col] === num) {
                // User has filled this cell with the correct number
                userFilledCount++;
              }
            }
          }
        }
      }
      
      // Number is complete if all required user-filled instances are complete
      map[num] = userRequiredCount > 0 && userFilledCount === userRequiredCount;
    }
    
    return map;
  }, [initialBoard, board, solution]);

  return (
    <View style={styles.container}>
      {/* Number buttons 1-9 */}
      <View style={styles.numberRow}>
        {Array.from({ length: 9 }, (_, i) => {
          const number = i + 1;
          const isComplete = numberCompletionMap[number];
          
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
    width: '100%',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    width: '100%',
  },
  numberButton: {
    flex: 1,
    maxWidth: 44,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 0,
    borderColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  hiddenButton: {
    flex: 1,
    maxWidth: 44,
    height: 52,
    marginHorizontal: 2,
    // Invisible placeholder to maintain layout
  },
  numberText: {
    fontSize: 28,
    color: '#2B7FFF',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

export default React.memo(NumberPad);
