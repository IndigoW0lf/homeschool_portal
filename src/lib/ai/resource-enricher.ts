import { ThinkResponse, Suggestion } from './types';
import { VideoResource } from '../resources/types';
import { searchEducationalVideos } from '../resources/youtube';
import { searchWorksheets, isTavilyConfigured, WorksheetResource } from '../resources/tavily';

// ============================================
// ENRICHED RESPONSE TYPE
// ============================================

/**
 * A suggestion enriched with real educational resources
 */
export interface EnrichedSuggestion extends Suggestion {
  // Enriched resources
  videos?: VideoResource[];
  worksheets?: WorksheetResource[];
}

/**
 * Luna's response with enriched resources
 */
export interface EnrichedThinkResponse {
  clarifying_questions: string[];
  suggestions: EnrichedSuggestion[];
  tone_check: 'CALM' | 'GENTLE';
  resourcesLoaded?: boolean;
}

// ============================================
// KEYWORD EXTRACTION
// ============================================

/**
 * Extract topic keywords from Luna's suggestion for resource search
 */
function extractSearchKeywords(suggestion: ThinkResponse['suggestions'][0]): {
  query: string;
  subject?: string;
  gradeLevel?: string;
} {
  const lessonData = suggestion.lesson_data as { 
    title?: string; 
    type?: string; 
    tags?: string[];
    parentNotes?: string;
  } | undefined;
  
  const assignmentData = suggestion.assignment_data as {
    title?: string;
    type?: string;
    tags?: string[];
    parentNotes?: string;
  } | undefined;

  // Try to extract from lesson_data first
  if (lessonData) {
    const title = lessonData.title || suggestion.title;
    const subject = lessonData.type; // "Math", "Science", etc.
    const tags = lessonData.tags?.join(' ') || '';
    
    return {
      query: `${title} ${tags}`.trim(),
      subject,
    };
  }

  // Try assignment_data
  if (assignmentData) {
    const title = assignmentData.title || suggestion.title;
    const tags = assignmentData.tags?.join(' ') || '';
    
    return {
      query: `${title} ${tags}`.trim(),
    };
  }

  // Fall back to suggestion title and steps
  const stepsText = suggestion.steps?.slice(0, 2).join(' ') || '';
  return {
    query: `${suggestion.title} ${stepsText}`.slice(0, 100).trim(),
  };
}

// ============================================
// ENRICHER FUNCTION
// ============================================

export interface EnrichmentOptions {
  /** Whether to fetch video resources */
  includeVideos?: boolean;
  /** Whether to fetch worksheet resources (requires Tavily API) */
  includeWorksheets?: boolean;
  /** Grade level for filtering resources */
  gradeLevel?: string;
  /** Maximum videos per suggestion */
  maxVideos?: number;
  /** Maximum worksheets per suggestion */
  maxWorksheets?: number;
}

/**
 * Enrich Luna's response with real educational resources
 * 
 * This is a post-processing step that:
 * 1. Extracts topic keywords from each suggestion
 * 2. Searches for relevant YouTube videos
 * 3. Searches for worksheets via Tavily web search
 * 4. Attaches resources to each suggestion
 * 
 * @param response - Luna's original think response
 * @param options - Enrichment options
 * @returns Enriched response with video/worksheet resources
 */
export async function enrichWithResources(
  response: ThinkResponse,
  options: EnrichmentOptions = {}
): Promise<EnrichedThinkResponse> {
  const {
    includeVideos = true,
    includeWorksheets = true, // Now enabled by default!
    gradeLevel,
    maxVideos = 2,
    maxWorksheets = 2,
  } = options;

  // Skip enrichment if no suggestions or no resources requested
  if (!response.suggestions?.length || (!includeVideos && !includeWorksheets)) {
    return {
      ...response,
      resourcesLoaded: false,
    };
  }

  // Only enrich suggestions that have lesson_data or assignment_data
  // (These are actual content creation requests, not support/emotional responses)
  const enrichableSuggestions = response.suggestions.filter(
    s => s.lesson_data || s.assignment_data
  );

  if (enrichableSuggestions.length === 0) {
    return {
      ...response,
      resourcesLoaded: false,
    };
  }

  // Enrich each suggestion
  const enrichedSuggestions = await Promise.all(
    response.suggestions.map(async (suggestion) => {
      const enriched: EnrichedSuggestion = { ...suggestion };

      // Only enrich if this is a content creation suggestion
      if (!suggestion.lesson_data && !suggestion.assignment_data) {
        return enriched;
      }

      try {
        // Extract keywords for search
        const keywords = extractSearchKeywords(suggestion);

        // Fetch videos if enabled and YouTube is configured
        if (includeVideos && keywords.query && isYouTubeConfigured()) {
          try {
            const videos = await searchEducationalVideos(keywords.query, {
              gradeLevel,
              subject: keywords.subject,
              maxResults: maxVideos,
            });
            enriched.videos = videos;
          } catch (error) {
            console.error('[Resource Enricher] Video search failed:', error);
            // Continue without videos - don't break the response
          }
        }

        // Fetch worksheets if enabled and Tavily is configured
        if (includeWorksheets && keywords.query && isTavilyConfigured()) {
          try {
            const worksheets = await searchWorksheets({
              query: keywords.query,
              gradeLevel,
              subject: keywords.subject,
              maxResults: maxWorksheets,
            });
            enriched.worksheets = worksheets;
          } catch (error) {
            console.error('[Resource Enricher] Worksheet search failed:', error);
            // Continue without worksheets - don't break the response
          }
        }

      } catch (error) {
        console.error('[Resource Enricher] Enrichment failed for suggestion:', suggestion.title, error);
      }

      return enriched;
    })
  );

  return {
    ...response,
    suggestions: enrichedSuggestions,
    resourcesLoaded: true,
  };
}

/**
 * Check if YouTube API is configured
 */
export function isYouTubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

/**
 * Re-export Tavily check
 */
export { isTavilyConfigured };
