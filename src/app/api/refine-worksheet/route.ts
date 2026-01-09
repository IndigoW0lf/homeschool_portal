import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { WorksheetData } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const REFINE_SYSTEM_PROMPT = `
You are an expert educational content editor. Your task is to refine an existing worksheet based on user feedback.

You will receive:
1. The current worksheet data as JSON
2. User feedback describing what changes they want

Apply the requested changes while preserving the overall structure and quality of the worksheet.
Return the COMPLETE refined worksheet as valid JSON matching the original schema.

**Common refinement requests and how to handle them:**
- "Remove word X from question Y" → Edit the specific question text
- "Add blanks to fill-in-the-blank" → Add underscores (____) where answers should go
- "Change question X to multiple choice" → Convert the question type and add options
- "This question gives away the answer" → Rephrase to be more neutral
- "Question X is just information, not a question" → Rewrite as an actual question

**Output format:**
Return ONLY valid JSON matching the WorksheetData schema:
{
  "title": "...",
  "instructions": "...",
  "sections": [
    {
      "title": "Section Title",
      "items": [
        {
          "id": "unique-id",
          "type": "text|multiple_choice|fill_in_blank|drawing_space|matching|true_false|word_bank|creative_prompt",
          "question": "Question text",
          "options": ["Option A", "Option B"] (for multiple_choice, matching, word_bank),
          "answer": "Correct answer",
          "space_lines": 3 (for text type)
        }
      ]
    }
  ]
}
`;

interface RefineRequest {
  worksheetData: WorksheetData;
  feedback: string;
}

/**
 * POST /api/refine-worksheet
 * Refine an existing worksheet based on user feedback
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RefineRequest = await request.json();
    const { worksheetData, feedback } = body;

    if (!worksheetData || !feedback) {
      return NextResponse.json(
        { error: 'Worksheet data and feedback are required' },
        { status: 400 }
      );
    }

    console.log('[API] Refining worksheet:', worksheetData.title);
    console.log('[API] User feedback:', feedback);

    const userMessage = `
## Current Worksheet:
${JSON.stringify(worksheetData, null, 2)}

## User Feedback (apply these changes):
${feedback}

Please return the refined worksheet as valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: REFINE_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5, // Lower temperature for more precise edits
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const refined: WorksheetData = JSON.parse(content);
    
    console.log('[API] Worksheet refined successfully');

    return NextResponse.json({
      success: true,
      data: refined,
    });
  } catch (error) {
    console.error('[API] Error refining worksheet:', error);
    return NextResponse.json(
      { error: 'Failed to refine worksheet' },
      { status: 500 }
    );
  }
}
