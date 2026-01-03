import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/rewards?kidId=xxx
 * Get all rewards for a kid
 */
export async function GET(request: NextRequest) {
  try {
    const kidId = request.nextUrl.searchParams.get('kidId');
    
    if (!kidId) {
      return NextResponse.json({ error: 'kidId is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('kid_rewards')
      .select('*')
      .eq('kid_id', kidId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Rewards] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    return NextResponse.json({ rewards: data || [] });

  } catch (error) {
    console.error('Rewards GET error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * POST /api/rewards
 * Create a new reward for a kid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kidId, name, description, emoji, category, moonCost } = body as {
      kidId: string;
      name: string;
      description?: string;
      emoji?: string;
      category?: string;
      moonCost: number;
    };

    if (!kidId || !name || !moonCost) {
      return NextResponse.json(
        { error: 'kidId, name, and moonCost are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('kid_rewards')
      .insert({
        kid_id: kidId,
        name,
        description: description || '',
        emoji: emoji || '🎁',
        category: category || 'custom',
        moon_cost: moonCost,
      })
      .select()
      .single();

    if (error) {
      console.error('[Rewards] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reward: data });

  } catch (error) {
    console.error('Rewards POST error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * PUT /api/rewards
 * Update an existing reward
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, emoji, moonCost, isActive } = body as {
      id: string;
      name?: string;
      description?: string;
      emoji?: string;
      moonCost?: number;
      isActive?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (emoji !== undefined) updates.emoji = emoji;
    if (moonCost !== undefined) updates.moon_cost = moonCost;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from('kid_rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Rewards] Update error:', error);
      return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reward: data });

  } catch (error) {
    console.error('Rewards PUT error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * DELETE /api/rewards?id=xxx
 * Delete (soft delete) a reward
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('kid_rewards')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[Rewards] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Rewards DELETE error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
