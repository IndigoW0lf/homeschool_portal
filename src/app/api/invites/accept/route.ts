import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Get invite code from form data
  const formData = await request.formData();
  const code = formData.get('code') as string;
  
  if (!code) {
    return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
  }
  
  // Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('family_invites')
    .select('*')
    .eq('invite_code', code)
    .eq('status', 'pending')
    .single();
  
  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }
  
  // Check email matches
  if (invite.email !== user.email) {
    return NextResponse.json({ error: 'This invite was sent to a different email' }, { status: 403 });
  }
  
  // Check if already expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
  }
  
  // Add user to family
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: invite.family_id,
      user_id: user.id,
      role: invite.role || 'member',
    });
  
  if (memberError) {
    // Check if already a member
    if (memberError.code === '23505') { // unique violation
      return NextResponse.json({ error: 'Already a member of this family' }, { status: 409 });
    }
    console.error('Error adding family member:', memberError);
    return NextResponse.json({ error: 'Failed to join family' }, { status: 500 });
  }
  
  // Mark invite as accepted
  await supabase
    .from('family_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);
  
  // Redirect to parent dashboard
  redirect('/parent?joined=true');
}
