import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SudokuCellProps {
  row: number;
  col: number;
  value: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameValue: boolean;
  isInitial: boolean;
  isCorrectlyFilled: boolean;
  isWrong: boolean;
  notes: Set<number>;
  onSelect: (row: number, col: number) => void;
  onClearWrongCell: () => void;
}

function SudokuCell({ 
  row, 
  col, 
  value, 
  isSelected, 
  isHighlighted,
  isSameValue,
  isInitial,
  isCorrectlyFilled,
  isWrong,
  notes,
  onSelect,
  onClearWrongCell
}: SudokuCellProps) {
  const { colors, typography } = useTheme();
  
  const isNonEditable = isInitial || isCorrectlyFilled;
  
  // Animation for wrong number entry - using opacity with native driver for better performance
  const errorOpacity = useRef(new Animated.Value(0)).current;
  
  // Trigger animation when this cell becomes the wrong cell
  useEffect(() => {
    if (isWrong) {
      // Simplified error animation - faster and uses native driver
      let timeoutId: any = null;
      
      Animated.sequence([
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(errorOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Clear the wrong cell after animation - faster timeout
        timeoutId = setTimeout(() => onClearWrongCell(), 50);
      });

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [isWrong, errorOpacity, onClearWrongCell]);

  // Memoize style calculations to avoid recalculation on every render
  const cellStyle = React.useMemo(() => {
    const baseStyle: any[] = [styles.cell];

    // Draw borders only on top/left to avoid overlap, and add outer bottom/right
    const thinColor = colors.borderThin;
    const thickColor = colors.borderThick;

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
      baseStyle.push({ backgroundColor: colors.cellSelected });
    } else if (isSameValue) {
      baseStyle.push({ backgroundColor: colors.cellSameValue });
    } else if (isHighlighted) {
      baseStyle.push({ backgroundColor: colors.cellHighlight });
    }
    
    return baseStyle;
  }, [isSelected, isSameValue, isHighlighted, row, col, colors]);

  const textStyle = React.useMemo(() => {
    const baseStyle = [
      styles.cellText, 
      { 
        color: isInitial ? colors.textPrimary : colors.textSecondary,
        fontFamily: typography.fontSerif,
        fontSize: 28,
        fontWeight: isInitial ? '600' : '400',
      }
    ];
    return baseStyle;
  }, [colors, typography, isInitial]);
  
  const noteTextStyle = React.useMemo(() => ({
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  }), [colors, typography]);

  return (
    <Animated.View style={cellStyle}>
      <Animated.View 
        style={[
          styles.errorOverlay, 
          { 
            backgroundColor: colors.error,
            opacity: errorOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          }
        ]} 
      />
      <TouchableOpacity
        style={styles.cellContent}
        onPressIn={() => onSelect(row, col)}
        activeOpacity={0.7}
        testID={`cell-${row}-${col}`}
        accessibilityLabel={`Cell row ${row + 1} column ${col + 1}${value !== 0 ? ` value ${value}` : ' empty'}`}
        accessibilityRole="button"
      >
        {value !== 0 ? (
          <Text style={textStyle}>{value}</Text>
        ) : notes.size > 0 ? (
          <View style={styles.notesContainer}>
            {/* Top row: 1-5 */}
            <View style={styles.notesRow}>
              {Array.from({ length: 5 }, (_, i) => {
                const num = i + 1;
                return (
                  <Text
                    key={num}
                    style={[
                      noteTextStyle,
                      { opacity: notes.has(num) ? 1 : 0 }
                    ]}
                  >
                    {num}
                  </Text>
                );
              })}
            </View>
            {/* Bottom row: 6-9 */}
            <View style={styles.notesRow}>
              {Array.from({ length: 4 }, (_, i) => {
                const num = i + 6;
                return (
                  <Text
                    key={num}
                    style={[
                      noteTextStyle,
                      { opacity: notes.has(num) ? 1 : 0 }
                    ]}
                  >
                    {num}
                  </Text>
                );
              })}
            </View>
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
  cellText: {
    // Dynamic styles applied in component
  },
  notesContainer: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  notesRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
});

export default React.memo(SudokuCell);
