import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * DELETE /api/account
 *
 * Permanently deletes the authenticated parent's account and ALL associated
 * data: families (if sole member), kids, journal entries, curriculum records,
 * lessons, profile photo, and the auth user record.
 *
 * For families with other members, the caller is removed but the family and
 * its kids are preserved.
 *
 * This action is irreversible.
 */
export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await createServiceRoleClient();

    // 1. Find all families this user belongs to
    const { data: memberships } = await service
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id);

    const familyIds = (memberships ?? []).map((m) => m.family_id);

    for (const familyId of familyIds) {
      // Count other members in this family
      const { count } = await service
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId);

      if (count === 1) {
        // Sole member — delete all kids in this family first (cascades to
        // journal_entries, external_curriculum, etc.), then the family itself
        const { data: kids } = await service
          .from('kids')
          .select('id')
          .eq('family_id', familyId);

        if (kids && kids.length > 0) {
          await service
            .from('kids')
            .delete()
            .in('id', kids.map((k) => k.id));
        }

        await service.from('families').delete().eq('id', familyId);
      } else {
        // Other members exist — only remove this user from the family
        await service
          .from('family_members')
          .delete()
          .eq('family_id', familyId)
          .eq('user_id', user.id);
      }
    }

    // 2. Delete profile photo from storage if present
    const { data: profile } = await service
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .single();

    if (profile?.profile_photo_url && !profile.profile_photo_url.startsWith('/api')) {
      // Legacy full URL — extract path
      const idx = profile.profile_photo_url.indexOf('/profile-photos/');
      if (idx !== -1) {
        const path = profile.profile_photo_url.slice(idx + '/profile-photos/'.length).split('?')[0];
        if (path) await service.storage.from('profile-photos').remove([path]);
      }
    } else if (profile?.profile_photo_url && profile.profile_photo_url.includes('/')) {
      // Bare storage path
      await service.storage.from('profile-photos').remove([profile.profile_photo_url]);
    }

    // 3. Delete profile row
    await service.from('profiles').delete().eq('id', user.id);

    // 4. Delete the auth user (cascades Supabase auth cleanup)
    const { error: deleteUserError } = await service.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error('[DELETE /api/account] Auth user deletion failed:', deleteUserError);
      return NextResponse.json(
        { error: 'Account data deleted but auth user removal failed — contact privacy@lunara.quest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/account] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
