/**
 * Unified Activity Types
 * 
 * This module provides a single source of truth for activity data structures,
 * bridging the gap between UI components (camelCase) and database rows (snake_case).
 * 
 * Use `ActivityInput` for form data and API requests.
 * Use the conversion functions to transform between layers.
 */

import { 
  LessonRow, 
  AssignmentItemRow, 
  WorksheetData,
  LessonLink,
  AssignmentStep,
  AssignmentRubricItem 
} from './index';

// ============================================
// CORE INPUT TYPE
// ============================================

/**
 * Unified input type for creating or editing lessons/assignments.
 * This is what forms collect and what the API accepts.
 */
export interface ActivityInput {
  /** Activity title - required */
  title: string;
  
  /** Whether this is a lesson (teaching) or assignment (practice) */
  activityType: 'lesson' | 'assignment';
  
  /** Subject category: Math, Science, History, etc. */
  category: string;
  
  /** Main description/instructions content */
  description: string;
  
  /** Estimated time to complete in minutes */
  estimatedMinutes: number;
  
  // === Lesson-specific fields ===
  
  /** Key discussion questions for the lesson */
  keyQuestions: string[];
  
  /** Materials needed */
  materials: string;
  
  // === Assignment-specific fields ===
  
  /** Step-by-step instructions for the student */
  steps: string[];
  
  /** What the student should turn in */
  deliverable: string;
  
  /** Success criteria / rubric items */
  rubric: string[];
  
  // === Shared fields ===
  
  /** Private notes for the parent/teacher */
  parentNotes: string;
  
  /** Categorization tags */
  tags: string[];
  
  /** External resource links */
  links: ActivityLink[];
  
  // === Scheduling ===
  
  /** Kid IDs to assign this activity to */
  assignTo: string[];
  
  /** Date to schedule (YYYY-MM-DD format) */
  scheduleDate?: string;
  
  // === AI Options ===
  
  /** Whether to auto-generate a worksheet */
  generateWorksheet: boolean;
  
  /** Pre-generated worksheets to attach */
  attachedWorksheets?: WorksheetData[];
  
  /** Whether to search for YouTube videos */
  searchYouTube?: boolean;
}

/**
 * Link structure used in activities
 */
export interface ActivityLink {
  label: string;
  url: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Response from POST /api/activities
 */
export interface ActivityCreateResult {
  success: boolean;
  id: string;
  type: 'lesson' | 'assignment';
  hasWorksheet: boolean;
  videoCount: number;
  worksheetId?: string;
  message?: string;
}

// ============================================
// DATABASE PAYLOAD TYPES
// ============================================

/**
 * Payload for creating a lesson (matches what mutations.createLesson expects)
 */
export interface LessonCreatePayload {
  title: string;
  type: string | null;
  description: string | null;
  instructions: string | null;
  key_questions: Array<{ text: string }> | null;
  materials: string | null;
  links: LessonLink[] | null;
  tags: string[];
  estimated_minutes: number;
  parent_notes: string | null;
}

/**
 * Payload for creating an assignment (matches what mutations.createAssignment expects)
 * Note: assignment_items table does NOT have an 'instructions' column
 * - Use 'deliverable' for what to turn in
 * - Use 'steps' for step-by-step instructions
 * - Use 'parent_notes' for teacher notes
 */
export interface AssignmentCreatePayload {
  title: string;
  type: string | null;
  estimated_minutes: number;
  steps: AssignmentStep[] | null;
  links: LessonLink[] | null;
  deliverable: string | null;
  rubric: AssignmentRubricItem[] | null;
  tags: string[];
  is_template: boolean;
  parent_notes: string | null;
  worksheet_data: WorksheetData | null;
}

// ============================================
// CONVERSION UTILITIES
// ============================================

/**
 * Convert ActivityInput to a lesson creation payload
 */
export function activityToLessonPayload(input: ActivityInput): LessonCreatePayload {
  return {
    title: input.title,
    type: input.category || null,
    description: input.description || null,
    instructions: input.description || null,  // Lessons use instructions field
    key_questions: input.keyQuestions.length > 0 
      ? input.keyQuestions.map(q => ({ text: q }))
      : null,
    materials: input.materials || null,
    links: input.links.length > 0 ? input.links : null,
    tags: input.tags,
    estimated_minutes: input.estimatedMinutes,
    parent_notes: input.parentNotes || null,
  };
}

/**
 * Convert ActivityInput to an assignment creation payload
 * Note: Description becomes parent_notes since assignments don't have an instructions column
 */
export function activityToAssignmentPayload(
  input: ActivityInput,
  worksheetData?: WorksheetData | null
): AssignmentCreatePayload {
  // For assignments, if there's a description but no explicit parent notes,
  // use description as parent notes (since there's no instructions field)
  const parentNotes = input.parentNotes || input.description || null;
  
  // If no explicit steps but has description, use description as a step
  let steps = input.steps.length > 0 
    ? input.steps.map(s => ({ text: s }))
    : null;
  
  // If description exists and no steps, create a step from description
  if (!steps && input.description) {
    steps = [{ text: input.description }];
  }

  return {
    title: input.title,
    type: input.category || null,
    estimated_minutes: input.estimatedMinutes,
    steps,
    links: input.links.length > 0 ? input.links : null,
    deliverable: input.deliverable || null,
    rubric: input.rubric.length > 0 
      ? input.rubric.map(r => ({ text: r }))
      : null,
    tags: input.tags,
    is_template: false,
    parent_notes: parentNotes,
    worksheet_data: worksheetData || null,
  };
}

/**
 * Convert a LessonRow from the database to a partial ActivityInput
 * Useful for populating edit forms
 */
export function lessonRowToActivity(row: LessonRow): Partial<ActivityInput> {
  // Handle key_questions which might be {text: string}[] or string[]
  const keyQuestions = row.key_questions?.map(q => 
    typeof q === 'string' ? q : q.text
  ) ?? [];

  return {
    title: row.title,
    activityType: 'lesson',
    category: row.type || '',
    description: row.description || row.instructions || '',
    estimatedMinutes: row.estimated_minutes,
    keyQuestions,
    materials: row.materials || '',
    parentNotes: row.parent_notes || '',
    tags: row.tags || [],
    links: row.links?.map(l => ({ label: l.label, url: l.url })) ?? [],
    steps: [],  // Lessons don't have steps
    deliverable: '',
    rubric: [],
  };
}

/**
 * Convert an AssignmentItemRow from the database to a partial ActivityInput
 * Useful for populating edit forms
 * 
 * Note: assignments don't have an 'instructions' column, so we derive
 * description from the first step or parent_notes
 */
export function assignmentRowToActivity(row: AssignmentItemRow): Partial<ActivityInput> {
  const steps = row.steps?.map(s => s.text) ?? [];
  
  // Derive description from first step or empty string
  // (parent_notes is private, so we don't expose it as description)
  const description = steps.length > 0 ? steps[0] : '';
  
  return {
    title: row.title,
    activityType: 'assignment',
    category: row.type || '',
    description,
    estimatedMinutes: row.estimated_minutes,
    steps,
    deliverable: row.deliverable || '',
    rubric: row.rubric?.map(r => r.text) ?? [],
    parentNotes: row.parent_notes || '',
    tags: row.tags || [],
    links: row.links?.map(l => ({ label: l.label, url: l.url })) ?? [],
    keyQuestions: [],  // Assignments don't have key questions
    materials: '',
    attachedWorksheets: row.worksheet_data ? [row.worksheet_data] : [],
  };
}

// ============================================
// FACTORY / DEFAULTS
// ============================================

/**
 * Create a new ActivityInput with sensible defaults
 */
export function createDefaultActivity(
  type: 'lesson' | 'assignment' = 'lesson'
): ActivityInput {
  return {
    title: '',
    activityType: type,
    category: 'Math',
    description: '',
    estimatedMinutes: 30,
    keyQuestions: [],
    materials: '',
    steps: [],
    deliverable: '',
    rubric: [],
    parentNotes: '',
    tags: [],
    links: [],
    assignTo: [],
    scheduleDate: new Date().toISOString().split('T')[0],
    generateWorksheet: false,
    attachedWorksheets: [],
    searchYouTube: true,  // Default to searching for videos
  };
}

/**
 * Merge partial data into defaults (for pre-filling forms)
 */
export function mergeWithDefaults(
  partial: Partial<ActivityInput>,
  type: 'lesson' | 'assignment' = 'lesson'
): ActivityInput {
  return {
    ...createDefaultActivity(type),
    ...partial,
    // Ensure arrays are never undefined
    keyQuestions: partial.keyQuestions ?? [],
    steps: partial.steps ?? [],
    rubric: partial.rubric ?? [],
    tags: partial.tags ?? [],
    links: partial.links ?? [],
    assignTo: partial.assignTo ?? [],
    attachedWorksheets: partial.attachedWorksheets ?? [],
  };
}
