/**
 * Tavily Web Search for Educational Resources
 * 
 * Searches for free worksheets, printables, and educational PDFs
 * that can be used in lessons and assignments.
 */

export interface WorksheetResource {
  url: string;
  title: string;
  description: string;
  source: string;
}

export interface TavilySearchOptions {
  query: string;
  gradeLevel?: string;
  subject?: string;
  maxResults?: number;
}

interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
}

interface TavilyResponse {
  results: TavilySearchResult[];
}

// Simple in-memory cache
const searchCache = new Map<string, { data: WorksheetResource[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

function getCacheKey(options: TavilySearchOptions): string {
  return `${options.query}|${options.gradeLevel || ''}|${options.subject || ''}|${options.maxResults}`;
}

/**
 * Check if Tavily API is configured
 */
export function isTavilyConfigured(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

/**
 * Map grade band to search-friendly terms
 */
function getGradeLevelTerms(gradeLevel?: string): string {
  if (!gradeLevel) return '';
  
  const level = gradeLevel.toLowerCase();
  if (level.includes('k') || level.includes('pre')) return 'kindergarten preschool';
  if (level.includes('1') || level.includes('2')) return 'first grade second grade early elementary';
  if (level.includes('3') || level.includes('4') || level.includes('5')) return 'elementary school';
  if (level.includes('6') || level.includes('7') || level.includes('8')) return 'middle school';
  if (level.includes('9') || level.includes('10') || level.includes('11') || level.includes('12')) return 'high school';
  
  return gradeLevel;
}

/**
 * Search for educational worksheets and printables
 */
export async function searchWorksheets(
  options: TavilySearchOptions
): Promise<WorksheetResource[]> {
  const { query, gradeLevel, subject, maxResults = 3 } = options;

  if (!isTavilyConfigured()) {
    console.log('[Tavily] API key not configured, skipping worksheet search');
    return [];
  }

  // Check cache
  const cacheKey = getCacheKey(options);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[Tavily] Cache hit for:', query);
    return cached.data;
  }

  const apiKey = process.env.TAVILY_API_KEY;
  
  // Build search query optimized for educational resources
  const gradeTerms = getGradeLevelTerms(gradeLevel);
  const subjectContext = subject ? `${subject} ` : '';
  const searchQuery = `${subjectContext}${query} ${gradeTerms} free printable worksheet PDF homeschool`.trim();

  console.log('[Tavily] Searching:', searchQuery);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'basic',
        include_domains: [
          'education.com',
          'teacherspayteachers.com',
          'worksheetplace.com',
          'superteacherworksheets.com',
          'k5learning.com',
          'havefunteaching.com',
          'abcteach.com',
          'enchantedlearning.com',
          'twinkl.com',
          'teachersmag.com',
          'worksheetfun.com',
          'dadsworksheets.com',
          'mathworksheets4kids.com',
          'reading-worksheets.com',
        ],
        max_results: maxResults * 2, // Get extra to filter
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Tavily] Search failed:', error);
      return [];
    }

    const data: TavilyResponse = await response.json();
    
    // Map to our resource format and filter
    const resources: WorksheetResource[] = (data.results || [])
      .slice(0, maxResults)
      .map((result) => {
        // Extract source domain
        const url = new URL(result.url);
        const source = url.hostname.replace('www.', '');
        
        return {
          url: result.url,
          title: result.title,
          description: result.content.slice(0, 200) + (result.content.length > 200 ? '...' : ''),
          source,
        };
      });

    // Cache results
    searchCache.set(cacheKey, { data: resources, timestamp: Date.now() });
    
    // Limit cache size
    if (searchCache.size > 50) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }

    console.log('[Tavily] Found', resources.length, 'worksheets for:', query);
    return resources;
    
  } catch (error) {
    console.error('[Tavily] Search error:', error);
    return [];
  }
}

/**
 * Search for any educational resource by type
 */
export async function searchEducationalResources(
  query: string,
  options: {
    type?: 'worksheet' | 'printable' | 'pdf' | 'activity' | 'game' | 'any';
    gradeLevel?: string;
    subject?: string;
    maxResults?: number;
  } = {}
): Promise<WorksheetResource[]> {
  const { type = 'any', gradeLevel, subject, maxResults = 3 } = options;

  if (!isTavilyConfigured()) {
    return [];
  }

  // Add type-specific terms
  const typeTerms: Record<string, string> = {
    worksheet: 'worksheet printable',
    printable: 'printable PDF free',
    pdf: 'PDF download free',
    activity: 'hands-on activity craft project',
    game: 'educational game learning activity',
    any: 'educational resource',
  };

  const enhancedQuery = `${query} ${typeTerms[type]}`;
  
  return searchWorksheets({
    query: enhancedQuery,
    gradeLevel,
    subject,
    maxResults,
  });
}
