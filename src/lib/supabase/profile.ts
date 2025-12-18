import { supabase } from './browser';
import type { Profile } from '@/types';

/**
 * Get the current user's profile (client-side)
 */
export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

/**
 * Ensure profile exists for user (call after login as fallback)
 * In case the trigger didn't fire, this creates the profile
 */
export async function ensureProfileExists(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to get existing profile
  const existing = await getProfile();
  if (existing) return existing;

  // Create if doesn't exist
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error ensuring profile exists:', error);
    return null;
  }

  return data;
}
