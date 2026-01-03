import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { detectJournalTags } from '@/lib/ai/journal-tags';

/**
 * POST /api/journal/save
 * 
 * Saves a journal entry for a kid with AI auto-tagging.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kidId, date, prompt, response, mood, skipped } = body as {
      kidId: string;
      date: string;
      prompt: string;
      response: string | null;
      mood: string | null;
      skipped: boolean;
    };

    if (!kidId || !date || !prompt) {
      return NextResponse.json(
        { error: 'kidId, date, and prompt are required' },
        { status: 400 }
      );
    }

    // Detect tags if not skipped and there's a response
    let tags: string[] = [];
    if (!skipped && response) {
      tags = await detectJournalTags(response);
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
        mood: skipped ? null : mood,
        tags: tags.length > 0 ? tags : null,
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
      tags,
    });

  } catch (error) {
    console.error('Journal save endpoint error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
