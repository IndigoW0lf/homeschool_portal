import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';

/**
 * GET /api/kids/[kidId]/featured-badges
 * Retrieve the featured badges for a kid
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kidId: string }> }
) {
  const { kidId } = await params;

  try {
    const supabase = await createServiceRoleClient();
    
    const { data, error } = await supabase
      .from('kids')
      .select('featured_badges')
      .eq('id', kidId)
      .single();

    if (error) {
      console.error('[featured-badges/GET] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch featured badges' }, { status: 500 });
    }

    return NextResponse.json({ featuredBadges: data.featured_badges || [] });
  } catch (error) {
    console.error('[featured-badges/GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/kids/[kidId]/featured-badges
 * Update the featured badges for a kid (max 3)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ kidId: string }> }
) {
  const { kidId } = await params;

  try {
    const body = await request.json();
    const { featuredBadges } = body;

    // Validation
    if (!Array.isArray(featuredBadges)) {
      return NextResponse.json({ error: 'featuredBadges must be an array' }, { status: 400 });
    }

    if (featuredBadges.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 featured badges allowed' }, { status: 400 });
    }

    // Check if this is a kid session and verify they're updating their own profile
    const kidSession = await getKidSession();
    if (kidSession && kidSession.kidId !== kidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update featured badges
    const supabase = await createServiceRoleClient();
    
    const { error } = await supabase
      .from('kids')
      .update({ featured_badges: featuredBadges })
      .eq('id', kidId);

    if (error) {
      console.error('[featured-badges/PUT] Database error:', error);
      return NextResponse.json({ error: 'Failed to update featured badges' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      featuredBadges 
    });
  } catch (error) {
    console.error('[featured-badges/PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
