import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/journal/save
 * 
 * Saves a journal entry for a kid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kidId, date, prompt, response, skipped } = body as {
      kidId: string;
      date: string;
      prompt: string;
      response: string | null;
      skipped: boolean;
    };

    if (!kidId || !date || !prompt) {
      return NextResponse.json(
        { error: 'kidId, date, and prompt are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Upsert journal entry (one per kid per date)
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert({
        kid_id: kidId,
        date,
        prompt,
        response: skipped ? null : response,
        skipped,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'kid_id,date',
      })
      .select()
      .single();

    if (error) {
      console.error('[Journal Save] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save journal entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      entry: data,
    });

  } catch (error) {
    console.error('Journal save endpoint error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
