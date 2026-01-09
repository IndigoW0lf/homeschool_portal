import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createLesson, assignItemToSchedule } from '@/lib/supabase/mutations';
import { generateWorksheet } from '@/lib/ai/worksheet-generator';
import { searchEducationalVideos } from '@/lib/resources/youtube';
import { isYouTubeConfigured } from '@/lib/ai/resource-enricher';

/**
 * POST /api/lessons
 * Create a new lesson with optional auto-worksheet and YouTube enrichment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      type,
      description,
      instructions,
      estimated_minutes,
      steps,
      links = [],
      assignTo,
      scheduleDate,
      generateWorksheet: shouldGenerateWorksheet,
    } = body;

    // Initialize links array with any provided links
    let enrichedLinks = [...links];
    let worksheetData = null;

    // 1. Search for relevant YouTube videos if API key is configured
    if (isYouTubeConfigured()) {
      try {
        console.log('[API] Searching YouTube for:', title);
        const videos = await searchEducationalVideos(title, {
          subject: type,
          maxResults: 2,
        });
        
        // Add videos as links
        for (const video of videos) {
          enrichedLinks.push({
            label: `📺 ${video.title}`,
            url: video.url,
          });
        }
        console.log('[API] Found', videos.length, 'videos to attach');
      } catch (ytError) {
        console.error('[API] YouTube search failed (non-fatal):', ytError);
        // Continue without videos - don't fail the request
      }
    } else {
      console.log('[API] YouTube API not configured, skipping video search');
    }

    // 2. Generate worksheet if requested
    if (shouldGenerateWorksheet) {
      try {
        console.log('[API] Generating worksheet for:', title);
        worksheetData = await generateWorksheet(
          title,
          undefined, // age - could be inferred from kids later
          description || instructions || ''
        );
        console.log('[API] Worksheet generated successfully');
      } catch (wsError) {
        console.error('[API] Worksheet generation failed (non-fatal):', wsError);
        // Continue without worksheet - don't fail the request
      }
    }

    // Create the lesson with enriched data
    const lessonData = {
      title,
      type,
      description: description || instructions || '',
      instructions: instructions || description || '',
      key_questions: [],
      materials: '',
      links: enrichedLinks,
      tags: [],
      estimated_minutes: estimated_minutes || 30,
      parent_notes: '',
    };

    const newLesson = await createLesson(lessonData);
    let scheduleItemIds: string[] = [];

    // Schedule if date and kids provided
    if (newLesson.id && scheduleDate && assignTo && assignTo.length > 0) {
      await assignItemToSchedule('lesson', newLesson.id, scheduleDate, assignTo);
    }

    // 3. If worksheet was generated, also create an assignment for it
    if (worksheetData) {
      // Import the assignment creation
      const { createAssignment } = await import('@/lib/supabase/mutations');
      
      const worksheetAssignment = await createAssignment({
        title: `📝 ${worksheetData.title || title + ' Worksheet'}`,
        type: 'worksheet',
        deliverable: null,
        rubric: [],
        steps: [{ text: 'Complete the worksheet questions' }],
        parent_notes: 'Auto-generated from lesson',
        estimated_minutes: 15,
        tags: ['worksheet', 'ai-generated'],
        links: [],
        is_template: false,
        worksheet_data: worksheetData,
      });

      // Schedule worksheet too if lesson was scheduled
      if (worksheetAssignment.id && scheduleDate && assignTo && assignTo.length > 0) {
        await assignItemToSchedule('assignment', worksheetAssignment.id, scheduleDate, assignTo);
      }

      console.log('[API] Worksheet assignment created:', worksheetAssignment.id);
    }

    return NextResponse.json({ 
      success: true, 
      id: newLesson.id,
      hasWorksheet: !!worksheetData,
      videoCount: enrichedLinks.filter(l => l.url?.includes('youtube')).length,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
