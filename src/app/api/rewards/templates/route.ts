import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/rewards/templates
 * Get all reward templates for the user's family
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // RLS policies should filter this to only the user's family templates
    const { data: templates, error } = await supabase
      .from('reward_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Reward Templates] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });

  } catch (error) {
    console.error('Reward Templates GET error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * POST /api/rewards/templates
 * Create a new reward template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, emoji, icon, category, moonCost, isUnlimited } = body as {
      name: string;
      description?: string;
      emoji?: string;
      icon?: string;
      category?: string;
      moonCost: number;
      isUnlimited?: boolean;
    };

    if (!name || !moonCost) {
      return NextResponse.json(
        { error: 'name and moonCost are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family (assume primary family for now)
    const { data: familyMember, error: familyError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (familyError || !familyMember) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const is_unlimited = isUnlimited !== undefined ? isUnlimited : true;

    const { data, error } = await supabase
      .from('reward_templates')
      .insert({
        family_id: familyMember.family_id,
        name,
        description: description || '',
        emoji: emoji || '🎁',
        icon: icon || null,
        category: category || 'custom',
        moon_cost: moonCost,
        is_unlimited,
      })
      .select()
      .single();

    if (error) {
      console.error('[Reward Templates] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ success: true, template: data });

  } catch (error) {
    console.error('Reward Templates POST error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
