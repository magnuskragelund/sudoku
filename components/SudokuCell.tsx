import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';

interface SudokuCellProps {
  row: number;
  col: number;
  value: number;
  isSelected: boolean;
  selectedCell: { row: number; col: number } | null;
  onSelect: () => void;
}

export default function SudokuCell({ row, col, value, isSelected, selectedCell, onSelect }: SudokuCellProps) {
  const { initialBoard, notes, wrongCell, clearWrongCell } = useGame();
  
  const isInitial = initialBoard[row][col] !== 0;
  const noteKey = `${row}-${col}`;
  const cellNotes = notes.get(noteKey) || new Set();
  
  // Animation for wrong number entry
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const errorAnimation = useRef(new Animated.Value(0)).current;
  
  const isWrongCell = wrongCell?.row === row && wrongCell?.col === col;
  
  // Trigger animation when this cell becomes the wrong cell
  useEffect(() => {
    if (isWrongCell) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Error color flash
      Animated.sequence([
        Animated.timing(errorAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(errorAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Clear the wrong cell after animation
        setTimeout(() => clearWrongCell(), 100);
      });
    }
  }, [isWrongCell, shakeAnimation, errorAnimation, clearWrongCell]);

  // Determine if this cell is in the same row or column as selected cell
  const isInSameRowOrColumn = (selectedRow: number, selectedCol: number) => {
    if (selectedRow === -1 || selectedCol === -1) return false;
    
    const sameRow = row === selectedRow;
    const sameCol = col === selectedCol;
    
    return sameRow || sameCol;
  };

  // Determine if this cell is in the same 3x3 box as selected cell
  const isInSameBox = (selectedRow: number, selectedCol: number) => {
    if (selectedRow === -1 || selectedCol === -1) return false;
    
    return Math.floor(row / 3) === Math.floor(selectedRow / 3) && 
           Math.floor(col / 3) === Math.floor(selectedCol / 3);
  };

  const getCellStyle = () => {
    const baseStyle = [styles.cell];
    
    // Add border styles for 3x3 sub-grids
    if (row % 3 === 2) baseStyle.push(styles.bottomThickBorder);
    if (col % 3 === 2) baseStyle.push(styles.rightThickBorder);
    
    // Background color based on state
    if (isSelected) {
      baseStyle.push(styles.selectedCell);
    } else if (isInSameRowOrColumn(selectedCell?.row ?? -1, selectedCell?.col ?? -1)) {
      baseStyle.push(styles.rowColumnHighlight);
    } else if (isInSameBox(selectedCell?.row ?? -1, selectedCell?.col ?? -1)) {
      baseStyle.push(styles.boxHighlight);
    } else if (isInitial) {
      baseStyle.push(styles.initialCell);
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

  const animatedStyle = {
    transform: [{ translateX: shakeAnimation }],
  };

  const errorColor = errorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#FB2C36'],
  });

  return (
    <Animated.View style={[getCellStyle(), animatedStyle]}>
      <Animated.View style={[styles.errorOverlay, { backgroundColor: errorColor }]} />
      <TouchableOpacity
        style={styles.cellContent}
        onPress={onSelect}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DC',
    position: 'relative',
  },
  cellContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  bottomThickBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#6B7280',
  },
  rightThickBorder: {
    borderRightWidth: 2,
    borderRightColor: '#6B7280',
  },
  initialCell: {
    backgroundColor: '#F3F4F6',
  },
  selectedCell: {
    backgroundColor: '#BEDBFF',
  },
  rowColumnHighlight: {
    backgroundColor: '#E5E7EB',
  },
  boxHighlight: {
    backgroundColor: '#E5E7EB',
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
