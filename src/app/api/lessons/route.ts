import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createLesson, createAssignment, assignItemToSchedule } from '@/lib/supabase/mutations';
import { enrichActivity } from '@/lib/ai/enrich-activity';

/**
 * POST /api/lessons
 * 
 * Create a new lesson with optional auto-worksheet and YouTube enrichment.
 * 
 * NOTE: This is a legacy route. New code should use /api/activities instead,
 * which provides a unified interface for both lessons and assignments.
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
      links = [],
      steps = [],
      keyQuestions = [],
      materials = '',
      parentNotes = '',
      tags = [],
      assignTo,
      scheduleDate,
      generateWorksheet: shouldGenerateWorksheet,
    } = body;

    console.log('[API/lessons] Creating lesson:', title);

    // Use centralized enrichment instead of inline logic
    const enrichment = await enrichActivity(
      { title, category: type, description: description || instructions },
      { 
        searchYouTube: true,
        generateWorksheet: shouldGenerateWorksheet,
        worksheetInstructions: description || instructions || '',
      }
    );

    // Combine provided links with enriched video links
    const enrichedLinks = [
      ...links,
      ...enrichment.videoLinks,
    ];

    // Format keyQuestions to the expected format if they're strings
    const formattedKeyQuestions = keyQuestions.map((q: string | { text: string }) => 
      typeof q === 'string' ? { text: q } : q
    );
    
    // Convert steps to a readable format for parent_notes if they exist and parentNotes is empty
    let finalParentNotes = parentNotes;
    if (!finalParentNotes && steps.length > 0) {
      const stepsText = steps.map((s: string, i: number) => `**Step ${i + 1}:** ${s}`).join('\n\n');
      finalParentNotes = `## Lesson Steps\n\n${stepsText}`;
    }
    
    // Create the lesson with enriched data
    const lessonData = {
      title,
      type,
      description: description || instructions || '',
      instructions: instructions || description || '',
      key_questions: formattedKeyQuestions,
      materials: materials || '',
      links: enrichedLinks,
      tags: tags || [],
      estimated_minutes: estimated_minutes || 30,
      parent_notes: finalParentNotes || '',
    };

    const newLesson = await createLesson(lessonData);
    console.log('[API/lessons] Lesson created:', newLesson.id);

    // Schedule if date and kids provided
    if (newLesson.id && scheduleDate && assignTo && assignTo.length > 0) {
      await assignItemToSchedule('lesson', newLesson.id, scheduleDate, assignTo);
      console.log('[API/lessons] Scheduled for', assignTo.length, 'kids');
    }

    // If worksheet was generated, also create an assignment for it
    let worksheetId: string | undefined;
    if (enrichment.worksheet) {
      const worksheetAssignment = await createAssignment({
        title: `📝 ${enrichment.worksheet.title || title + ' Worksheet'}`,
        type: 'worksheet',
        deliverable: 'Completed worksheet',
        rubric: [],
        steps: [{ text: 'Complete the worksheet questions' }],
        parent_notes: `Auto-generated from lesson: ${title}`,
        estimated_minutes: 15,
        tags: ['worksheet', 'ai-generated'],
        links: [],
        is_template: false,
        worksheet_data: enrichment.worksheet,
      });

      worksheetId = worksheetAssignment.id;

      // Schedule worksheet too if lesson was scheduled
      if (worksheetAssignment.id && scheduleDate && assignTo && assignTo.length > 0) {
        await assignItemToSchedule('assignment', worksheetAssignment.id, scheduleDate, assignTo);
      }

      console.log('[API/lessons] Worksheet assignment created:', worksheetId);
    }

    const videoCount = enrichment.videoLinks.length;
    console.log('[API/lessons] Complete - hasWorksheet:', !!enrichment.worksheet, '| videoCount:', videoCount);

    return NextResponse.json({ 
      success: true, 
      id: newLesson.id,
      hasWorksheet: !!enrichment.worksheet,
      videoCount,
      worksheetId,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('[API/lessons] Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lessons
 * 
 * Update an existing lesson by ID.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...lessonData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    console.log('[API/lessons] Updating lesson:', id);

    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API/lessons] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API/lessons] Lesson updated successfully');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API/lessons] Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}
