import { OpenAI } from 'openai';
import { WorksheetData } from '@/types';
import { createServerClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WORKSHEET_SYSTEM_PROMPT = `
You are an expert educational content creator for homeschooled children.
Your task is to generate a high-quality, engaging worksheet based on the provided topic and context.
The output MUST be valid JSON matching the following schema:

{
  "title": "Creative Title",
  "instructions": "Overall instructions for the student",
  "sections": [
    {
      "title": "Section Title (optional)",
      "items": [
        {
          "id": "unique-id-1",
          "type": "text" | "multiple_choice" | "fill_in_blank" | "drawing_space",
          "question": "Question text",
          "options": ["Option A", "Option B"] (only for multiple_choice),
          "answer": "Correct answer" (for answer key),
          "space_lines": 3 (number of lines for text answers)
        }
      ]
    }
  ]
}

Guidelines:
- "text": A standard open-ended question.
- "multiple_choice": Provide 3-4 options.
- "fill_in_blank": Use underscores (____) for the blank.
- "drawing_space": Prompts the child to draw something.
- Adjust complexity based on the child's age/grade if provided.
- usage of "id" should be short random strings.
- Ensure the tone is encouraging and fun.
`;

export async function generateWorksheet(
  topic: string,
  age?: number | string,
  instructions?: string
): Promise<WorksheetData> {
  const context = `
  Topic: ${topic}
  Target Age: ${age || 'Not specified'}
  Additional Instructions: ${instructions || 'None'}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: WORKSHEET_SYSTEM_PROMPT },
        { role: 'user', content: `Generate a worksheet for:\n${context}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content generated');

    const parsed = JSON.parse(content);
    return parsed as WorksheetData;
  } catch (error) {
    console.error('Error generating worksheet:', error);
    throw new Error('Failed to generate worksheet');
  }
}
