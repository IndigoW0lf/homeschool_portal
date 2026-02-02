/**
 * World Pack Purchase API
 * POST: Purchase a world pack with moons
 * GET: Get kid's unlocked packs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import worldPacks from '@/../content/world-packs.json';

interface RouteParams {
  params: Promise<{ kidId: string }>;
}

// GET: Fetch kid's unlocked packs
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { kidId } = await params;
  
  try {
    const supabase = await createServiceRoleClient();
    
    const { data: unlocks, error } = await supabase
      .from('kid_world_unlocks')
      .select('pack_id')
      .eq('kid_id', kidId);
    
    if (error) {
      console.error('Error fetching unlocks:', error);
      return NextResponse.json({ error: 'Failed to fetch unlocks' }, { status: 500 });
    }
    
    const unlockedPacks = unlocks?.map(u => u.pack_id) || [];
    
    return NextResponse.json({ 
      unlockedPacks,
      availablePacks: worldPacks.packs.map(p => ({
        ...p,
        isOwned: unlockedPacks.includes(p.id),
      })),
    });
  } catch (error) {
    console.error('World packs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Purchase a world pack
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { kidId } = await params;
  
  try {
    const { packId } = await request.json();
    
    if (!packId) {
      return NextResponse.json({ error: 'Pack ID required' }, { status: 400 });
    }
    
    // Find pack in config
    const pack = worldPacks.packs.find(p => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }
    
    const supabase = await createServiceRoleClient();
    
    // Check if already owned
    const { data: existing } = await supabase
      .from('kid_world_unlocks')
      .select('id')
      .eq('kid_id', kidId)
      .eq('pack_id', packId)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'Pack already owned' }, { status: 400 });
    }
    
    // Check kid's moon balance
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('moon_balance')
      .eq('id', kidId)
      .single();
    
    if (kidError || !kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }
    
    const currentBalance = kid.moon_balance || 0;
    
    if (currentBalance < pack.cost) {
      return NextResponse.json({ 
        error: 'Not enough moons',
        required: pack.cost,
        current: currentBalance,
      }, { status: 400 });
    }
    
    // Deduct moons
    const newBalance = currentBalance - pack.cost;
    const { error: updateError } = await supabase
      .from('kids')
      .update({ moon_balance: newBalance })
      .eq('id', kidId);
    
    if (updateError) {
      console.error('Error updating balance:', updateError);
      return NextResponse.json({ error: 'Failed to deduct moons' }, { status: 500 });
    }
    
    // Add unlock record
    const { error: unlockError } = await supabase
      .from('kid_world_unlocks')
      .insert({ kid_id: kidId, pack_id: packId });
    
    if (unlockError) {
      // Rollback moon deduction
      await supabase
        .from('kids')
        .update({ moon_balance: currentBalance })
        .eq('id', kidId);
      
      console.error('Error creating unlock:', unlockError);
      return NextResponse.json({ error: 'Failed to unlock pack' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      newMoonBalance: newBalance,
      pack: {
        id: pack.id,
        name: pack.name,
        items: pack.items,
      },
    });
  } catch (error) {
    console.error('World pack purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
