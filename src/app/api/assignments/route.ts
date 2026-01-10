import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAssignment, assignItemToSchedule } from '@/lib/supabase/mutations';
import { enrichActivity } from '@/lib/ai/enrich-activity';

/**
 * POST /api/assignments
 * 
 * Create a new assignment with optional auto-worksheet and YouTube enrichment.
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
      steps,
      links = [],
      deliverable,
      rubric = [],
      parentNotes,
      tags = [],
      assignTo,
      scheduleDate,
      generateWorksheet: shouldGenerateWorksheet,
    } = body;

    console.log('[API/assignments] Creating assignment:', title);

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

    // Create the assignment
    // Note: AssignmentItemRow doesn't have 'instructions' column
    // Use steps for step-by-step instructions, and parent_notes for teacher notes
    const assignmentData = {
      title,
      type: type || null,
      estimated_minutes: estimated_minutes || 30,
      // Convert steps to the expected format
      steps: Array.isArray(steps) 
        ? steps.map((s: string | { text: string }) => 
            typeof s === 'string' ? { text: s } : s
          ) 
        : [],
      links: enrichedLinks,
      deliverable: deliverable || null,
      // Convert rubric to the expected format
      rubric: Array.isArray(rubric)
        ? rubric.map((r: string | { text: string }) =>
            typeof r === 'string' ? { text: r } : r
          )
        : [],
      tags: tags || [],
      is_template: false,
      parent_notes: parentNotes || description || instructions || null,
      worksheet_data: enrichment.worksheet,
    };

    const newAssignment = await createAssignment(assignmentData);
    console.log('[API/assignments] Assignment created:', newAssignment.id);

    // Schedule if date and kids provided
    if (newAssignment.id && scheduleDate && assignTo && assignTo.length > 0) {
      await assignItemToSchedule('assignment', newAssignment.id, scheduleDate, assignTo);
      console.log('[API/assignments] Scheduled for', assignTo.length, 'kids');
    }

    const videoCount = enrichment.videoLinks.length;
    console.log('[API/assignments] Complete - hasWorksheet:', !!enrichment.worksheet, '| videoCount:', videoCount);

    return NextResponse.json({ 
      success: true, 
      id: newAssignment.id,
      hasWorksheet: !!enrichment.worksheet,
      videoCount,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('[API/assignments] Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
