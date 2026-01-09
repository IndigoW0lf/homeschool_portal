import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAssignment, assignItemToSchedule } from '@/lib/supabase/mutations';
import { generateWorksheet } from '@/lib/ai/worksheet-generator';
import { searchEducationalVideos } from '@/lib/resources/youtube';
import { isYouTubeConfigured } from '@/lib/ai/resource-enricher';

/**
 * POST /api/assignments
 * Create a new assignment with optional auto-worksheet and YouTube enrichment
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
        // Continue without videos
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
          undefined,
          description || instructions || ''
        );
        console.log('[API] Worksheet generated successfully');
      } catch (wsError) {
        console.error('[API] Worksheet generation failed (non-fatal):', wsError);
        // Continue without worksheet
      }
    }

    // Create the assignment
    const assignmentData = {
      title,
      type: type || null,
      instructions: instructions || description || '',
      estimated_minutes: estimated_minutes || 30,
      steps: steps?.map((s: string) => ({ text: s })) || [],
      links: enrichedLinks,
      deliverable: null,
      rubric: [],
      tags: [],
      is_template: false,
      parent_notes: null,
      worksheet_data: worksheetData, // Attach generated worksheet if any
    };

    const newAssignment = await createAssignment(assignmentData);

    // Schedule if date and kids provided
    if (newAssignment.id && scheduleDate && assignTo && assignTo.length > 0) {
      await assignItemToSchedule('assignment', newAssignment.id, scheduleDate, assignTo);
    }

    return NextResponse.json({ 
      success: true, 
      id: newAssignment.id,
      hasWorksheet: !!worksheetData,
      videoCount: enrichedLinks.filter(l => l.url?.includes('youtube')).length,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
