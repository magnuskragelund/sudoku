import * as Haptics from 'expo-haptics';
import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';

interface NumberPadProps {
  noteMode?: boolean;
  addNote?: (number: number) => void;
  removeNote?: (number: number) => void;
  notes?: Map<string, Set<number>>;
  placeUsed?: boolean;
  usePlace?: () => void;
}

function NumberPad({ noteMode = false, addNote, removeNote, notes, placeUsed = false, usePlace }: NumberPadProps) {
  const { placeNumber, selectDigit, selectedCell, selectedDigit, initialBoard, board, solution, status } = useGame();
  const { colors, typography, spacing, colorScheme } = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const handleNumberPress = (number: number) => {
    // In note mode, require a selected cell to add notes
    if (noteMode) {
      if (!selectedCell) {
        // In note mode, you need a cell selected to add notes
        return;
      }

      const { row, col } = selectedCell;
      // Only allow notes in empty cells (not initial clues)
      if (initialBoard[row][col] === 0 && board[row][col] === 0) {
        const noteKey = `${row}-${col}`;
        const cellNotes = notes?.get(noteKey);
        const hasNote = cellNotes?.has(number) ?? false;

        // Toggle note: remove if exists, add if not
        if (hasNote && removeNote) {
          removeNote(number);
          // Light haptic feedback for note removal
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else if (!hasNote && addNote) {
          addNote(number);
          // Light haptic feedback for note addition
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }
      return;
    }

    // Digit First mode: If no cell is selected, select the digit
    if (!selectedCell) {
      // Toggle: if same digit is selected, deselect it
      selectDigit(selectedDigit === number ? null : number);
      return;
    }

    const { row, col } = selectedCell;

    // Cell First mode: place numbers in selected cell
    // Only allow placing numbers in editable cells (not initial and not correctly filled)
    const isEditable = initialBoard[row][col] === 0 &&
      board[row][col] !== solution[row][col];
    if (isEditable) {
      // Check if the move will be correct before placing - for immediate haptic feedback
      const isCorrect = number === solution[row][col];

      // Trigger haptic feedback immediately for correct/wrong moves
      if (Platform.OS !== 'web') {
        if (isCorrect) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      // Then place the number
      placeNumber(number);
    }
  };

  // Check if cell is editable (not initial clue and not correctly filled)
  const isSelectedCellEditable = React.useMemo(() => {
    if (!selectedCell) return false;
    // In note mode, allow notes only in empty cells
    if (noteMode) {
      return initialBoard[selectedCell.row][selectedCell.col] === 0 &&
        board[selectedCell.row][selectedCell.col] === 0;
    }
    // In normal mode, allow placing numbers in editable cells
    return initialBoard[selectedCell.row][selectedCell.col] === 0 &&
      board[selectedCell.row][selectedCell.col] !== solution[selectedCell.row][selectedCell.col];
  }, [selectedCell, initialBoard, board, solution, noteMode]);

  // Check which numbers have notes in the selected cell (for visual feedback)
  const selectedCellNotes = React.useMemo(() => {
    if (!selectedCell || !notes) return new Set<number>();
    const noteKey = `${selectedCell.row}-${selectedCell.col}`;
    return notes.get(noteKey) || new Set<number>();
  }, [selectedCell, notes]);

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
      {/* Note mode indicator - floating */}
      {noteMode && (
        <View style={styles.noteModeIndicatorWrapper}>
          <View style={[styles.noteModeIndicator, { backgroundColor: colors.primary }]}>
            <Text style={[
              styles.noteModeText,
              {
                fontFamily: typography.fontBody,
                fontSize: typography.textSm,
                color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF',
              }
            ]}>
              NOTE MODE
            </Text>
          </View>
        </View>
      )}

      {/* Number buttons 1-9 in two rows */}
      <View style={styles.numberPadWrapper}>
        {/* First row: 1-5 */}
        <View style={styles.numberRow}>
          {Array.from({ length: 5 }, (_, i) => {
            const number = i + 1;
            const isComplete = numberCompletionMap[number];
            const hasNote = selectedCellNotes.has(number);
            const isDigitSelected = selectedDigit === number;

            // Hide the button if the number is complete (only in normal mode)
            if (!noteMode && isComplete) {
              return <View key={number} style={styles.hiddenButton} />;
            }

            // Determine if button should be highlighted
            const isHighlighted = noteMode
              ? hasNote
              : isDigitSelected;

            // Button is enabled if: no cell selected (Digit First) OR cell is editable
            const isButtonEnabled = !selectedCell || isSelectedCellEditable;

            return (
              <TouchableOpacity
                key={number}
                style={[
                  styles.numberButton,
                  isLargeScreen && styles.numberButtonLarge,
                  {
                    backgroundColor: isHighlighted
                      ? colors.primary
                      : colors.cardBackground,
                    borderColor: isHighlighted
                      ? colors.primary
                      : colors.borderThin,
                    borderWidth: isHighlighted ? 2 : 1,
                    shadowColor: colors.cardShadow,
                  }
                ]}
                onPress={() => handleNumberPress(number)}
                disabled={!isButtonEnabled}
                testID={`number-${number}`}
                accessibilityLabel={noteMode ? `Toggle note ${number}` : isDigitSelected ? `Selected digit ${number}` : `Number ${number}`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.numberText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: isLargeScreen ? 32 : 26,
                    color: isHighlighted
                      ? (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                      : colors.textPrimary,
                    opacity: isButtonEnabled ? 1 : 0.3,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    marginTop: isLargeScreen ? 2 : 1,
                  }
                ]}>
                  {number}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Second row: 6-9 + Place button */}
        <View style={styles.numberRow}>
          {Array.from({ length: 4 }, (_, i) => {
            const number = i + 6;
            const isComplete = numberCompletionMap[number];
            const hasNote = selectedCellNotes.has(number);
            const isDigitSelected = selectedDigit === number;

            // Hide the button if the number is complete (only in normal mode)
            if (!noteMode && isComplete) {
              return <View key={number} style={styles.hiddenButton} />;
            }

            // Determine if button should be highlighted
            const isHighlighted = noteMode
              ? hasNote
              : isDigitSelected;

            // Button is enabled if: no cell selected (Digit First) OR cell is editable
            const isButtonEnabled = !selectedCell || isSelectedCellEditable;

            return (
              <TouchableOpacity
                key={number}
                style={[
                  styles.numberButton,
                  isLargeScreen && styles.numberButtonLarge,
                  {
                    backgroundColor: isHighlighted
                      ? colors.primary
                      : colors.cardBackground,
                    borderColor: isHighlighted
                      ? colors.primary
                      : colors.borderThin,
                    borderWidth: isHighlighted ? 2 : 1,
                    shadowColor: colors.cardShadow,
                  }
                ]}
                onPress={() => handleNumberPress(number)}
                disabled={!isButtonEnabled}
                testID={`number-${number}`}
                accessibilityLabel={noteMode ? `Toggle note ${number}` : isDigitSelected ? `Selected digit ${number}` : `Number ${number}`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.numberText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: isLargeScreen ? 32 : 26,
                    color: isHighlighted
                      ? (colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF')
                      : colors.textPrimary,
                    opacity: isButtonEnabled ? 1 : 0.3,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    marginTop: isLargeScreen ? 2 : 1,
                  }
                ]}>
                  {number}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Place Button */}
          <TouchableOpacity
            style={[
              styles.numberButton,
              isLargeScreen && styles.numberButtonLarge,
              {
                backgroundColor: (placeUsed || !selectedCell || status !== 'playing')
                  ? colors.buttonBackgroundDisabled
                  : colors.cardBackground,
                borderColor: colors.borderThin,
                borderWidth: 1,
                shadowColor: colors.cardShadow,
              }
            ]}
            onPress={usePlace}
            disabled={placeUsed || !selectedCell || status !== 'playing'}
            testID="place-button"
            accessibilityLabel="Place correct number"
            accessibilityRole="button"
          >
            <CheckCircle
              size={isLargeScreen ? 24 : 20}
              color={
                (placeUsed || !selectedCell || status !== 'playing')
                  ? colors.textTertiary
                  : colors.textSecondary
              }
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    width: '100%',
    position: 'relative',
  },
  noteModeIndicatorWrapper: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  noteModeIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  noteModeText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  numberPadWrapper: {
    width: '100%',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    paddingHorizontal: 4,
  },
  numberButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  numberButtonLarge: {
    height: 56,
    marginHorizontal: 4,
  },
  hiddenButton: {
    flex: 1,
    height: 48,
    marginHorizontal: 3,
  },
  numberText: {
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default React.memo(NumberPad);
