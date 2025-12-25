/**
 * OpenAI Service
 * Handles AI-powered hint elaboration
 */

import Constants from 'expo-constants';

interface ElaborateHintParams {
  board: number[][];
  hint: {
    technique: string;
    explanation: string;
    guidance: string;
    cell?: { row: number; col: number };
    value?: number;
  };
}

/**
 * Format the board as a readable string for the AI
 */
function formatBoard(board: number[][]): string {
  let output = 'Current Sudoku board state:\n';
  output += '  1 2 3   4 5 6   7 8 9\n';
  output += '+-------+-------+-------+\n';
  
  for (let row = 0; row < 9; row++) {
    let rowStr = `${row + 1}|`;
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      rowStr += value === 0 ? ' .' : ` ${value}`;
      if (col === 2 || col === 5) {
        rowStr += ' |';
      }
    }
    rowStr += ' |\n';
    output += rowStr;
    if (row === 2 || row === 5) {
      output += '+-------+-------+-------+\n';
    }
  }
  output += '+-------+-------+-------+\n';
  
  return output;
}

/**
 * Call OpenAI API to elaborate on a hint
 */
export async function elaborateHint(params: ElaborateHintParams): Promise<string> {
  // Try to get API key from environment variables or expo config
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || Constants.expoConfig?.extra?.openaiApiKey;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY environment variable.');
  }

  const boardString = formatBoard(params.board);
  const hint = params.hint;
  
  const cellInfo = hint.cell && hint.value 
    ? `The hint suggests placing ${hint.value} at row ${hint.cell.row + 1}, column ${hint.cell.col + 1}.`
    : 'The hint provides guidance but does not specify a particular cell to fill.';

  const prompt = `You are a Sudoku tutor providing a detailed explanation of a solving technique. The student is working on a specific puzzle and has received a hint.

${boardString}

The hint they received is:
Technique: ${hint.technique.replace('_', ' ')}
Explanation: ${hint.explanation}
Guidance: ${hint.guidance}
${cellInfo}

Provide a detailed explanation of this hint specifically for this puzzle state. Start by acknowledging that this explanation is tailored to the current board state shown above. Then explain:
1. Why this technique applies to this specific puzzle configuration
2. What specific cells, rows, columns, or boxes to examine in the board above
3. Step-by-step reasoning using the actual board state
4. How this connects to other solving strategies visible in this puzzle

Write in a direct, instructional tone. Do not use conversational phrases like "Absolutely", "Let's break it down", "Here's how", or similar chat-like language. Start directly with the explanation, making it clear this is specific to the puzzle state shown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Sudoku tutor providing direct, instructional explanations. Write in a clear, educational tone without conversational phrases. Focus on explaining techniques specific to the puzzle state provided.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const elaboration = data.choices?.[0]?.message?.content;
    
    if (!elaboration) {
      throw new Error('No response from OpenAI API');
    }

    return elaboration.trim();
  } catch (error: any) {
    if (error.message.includes('API key')) {
      throw error;
    }
    throw new Error(`Failed to elaborate hint: ${error.message || 'Unknown error'}`);
  }
}
