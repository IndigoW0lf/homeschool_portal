/**
 * Family management functions for multi-adult support
 */

import { supabase } from './browser';
import type { Family, FamilyMember, FamilyInvite, Profile } from '@/types';

/**
 * Get the current user's family (or first family if multiple)
 */
export async function getUserFamily(): Promise<Family | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('[getUserFamily] No user logged in');
        return null;
    }
    console.log('[getUserFamily] User:', user.id);

    // First, directly check family_members for this user
    const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id);
    
    console.log('[getUserFamily] Direct family_members query:', memberData, memberError);

    if (!memberData || memberData.length === 0) {
        console.error('[getUserFamily] No family_members found for user. RLS may be hiding records.', { user: user.id, error: memberError });
        return null;
    }

    // Now get the family details
    const familyId = memberData[0].family_id;
    const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

    console.log('[getUserFamily] Family query:', familyData, familyError);

    if (familyError || !familyData) {
        console.error('Error fetching family:', familyError);
        return null;
    }

    return familyData as unknown as Family;
}

/**
 * Get all family members for a family
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const { data: members, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching family members:', error);
        return [];
    }

    if (!members || members.length === 0) {
        return [];
    }

    // Fetch profiles for all member user_ids
    const userIds = members.map(m => m.user_id).filter(Boolean);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

    // Create a map for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Merge profiles with members
    return members.map(member => ({
        ...member,
        profile: profileMap.get(member.user_id),
    })) as FamilyMember[];
}

/**
 * Get pending invites for a family
 */
export async function getFamilyInvites(familyId: string): Promise<FamilyInvite[]> {
    const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching family invites:', error);
        return [];
    }

    return (data || []) as FamilyInvite[];
}

/**
 * Get pending invites for the current user (invites they can accept)
 */
export async function getMyPendingInvites(): Promise<FamilyInvite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return [];

    const { data, error } = await supabase
        .from('family_invites')
        .select(`
      *,
      family:families(*)
    `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my invites:', error);
        return [];
    }

    return (data || []) as FamilyInvite[];
}

/**
 * Update family name
 */
export async function updateFamilyName(familyId: string, name: string): Promise<boolean> {
    const { error } = await supabase
        .from('families')
        .update({ name })
        .eq('id', familyId);

    if (error) {
        console.error('Error updating family name:', error);
        return false;
    }

    return true;
}

/**
 * Invite an adult to the family
 */
export async function inviteFamilyMember(
    familyId: string,
    email: string,
    role: 'admin' | 'member' = 'member'
): Promise<{ success: boolean; error?: string; inviteCode?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if user already exists and is a member
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();  // Returns null instead of error if not found

    if (existingProfile?.id) {
        // User exists - check if already a family member
        const { data: existingMember } = await supabase
            .from('family_members')
            .select('id')
            .eq('family_id', familyId)
            .eq('user_id', existingProfile.id)
            .maybeSingle();

        if (existingMember) {
            return { success: false, error: 'This person is already a family member' };
        }
    }

    // Check if invite already exists (by email, regardless of user account)
    const { data: existingInvite } = await supabase
        .from('family_invites')
        .select('id')
        .eq('family_id', familyId)
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();

    if (existingInvite) {
        return { success: false, error: 'An invitation has already been sent to this email' };
    }

    // Create the invite
    const { data: invite, error } = await supabase
        .from('family_invites')
        .insert({
            family_id: familyId,
            email,
            role,
            invited_by: user.id,
        })
        .select('invite_code')
        .single();

    if (error || !invite) {
        console.error('Error inviting family member:', error);
        return { success: false, error: error?.message || 'Failed to create invite' };
    }

    // Get family name and inviter name for the email
    const [{ data: family }, { data: profile }] = await Promise.all([
        supabase.from('families').select('name').eq('id', familyId).single(),
        supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    ]);

    // Call Edge Function to send email
    try {
        const { data, error: fnError } = await supabase.functions.invoke('send-family-invite', {
            body: {
                email,
                familyName: family?.name || 'My Family',
                inviterName: profile?.display_name || 'A family member',
                inviteCode: invite.invite_code,
            },
        });

        if (fnError) {
            console.error('Error calling send-family-invite function:', fnError);
            // Don't fail the invite - it's still created, just email didn't send
        } else if (data?.error) {
            console.error('Edge function error:', data.error);
        }
    } catch (err) {
        console.error('Failed to send invite email:', err);
        // Invite is still valid, just couldn't send email
    }

    return { success: true, inviteCode: invite.invite_code };
}

/**
 * Accept a family invitation
 */
export async function acceptFamilyInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get the invite
    const { data: invite, error: fetchError } = await supabase
        .from('family_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

    if (fetchError || !invite) {
        return { success: false, error: 'Invitation not found' };
    }

    // Add user to family
    const { error: memberError } = await supabase
        .from('family_members')
        .insert({
            family_id: invite.family_id,
            user_id: user.id,
            role: invite.role,
            invited_by: invite.invited_by,
            accepted_at: new Date().toISOString(),
        });

    if (memberError) {
        console.error('Error joining family:', memberError);
        return { success: false, error: memberError.message };
    }

    // Mark invite as accepted (update BOTH status and accepted_at)
    await supabase
        .from('family_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', inviteId);

    return { success: true };
}

/**
 * Decline/cancel a family invitation
 */
export async function declineFamilyInvite(inviteId: string): Promise<boolean> {
    const { error } = await supabase
        .from('family_invites')
        .delete()
        .eq('id', inviteId);

    if (error) {
        console.error('Error declining invite:', error);
        return false;
    }

    return true;
}

/**
 * Remove a family member (admin only)
 */
export async function removeFamilyMember(memberId: string): Promise<boolean> {
    const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

    if (error) {
        console.error('Error removing family member:', error);
        return false;
    }

    return true;
}

/**
 * Leave a family (self-remove)
 */
export async function leaveFamily(familyId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error leaving family:', error);
        return false;
    }

    return true;
}

/**
 * Check if current user is an admin of the family
 */
export async function isUserFamilyAdmin(familyId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single();

    if (error || !data) return false;

    return data.role === 'admin';
}
