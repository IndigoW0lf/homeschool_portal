/**
 * AI Activity Enrichment
 * 
 * Centralizes all AI-powered enrichment for activities:
 * - YouTube video search
 * - Worksheet generation
 * 
 * This replaces the scattered enrichment logic that was duplicated
 * across /api/lessons and /api/assignments routes.
 */

import { generateWorksheet } from './worksheet-generator';
import { searchEducationalVideos } from '../resources/youtube';
import { WorksheetData } from '@/types';
import { ActivityLink } from '@/types/activity';

// ============================================
// TYPES
// ============================================

export interface EnrichmentOptions {
  /** Search for relevant YouTube videos */
  searchYouTube?: boolean;
  
  /** Generate a worksheet using AI */
  generateWorksheet?: boolean;
  
  /** Target age/grade for content */
  ageOrGrade?: string | number;
  
  /** Additional context for worksheet generation */
  worksheetInstructions?: string;
  
  /** Maximum videos to return */
  maxVideos?: number;
}

export interface EnrichmentResult {
  /** YouTube videos found as links */
  videoLinks: ActivityLink[];
  
  /** Generated worksheet data (if requested) */
  worksheet: WorksheetData | null;
  
  /** Error message if video search failed (non-fatal) */
  videoError?: string;
  
  /** Error message if worksheet generation failed (non-fatal) */
  worksheetError?: string;
}

// ============================================
// MAIN ENRICHMENT FUNCTION
// ============================================

/**
 * Enrich an activity with AI-generated content.
 * 
 * This is designed to be non-blocking - if one enrichment fails,
 * the others continue and errors are captured in the result.
 * 
 * @param activity - Basic activity info (title, category, description)
 * @param options - What enrichments to perform
 * @returns EnrichmentResult with videos and/or worksheet
 * 
 * @example
 * const enrichment = await enrichActivity(
 *   { title: "Fractions", category: "Math", description: "Learn about 1/2" },
 *   { searchYouTube: true, generateWorksheet: true }
 * );
 * // enrichment.videoLinks -> [{label: "📺 Fractions for Kids", url: "..."}]
 * // enrichment.worksheet -> { title: "Fractions Worksheet", sections: [...] }
 */
export async function enrichActivity(
  activity: { 
    title: string; 
    category: string; 
    description?: string;
  },
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
  const {
    searchYouTube = true,
    generateWorksheet: shouldGenerateWorksheet = false,
    ageOrGrade,
    worksheetInstructions,
    maxVideos = 2,
  } = options;

  const result: EnrichmentResult = {
    videoLinks: [],
    worksheet: null,
  };

  // Run enrichments in parallel for speed
  const enrichmentPromises: Promise<void>[] = [];

  // YouTube video search
  if (searchYouTube && isYouTubeConfigured()) {
    enrichmentPromises.push(
      searchYouTubeVideos(activity, maxVideos).then(
        (links) => { result.videoLinks = links; },
        (error) => { 
          result.videoError = error instanceof Error ? error.message : String(error);
          console.error('[Enrichment] YouTube search failed:', result.videoError);
        }
      )
    );
  }

  // Worksheet generation
  if (shouldGenerateWorksheet && isOpenAIConfigured()) {
    enrichmentPromises.push(
      generateWorksheetContent(activity, ageOrGrade, worksheetInstructions).then(
        (worksheet) => { result.worksheet = worksheet; },
        (error) => {
          result.worksheetError = error instanceof Error ? error.message : String(error);
          console.error('[Enrichment] Worksheet generation failed:', result.worksheetError);
        }
      )
    );
  }

  // Wait for all enrichments to complete
  await Promise.all(enrichmentPromises);

  // Log summary
  console.log('[Enrichment] Complete:', {
    title: activity.title,
    videosFound: result.videoLinks.length,
    worksheetGenerated: !!result.worksheet,
    hasErrors: !!(result.videoError || result.worksheetError),
  });

  return result;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Search YouTube for educational videos and format as links
 */
async function searchYouTubeVideos(
  activity: { title: string; category: string },
  maxResults: number
): Promise<ActivityLink[]> {
  console.log('[Enrichment] Searching YouTube for:', activity.title);
  
  const videos = await searchEducationalVideos(activity.title, {
    subject: activity.category,
    maxResults,
  });

  return videos.map(video => ({
    label: `📺 ${video.title}`,
    url: video.url,
  }));
}

/**
 * Generate a worksheet for the activity
 */
async function generateWorksheetContent(
  activity: { title: string; description?: string },
  ageOrGrade?: string | number,
  instructions?: string
): Promise<WorksheetData> {
  console.log('[Enrichment] Generating worksheet for:', activity.title);
  
  const contextInstructions = [
    activity.description,
    instructions,
  ].filter(Boolean).join('\n\n');

  return await generateWorksheet(
    activity.title,
    ageOrGrade,
    contextInstructions || undefined
  );
}

// ============================================
// CONFIGURATION CHECKS
// ============================================

/**
 * Check if YouTube API is properly configured
 */
export function isYouTubeConfigured(): boolean {
  const hasKey = !!process.env.YOUTUBE_API_KEY;
  if (!hasKey) {
    console.log('[Enrichment] YouTube API not configured');
  }
  return hasKey;
}

/**
 * Check if OpenAI API is properly configured
 */
export function isOpenAIConfigured(): boolean {
  const hasKey = !!process.env.OPENAI_API_KEY;
  if (!hasKey) {
    console.log('[Enrichment] OpenAI API not configured');
  }
  return hasKey;
}

// ============================================
// CONVENIENCE EXPORTS
// ============================================

/**
 * Quick check if any enrichment is available
 */
export function canEnrich(): boolean {
  return isYouTubeConfigured() || isOpenAIConfigured();
}

/**
 * Get available enrichment capabilities
 */
export function getEnrichmentCapabilities(): {
  youtube: boolean;
  worksheet: boolean;
} {
  return {
    youtube: isYouTubeConfigured(),
    worksheet: isOpenAIConfigured(),
  };
}
