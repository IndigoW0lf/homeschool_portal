import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { enrichActivity } from '@/lib/ai/enrich-activity';

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
  searchYouTube?: boolean;  // Option to search for videos
  assignTo?: string[];  // Kid IDs to determine grade level
}

/**
 * POST /api/refine-lesson
 * Refine an existing lesson based on user feedback, with optional YouTube enrichment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RefineRequest = await request.json();
    const { lessonData, feedback, searchYouTube = true, assignTo } = body;  // Default to true

    if (!lessonData || !feedback) {
      return NextResponse.json(
        { error: 'Lesson data and feedback are required' },
        { status: 400 }
      );
    }

    console.log('[API/refine-lesson] Refining lesson:', lessonData.title);
    console.log('[API/refine-lesson] User feedback:', feedback);

    // Fetch kid grade levels if we have assigned students
    let targetGradeLevel: string | undefined;
    if (assignTo && assignTo.length > 0) {
      const { data: kids } = await supabase
        .from('kids')
        .select('grades')
        .in('id', assignTo);
      
      if (kids && kids.length > 0) {
        // Use the first kid's first grade as the target
        const firstKidGrades = kids[0].grades;
        if (firstKidGrades && firstKidGrades.length > 0) {
          targetGradeLevel = firstKidGrades[0];
          console.log('[API/refine-lesson] Target grade level:', targetGradeLevel);
        }
      }
    }

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
    
    console.log('[API/refine-lesson] AI refinement complete');

    // Search for YouTube videos based on the refined lesson
    let videoCount = 0;
    if (searchYouTube) {
      console.log('[API/refine-lesson] Searching for YouTube videos...');
      const enrichment = await enrichActivity(
        { 
          title: refined.title, 
          category: refined.type, 
          description: refined.description 
        },
        { 
          searchYouTube: true, 
          generateWorksheet: false,  // Don't generate worksheets during refine
          ageOrGrade: targetGradeLevel,
        }
      );
      
      if (enrichment.videoLinks.length > 0) {
        // Merge video links with any existing links
        const existingLinks = refined.links || [];
        const existingUrls = new Set(existingLinks.map((l: { url: string }) => l.url));
        
        // Only add videos that aren't already in the links
        const newVideos = enrichment.videoLinks.filter(v => !existingUrls.has(v.url));
        refined.links = [...existingLinks, ...newVideos];
        videoCount = newVideos.length;
        
        console.log('[API/refine-lesson] Added', videoCount, 'YouTube videos');
      }
    }

    console.log('[API/refine-lesson] Done');

    return NextResponse.json({
      success: true,
      data: refined,
      videoCount,  // Tell the client how many videos were added
    });
  } catch (error) {
    console.error('[API/refine-lesson] Error refining lesson:', error);
    return NextResponse.json(
      { error: 'Failed to refine lesson' },
      { status: 500 }
    );
  }
}
