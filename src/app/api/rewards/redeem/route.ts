import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';

/**
 * POST /api/rewards/redeem
 * Creates a pending redemption when kid "buys" a reward
 * ALSO deducts moons from the database
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

    // Check for kid session - use Service Role to bypass RLS
    const kidSession = await getKidSession();
    let supabase;
    
    if (kidSession && kidSession.kidId === kidId) {
      // Kid buying for themselves → Use Service Role (bypass RLS)
      supabase = await createServiceRoleClient();
    } else {
      // Parent/other user → Use standard client (RLS)
      supabase = await createServerClient();
      
      // If not a kid session, verify parent is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // 1. Get the reward details to know the cost
    const { data: reward, error: rewardError } = await supabase
      .from('kid_rewards')
      .select('moon_cost, name')
      .eq('id', rewardId)
      .single();
    
    if (rewardError || !reward) {
      console.error('[Redeem] Reward not found:', rewardError);
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    // 2. Get current moons for the kid from student_progress
    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select('total_stars')
      .eq('kid_id', kidId)
      .single();
    
    if (progressError) {
      console.error('[Redeem] Progress not found:', progressError);
      // If no progress record, assume 0 moons
    }
    
    const currentMoons = progress?.total_stars || 0;
    const cost = reward.moon_cost || 0;
    
    // 3. Check if kid has enough moons
    if (currentMoons < cost) {
      return NextResponse.json(
        { error: 'Not enough moons', currentMoons, cost },
        { status: 400 }
      );
    }
    
    // 4. Deduct moons from database (student_progress.total_stars)
    const newMoonBalance = currentMoons - cost;
    const { error: updateError } = await supabase
      .from('student_progress')
      .update({ total_stars: newMoonBalance, updated_at: new Date().toISOString() })
      .eq('kid_id', kidId);
    
    if (updateError) {
      console.error('[Redeem] Failed to deduct moons:', updateError);
      return NextResponse.json({ error: 'Failed to deduct moons' }, { status: 500 });
    }
    
    // 5. Create pending redemption
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
      // Refund the moons since redemption failed
      await supabase
        .from('student_progress')
        .update({ total_stars: currentMoons })
        .eq('kid_id', kidId);
      return NextResponse.json({ error: 'Failed to create redemption' }, { status: 500 });
    }

    console.log(`[Redeem] Success: ${reward.name} for ${cost} moons. New balance: ${newMoonBalance}`);

    return NextResponse.json({
      success: true,
      redemption: data,
      newMoonBalance,
      message: 'Redemption request sent! Ask your parent to approve it.',
    });

  } catch (error) {
    console.error('Redeem endpoint error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * GET /api/rewards/redeem?kidId=xxx
 * Gets pending redemptions for a kid (for parent dashboard or kid viewing their own)
 * Combines both reward_redemptions AND shop_purchases
 */
export async function GET(request: NextRequest) {
  try {
    const kidId = request.nextUrl.searchParams.get('kidId');
    
    if (!kidId) {
      return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
    }

    // Check for kid session - use Service Role to bypass RLS
    const kidSession = await getKidSession();
    let supabase;
    
    if (kidSession && kidSession.kidId === kidId) {
      // Kid viewing their own redemptions → Use Service Role
      supabase = await createServiceRoleClient();
    } else {
      // Parent/other user → Use standard client (RLS)
      supabase = await createServerClient();
    }

    console.log('[Redeem API] Fetching for kidId:', kidId);
    
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

    console.log('[Redeem API] reward_redemptions:', rewardRedemptions?.length || 0, rewardError?.message || 'OK');

    // First check ALL shop purchases for this kid (for debugging)
    const { data: allShopPurchases, error: allShopError } = await supabase
      .from('shop_purchases')
      .select('*')
      .eq('kid_id', kidId);
    
    console.log('[Redeem API] ALL shop_purchases for kid:', allShopPurchases?.length || 0, allShopError?.message || 'OK');
    if (allShopPurchases && allShopPurchases.length > 0) {
      console.log('[Redeem API] Shop purchases statuses:', allShopPurchases.map(p => p.status));
    }

    // Fetch from shop_purchases (new system) - unfulfilled items
    const { data: shopPurchases, error: shopError } = await supabase
      .from('shop_purchases')
      .select('*')
      .eq('kid_id', kidId)
      .eq('status', 'unfulfilled')
      .order('purchased_at', { ascending: false });

    console.log('[Redeem API] Unfulfilled shop_purchases:', shopPurchases?.length || 0, shopError?.message || 'OK');

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

    console.log('[Redeem API] Combined total:', combinedRedemptions.length);

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
