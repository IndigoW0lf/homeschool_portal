import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/moons/history?kidId=xxx
 * Returns last 30 days of moon transactions
 */
export async function GET(request: NextRequest) {
  try {
    const kidId = request.nextUrl.searchParams.get('kidId');
    
    if (!kidId) {
      return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Get transactions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('progress_awards')
      .select('*')
      .eq('kid_id', kidId)
      .gte('awarded_at', thirtyDaysAgo.toISOString())
      .order('awarded_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Moon History] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Also get total moons
    const { data: progress } = await supabase
      .from('student_progress')
      .select('total_stars')
      .eq('kid_id', kidId)
      .single();

    return NextResponse.json({
      transactions: data || [],
      totalMoons: progress?.total_stars || 0,
    });

  } catch (error) {
    console.error('Moon history endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * POST /api/moons/bonus
 * Add bonus moons for a kid (parent only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kidId, amount, note } = body as {
      kidId: string;
      amount: number;
      note?: string;
    };

    if (!kidId || !amount || amount < 1) {
      return NextResponse.json(
        { error: 'kidId and positive amount are required' },
        { status: 400 }
      );
    }

    // Cap at reasonable maximum per bonus
    if (amount > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 moons per bonus' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const today = new Date().toISOString().split('T')[0];
    
    // Insert bonus transaction
    const { data: award, error: awardError } = await supabase
      .from('progress_awards')
      .insert({
        kid_id: kidId,
        date: today,
        item_id: `bonus-${Date.now()}`, // Unique ID for each bonus
        stars_earned: amount,
        source: 'bonus',
        note: note || 'Bonus from parent',
      })
      .select()
      .single();

    if (awardError) {
      console.error('[Moon Bonus] Award insert error:', awardError);
      return NextResponse.json({ error: 'Failed to add bonus' }, { status: 500 });
    }

    // Update total in student_progress
    const { error: updateError } = await supabase
      .rpc('increment_total_stars', { kid_id_param: kidId, amount_param: amount });

    // If RPC doesn't exist, fall back to manual update
    if (updateError) {
      const { data: current } = await supabase
        .from('student_progress')
        .select('total_stars')
        .eq('kid_id', kidId)
        .single();

      await supabase
        .from('student_progress')
        .upsert({
          kid_id: kidId,
          total_stars: (current?.total_stars || 0) + amount,
        }, { onConflict: 'kid_id' });
    }

    return NextResponse.json({
      success: true,
      award,
      message: `Added ${amount} bonus moons!`,
    });

  } catch (error) {
    console.error('Moon bonus endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
