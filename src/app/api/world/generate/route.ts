/**
 * World Generation API Route - AI-powered world generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWorldLayout } from '@/lib/world/generator';

export async function POST(request: NextRequest) {
  try {
    const { theme } = await request.json();
    
    if (!theme || typeof theme !== 'string') {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      );
    }
    
    const generated = await generateWorldLayout(theme);
    
    if (!generated) {
      return NextResponse.json(
        { error: 'Failed to generate world' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ generated });
  } catch (error) {
    console.error('World generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
