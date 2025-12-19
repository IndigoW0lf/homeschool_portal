import { NextResponse } from 'next/server';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes': string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify with Cloudflare
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const result: TurnstileVerifyResponse = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      console.warn('Turnstile verification failed:', result['error-codes']);
      return NextResponse.json(
        { success: false, error: 'Verification failed', codes: result['error-codes'] },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Turnstile verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification request failed' },
      { status: 500 }
    );
  }
}
