'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Envelope, Key, Warning, ArrowRight } from '@phosphor-icons/react';

interface AccountSettingsProps {
  user: User;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) return;

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success('Check your new email for a confirmation link!');
      setShowEmailForm(false);
      setNewEmail('');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to update email';
      toast.error(message);
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully! 🔐');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/parent/login');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Current Email */}
      <div className="pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <Envelope size={20} className="text-muted" />
          <h3 className="font-medium text-heading">
            Email Address
          </h3>
        </div>
        <p className="text-muted mb-4">
          {user.email}
        </p>

        {!showEmailForm ? (
          <button
            onClick={() => setShowEmailForm(true)}
            className="text-sm text-[var(--cosmic-rust-500)] hover:underline flex items-center gap-1"
          >
            Change email address
            <ArrowRight size={14} />
          </button>
        ) : (
          <form onSubmit={handleEmailChange} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label htmlFor="newEmail" className="sr-only">New email</label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background-elevated)] text-heading focus:ring-2 focus:ring-[var(--cosmic-rust-500)] focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isChangingEmail || !newEmail}
                className="px-4 py-2 bg-[var(--cosmic-rust-500)] text-[var(--foreground)] text-sm rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isChangingEmail ? 'Sending...' : 'Send Confirmation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false);
                  setNewEmail('');
                }}
                className="px-4 py-2 text-muted text-sm hover:underline"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-muted">
              We'll send a confirmation link to your new email. You'll need to click it to complete the change.
            </p>
          </form>
        )}
      </div>

      {/* Password */}
      <div className="pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <Key size={20} className="text-muted" />
          <h3 className="font-medium text-heading">
            Password
          </h3>
        </div>
        <p className="text-muted text-sm mb-4">
          {showPasswordForm ? 'Enter your new password below' : 'Set or update your password for login'}
        </p>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="text-sm text-[var(--cosmic-rust-500)] hover:underline flex items-center gap-1"
          >
            Set new password
            <ArrowRight size={14} />
          </button>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-muted mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background-elevated)] text-heading focus:ring-2 focus:ring-[var(--cosmic-rust-500)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background-elevated)] text-heading focus:ring-2 focus:ring-[var(--cosmic-rust-500)] focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-[var(--cosmic-rust-500)] text-[var(--foreground)] text-sm rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 text-muted text-sm hover:underline"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-muted">
              Password must be at least 6 characters
            </p>
          </form>
        )}
      </div>

      {/* Sign Out */}
      <div className="pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <Warning size={20} className="text-muted" />
          <h3 className="font-medium text-heading">
            Session
          </h3>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 border border-[var(--border)] text-muted text-sm rounded-lg hover:bg-[var(--hover-overlay)] transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Account Info */}
      <div className="text-sm text-muted">
        <p>Account created: {new Date(user.created_at).toLocaleDateString()}</p>
        <p>Last sign in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
  );
}
