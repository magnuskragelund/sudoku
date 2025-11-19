import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import SudokuCell from './SudokuCell';

export default function SudokuBoard() {
  const { 
    board, 
    selectedCell, 
    selectCell, 
    initialBoard, 
    notes, 
    wrongCell, 
    clearWrongCell, 
    solution 
  } = useGame();
  const { colors } = useTheme();

  const handleCellSelect = useCallback((row: number, col: number) => {
    selectCell(row, col);
  }, [selectCell]);

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
          
          if (selectedCell) {
             // Same row or column
             const sameRow = rowIndex === selectedCell.row;
             const sameCol = colIndex === selectedCell.col;
             // Same box
             const sameBox = Math.floor(rowIndex / 3) === Math.floor(selectedCell.row / 3) && 
                             Math.floor(colIndex / 3) === Math.floor(selectedCell.col / 3);
             
             isHighlighted = sameRow || sameCol || sameBox;
             
             // Same value highlighting
             if (selectedValue !== 0 && value === selectedValue) {
                 isSameValue = true;
             }
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
              isInitial={isInitial}
              isCorrectlyFilled={isCorrectlyFilled}
              isWrong={isWrong}
              notes={cellNotes}
              onSelect={handleCellSelect}
              onClearWrongCell={handleClearWrongCell}
            />
          );
        })}
      </View>
    );
  }, [board, selectedCell, initialBoard, notes, wrongCell, solution, selectedValue, handleCellSelect, handleClearWrongCell]);

  // Memoize the entire board to prevent unnecessary re-renders
  const boardRows = useMemo(() => {
    return Array.from({ length: 9 }, (_, rowIndex) => renderRow(rowIndex));
  }, [renderRow]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElevated }]}>
      {boardRows}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    width: '100%', // Ensure board takes full available width
    aspectRatio: 1, // Maintain square shape
  },
  row: {
    flexDirection: 'row',
    flex: 1, // Each row takes equal space
  },
});
