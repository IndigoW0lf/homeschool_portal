// Shared authorization helper for kid-scoped API routes.
// Accepts either a signed kid session (own data) or an authenticated
// parent who belongs to the same family as the kid.

import { getKidSession } from './kid-session';
import { createServerClient } from './supabase/server';

/**
 * Returns true if the current request is authorized to access kidId's data.
 * Does NOT throw — callers should return 401/403 when this returns false.
 */
export async function canAccessKid(kidId: string): Promise<boolean> {
  // Path 1: kid's own signed session
  const kidSession = await getKidSession();
  if (kidSession?.kidId === kidId) return true;

  // Path 2: authenticated parent in the same family
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: kid } = await supabase
    .from('kids')
    .select('family_id')
    .eq('id', kidId)
    .single();

  if (!kid?.family_id) return false;

  const { data: membership } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', kid.family_id)
    .eq('user_id', user.id)
    .single();

  return !!membership;
}
