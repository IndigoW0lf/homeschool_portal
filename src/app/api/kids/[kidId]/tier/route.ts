import { NextRequest, NextResponse } from 'next/server';
import { unlockDesignStudioTier } from '@/lib/supabase/mutations';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getTierLimits, getTierCost, getNextTierInfo, type DesignStudioTier } from '@/lib/avatar/tier-limits';

interface RouteParams {
  params: Promise<{ kidId: string }>;
}

// GET /api/kids/[kidId]/tier - Get current tier info and limits
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  
  try {
    const supabase = await createServiceRoleClient();
    
    const { data: kid, error } = await supabase
      .from('kids')
      .select('design_studio_tier, moons')
      .eq('id', kidId)
      .single();
    
    if (error || !kid) {
      console.error('[Tier API] Error fetching kid:', error);
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }
    
    const currentTier = (kid.design_studio_tier || 1) as DesignStudioTier;
    const tierLimits = getTierLimits(currentTier);
    const nextTierInfo = getNextTierInfo(currentTier);
    
    // Get current design count
    const { count } = await supabase
      .from('kid_designs')
      .select('*', { count: 'exact', head: true })
      .eq('kid_id', kidId);
    
    return NextResponse.json({
      currentTier,
      tierLimits,
      nextTier: nextTierInfo.nextTier,
      nextTierCost: nextTierInfo.cost,
      nextTierLimits: nextTierInfo.limits,
      moonBalance: kid.moons || 0,
      currentDesignCount: count || 0,
    });
  } catch (error) {
    console.error('[Tier API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/kids/[kidId]/tier - Unlock next tier
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  
  try {
    const body = await request.json();
    const { targetTier } = body as { targetTier: DesignStudioTier };
    
    if (!targetTier || ![2, 3, 4].includes(targetTier)) {
      return NextResponse.json(
        { error: 'Invalid target tier' },
        { status: 400 }
      );
    }
    
    const moonCost = getTierCost(targetTier);
    const result = await unlockDesignStudioTier(kidId, targetTier, moonCost);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    const tierLimits = getTierLimits(targetTier);
    
    return NextResponse.json({
      success: true,
      newTier: targetTier,
      tierLimits,
      newMoonBalance: result.newMoonBalance,
    });
  } catch (error) {
    console.error('[Tier API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
