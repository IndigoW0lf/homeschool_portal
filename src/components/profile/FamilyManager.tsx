'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Trash,
    Crown,
    EnvelopeSimple,
    Check,
    X,
    Clock,
    PencilSimple,
    SignOut,
    CaretDown
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
    getUserFamily,
    getFamilyMembers,
    getFamilyInvites,
    getMyPendingInvites,
    inviteFamilyMember,
    acceptFamilyInvite,
    declineFamilyInvite,
    removeFamilyMember,
    updateFamilyName,
    isUserFamilyAdmin,
} from '@/lib/supabase/family';
import { supabase } from '@/lib/supabase/browser';
import type { Family, FamilyMember, FamilyInvite } from '@/types';

export function FamilyManager() {
    const router = useRouter();
    const [family, setFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [invites, setInvites] = useState<FamilyInvite[]>([]);
    const [myInvites, setMyInvites] = useState<FamilyInvite[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
    const [isInviting, setIsInviting] = useState(false);

    // Edit family name
    const [editingName, setEditingName] = useState(false);
    const [familyName, setFamilyName] = useState('');

    // Confirmation states
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            const fam = await getUserFamily();
            setFamily(fam);
            setFamilyName(fam?.name || 'My Family');

            if (fam) {
                const [membersData, invitesData, adminCheck] = await Promise.all([
                    getFamilyMembers(fam.id),
                    getFamilyInvites(fam.id),
                    isUserFamilyAdmin(fam.id),
                ]);
                setMembers(membersData);
                setInvites(invitesData);
                setIsAdmin(adminCheck);
            }

            // Also check for invites to this user
            const myPending = await getMyPendingInvites();
            setMyInvites(myPending);
        } catch (err) {
            console.error('Error loading family data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleInvite() {
        if (!family || !inviteEmail.trim()) return;

        setIsInviting(true);
        const result = await inviteFamilyMember(family.id, inviteEmail.trim().toLowerCase(), inviteRole);
        setIsInviting(false);

        if (result.success) {
            toast.success(`Invitation sent to ${inviteEmail}!`);
            setInviteEmail('');
            setShowInviteForm(false);
            loadData();
        } else {
            toast.error(result.error || 'Failed to send invitation');
        }
    }

    async function handleAcceptInvite(invite: FamilyInvite) {
        const result = await acceptFamilyInvite(invite.id);
        if (result.success) {
            toast.success(`You've joined ${invite.family?.name || 'the family'}! 🎉`);
            loadData();
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to accept invitation');
        }
    }

    async function handleDeclineInvite(inviteId: string) {
        const success = await declineFamilyInvite(inviteId);
        if (success) {
            toast.success('Invitation declined');
            loadData();
        } else {
            toast.error('Failed to decline invitation');
        }
    }

    async function handleRemoveMember(memberId: string) {
        const success = await removeFamilyMember(memberId);
        if (success) {
            toast.success('Member removed');
            setRemovingId(null);
            loadData();
        } else {
            toast.error('Failed to remove member');
        }
    }

    async function handleCancelInvite(inviteId: string) {
        const success = await declineFamilyInvite(inviteId);
        if (success) {
            toast.success('Invitation cancelled');
            loadData();
        } else {
            toast.error('Failed to cancel invitation');
        }
    }

    async function handleSaveFamilyName() {
        if (!family || !familyName.trim()) return;

        const success = await updateFamilyName(family.id, familyName.trim());
        if (success) {
            toast.success('Family name updated!');
            setFamily({ ...family, name: familyName.trim() });
            setEditingName(false);
        } else {
            toast.error('Failed to update family name');
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-[var(--background-secondary)] rounded w-1/3"></div>
                <div className="h-20 bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pending Invitations to Current User */}
            {myInvites.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                        <EnvelopeSimple size={18} weight="duotone" />
                        You&apos;ve Been Invited!
                    </h3>
                    <div className="space-y-2">
                        {myInvites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-3 bg-[var(--background-elevated)] rounded-lg">
                                <div>
                                    <p className="font-medium text-heading">
                                        {invite.family?.name || 'A Family'}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Invited by {invite.inviter_profile?.display_name || invite.inviter_profile?.email || 'someone'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAcceptInvite(invite)}
                                        className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center gap-1"
                                    >
                                        <Check size={14} weight="bold" /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleDeclineInvite(invite.id)}
                                        className="px-3 py-1.5 text-sm text-muted hover:bg-[var(--hover-overlay)] rounded-lg"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Family Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 flex items-center justify-center">
                        <Users size={22} weight="duotone" className="text-[var(--ember-600)] dark:text-[var(--ember-400)]" />
                    </div>
                    {editingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                                className="px-2 py-1 text-lg font-semibold border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading"
                                autoFocus
                            />
                            <button onClick={handleSaveFamilyName} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                                <Check size={18} weight="bold" />
                            </button>
                            <button onClick={() => { setEditingName(false); setFamilyName(family?.name || 'My Family'); }} className="p-1.5 text-muted hover:bg-[var(--hover-overlay)] rounded">
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-heading">
                                {family?.name || 'My Family'}
                            </h3>
                            {isAdmin && (
                                <button
                                    onClick={() => setEditingName(true)}
                                    className="p-1 text-muted hover:text-muted dark:hover:text-muted"
                                    title="Edit family name"
                                >
                                    <PencilSimple size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {isAdmin && !showInviteForm && (
                    <button
                        onClick={() => setShowInviteForm(true)}
                        className="text-sm font-medium text-[var(--ember-500)] hover:text-[var(--ember-600)] flex items-center gap-1"
                    >
                        <UserPlus size={16} weight="bold" />
                        Invite Adult
                    </button>
                )}
            </div>

            {/* Invite Form */}
            {showInviteForm && (
                <div className="p-4 rounded-lg bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20 border border-[var(--ember-200)] dark:border-[var(--ember-800)] space-y-3">
                    <p className="text-sm font-medium text-heading dark:text-muted">
                        Invite another adult to join your family
                    </p>
                    <p className="text-xs text-muted">
                        They&apos;ll be able to see and manage all kids in the family.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-muted mb-1">Email Address</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="parent@example.com"
                                className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-muted mb-1">Role</label>
                            <div className="relative">
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                                    className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] outline-none focus:ring-2 focus:ring-[var(--ember-500)] appearance-none"
                                >
                                    <option value="member">Member (can view & interact)</option>
                                    <option value="admin">Admin (full control)</option>
                                </select>
                                <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => { setShowInviteForm(false); setInviteEmail(''); }}
                            className="px-3 py-1.5 text-sm text-muted hover:bg-[var(--hover-overlay)] rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInvite}
                            disabled={isInviting || !inviteEmail.trim()}
                            className="px-4 py-1.5 text-sm bg-[var(--ember-500)] text-white rounded-lg font-medium hover:bg-[var(--ember-600)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <EnvelopeSimple size={16} />
                            {isInviting ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </div>
            )}

            {/* Family Members */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Family Members ({members.length})
                </p>
                {members.map((member) => (
                    <div
                        key={member.id}
                        className={cn(
                            "p-3 rounded-lg border transition-all",
                            removingId === member.id
                                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                : "bg-[var(--background-secondary)] bg-[var(--background)] border-[var(--border)]"
                        )}
                    >
                        {removingId === member.id ? (
                            <div className="space-y-2">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Remove <strong>{member.profile?.display_name || member.profile?.email || 'this member'}</strong>?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setRemovingId(null)}
                                        className="px-2 py-1 text-xs text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-700)] rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded"
                                    >
                                        Yes, Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {member.profile?.avatar_url ? (
                                        <img
                                            src={member.profile.avatar_url}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 flex items-center justify-center text-[var(--ember-600)] dark:text-[var(--ember-400)] font-medium text-lg">
                                            {(member.profile?.display_name || member.profile?.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-heading">
                                                {member.profile?.display_name || member.profile?.email || 'Unknown'}
                                            </p>
                                            {member.role === 'admin' && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                                    <Crown size={10} weight="fill" /> Admin
                                                </span>
                                            )}
                                            {member.user_id === currentUserId && (
                                                <span className="text-xs text-muted">(You)</span>
                                            )}
                                        </div>
                                        {member.profile?.email && member.profile?.display_name && (
                                            <p className="text-xs text-muted">
                                                {member.profile.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {isAdmin && member.user_id !== currentUserId && (
                                    <button
                                        onClick={() => setRemovingId(member.id)}
                                        className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Remove member"
                                    >
                                        <Trash size={16} />
                                    </button>
                                )}
                                {!isAdmin && member.user_id === currentUserId && members.length > 1 && (
                                    <button
                                        onClick={() => setRemovingId(member.id)}
                                        className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
                                        title="Leave family"
                                    >
                                        <SignOut size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">
                        Pending Invitations ({invites.length})
                    </p>
                    {invites.map((invite) => (
                        <div
                            key={invite.id}
                            className="p-3 rounded-lg border border-dashed border-[var(--border)] dark:border-[var(--border)] bg-[var(--background-secondary)]/50 dark:bg-[var(--night-900)]/30"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
                                        <Clock size={18} className="text-muted" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted dark:text-muted">
                                            {invite.email}
                                        </p>
                                        <p className="text-xs text-muted">
                                            Invited as {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleCancelInvite(invite.id)}
                                        className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Cancel invitation"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
