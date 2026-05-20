import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { kidId, pin } = await request.json();

    if (!kidId || !pin) {
      return NextResponse.json(
        { success: false, error: 'Missing kidId or PIN' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 4 digits' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify user is authenticated (parent setting PIN)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify parent owns this kid
    const { data: kid, error: fetchError } = await supabase
      .from('kids')
      .select('id, user_id')
      .eq('id', kidId)
      .single();

    if (fetchError || !kid) {
      return NextResponse.json(
        { success: false, error: 'Kid not found' },
        { status: 404 }
      );
    }

    if (kid.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Hash and store the PIN
    const pinHash = await bcrypt.hash(pin, 10);

    const { error: updateError } = await supabase
      .from('kids')
      .update({
        pin_hash: pinHash,
        failed_pin_attempts: 0,
        pin_lockout_until: null,
      })
      .eq('id', kidId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PIN set error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set PIN' },
      { status: 500 }
    );
  }
}

// No DELETE endpoint - PIN cannot be removed, only reset
// This ensures all kids always have a PIN for security
