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
 * Format the board as a compact string for the AI (optimized for speed)
 */
function formatBoard(board: number[][]): string {
  let output = 'Board:\n';
  for (let row = 0; row < 9; row++) {
    let rowStr = '';
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      rowStr += value === 0 ? '.' : value.toString();
      if (col === 2 || col === 5) rowStr += '|';
    }
    output += rowStr + '\n';
    if (row === 2 || row === 5) output += '---+---+---\n';
  }
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
    ? `Place ${hint.value} at r${hint.cell.row + 1}c${hint.cell.col + 1}.`
    : '';

  const prompt = `${boardString}
Technique: ${hint.technique.replace('_', ' ')}
${hint.explanation}
${hint.guidance}
${cellInfo}

Explain this technique for this board. Be direct and specific.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Using gpt-4o-mini for best speed/quality balance
        // For even faster responses, consider 'gpt-3.5-turbo' (faster but lower quality)
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sudoku tutor. Direct explanations. No conversational phrases.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 600,
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
