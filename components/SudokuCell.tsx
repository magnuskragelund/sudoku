import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';

interface SudokuCellProps {
  row: number;
  col: number;
  value: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function SudokuCell({ row, col, value, isSelected, onSelect }: SudokuCellProps) {
  const { initialBoard, notes } = useGame();
  
  const isInitial = initialBoard[row][col] !== 0;
  const noteKey = `${row}-${col}`;
  const cellNotes = notes.get(noteKey) || new Set();

  // Determine if this cell is in the same row, column, or 3x3 box as selected cell
  const isRelated = (selectedRow: number, selectedCol: number) => {
    if (selectedRow === -1 || selectedCol === -1) return false;
    
    const sameRow = row === selectedRow;
    const sameCol = col === selectedCol;
    const sameBox = Math.floor(row / 3) === Math.floor(selectedRow / 3) && 
                   Math.floor(col / 3) === Math.floor(selectedCol / 3);
    
    return sameRow || sameCol || sameBox;
  };

  const getCellStyle = () => {
    const baseStyle = [styles.cell];
    
    // Add border styles for 3x3 sub-grids
    if (row % 3 === 2) baseStyle.push(styles.bottomThickBorder);
    if (col % 3 === 2) baseStyle.push(styles.rightThickBorder);
    
    // Background color based on state
    if (isInitial) {
      baseStyle.push(styles.initialCell);
    } else if (isSelected) {
      baseStyle.push(styles.selectedCell);
    } else if (isRelated(row, col)) {
      baseStyle.push(styles.relatedCell);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.cellText];
    if (isInitial) {
      baseStyle.push(styles.initialText);
    } else {
      baseStyle.push(styles.userText);
    }
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getCellStyle()}
      onPress={onSelect}
      disabled={isInitial}
    >
      {value !== 0 ? (
        <Text style={getTextStyle()}>{value}</Text>
      ) : cellNotes.size > 0 ? (
        <View style={styles.notesContainer}>
          {Array.from({ length: 9 }, (_, i) => (
            <Text
              key={i}
              style={[
                styles.noteText,
                { opacity: cellNotes.has(i + 1) ? 1 : 0 }
              ]}
            >
              {i + 1}
            </Text>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomThickBorder: {
    borderBottomWidth: 2,
  },
  rightThickBorder: {
    borderRightWidth: 2,
  },
  initialCell: {
    backgroundColor: '#F3F4F6',
  },
  selectedCell: {
    backgroundColor: '#BEDBFF',
  },
  relatedCell: {
    backgroundColor: '#8EC5FF',
  },
  cellText: {
    fontSize: 30,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  initialText: {
    color: '#1E2939',
  },
  userText: {
    color: '#1E2939',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  noteText: {
    fontSize: 8,
    color: '#4A5565',
    fontFamily: 'Inter',
    width: '33%',
    textAlign: 'center',
  },
});
