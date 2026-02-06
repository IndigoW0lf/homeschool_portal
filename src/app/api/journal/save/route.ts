import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';
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

    // Auth Check:
    // 1. Is it a Kid Session?
    const kidSession = await getKidSession();
    let supabase;
    
    if (kidSession && kidSession.kidId === kidId) {
      // Authorized Kid -> Use Service Role to write their own journal
      supabase = await createServiceRoleClient();
    } else {
      // Parent/Standard User -> Use RLS
      supabase = await createServerClient();
    }
    
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

    // Award moons if not skipped
    if (!skipped && data) {
       // Fetch kid's reward setting
       const { data: kidSettings } = await supabase
         .from('kids')
         .select('journal_moon_reward')
         .eq('id', kidId)
         .single();
       
       const rewardAmount = kidSettings?.journal_moon_reward || 1;
       
       // Use our centralized mutation logic (need to import or duplicate simplified version)
       // Since this is an API route, we can call the DB directly to award
       const { awardStars } = await import('@/lib/supabase/mutations');
       await awardStars(kidId, date, `journal-${date}`, rewardAmount);
    }

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
