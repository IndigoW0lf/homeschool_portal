import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createLesson, createAssignment, assignItemToSchedule } from '@/lib/supabase/mutations';
import { enrichActivity } from '@/lib/ai/enrich-activity';
import { 
  ActivityInput, 
  ActivityCreateResult,
  activityToLessonPayload,
  activityToAssignmentPayload,
  ActivityLink,
} from '@/types/activity';

/**
 * POST /api/activities
 * 
 * Unified endpoint for creating lessons and assignments.
 * Replaces the duplicated logic in /api/lessons and /api/assignments.
 * 
 * Features:
 * - Auto-enriches with YouTube videos
 * - Auto-generates worksheets when requested
 * - Schedules to kids' calendars
 * - Creates worksheet as separate assignment when generated
 * 
 * @param request - JSON body conforming to ActivityInput
 * @returns ActivityCreateResult
 */
export async function POST(request: NextRequest): Promise<NextResponse<ActivityCreateResult | { error: string }>> {
  try {
    // 1. Auth check
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const body = await request.json();
    const input = parseActivityInput(body);
    
    console.log('[API/activities] Creating:', {
      title: input.title,
      type: input.activityType,
      category: input.category,
      generateWorksheet: input.generateWorksheet,
    });

    // 3. Fetch kid grade levels if we have assigned students
    let targetGradeLevel: string | undefined;
    if (input.assignTo && input.assignTo.length > 0) {
      const { data: kids } = await supabase
        .from('kids')
        .select('grades')
        .in('id', input.assignTo);
      
      if (kids && kids.length > 0) {
        const firstKidGrades = kids[0].grades;
        if (firstKidGrades && firstKidGrades.length > 0) {
          targetGradeLevel = firstKidGrades[0];
          console.log('[API/activities] Target grade level:', targetGradeLevel);
        }
      }
    }

    // 4. Run AI enrichment (YouTube + worksheet)
    const enrichment = await enrichActivity(
      {
        title: input.title,
        category: input.category,
        description: input.description,
      },
      {
        searchYouTube: input.searchYouTube !== false,  // Default to true
        generateWorksheet: input.generateWorksheet,
        worksheetInstructions: input.description,
        ageOrGrade: targetGradeLevel,  // Pass grade level for age-appropriate content
      }
    );

    // 5. Merge enriched links with any provided links
    const allLinks: ActivityLink[] = [
      ...input.links,
      ...enrichment.videoLinks,
    ];

    // 6. Create the activity (lesson or assignment)
    let createdItem: { id: string };
    
    if (input.activityType === 'lesson') {
      const lessonPayload = activityToLessonPayload({
        ...input,
        links: allLinks,
      });
      createdItem = await createLesson(lessonPayload);
      console.log('[API/activities] Lesson created:', createdItem.id);
    } else {
      const assignmentPayload = activityToAssignmentPayload(
        { ...input, links: allLinks },
        enrichment.worksheet  // Attach worksheet to assignment
      );
      createdItem = await createAssignment(assignmentPayload);
      console.log('[API/activities] Assignment created:', createdItem.id);
    }

    // 7. Schedule if requested
    if (createdItem.id && input.scheduleDate && input.assignTo.length > 0) {
      await assignItemToSchedule(
        input.activityType,
        createdItem.id,
        input.scheduleDate,
        input.assignTo
      );
      console.log('[API/activities] Scheduled for:', input.assignTo.length, 'kids');
    }

    // 8. If worksheet was generated for a LESSON, create a separate assignment for it
    let worksheetAssignmentId: string | undefined;
    
    if (input.activityType === 'lesson' && enrichment.worksheet) {
      const worksheetAssignment = await createAssignment({
        title: `📝 ${enrichment.worksheet.title || input.title + ' Worksheet'}`,
        type: 'worksheet',
        deliverable: 'Completed worksheet',
        estimated_minutes: 15,
        steps: [{ text: 'Complete the worksheet questions' }],
        links: [],
        rubric: [],
        tags: ['worksheet', 'ai-generated'],
        is_template: false,
        parent_notes: `Auto-generated from lesson: ${input.title}`,
        worksheet_data: enrichment.worksheet,
      });
      
      worksheetAssignmentId = worksheetAssignment.id;
      
      // Schedule worksheet too
      if (worksheetAssignment.id && input.scheduleDate && input.assignTo.length > 0) {
        await assignItemToSchedule(
          'assignment',
          worksheetAssignment.id,
          input.scheduleDate,
          input.assignTo
        );
      }
      
      console.log('[API/activities] Worksheet assignment created:', worksheetAssignmentId);
    }

    // 9. Build and return result
    const result: ActivityCreateResult = {
      success: true,
      id: createdItem.id,
      type: input.activityType,
      hasWorksheet: !!enrichment.worksheet,
      videoCount: enrichment.videoLinks.length,
      worksheetId: worksheetAssignmentId,
      message: buildSuccessMessage(input, enrichment.videoLinks.length, !!enrichment.worksheet),
    };

    console.log('[API/activities] Success:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[API/activities] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create activity' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse and normalize the request body into an ActivityInput
 * Handles various field name formats from different forms
 */
function parseActivityInput(body: Record<string, unknown>): ActivityInput {
  return {
    title: String(body.title || ''),
    activityType: body.activityType === 'assignment' ? 'assignment' : 'lesson',
    category: String(body.category || body.type || 'Math'),
    description: String(body.description || body.instructions || ''),
    estimatedMinutes: Number(body.estimatedMinutes || body.estimated_minutes || 30),
    
    // Array fields - normalize to string[]
    keyQuestions: normalizeStringArray(body.keyQuestions),
    steps: normalizeStringArray(body.steps),
    rubric: normalizeStringArray(body.rubric),
    
    materials: String(body.materials || ''),
    deliverable: String(body.deliverable || ''),
    parentNotes: String(body.parentNotes || body.parent_notes || ''),
    
    tags: normalizeStringArray(body.tags),
    links: normalizeLinkArray(body.links),
    
    assignTo: normalizeStringArray(body.assignTo),
    scheduleDate: body.scheduleDate ? String(body.scheduleDate) : undefined,
    
    generateWorksheet: Boolean(body.generateWorksheet),
    searchYouTube: body.searchYouTube !== false,  // Default true
    attachedWorksheets: Array.isArray(body.attachedWorksheets) ? body.attachedWorksheets : [],
  };
}

/**
 * Normalize array fields that might be string[], {text: string}[], or undefined
 */
function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  
  return value.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'text' in item) return String(item.text);
    return String(item);
  }).filter(s => s.trim() !== '');
}

/**
 * Normalize link arrays
 */
function normalizeLinkArray(value: unknown): ActivityLink[] {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  
  return value
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      label: String((item as Record<string, unknown>).label || ''),
      url: String((item as Record<string, unknown>).url || ''),
    }))
    .filter(link => link.url.trim() !== '');
}

/**
 * Build a user-friendly success message
 */
function buildSuccessMessage(
  input: ActivityInput, 
  videoCount: number, 
  hasWorksheet: boolean
): string {
  const parts: string[] = [];
  
  if (input.scheduleDate && input.assignTo.length > 0) {
    parts.push(`Scheduled for ${input.assignTo.length} kid${input.assignTo.length > 1 ? 's' : ''}`);
  }
  
  if (videoCount > 0) {
    parts.push(`${videoCount} video${videoCount > 1 ? 's' : ''} found`);
  }
  
  if (hasWorksheet) {
    parts.push('worksheet generated');
  }
  
  if (parts.length === 0) {
    return `${input.activityType === 'lesson' ? 'Lesson' : 'Assignment'} created successfully`;
  }
  
  return `Created with: ${parts.join(', ')}`;
}
