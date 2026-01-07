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
 * Combines both reward_redemptions AND shop_purchases
 */
export async function GET(request: NextRequest) {
  try {
    const kidId = request.nextUrl.searchParams.get('kidId');
    
    if (!kidId) {
      return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Fetch from reward_redemptions (old system)
    const { data: rewardRedemptions, error: rewardError } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:kid_rewards(name, emoji, moon_cost)
      `)
      .eq('kid_id', kidId)
      .eq('status', 'pending')
      .order('redeemed_at', { ascending: false });

    if (rewardError) {
      console.error('[Redeem] reward_redemptions error:', rewardError);
    }

    // Fetch from shop_purchases (new system) - unfulfilled items
    const { data: shopPurchases, error: shopError } = await supabase
      .from('shop_purchases')
      .select('*')
      .eq('kid_id', kidId)
      .eq('status', 'unfulfilled')
      .order('purchased_at', { ascending: false });

    if (shopError) {
      console.error('[Redeem] shop_purchases error:', shopError);
    }

    // Combine results, mapping shop_purchases to same format
    const combinedRedemptions = [
      ...(rewardRedemptions || []),
      ...(shopPurchases || []).map(p => ({
        id: p.id,
        kid_id: p.kid_id,
        reward_id: p.item_id,
        status: p.status,
        redeemed_at: p.purchased_at,
        source: 'shop', // To differentiate in UI
        reward: {
          name: p.item_name || 'Shop Item',
          emoji: '🎁',
          moon_cost: p.cost
        }
      }))
    ];

    return NextResponse.json({ redemptions: combinedRedemptions });

  } catch (error) {
    console.error('Redeem GET endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * PUT /api/rewards/redeem
 * Approve/deny a reward_redemption OR mark shop_purchase as fulfilled
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { redemptionId, status, source } = body as {
      redemptionId: string;
      status: 'approved' | 'denied' | 'fulfilled';
      source?: 'shop'; // If from shop_purchases table
    };

    if (!redemptionId || !status) {
      return NextResponse.json(
        { error: 'redemptionId and status are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Handle shop purchases (fulfillment)
    if (source === 'shop' || status === 'fulfilled') {
      const { data, error } = await supabase
        .from('shop_purchases')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
        })
        .eq('id', redemptionId)
        .select()
        .single();

      if (error) {
        console.error('[Redeem] shop_purchases update error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        redemption: data,
        message: 'Marked as fulfilled! 🎉',
      });
    }
    
    // Handle reward_redemptions (legacy approval system)
    const { data, error } = await supabase
      .from('reward_redemptions')
      .update({
        status,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', redemptionId)
      .select()
      .single();

    if (error) {
      console.error('[Redeem] Update error:', error);
      return NextResponse.json({ error: 'Failed to update redemption' }, { status: 500 });
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
