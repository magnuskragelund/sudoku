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

function SudokuCell({ row, col, value, isSelected, selectedCell, onSelect }: SudokuCellProps) {
  const { initialBoard, notes, wrongCell, clearWrongCell, board, solution } = useGame();
  
  const isInitial = initialBoard[row][col] !== 0;
  // Cell is also "initial-like" if it's been correctly filled by the user
  const isCorrectlyFilled = board[row][col] !== 0 && board[row][col] === solution[row][col] && !isInitial;
  const isNonEditable = isInitial || isCorrectlyFilled;
  const noteKey = `${row}-${col}`;
  const cellNotes = notes.get(noteKey) || new Set();
  
  // Animation for wrong number entry
  const errorAnimation = useRef(new Animated.Value(0)).current;
  
  const isWrongCell = wrongCell?.row === row && wrongCell?.col === col;
  
  // Trigger animation when this cell becomes the wrong cell
  useEffect(() => {
    if (isWrongCell) {
      // Error color flash
      let timeoutId: any = null;
      
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
        timeoutId = setTimeout(() => clearWrongCell(), 100);
      });

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [isWrongCell, errorAnimation, clearWrongCell]);

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

  // Determine if this cell has the same value as the selected cell
  const hasSameValue = (selectedRow: number, selectedCol: number, selectedValue: number) => {
    if (selectedRow === -1 || selectedCol === -1 || selectedValue === 0) return false;
    
    return value === selectedValue;
  };

  // Memoize selected value to avoid recalculating on every render
  const selectedValue = React.useMemo(() => {
    return selectedCell ? board[selectedCell.row][selectedCell.col] : 0;
  }, [selectedCell, board]);

  // Memoize style calculations to avoid recalculation on every render
  const cellStyle = React.useMemo(() => {
    const baseStyle = [styles.cell];

    // Draw borders only on top/left to avoid overlap, and add outer bottom/right
    const thinColor = '#D1D5DC';
    const thickColor = '#6B7280';

    // 3x3 thick separators on top/left
    if (row % 3 === 0) {
      baseStyle.push({ borderTopWidth: 2, borderTopColor: thickColor });
    } else {
      baseStyle.push({ borderTopWidth: 0.5, borderTopColor: thinColor });
    }

    if (col % 3 === 0) {
      baseStyle.push({ borderLeftWidth: 2, borderLeftColor: thickColor });
    } else {
      baseStyle.push({ borderLeftWidth: 0.5, borderLeftColor: thinColor });
    }

    // Outer edges: bottom/right thick borders on last row/col
    if (row === 8) baseStyle.push({ borderBottomWidth: 2, borderBottomColor: thickColor });
    if (col === 8) baseStyle.push({ borderRightWidth: 2, borderRightColor: thickColor });

    // Background color based on state
    if (isSelected) {
      baseStyle.push(styles.selectedCell);
    } else if (hasSameValue(selectedCell?.row ?? -1, selectedCell?.col ?? -1, selectedValue)) {
      baseStyle.push(styles.sameValueHighlight);
    } else if (isInSameRowOrColumn(selectedCell?.row ?? -1, selectedCell?.col ?? -1)) {
      baseStyle.push(styles.rowColumnHighlight);
    } else if (isInSameBox(selectedCell?.row ?? -1, selectedCell?.col ?? -1)) {
      baseStyle.push(styles.boxHighlight);
    } else if (isNonEditable) {
      baseStyle.push(styles.initialCell);
    }
    
    return baseStyle;
  }, [isSelected, selectedCell, isNonEditable, row, col, selectedValue]);

  const textStyle = React.useMemo(() => {
    const baseStyle = [styles.cellText];
    if (isNonEditable) {
      baseStyle.push(styles.initialText);
    } else {
      baseStyle.push(styles.userText);
    }
    return baseStyle;
  }, [isNonEditable]);

  const errorColor = errorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#FB2C36'],
  });

  return (
    <Animated.View style={cellStyle}>
      <Animated.View style={[styles.errorOverlay, { backgroundColor: errorColor }]} />
      <TouchableOpacity
        style={styles.cellContent}
        onPressIn={onSelect}
        activeOpacity={0.7}
      >
        {value !== 0 ? (
          <Text style={textStyle}>{value}</Text>
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
    width: '11.11%', // 100% / 9 cells
    aspectRatio: 1, // Maintain square cells
    borderWidth: 0,
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
  // Removed bottom/right thick helpers; borders are computed inline to avoid overlaps
  initialCell: {
    // No background for filled cells
  },
  selectedCell: {
    backgroundColor: '#BEDBFF',
  },
  rowColumnHighlight: {
    backgroundColor: '#F3F4F6',
  },
  boxHighlight: {
    backgroundColor: '#F3F4F6',
  },
  sameValueHighlight: {
    backgroundColor: '#BEDBFF', // Same blue as selected cell
  },
  cellText: {
    fontSize: 30,
    fontWeight: '400',
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

export default React.memo(SudokuCell);
