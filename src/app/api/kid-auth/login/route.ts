import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createKidSession, KID_SESSION_MAX_AGE } from '@/lib/kid-session';
import bcrypt from 'bcryptjs';

/**
 * POST /api/kid-auth/login
 * 
 * Authenticate a kid with first name, last initial, and password.
 * Creates a kid session cookie on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { firstName, lastInitial, password, rememberMe } = body;
    
    // Trim inputs to handle iOS/mobile autocomplete adding spaces
    firstName = firstName?.trim();
    lastInitial = lastInitial?.trim();
    password = password?.trim();

    if (!firstName || !lastInitial || !password) {
      return NextResponse.json(
        { error: 'First name, last initial, and password are required' },
        { status: 400 }
      );
    }

    // Use Service Role client to bypass RLS (since kid isn't logged in yet)
    const supabase = await createServiceRoleClient();

    // Look up kids matching name and last initial
    const { data: kids, error } = await supabase
      .from('kids')
      .select('id, name, last_name, password_hash')
      .ilike('name', firstName)
      .not('password_hash', 'is', null);

    if (error) {
      console.error('[kid-auth/login] Database error:', error);
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }

    if (!kids || kids.length === 0) {
      return NextResponse.json(
        { error: 'No account found with that name. Ask your parent for help!' },
        { status: 401 }
      );
    }

    // Filter by last initial
    const matchingKids = kids.filter(kid => {
      const kidInitial = (kid.last_name || '').charAt(0).toUpperCase();
      return kidInitial === lastInitial.toUpperCase();
    });

    if (matchingKids.length === 0) {
      return NextResponse.json(
        { error: 'No account found with that name. Ask your parent for help!' },
        { status: 401 }
      );
    }

    // Check password against all matching kids (there could be duplicates)
    let authenticatedKid = null;
    for (const kid of matchingKids) {
      if (kid.password_hash) {
        const isValid = await bcrypt.compare(password, kid.password_hash);
        if (isValid) {
          authenticatedKid = kid;
          break;
        }
      }
    }

    if (!authenticatedKid) {
      return NextResponse.json(
        { error: 'Wrong password. Try again or ask your parent!' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await supabase
      .from('kids')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authenticatedKid.id);

    // Create kid session
    const maxAge = rememberMe ? KID_SESSION_MAX_AGE : undefined;
    await createKidSession(authenticatedKid.id, authenticatedKid.name, maxAge);

    console.log('[kid-auth/login] Kid logged in:', authenticatedKid.name);

    return NextResponse.json({
      success: true,
      kidId: authenticatedKid.id,
      name: authenticatedKid.name,
      redirectTo: `/kids/${authenticatedKid.id}`,
    });
  } catch (error) {
    console.error('[kid-auth/login] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
