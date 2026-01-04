import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getOpenAIClient, AI_MODELS } from '@/lib/ai/config';

interface ParsedCurriculumItem {
  taskName: string;
  course: string;
  subject: string;
  date: string;
  score: number | null;
  itemType: string;
}

const SYSTEM_PROMPT = `You are an expert at parsing educational curriculum data. 
Your job is to take raw text from curriculum export reports (CSV, TSV, or pasted text) and extract structured data.

For each item, extract:
- taskName: The name of the task/lesson/assignment
- course: The course or curriculum name
- subject: The subject area (Reading, Math, Science, Language Arts, History, Writing, Art, etc.)
- date: The date in YYYY-MM-DD format
- score: The score as a number (0-100), or null if not graded
- itemType: One of "assessment", "practice", "video", "supplemental", or "lesson"

Rules:
1. Parse ALL rows, don't skip any
2. Handle various date formats (MM/DD/YYYY, YYYY-MM-DD, etc.) and convert to YYYY-MM-DD
3. Extract percentages as numbers (83% → 83)
4. Determine subject from the course name (e.g., "Reading Comprehension: Level E" → "Reading")
5. Determine itemType from the task name (Quiz/Assessment → "assessment", Practice → "practice", Video → "video", Supplemental → "supplemental", otherwise → "lesson")
6. Handle embedded quotes and special characters in task names
7. Skip header rows and disclaimer text (like "This grade report was printed...")

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "taskName": "Example Task",
      "course": "Example Course",
      "subject": "Reading",
      "date": "2025-10-27",
      "score": 83,
      "itemType": "assessment"
    }
  ],
  "parseWarnings": ["any warnings about ambiguous or unparseable data"]
}`;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawText, source = 'unknown' } = await request.json();
    
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'Missing rawText' }, { status: 400 });
    }

    // Truncate if too long (avoid token limits)
    const maxLength = 50000; // ~15k tokens
    const truncatedText = rawText.length > maxLength 
      ? rawText.substring(0, maxLength) + '\n... (truncated)'
      : rawText;

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.default,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Parse this curriculum data from ${source}:\n\n${truncatedText}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 16000, // Allow for many items
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const parsed = JSON.parse(content) as {
      items: ParsedCurriculumItem[];
      parseWarnings: string[];
    };

    // Validate and clean up the parsed data
    const validItems = parsed.items.filter(item => {
      return item.taskName && item.course && item.date && 
             /^\d{4}-\d{2}-\d{2}$/.test(item.date);
    });

    return NextResponse.json({
      success: true,
      items: validItems,
      warnings: parsed.parseWarnings || [],
      totalParsed: parsed.items.length,
      validCount: validItems.length,
      skipped: parsed.items.length - validItems.length,
    });
    
  } catch (error) {
    console.error('AI parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
