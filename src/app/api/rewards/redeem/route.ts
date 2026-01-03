import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/rewards/redeem
 * Creates a pending redemption when kid "buys" a reward
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kidId, rewardId } = body as {
      kidId: string;
      rewardId: string;
    };

    if (!kidId || !rewardId) {
      return NextResponse.json(
        { error: 'kidId and rewardId are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Create pending redemption
    const { data, error } = await supabase
      .from('reward_redemptions')
      .insert({
        kid_id: kidId,
        reward_id: rewardId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Redeem] Database error:', error);
      return NextResponse.json({ error: 'Failed to create redemption' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      redemption: data,
      message: 'Redemption request sent! Ask your parent to approve it.',
    });

  } catch (error) {
    console.error('Redeem endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * GET /api/rewards/redeem?kidId=xxx
 * Gets pending redemptions for a kid (for parent dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const kidId = request.nextUrl.searchParams.get('kidId');
    
    if (!kidId) {
      return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:kid_rewards(name, emoji, moon_cost)
      `)
      .eq('kid_id', kidId)
      .eq('status', 'pending')
      .order('redeemed_at', { ascending: false });

    if (error) {
      console.error('[Redeem] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 });
    }

    return NextResponse.json({ redemptions: data || [] });

  } catch (error) {
    console.error('Redeem GET endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * PUT /api/rewards/redeem
 * Approve or deny a redemption (parent action)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { redemptionId, status, note } = body as {
      redemptionId: string;
      status: 'approved' | 'denied';
      note?: string;
    };

    if (!redemptionId || !status) {
      return NextResponse.json(
        { error: 'redemptionId and status are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reward_redemptions')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_note: note || null,
      })
      .eq('id', redemptionId)
      .select()
      .single();

    if (error) {
      console.error('[Redeem] Update error:', error);
      return NextResponse.json({ error: 'Failed to update redemption' }, { status: 500 });
    }

    // If denied, refund the moons
    if (status === 'denied' && data) {
      // Get reward cost
      const { data: reward } = await supabase
        .from('kid_rewards')
        .select('moon_cost')
        .eq('id', data.reward_id)
        .single();

      if (reward) {
        // Could add refund logic here or handle on client
      }
    }

    return NextResponse.json({
      success: true,
      redemption: data,
      message: status === 'approved' ? 'Reward approved! 🎉' : 'Reward denied.',
    });

  } catch (error) {
    console.error('Redeem PUT endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
