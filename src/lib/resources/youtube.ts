import { 
  VideoResource, 
  getGradeLevelSearchTerms, 
  parseDurationToMinutes 
} from './types';

// ============================================
// YOUTUBE API CONFIGURATION
// ============================================

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Get YouTube API key from environment
 */
function getYouTubeApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }
  return apiKey;
}

// ============================================
// SIMPLE IN-MEMORY CACHE
// ============================================

interface CacheEntry {
  data: VideoResource[];
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

const CACHE_VERSION = 'v2'; // Increment to invalidate old caches

function getCacheKey(query: string, options: YouTubeSearchOptions): string {
  return `${CACHE_VERSION}|${query}|${options.gradeLevel || ''}|${options.subject || ''}|${options.maxResults}`;
}

function getFromCache(key: string): VideoResource[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: VideoResource[]): void {
  // Limit cache size to prevent memory issues
  if (searchCache.size > 100) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  
  searchCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// ============================================
// YOUTUBE SEARCH
// ============================================

export interface YouTubeSearchOptions {
  gradeLevel?: string;
  subject?: string;
  maxResults?: number;
  /** Minimum video duration in minutes */
  minDuration?: number;
  /** Maximum video duration in minutes */
  maxDuration?: number;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics?: {
    viewCount?: string;
  };
  status?: {
    uploadStatus: string;
    privacyStatus: string;
    embeddable: boolean;
  };
}

/**
 * Search for educational videos on YouTube
 * 
 * @param query - Search query (topic, concept, etc.)
 * @param options - Search options including grade level and subject
 * @returns Array of video resources
 */
export async function searchEducationalVideos(
  query: string,
  options: YouTubeSearchOptions = {}
): Promise<VideoResource[]> {
  const {
    gradeLevel,
    subject,
    maxResults = 3,
    minDuration = 2,   // Minimum 2 minutes
    maxDuration = 20,  // Maximum 20 minutes (good for lessons)
  } = options;

  // Check cache first
  const cacheKey = getCacheKey(query, options);
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('[YouTube] Cache hit for:', query);
    return cached;
  }

  const apiKey = getYouTubeApiKey();

  // Build search query with educational context
  const gradeLevelTerms = getGradeLevelSearchTerms(gradeLevel);
  const subjectContext = subject ? `${subject} ` : '';
  const fullQuery = `${subjectContext}${query} ${gradeLevelTerms} educational lesson`.trim();

  console.log('[YouTube] Searching:', fullQuery);

  // Step 1: Search for videos
  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: fullQuery,
    type: 'video',
    maxResults: String(Math.min(maxResults * 2, 10)), // Get extra to filter by duration
    safeSearch: 'strict',
    relevanceLanguage: 'en',
    regionCode: 'US', // Ensure US-available content
    videoDuration: 'medium', // 4-20 minutes
    videoEmbeddable: 'true',
    key: apiKey,
  });

  const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
  
  if (!searchResponse.ok) {
    const error = await searchResponse.text();
    console.error('[YouTube] Search failed:', error);
    throw new Error(`YouTube search failed: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const searchItems: YouTubeSearchItem[] = searchData.items || [];

  if (searchItems.length === 0) {
    console.log('[YouTube] No results for:', query);
    return [];
  }

  // Step 2: Get video details (duration, view count, status)
  const videoIds = searchItems.map(item => item.id.videoId).join(',');
  
  const detailsParams = new URLSearchParams({
    part: 'contentDetails,statistics,status',
    id: videoIds,
    key: apiKey,
  });

  const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
  
  if (!detailsResponse.ok) {
    console.error('[YouTube] Details fetch failed - aborting enrichment to avoid bad links');
    return [];
  }

  const detailsData = await detailsResponse.json();
  const videoDetails: YouTubeVideoDetails[] = detailsData.items || [];

  // Create a map for quick lookup
  const detailsMap = new Map<string, YouTubeVideoDetails>();
  for (const detail of videoDetails) {
    detailsMap.set(detail.id, detail);
  }

  // Step 3: Build video resources with filtering
  const videos: VideoResource[] = [];

  for (const item of searchItems) {
    const videoId = item.id.videoId;
    if (!videoId) continue;
    const details = detailsMap.get(videoId);
    
    // STRICT CHECK: Video must exist in details endpoint to be valid
    if (!details) {
      continue;
    }

    // STRICT CHECK: Privacy and Embeddable status
    if (details.status) {
      if (details.status.privacyStatus !== 'public') continue;
      if (details.status.embeddable === false) continue;
    }
    
    // Parse duration and filter
    let durationMinutes = 0;
    if (details?.contentDetails?.duration) {
      durationMinutes = parseDurationToMinutes(details.contentDetails.duration);
      
      // Skip videos outside duration range
      if (durationMinutes < minDuration || durationMinutes > maxDuration) {
        continue;
      }
    }

    const video: VideoResource = {
      videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url 
        || item.snippet.thumbnails.default?.url 
        || '',
      duration: details?.contentDetails?.duration,
      durationMinutes: Math.round(durationMinutes * 10) / 10,
      viewCount: details?.statistics?.viewCount 
        ? parseInt(details.statistics.viewCount, 10) 
        : undefined,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };

    videos.push(video);

    // Stop once we have enough videos
    if (videos.length >= maxResults) {
      break;
    }
  }

  // Cache results
  setCache(cacheKey, videos);

  console.log('[YouTube] Found', videos.length, 'videos for:', query);
  return videos;
}

/**
 * Get a single video by ID
 */
export async function getVideoById(videoId: string): Promise<VideoResource | null> {
  const apiKey = getYouTubeApiKey();

  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoId,
    key: apiKey,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
  
  if (!response.ok) {
    console.error('[YouTube] Failed to get video:', videoId);
    return null;
  }

  const data = await response.json();
  const item = data.items?.[0];

  if (!item) {
    return null;
  }

  const durationMinutes = item.contentDetails?.duration
    ? parseDurationToMinutes(item.contentDetails.duration)
    : 0;

  return {
    videoId: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.medium?.url || '',
    duration: item.contentDetails?.duration,
    durationMinutes: Math.round(durationMinutes * 10) / 10,
    viewCount: item.statistics?.viewCount
      ? parseInt(item.statistics.viewCount, 10)
      : undefined,
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
