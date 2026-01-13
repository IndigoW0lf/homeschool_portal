// Kid Session Management
// Handles kid-specific sessions separate from parent Supabase auth

import { cookies } from 'next/headers';

const KID_SESSION_COOKIE = 'lunara_kid_session';
export const KID_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface KidSession {
  kidId: string;
  name: string;
  createdAt: number;
}

/**
 * Create a kid session cookie
 * @param kidId ID of the kid
 * @param name Name of the kid
 * @param maxAge Optional max age in seconds. If undefined, creates a session cookie.
 */
export async function createKidSession(kidId: string, name: string, maxAge?: number): Promise<void> {
  const session: KidSession = {
    kidId,
    name,
    createdAt: Date.now(),
  };
  
  const cookieStore = await cookies();
  cookieStore.set(KID_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAge,
    path: '/',
  });
}

/**
 * Get the current kid session if one exists
 */
export async function getKidSession(): Promise<KidSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(KID_SESSION_COOKIE);
    
    // console.log('[getKidSession] Cookie present:', !!sessionCookie?.value);

    if (!sessionCookie?.value) {
      return null;
    }
    
    const session = JSON.parse(sessionCookie.value) as KidSession;
    return session;
  } catch {
    return null;
  }
}

/**
 * Clear the kid session (logout)
 */
export async function clearKidSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(KID_SESSION_COOKIE);
}

/**
 * Check if a kid session exists and matches the given kid ID
 */
export async function isKidSessionValid(kidId: string): Promise<boolean> {
  const session = await getKidSession();
  return session?.kidId === kidId;
}

/**
 * Get the kid ID from the current session
 */
export async function getKidIdFromSession(): Promise<string | null> {
  const session = await getKidSession();
  return session?.kidId || null;
}
