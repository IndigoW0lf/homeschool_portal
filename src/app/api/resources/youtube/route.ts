import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchEducationalVideos, YouTubeSearchOptions } from '@/lib/resources/youtube';
import { checkRateLimit } from '@/lib/ai/rate-limiter';
import { createServerClient } from '@/lib/supabase/server';

const YouTubeSearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200, 'Query too long'),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  maxResults: z.number().min(1).max(5).default(3),
});

/**
 * POST /api/resources/youtube
 *
 * Search for educational videos on YouTube.
 * Requires parent authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Require parent authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Shared rate limiter (Upstash when configured, in-memory fallback)
    const { allowed } = await checkRateLimit(`yt:${user.id}`);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = YouTubeSearchRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, gradeLevel, subject, maxResults } = parseResult.data;
    const options: YouTubeSearchOptions = { gradeLevel, subject, maxResults };
    const videos = await searchEducationalVideos(query, options);

    return NextResponse.json({ videos, query, cached: false });

  } catch (error) {
    console.error('[API /resources/youtube] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('YOUTUBE_API_KEY')) {
        return NextResponse.json({ error: 'YouTube service not configured' }, { status: 503 });
      }
      if (error.message.includes('403') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'YouTube API quota exceeded. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ error: 'Failed to search for videos' }, { status: 500 });
  }
}
