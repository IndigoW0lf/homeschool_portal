import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import avatarCatalog from '../../../../../content/purchasable-avatars.json';

interface AvatarItem {
  id: string;
  name: string;
  svgPath: string;
  cost: number;
  isFree: boolean;
}

type CategoryKey = 'upper' | 'standing' | 'sitting' | 'special' | 'medical';

/**
 * POST /api/avatars/purchase
 * Purchase an avatar for a kid
 */
export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient();

  let body: { kidId: string; avatarId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kidId, avatarId } = body;

  if (!kidId || !avatarId) {
    return NextResponse.json({ error: 'kidId and avatarId are required' }, { status: 400 });
  }

  // Find avatar in catalog
  let avatar: AvatarItem | undefined;
  let category: CategoryKey | undefined;

  for (const cat of ['upper', 'standing', 'sitting', 'special', 'medical'] as CategoryKey[]) {
    const found = (avatarCatalog[cat] as AvatarItem[]).find(a => a.id === avatarId);
    if (found) {
      avatar = found;
      category = cat;
      break;
    }
  }

  if (!avatar || !category) {
    return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
  }

  // Check if avatar is free
  if (avatar.isFree) {
    // Auto-grant free avatars
    const { error: insertError } = await supabase
      .from('kid_owned_avatars')
      .upsert({
        kid_id: kidId,
        avatar_id: avatarId,
        category,
        svg_path: avatar.svgPath,
        name: avatar.name,
      }, { onConflict: 'kid_id,avatar_id' });

    if (insertError) {
      console.error('[avatars/purchase] Failed to grant free avatar:', insertError);
    }

    return NextResponse.json({ success: true, isFree: true });
  }

  // Check if already owned
  const { data: existing } = await supabase
    .from('kid_owned_avatars')
    .select('id')
    .eq('kid_id', kidId)
    .eq('avatar_id', avatarId)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Avatar already owned' }, { status: 400 });
  }

  // Get kid's current moon balance
  const { data: kid, error: kidError } = await supabase
    .from('kids')
    .select('moons')
    .eq('id', kidId)
    .single();

  if (kidError || !kid) {
    return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  }

  const currentMoons = kid.moons || 0;
  if (currentMoons < avatar.cost) {
    return NextResponse.json({ error: 'Not enough moons' }, { status: 400 });
  }

  // Deduct moons
  const newBalance = currentMoons - avatar.cost;
  const { error: moonError } = await supabase
    .from('kids')
    .update({ moons: newBalance })
    .eq('id', kidId);

  if (moonError) {
    console.error('[avatars/purchase] Failed to deduct moons:', moonError);
    return NextResponse.json({ error: 'Failed to deduct moons' }, { status: 500 });
  }

  // Add to kid's owned avatars
  const { error: insertError } = await supabase
    .from('kid_owned_avatars')
    .insert({
      kid_id: kidId,
      avatar_id: avatarId,
      category,
      svg_path: avatar.svgPath,
      name: avatar.name,
    });

  if (insertError) {
    console.error('[avatars/purchase] Failed to add owned avatar:', insertError);
    // Refund moons on failure
    await supabase.from('kids').update({ moons: currentMoons }).eq('id', kidId);
    return NextResponse.json({ error: 'Failed to add avatar' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newMoonBalance: newBalance,
    avatar: {
      id: avatarId,
      name: avatar.name,
      svgPath: avatar.svgPath,
    },
  });
}
