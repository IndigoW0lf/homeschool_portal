import { NextRequest, NextResponse } from 'next/server';
import { searchEducationalVideos } from '@/lib/resources/youtube';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const isConfigured = !!apiKey;
    const keyPreview = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING';

    console.log('[Test-YouTube] Starting test...');
    console.log('[Test-YouTube] API Key Configured:', isConfigured);
    console.log('[Test-YouTube] API Key Preview:', keyPreview);

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        message: 'YOUTUBE_API_KEY is not set in environment variables',
        env_check: process.env.NODE_ENV
      }, { status: 500 });
    }

    // Force a real search
    console.log('[Test-YouTube] Attempting search for "math for kids"...');
    
    // Using the simplified search function which handles the fetch internally
    const results = await searchEducationalVideos('math for kids', {
      maxResults: 3,
      gradeLevel: '3rd Grade',
      subject: 'Math'
    });

    console.log('[Test-YouTube] Search completed. Found:', results.length);

    return NextResponse.json({
      success: true,
      keyConfigured: true,
      keyPreview,
      resultsCount: results.length,
      firstResult: results[0] || null,
      results
    });

  } catch (error: any) {
    console.error('[Test-YouTube] Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      stack: error.stack,
      details: 'Check server logs for more info'
    }, { status: 500 });
  }
}
