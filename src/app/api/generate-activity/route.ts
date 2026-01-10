import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { enrichActivity } from '@/lib/ai/enrich-activity';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACTIVITY_GENERATION_PROMPT = `
You are an expert homeschool curriculum designer creating engaging, age-appropriate learning activities.

Generate a complete activity based on the provided title, category, and context. Your output MUST be valid JSON matching this schema:

{
  "description": "Detailed description of the activity (2-4 paragraphs, use markdown formatting with **bold** for emphasis)",
  "steps": ["Step 1 text", "Step 2 text", ...],
  "keyQuestions": ["Discussion question 1", "Discussion question 2", ...],
  "materials": "Comma-separated list of materials needed",
  "estimatedMinutes": number (15, 30, 45, or 60)
}

**Guidelines:**
- For LESSONS: Focus on teaching concepts with explanation, examples, and discussion
- For ASSIGNMENTS: Focus on practice, application, and measurable outcomes
- Tailor complexity to the grade level provided
- Include 3-5 clear, actionable steps
- Include 2-4 thought-provoking discussion questions
- Keep materials simple and commonly available at home

**Grade Level Guidance:**
- K-2: Simple vocabulary, hands-on activities, short duration (15-20 min)
- 3-5: More reading/writing, introduce reasoning, medium duration (20-30 min)
- 6-8: Abstract thinking, research components, longer duration (30-45 min)
- 9-12: Complex analysis, independent work, extended duration (45-60 min)

Be creative, engaging, and practical for a homeschool setting.
Do NOT include any links or URLs in your response - those will be added separately.
`;

interface GenerateRequest {
  title: string;
  category: string;
  activityType: 'lesson' | 'assignment';
  description?: string;
  kidNames?: string[];
  gradeLevel?: string;
  searchYouTube?: boolean;  // Whether to search for YouTube videos
}

interface GeneratedActivity {
  description: string;
  steps: string[];
  keyQuestions: string[];
  materials: string;
  estimatedMinutes: number;
}

/**
 * POST /api/generate-activity
 * Generate activity content using AI based on title and context,
 * with optional YouTube video enrichment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const {
      title,
      category,
      activityType,
      description,
      kidNames,
      gradeLevel,
      searchYouTube = true,  // Default to true
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Build context for the AI
    const context = `
Activity Type: ${activityType === 'lesson' ? 'Lesson (teaching/instruction)' : 'Assignment (practice/application)'}
Title: ${title}
Category/Subject: ${category || 'General'}
${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
${kidNames?.length ? `Students: ${kidNames.join(', ')}` : ''}
${description ? `User's Notes/Description: ${description}` : ''}
`.trim();

    console.log('[API/generate-activity] Generating activity:', { title, category, activityType, gradeLevel });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ACTIVITY_GENERATION_PROMPT },
        { role: 'user', content: `Generate a ${activityType} for:\n\n${context}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const generated: GeneratedActivity = JSON.parse(content);
    
    console.log('[API/generate-activity] AI generation complete:', {
      stepsCount: generated.steps?.length,
      questionsCount: generated.keyQuestions?.length,
      estimatedMinutes: generated.estimatedMinutes,
    });

    // Enrich with YouTube videos
    let suggestedLinks: { label: string; url: string }[] = [];
    let videoCount = 0;
    
    if (searchYouTube) {
      console.log('[API/generate-activity] Searching for YouTube videos...');
      const enrichment = await enrichActivity(
        { title, category, description: generated.description },
        { searchYouTube: true, generateWorksheet: false }
      );
      
      if (enrichment.videoLinks.length > 0) {
        suggestedLinks = enrichment.videoLinks;
        videoCount = enrichment.videoLinks.length;
        console.log('[API/generate-activity] Found', videoCount, 'YouTube videos');
      } else if (enrichment.videoError) {
        console.log('[API/generate-activity] YouTube search failed:', enrichment.videoError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...generated,
        suggestedLinks,
      },
      videoCount,
    });
  } catch (error) {
    console.error('[API/generate-activity] Error generating activity:', error);
    return NextResponse.json(
      { error: 'Failed to generate activity' },
      { status: 500 }
    );
  }
}

