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
          "type": "text" | "multiple_choice" | "fill_in_blank" | "drawing_space" | "matching" | "true_false" | "word_bank" | "creative_prompt",
          "question": "Question text",
          "options": ["Option A", "Option B"] (only for multiple_choice, matching, word_bank),
          "answer": "Correct answer" (for answer key),
          "space_lines": 3 (number of lines for text answers)
        }
      ]
    }
  ]
}

**Question Type Guidelines:**
- "text": Open-ended questions (reflection, analysis, explanation)
- "multiple_choice": 3-4 options, use sparingly
- "fill_in_blank": Use underscores (____) for blanks, great for vocabulary
- "drawing_space": Creative expression, diagrams, illustrations
- "matching": Connect terms to definitions (use options array for pairs)
- "true_false": Quick knowledge checks
- "word_bank": Provide word choices to fill in blanks
- "creative_prompt": Open-ended creative writing or art prompts

**VARIETY IS KEY:**
- Mix question types based on the topic and age
- For younger kids (K-2): More drawing, matching, true/false, simple fill-in-blank
- For middle grades (3-5): Balance of all types, include some reasoning questions
- For older kids (6-8): More text responses, analysis, creative prompts
- For high school (9-12): Deeper analysis, essay prompts, critical thinking

**Respond creatively to the specific instructions provided.** If they want "deeper thinking" questions, emphasize reflection and analysis. If they want "fun" make it playful with creative prompts.

Ensure the tone is encouraging and age-appropriate.
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
