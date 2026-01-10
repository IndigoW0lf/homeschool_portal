import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const REFINE_LESSON_PROMPT = `
You are an expert homeschool curriculum designer. Your task is to refine an existing lesson based on user feedback.

You will receive:
1. The current lesson data as JSON
2. User feedback describing what changes they want

Apply the requested changes while preserving the overall structure and educational quality.
Return the COMPLETE refined lesson as valid JSON matching the schema below.

**Common refinement requests and how to handle them:**
- "Add a video about X" → Add relevant video discussion to parentNotes, suggest a YouTube search term
- "Make it more hands-on" → Add activities to steps and materials list
- "Add discussion questions" → Enhance keyQuestions array
- "Shorten the lesson" → Reduce estimatedMinutes and simplify content
- "Focus on Y instead of Z" → Adjust description and keyQuestions to shift focus

**Output format:**
Return ONLY valid JSON matching this schema:
{
  "title": "Lesson title",
  "type": "Subject category",
  "description": "Rich description with markdown formatting",
  "keyQuestions": ["Question 1", "Question 2", ...],
  "materials": "Comma-separated list of materials",
  "estimatedMinutes": 30,
  "parentNotes": "Teaching notes, steps, video suggestions, etc.",
  "tags": ["tag1", "tag2"],
  "links": [{ "label": "Resource name", "url": "https://..." }]
}

Be creative but practical. Maintain the warm, supportive tone appropriate for homeschool families.
`;

interface LessonData {
  title: string;
  type: string;
  description: string;
  keyQuestions: { text: string }[] | string[];
  materials: string;
  estimatedMinutes: number;
  parentNotes?: string;
  tags?: string[];
  links?: { label: string; url: string }[];
}

interface RefineRequest {
  lessonData: LessonData;
  feedback: string;
}

/**
 * POST /api/refine-lesson
 * Refine an existing lesson based on user feedback
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RefineRequest = await request.json();
    const { lessonData, feedback } = body;

    if (!lessonData || !feedback) {
      return NextResponse.json(
        { error: 'Lesson data and feedback are required' },
        { status: 400 }
      );
    }

    console.log('[API] Refining lesson:', lessonData.title);
    console.log('[API] User feedback:', feedback);

    // Normalize keyQuestions to strings for the prompt
    const normalizedLesson = {
      ...lessonData,
      keyQuestions: lessonData.keyQuestions?.map(q => 
        typeof q === 'string' ? q : q.text
      ) || [],
    };

    const userMessage = `
## Current Lesson:
${JSON.stringify(normalizedLesson, null, 2)}

## User Feedback (apply these changes):
${feedback}

Please return the refined lesson as valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: REFINE_LESSON_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const refined = JSON.parse(content);
    
    // Normalize keyQuestions back to the expected format
    if (Array.isArray(refined.keyQuestions)) {
      refined.keyQuestions = refined.keyQuestions.map((q: string) => ({ text: q }));
    }
    
    console.log('[API] Lesson refined successfully');

    return NextResponse.json({
      success: true,
      data: refined,
    });
  } catch (error) {
    console.error('[API] Error refining lesson:', error);
    return NextResponse.json(
      { error: 'Failed to refine lesson' },
      { status: 500 }
    );
  }
}
