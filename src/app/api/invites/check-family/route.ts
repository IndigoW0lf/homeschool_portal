import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
  }
  
  const supabase = await createServerClient();
  
  // Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('family_invites')
    .select('family_id')
    .eq('invite_code', code)
    .eq('status', 'pending')
    .single();
  
  if (inviteError || !invite) {
    return NextResponse.json({ hasKids: false });
  }
  
  // Check if family has kids
  const { data: kids, error: kidsError } = await supabase
    .from('kids')
    .select('id')
    .eq('family_id', invite.family_id)
    .limit(1);
  
  // Get family name
  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('id', invite.family_id)
    .single();
  
  return NextResponse.json({
    hasKids: !kidsError && kids && kids.length > 0,
    familyName: family?.name || 'the family',
  });
}
