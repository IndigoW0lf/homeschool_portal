import { NextResponse } from 'next/server';
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

    // Simple PIN comparison (in production, use bcrypt compare)
    // For now, we'll use a simple hash comparison
    const expectedHash = simpleHash(pin);
    const isCorrect = kid.pin_hash === expectedHash;

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

// Simple hash function for PINs (in production, use bcrypt)
function simpleHash(pin: string): string {
  let hash = 0;
  const salt = 'lunara_pin_salt_2024';
  const salted = salt + pin + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
