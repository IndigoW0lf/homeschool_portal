'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';
import { Kid } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Updates a kid's profile data.
 * Supports both Parent (via RLS) and Kid (via Session + Service Role)
 */
export async function updateKidProfileAction(kidId: string, updates: Partial<Kid>) {
  try {
    const kidSession = await getKidSession();
    
    // Validate session if it's a kid
    // If no kid session, we assume it's a parent (handled by normal RLS or checked here)
    // Actually, createServiceRoleClient requires us to be careful.
    
    let supabase;
    
    if (kidSession && kidSession.kidId === kidId) {
       // Authenticated Kid -> Use Service Role
       supabase = await createServiceRoleClient();
    } else {
       // Parent or unauthorized -> Use standard client (which respects RLS)
       // Wait, standard client in Server Action uses 'cookies()'.
       // If parent is logged in, it works.
       // But if we used Service Role for everything, we bypass RLS.
       // We should default to Service Role ONLY if Kid Session validates ownership.
       
       if (!kidSession) {
          // Check if parent?
          // For simplicity, let's use Service Role Client BUT verify parent ownership?
          // Or just use createServerClient and let RLS handle it?
          // "createServerClient" in server action works fine for parents.
          const { createServerClient } = await import('@/lib/supabase/server');
          supabase = await createServerClient();
          
          // Verify user is logged in
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
             throw new Error('Unauthorized');
          }
       } else {
          throw new Error('Unauthorized: Session mismatch');
       }
    }

    // Prepare DB payload (convert camelCase to snake_case)
    const dbPayload: any = {};
    if (updates.nickname !== undefined) dbPayload.nickname = updates.nickname;
    if (updates.bio !== undefined) dbPayload.bio = updates.bio;
    if (updates.favoriteShows !== undefined) dbPayload.favorite_shows = updates.favoriteShows;
    if (updates.favoriteMusic !== undefined) dbPayload.favorite_music = updates.favoriteMusic;
    if (updates.favoriteFoods !== undefined) dbPayload.favorite_foods = updates.favoriteFoods;
    if (updates.favoriteSubjects !== undefined) dbPayload.favorite_subjects = updates.favoriteSubjects;
    if (updates.hobbies !== undefined) dbPayload.hobbies = updates.hobbies;
    if (updates.favoriteColor !== undefined) dbPayload.favorite_color = updates.favoriteColor;
    if (updates.birthday !== undefined) dbPayload.birthday = updates.birthday;
    if (updates.gradeBand !== undefined) dbPayload.grade_band = updates.gradeBand;
    if (updates.grades !== undefined) dbPayload.grades = updates.grades;
    if (updates.avatarState !== undefined) dbPayload.avatar_state = updates.avatarState;

    const { error } = await supabase
      .from('kids')
      .update(dbPayload)
      .eq('id', kidId);

    if (error) throw error;

    revalidatePath(`/kids/${kidId}`);
    return { success: true };
  } catch (error) {
    console.error('Update profile failed:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}
