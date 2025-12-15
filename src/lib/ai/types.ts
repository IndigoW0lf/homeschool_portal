import { z } from 'zod';

// ============================================
// REQUEST SCHEMAS
// ============================================

/**
 * Context types for AI thinking sessions
 */
export const ThinkContextSchema = z.enum([
  'WEEK_THINK',
  'LESSON_STUCK', 
  'INTEREST_SPARK',
  'REFLECTION',
  'GENERAL',
]);

export type ThinkContext = z.infer<typeof ThinkContextSchema>;

/**
 * Request body for /api/ai/think
 */
export const ThinkRequestSchema = z.object({
  context: ThinkContextSchema.default('GENERAL'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  // Conversation history for context
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  // Optional identifiers for context loading
  childProfileId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});

export type ThinkRequest = z.infer<typeof ThinkRequestSchema>;

// ============================================
// RESPONSE SCHEMAS (Structured Output)
// ============================================

/**
 * Tone check values - Luna's emotional register
 * CALM: Default, grounded presence
 * GENTLE: Extra softness when distress is detected
 */
export const ToneCheckSchema = z.enum(['CALM', 'GENTLE']);
export type ToneCheck = z.infer<typeof ToneCheckSchema>;

// ============================================
// FORM PRE-FILL SCHEMAS
// ============================================

/**
 * Assignment types matching AssignmentForm
 */
export const ASSIGNMENT_TYPES = [
  'Practice', 'Project', 'Journal', 'Creative', 'Logic Drill', 'Experiment', 'Essay'
] as const;

/**
 * Lesson types matching LessonForm
 */
export const LESSON_TYPES = [
  'Math', 'Science', 'History', 'Language Arts', 'Art', 'Music', 'PE', 'Life Skills', 'Coding'
] as const;

/**
 * Pre-fill data for Assignment form
 */
export const AssignmentSuggestionSchema = z.object({
  title: z.string().describe('Assignment title'),
  type: z.enum(ASSIGNMENT_TYPES).describe('Process/type of assignment'),
  deliverable: z.string().describe('What the student should turn in'),
  rubric: z.array(z.string()).max(5).describe('Success criteria, "I can..." statements'),
  steps: z.array(z.string()).max(6).describe('Student steps to complete the assignment'),
  tags: z.array(z.string()).max(5).describe('Subject or topic tags'),
  estimatedMinutes: z.number().min(5).max(180).describe('Estimated time in minutes'),
  parentNotes: z.string().optional().describe('Private notes for the parent'),
});

export type AssignmentSuggestion = z.infer<typeof AssignmentSuggestionSchema>;

/**
 * Pre-fill data for Lesson form
 */
export const LessonSuggestionSchema = z.object({
  title: z.string().describe('Lesson title'),
  type: z.enum(LESSON_TYPES).describe('Subject/type of lesson'),
  keyQuestions: z.array(z.string()).max(5).describe('Checks for understanding'),
  materials: z.string().describe('Materials needed'),
  tags: z.array(z.string()).max(5).describe('Subject or topic tags'),
  estimatedMinutes: z.number().min(5).max(180).describe('Estimated time in minutes'),
  parentNotes: z.string().optional().describe('Private notes for the parent'),
});

export type LessonSuggestion = z.infer<typeof LessonSuggestionSchema>;

/**
 * A single suggestion from Luna
 * May include optional form data for assignment or lesson creation
 */
export const SuggestionSchema = z.object({
  title: z.string().describe('Brief, actionable title for this suggestion'),
  why_this_might_help: z.string().describe('Why this might be helpful, framed as a thought not a directive'),
  steps: z.array(z.string()).max(4).describe('Optional concrete steps, max 4'),
  // Optional form pre-fill data
  assignment_data: AssignmentSuggestionSchema.optional().describe('Pre-fill data if this is an assignment suggestion'),
  lesson_data: LessonSuggestionSchema.optional().describe('Pre-fill data if this is a lesson suggestion'),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

/**
 * Luna's structured response
 * 
 * HARD CONSTRAINTS (enforced by schema):
 * - Max 3 clarifying questions
 * - Max 2 suggestions
 * - tone_check must be CALM or GENTLE
 * 
 * SOFT CONSTRAINTS (enforced by system prompt):
 * - Never include directives ("you should", "you need to")
 * - Never include diagnoses, benchmarks, or urgency
 */
export const ThinkResponseSchema = z.object({
  clarifying_questions: z
    .array(z.string())
    .max(2)
    .describe('Questions to better understand the situation before suggesting anything'),
  suggestions: z
    .array(SuggestionSchema)
    .max(2)
    .describe('Thoughts or ideas, only if enough context exists'),
  tone_check: ToneCheckSchema.describe('CALM for normal, GENTLE when distress is detected'),
});

export type ThinkResponse = z.infer<typeof ThinkResponseSchema>;

// ============================================
// JSON SCHEMA FOR OPENAI STRUCTURED OUTPUTS
// ============================================

/**
 * JSON Schema for OpenAI's response_format parameter
 * This enforces structured output at the API level
 * 
 * This is the "safety cage" - OpenAI will only return responses
 * that match this exact structure.
 */
export const THINK_RESPONSE_JSON_SCHEMA = {
  name: 'luna_think_response',
  strict: false, // Allow optional fields like assignment_data, lesson_data
  schema: {
    type: 'object',
    properties: {
      clarifying_questions: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 2,
        description: 'Questions to better understand the situation (max 2)',
      },
      suggestions: {
        type: 'array',
        maxItems: 2,
        items: {
          type: 'object',
          properties: {
            title: { 
              type: 'string', 
              description: 'Brief, actionable title' 
            },
            why_this_might_help: { 
              type: 'string', 
              description: 'Why this might help, as a thought not directive' 
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 4,
              description: 'Optional concrete steps',
            },
            assignment_data: {
              type: 'object',
              description: 'Pre-fill data for assignment form (include when suggesting an assignment)',
              properties: {
                title: { type: 'string' },
                type: { type: 'string', enum: ['Practice', 'Project', 'Journal', 'Creative', 'Logic Drill', 'Experiment', 'Essay'] },
                deliverable: { type: 'string' },
                rubric: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                steps: { type: 'array', items: { type: 'string' }, maxItems: 6 },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                estimatedMinutes: { type: 'number' },
                parentNotes: { type: 'string' },
              },
              required: ['title', 'type', 'deliverable', 'rubric', 'steps', 'tags', 'estimatedMinutes', 'parentNotes'],
              additionalProperties: false,
            },
            lesson_data: {
              type: 'object',
              description: 'Pre-fill data for lesson form (include when suggesting a lesson)',
              properties: {
                title: { type: 'string' },
                type: { type: 'string', enum: ['Math', 'Science', 'History', 'Language Arts', 'Art', 'Music', 'PE', 'Life Skills', 'Coding'] },
                keyQuestions: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                materials: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                estimatedMinutes: { type: 'number' },
                parentNotes: { type: 'string' },
              },
              required: ['title', 'type', 'keyQuestions', 'materials', 'tags', 'estimatedMinutes', 'parentNotes'],
              additionalProperties: false,
            },
          },
          required: ['title', 'why_this_might_help', 'steps'],
          additionalProperties: false,
        },
        description: 'Suggestions, max 2. Include assignment_data or lesson_data when parent asks for one.',
      },
      tone_check: {
        type: 'string',
        enum: ['CALM', 'GENTLE'],
        description: 'CALM for normal exchanges, GENTLE when distress detected',
      },
    },
    required: ['clarifying_questions', 'suggestions', 'tone_check'],
    additionalProperties: false,
  },
} as const;

// ============================================
// TYPESCRIPT TYPES (for external consumers)
// ============================================

/**
 * Generated TypeScript interface matching the JSON Schema
 * Use this for type-safe handling of Luna's responses
 */
export interface LunaThinkResponse {
  /** Max 3 clarifying questions, asked before offering solutions */
  clarifying_questions: string[];
  
  /** Max 2 suggestions, only when context is clear */
  suggestions: Array<{
    /** Brief, actionable title */
    title: string;
    /** Why this might help - framed as thought, not directive */
    why_this_might_help: string;
    /** Optional concrete steps, max 4 */
    steps: string[];
  }>;
  
  /** Emotional register: CALM (default) or GENTLE (distress detected) */
  tone_check: 'CALM' | 'GENTLE';
}
