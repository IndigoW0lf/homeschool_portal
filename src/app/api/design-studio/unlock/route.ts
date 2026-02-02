import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import avatarCatalog from '../../../../../content/purchasable-avatars.json';

const DESIGN_STUDIO_COST = avatarCatalog.designStudio.cost;

/**
 * POST /api/design-studio/unlock
 * Purchase Design Studio access for a kid
 */
export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient();

  let body: { kidId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kidId } = body;

  if (!kidId) {
    return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
  }

  // Check if already unlocked
  const { data: kid, error: kidError } = await supabase
    .from('kids')
    .select('moons, design_studio_unlocked')
    .eq('id', kidId)
    .single();

  if (kidError || !kid) {
    return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  }

  if (kid.design_studio_unlocked) {
    return NextResponse.json({ error: 'Design Studio already unlocked' }, { status: 400 });
  }

  const currentMoons = kid.moons || 0;
  if (currentMoons < DESIGN_STUDIO_COST) {
    return NextResponse.json({ 
      error: 'Not enough moons',
      required: DESIGN_STUDIO_COST,
      current: currentMoons,
    }, { status: 400 });
  }

  // Deduct moons and unlock
  const newBalance = currentMoons - DESIGN_STUDIO_COST;
  const { error: updateError } = await supabase
    .from('kids')
    .update({ 
      moons: newBalance,
      design_studio_unlocked: true,
    })
    .eq('id', kidId);

  if (updateError) {
    console.error('[design-studio/unlock] Failed to unlock:', updateError);
    return NextResponse.json({ error: 'Failed to unlock Design Studio' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newMoonBalance: newBalance,
    designStudioUnlocked: true,
  });
}

/**
 * GET /api/design-studio/unlock?kidId=xxx
 * Check if Design Studio is unlocked for a kid
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kidId = searchParams.get('kidId');

  if (!kidId) {
    return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();
  
  const { data: kid, error } = await supabase
    .from('kids')
    .select('design_studio_unlocked')
    .eq('id', kidId)
    .single();

  if (error || !kid) {
    return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  }

  return NextResponse.json({
    unlocked: kid.design_studio_unlocked || false,
    cost: DESIGN_STUDIO_COST,
  });
}
