import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import openPeepsOptions from '../../../../../content/open-peeps-options.json';

// Flatten premium items from the options file
type CategoryKey = 'face' | 'head' | 'accessories' | 'facialHair';
interface OptionItem {
  id: string;
  label: string;
  unlocked: boolean;
  cost?: number;
}

const PREMIUM_ITEMS: Record<string, { category: CategoryKey; label: string; cost: number }> = {};

for (const [category, items] of Object.entries(openPeepsOptions)) {
  if (['face', 'head', 'accessories', 'facialHair'].includes(category)) {
    for (const item of items as OptionItem[]) {
      if (!item.unlocked && item.cost) {
        PREMIUM_ITEMS[`${category}:${item.id}`] = {
          category: category as CategoryKey,
          label: item.label,
          cost: item.cost,
        };
      }
    }
  }
}

/**
 * POST /api/avatar-items/purchase
 * Purchase an avatar item for a kid
 */
export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient();

  let body: { kidId: string; itemKey: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kidId, itemKey } = body;

  if (!kidId || !itemKey) {
    return NextResponse.json({ error: 'kidId and itemKey are required' }, { status: 400 });
  }

  // Validate item exists
  const item = PREMIUM_ITEMS[itemKey];
  if (!item) {
    return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
  }

  // Check if already owned
  const { data: existing } = await supabase
    .from('kid_avatar_items')
    .select('id')
    .eq('kid_id', kidId)
    .eq('item_category', item.category)
    .eq('item_id', itemKey.split(':')[1])
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Item already owned' }, { status: 400 });
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
  if (currentMoons < item.cost) {
    return NextResponse.json({ error: 'Not enough moons' }, { status: 400 });
  }

  // Deduct moons
  const newBalance = currentMoons - item.cost;
  const { error: moonError } = await supabase
    .from('kids')
    .update({ moons: newBalance })
    .eq('id', kidId);

  if (moonError) {
    console.error('[avatar-items/purchase] Failed to deduct moons:', moonError);
    return NextResponse.json({ error: 'Failed to deduct moons' }, { status: 500 });
  }

  // Add to kid's unlocked items
  const { error: insertError } = await supabase
    .from('kid_avatar_items')
    .insert({
      kid_id: kidId,
      item_category: item.category,
      item_id: itemKey.split(':')[1],
    });

  if (insertError) {
    console.error('[avatar-items/purchase] Failed to unlock item:', insertError);
    // Refund moons on failure
    await supabase.from('kids').update({ moons: currentMoons }).eq('id', kidId);
    return NextResponse.json({ error: 'Failed to unlock item' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newMoonBalance: newBalance,
    unlockedItem: itemKey,
  });
}
