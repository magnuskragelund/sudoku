import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGame } from '../context/GameContext';
import SudokuCell from './SudokuCell';

export default function SudokuBoard() {
  const { board, selectedCell, selectCell } = useGame();

  const handleCellSelect = useCallback((row: number, col: number) => {
    selectCell(row, col);
  }, [selectCell]);

  const renderRow = useCallback((rowIndex: number) => {
    return (
      <View key={rowIndex} style={styles.row}>
        {Array.from({ length: 9 }, (_, colIndex) => (
          <SudokuCell
            key={`${rowIndex}-${colIndex}`}
            row={rowIndex}
            col={colIndex}
            value={board[rowIndex][colIndex]}
            isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
            selectedCell={selectedCell}
            onSelect={() => handleCellSelect(rowIndex, colIndex)}
          />
        ))}
      </View>
    );
  }, [board, selectedCell, handleCellSelect]);

  // Memoize the entire board to prevent unnecessary re-renders
  const boardRows = useMemo(() => {
    return Array.from({ length: 9 }, (_, rowIndex) => renderRow(rowIndex));
  }, [renderRow]);

  return (
    <View style={styles.container}>
      {boardRows}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 0,
    width: '100%', // Ensure board takes full available width
    aspectRatio: 1, // Maintain square shape
  },
  row: {
    flexDirection: 'row',
    flex: 1, // Each row takes equal space
  },
});
