import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import SudokuCell from './SudokuCell';

interface SudokuBoardProps {
  hintMode?: boolean;
  currentHint?: { 
    technique: string; 
    explanation: string; 
    guidance: string; 
    cell?: { row: number; col: number }; 
    value?: number 
  } | null;
  disabled?: boolean;
}

export default function SudokuBoard({ hintMode = false, currentHint = null, disabled = false }: SudokuBoardProps) {
  const { 
    board, 
    selectedCell, 
    selectedDigit,
    selectCell, 
    initialBoard, 
    notes, 
    wrongCell, 
    clearWrongCell, 
    solution 
  } = useGame();
  const { colors } = useTheme();

  const handleCellSelect = useCallback((row: number, col: number) => {
    if (disabled) return; // Disable cell selection in hint mode
    selectCell(row, col);
  }, [selectCell, disabled]);

  const handleClearWrongCell = useCallback(() => {
    clearWrongCell();
  }, [clearWrongCell]);

  // Selected value helper to avoid recalculating inside loop
  const selectedValue = useMemo(() => {
    if (!selectedCell) return 0;
    return board[selectedCell.row][selectedCell.col];
  }, [board, selectedCell]);

  const renderRow = useCallback((rowIndex: number) => {
    return (
      <View key={rowIndex} style={styles.row}>
        {Array.from({ length: 9 }, (_, colIndex) => {
          const value = board[rowIndex][colIndex];
          
          // Determine selection state
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          
          // Compute highlighting
          let isHighlighted = false;
          let isSameValue = false;
          let isSameValueDigit = false;
          let isHintHighlighted = false;
          let isHintRow = false;
          let isHintCol = false;
          
          // Hint mode highlighting
          if (hintMode && currentHint) {
            // Highlight the specific cell mentioned in hint
            if (currentHint.cell && rowIndex === currentHint.cell.row && colIndex === currentHint.cell.col) {
              isHintHighlighted = true;
            }
            
            // Highlight row/column mentioned in guidance
            if (currentHint.cell) {
              if (rowIndex === currentHint.cell.row) {
                isHintRow = true;
              }
              if (colIndex === currentHint.cell.col) {
                isHintCol = true;
              }
            }
          }
          
          if (selectedCell) {
             // Same row or column
             const sameRow = rowIndex === selectedCell.row;
             const sameCol = colIndex === selectedCell.col;
             // Same box
             const sameBox = Math.floor(rowIndex / 3) === Math.floor(selectedCell.row / 3) && 
                             Math.floor(colIndex / 3) === Math.floor(selectedCell.col / 3);
             
             isHighlighted = sameRow || sameCol || sameBox;
             
             // Same value highlighting (Cell First mode)
             if (selectedValue !== 0 && value === selectedValue) {
                 isSameValue = true;
             }
          }
          
          // Digit First mode: highlight all instances of selected digit
          if (selectedDigit !== null && value === selectedDigit) {
            isSameValueDigit = true;
          }

          const isInitial = initialBoard[rowIndex][colIndex] !== 0;
          const isCorrectlyFilled = value !== 0 && value === solution[rowIndex][colIndex] && !isInitial;
          const isWrong = wrongCell?.row === rowIndex && wrongCell?.col === colIndex;
          const noteKey = `${rowIndex}-${colIndex}`;
          const cellNotes = notes.get(noteKey) || new Set<number>();

          return (
            <SudokuCell
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              value={value}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isSameValue={isSameValue}
              isSameValueDigit={isSameValueDigit}
              isInitial={isInitial}
              isCorrectlyFilled={isCorrectlyFilled}
              isWrong={isWrong}
              notes={cellNotes}
              onSelect={handleCellSelect}
              onClearWrongCell={handleClearWrongCell}
              hintMode={hintMode}
              isHintHighlighted={isHintHighlighted}
              isHintRow={isHintRow}
              isHintCol={isHintCol}
            />
          );
        })}
      </View>
    );
  }, [board, selectedCell, selectedDigit, initialBoard, notes, wrongCell, solution, selectedValue, handleCellSelect, handleClearWrongCell, hintMode, currentHint]);

  // Memoize the entire board to prevent unnecessary re-renders
  const boardRows = useMemo(() => {
    return Array.from({ length: 9 }, (_, rowIndex) => renderRow(rowIndex));
  }, [renderRow]);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.borderThick, shadowColor: colors.cardShadow }]}>
      {boardRows}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
});
