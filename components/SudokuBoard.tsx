import React, { useCallback } from 'react';
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

  return (
    <View style={styles.container}>
      {Array.from({ length: 9 }, (_, rowIndex) => renderRow(rowIndex))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#1E2939',
    padding: 2,
  },
  row: {
    flexDirection: 'row',
  },
});
