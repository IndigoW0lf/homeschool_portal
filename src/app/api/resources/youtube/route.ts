import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchEducationalVideos, YouTubeSearchOptions } from '@/lib/resources/youtube';

// ============================================
// REQUEST VALIDATION
// ============================================

const YouTubeSearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200, 'Query too long'),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  maxResults: z.number().min(1).max(5).default(3),
});

// ============================================
// RATE LIMITING (simple in-memory)
// ============================================

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + 60000, // 1 minute
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================
// API ROUTE
// ============================================

/**
 * POST /api/resources/youtube
 * 
 * Search for educational videos on YouTube
 * 
 * Request body:
 * - query: string (required) - Search query
 * - gradeLevel: string (optional) - e.g., "3rd grade"
 * - subject: string (optional) - e.g., "math"
 * - maxResults: number (optional, default 3, max 5)
 * 
 * Returns:
 * - videos: VideoResource[]
 * - query: string
 * - cached: boolean
 */
export async function POST(request: NextRequest) {
  try {
    // Get user identifier for rate limiting
    const identifier = request.headers.get('x-forwarded-for')
      ?? request.headers.get('x-real-ip')
      ?? 'anonymous';

    // Check rate limit
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = YouTubeSearchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { query, gradeLevel, subject, maxResults } = parseResult.data;

    // Search for videos
    const options: YouTubeSearchOptions = {
      gradeLevel,
      subject,
      maxResults,
    };

    const videos = await searchEducationalVideos(query, options);

    return NextResponse.json({
      videos,
      query,
      cached: false, // Could track this in the future
    });

  } catch (error) {
    console.error('[API /resources/youtube] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('YOUTUBE_API_KEY')) {
        return NextResponse.json(
          { error: 'YouTube service not configured' },
          { status: 503 }
        );
      }
      if (error.message.includes('403') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'YouTube API quota exceeded. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to search for videos' },
      { status: 500 }
    );
  }
}
