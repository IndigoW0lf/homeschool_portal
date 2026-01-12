// Kid Credentials API
// Allows parents to set/update kid login credentials (last name + password)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

/**
 * POST /api/kids/[kidId]/credentials
 * 
 * Update kid credentials. Parent only.
 * Body: { lastName, password }
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ kidId: string }> }
) {
  try {
    const { kidId } = await params;
    const { lastName, password } = await request.json();
    
    if (!kidId) {
      return NextResponse.json({ error: 'Kid ID required' }, { status: 400 });
    }

    if (!lastName || !password) {
      return NextResponse.json({ error: 'Last name and password are required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Ensure user is authenticated (parent)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify parent owns this kid
    const { data: kid, error: fetchError } = await supabase
      .from('kids')
      .select('id, name')
      .eq('id', kidId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !kid) {
      return NextResponse.json({ error: 'Kid not found or unauthorized' }, { status: 404 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check availability of credentials (first name + last initial + password hash)
    // Note: We can't check hash uniqueness directly because different salts produce different hashes
    // Instead, we trust the DB constraint if we added one, OR we rely on the fact that
    // minimal collisions on first name + last initial are acceptable as long as passwords differ.
    // However, if two kids have SAME name, SAME initial, and SAME password, they can't distinguish.
    
    // Check for potential collision (same name + same initial)
    const firstInitial = lastName.charAt(0).toUpperCase();
    const { data: collisions } = await supabase
      .from('kids')
      .select('id, name, last_name, password_hash')
      .ilike('name', kid.name) // Same first name
      .neq('id', kidId); // Not this kid

    // Filter collisions manually for last initial match
    const initialCollisions = (collisions || []).filter(k => 
      k.last_name && k.last_name.charAt(0).toUpperCase() === firstInitial
    );

    // If collisions exist, ensure password isn't identical
    for (const collision of initialCollisions) {
      if (collision.password_hash) {
        const isMatch = await bcrypt.compare(password, collision.password_hash);
        if (isMatch) {
           return NextResponse.json({ 
             error: 'This password is already used by another kid with the same name. Please choose a unique password.' 
           }, { status: 409 });
        }
      }
    }

    // Update kid credentials
    const { error: updateError } = await supabase
      .from('kids')
      .update({
        last_name: lastName,
        password_hash: passwordHash,
        // Clear pin_hash if switching to password? Or keep both for now? Keeping both is safer.
      })
      .eq('id', kidId);

    if (updateError) {
      console.error('[credentials] DB Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[credentials] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
