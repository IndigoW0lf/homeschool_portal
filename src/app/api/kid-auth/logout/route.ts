import { NextResponse } from 'next/server';
import { clearKidSession } from '@/lib/kid-session';

export async function POST() {
  await clearKidSession();
  return NextResponse.json({ success: true });
}
