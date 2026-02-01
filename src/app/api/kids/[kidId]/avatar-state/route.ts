import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    kidId: string;
  }>;
}

/**
 * GET /api/kids/[kidId]/avatar-state
 * Fetch the kid's Open Peeps avatar state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;

  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('kids')
    .select('open_peeps_avatar_state, avatar_url')
    .eq('id', kidId)
    .single();

  if (error) {
    console.error('[avatar-state] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch avatar state' }, { status: 500 });
  }

  return NextResponse.json({
    openPeepsState: data?.open_peeps_avatar_state || null,
    avatarUrl: data?.avatar_url || null,
  });
}

/**
 * PUT /api/kids/[kidId]/avatar-state
 * Save the kid's Open Peeps avatar state
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;

  let body: { openPeepsState: Record<string, string>; avatarUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { openPeepsState, avatarUrl } = body;

  if (!openPeepsState) {
    return NextResponse.json({ error: 'openPeepsState is required' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Update the kid's avatar state
  const { error } = await supabase
    .from('kids')
    .update({
      open_peeps_avatar_state: openPeepsState,
      avatar_url: avatarUrl || null,
    })
    .eq('id', kidId);

  if (error) {
    console.error('[avatar-state] PUT error:', error);
    return NextResponse.json({ error: 'Failed to save avatar state' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
