import { z } from 'zod';

// ============================================
// VIDEO RESOURCES
// ============================================

/**
 * YouTube video resource returned from search
 */
export const VideoResourceSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string(),
  thumbnailUrl: z.string().url(),
  duration: z.string().optional(), // ISO 8601 duration, e.g., "PT5M30S"
  durationMinutes: z.number().optional(), // Computed minutes for display
  viewCount: z.number().optional(),
  publishedAt: z.string().optional(),
  url: z.string().url(),
});

export type VideoResource = z.infer<typeof VideoResourceSchema>;

// ============================================
// WORKSHEET RESOURCES
// ============================================

/**
 * Trusted educational domains for worksheet/resource discovery
 */
export const TRUSTED_EDUCATIONAL_DOMAINS = [
  'education.com',
  'khanacademy.org',
  'commonlit.org',
  'readworks.org',
  'ixl.com',
  'splashlearn.com',
  'abcya.com',
  'starfall.com',
  'mathplayground.com',
  'funbrain.com',
  'brainpop.com',
  'pbslearningmedia.org',
  'nationalgeographic.org',
  'ducksters.com',
  'coolmath.com',
  'readtheory.org',
  'newsela.com',
  'quill.org',
  'mobymax.com',
  'mathgames.com',
  'k5learning.com',
  'super Teacher worksheets.com',
  'mathworksheets4kids.com',
  'teacherspayteachers.com', // Note: links only, no API
] as const;

/**
 * Worksheet or educational resource from web search
 */
export const WorksheetResourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  source: z.string(), // Domain name, e.g., "education.com"
  isTrusted: z.boolean(), // Whether source is in trusted domains list
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  resourceType: z.enum(['worksheet', 'article', 'interactive', 'lesson', 'video', 'other']).optional(),
});

export type WorksheetResource = z.infer<typeof WorksheetResourceSchema>;

// ============================================
// COMBINED RESOURCE TYPES
// ============================================

/**
 * Any educational resource (video or worksheet)
 */
export const EducationalResourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('video'),
    resource: VideoResourceSchema,
  }),
  z.object({
    type: z.literal('worksheet'),
    resource: WorksheetResourceSchema,
  }),
]);

export type EducationalResource = z.infer<typeof EducationalResourceSchema>;

/**
 * Search request for educational resources
 */
export const ResourceSearchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  resourceType: z.enum(['video', 'worksheet', 'all']).default('all'),
  gradeLevel: z.string().optional(), // e.g., "3rd grade", "K-2", "high school"
  subject: z.string().optional(), // e.g., "math", "science", "reading"
  maxResults: z.number().min(1).max(10).default(3),
});

export type ResourceSearchRequest = z.infer<typeof ResourceSearchRequestSchema>;

/**
 * Response from resource search
 */
export interface ResourceSearchResponse {
  videos: VideoResource[];
  worksheets: WorksheetResource[];
  query: string;
  cached: boolean;
}

// ============================================
// GRADE LEVEL UTILITIES
// ============================================

/**
 * Map grade levels to YouTube-friendly search terms
 */
export function getGradeLevelSearchTerms(gradeLevel?: string): string {
  if (!gradeLevel) return '';
  
  const normalized = gradeLevel.toLowerCase();
  
  // Map common formats
  if (normalized.includes('k') || normalized.includes('kindergarten')) {
    return 'for kids kindergarten';
  }
  if (normalized.includes('preschool') || normalized.includes('pre-k')) {
    return 'for toddlers preschool';
  }
  if (normalized.match(/1st|first|grade 1/)) return 'for kids 1st grade';
  if (normalized.match(/2nd|second|grade 2/)) return 'for kids 2nd grade';
  if (normalized.match(/3rd|third|grade 3/)) return 'for kids 3rd grade';
  if (normalized.match(/4th|fourth|grade 4/)) return 'for kids 4th grade';
  if (normalized.match(/5th|fifth|grade 5/)) return 'for kids 5th grade';
  if (normalized.match(/6th|sixth|grade 6/)) return 'middle school 6th grade';
  if (normalized.match(/7th|seventh|grade 7/)) return 'middle school 7th grade';
  if (normalized.match(/8th|eighth|grade 8/)) return 'middle school 8th grade';
  if (normalized.match(/9th|ninth|grade 9/)) return 'high school 9th grade';
  if (normalized.match(/10th|tenth|grade 10/)) return 'high school 10th grade';
  if (normalized.match(/11th|eleventh|grade 11/)) return 'high school 11th grade';
  if (normalized.match(/12th|twelfth|grade 12/)) return 'high school 12th grade';
  
  return gradeLevel;
}

/**
 * Parse ISO 8601 duration to minutes
 * e.g., "PT5M30S" -> 5.5, "PT1H2M" -> 62
 */
export function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 60 + minutes + seconds / 60;
}
