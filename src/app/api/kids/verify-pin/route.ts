import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

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

    // Fetch kid data
    const { data: kid, error: fetchError } = await supabase
      .from('kids')
      .select('pin_hash, failed_pin_attempts, pin_lockout_until')
      .eq('id', kidId)
      .single();

    if (fetchError || !kid) {
      return NextResponse.json(
        { success: false, error: 'Kid not found' },
        { status: 404 }
      );
    }

    // Check lockout
    if (kid.pin_lockout_until) {
      const lockoutEnd = new Date(kid.pin_lockout_until);
      if (lockoutEnd > new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Too many attempts. Try again later.',
          lockedOut: true,
        });
      }
    }

    // If no PIN is set, allow access (PIN is optional feature)
    if (!kid.pin_hash) {
      return NextResponse.json({ success: true });
    }

    // Compare PIN — bcrypt hashes start with $2b$; legacy hashes are hex strings
    let isCorrect: boolean;
    if (kid.pin_hash.startsWith('$2')) {
      isCorrect = await bcrypt.compare(pin, kid.pin_hash);
    } else {
      // Legacy simpleHash — compare then immediately upgrade to bcrypt on success
      isCorrect = kid.pin_hash === simpleHash(pin);
      if (isCorrect) {
        const newHash = await bcrypt.hash(pin, 10);
        await supabase.from('kids').update({ pin_hash: newHash }).eq('id', kidId);
      }
    }

    if (isCorrect) {
      // Reset failed attempts on success
      await supabase
        .from('kids')
        .update({
          failed_pin_attempts: 0,
          pin_lockout_until: null,
        })
        .eq('id', kidId);

      return NextResponse.json({ success: true });
    } else {
      // Increment failed attempts
      const newAttempts = (kid.failed_pin_attempts || 0) + 1;
      const lockoutUntil = newAttempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
        : null;

      await supabase
        .from('kids')
        .update({
          failed_pin_attempts: newAttempts,
          pin_lockout_until: lockoutUntil,
        })
        .eq('id', kidId);

      return NextResponse.json({
        success: false,
        error: 'Incorrect PIN',
        attemptsRemaining: MAX_ATTEMPTS - newAttempts,
        lockedOut: newAttempts >= MAX_ATTEMPTS,
      });
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// Legacy hash — only used for backward-compatible migration of old PINs
function simpleHash(pin: string): string {
  let hash = 0;
  const salt = 'lunara_pin_salt_2024';
  const salted = salt + pin + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
