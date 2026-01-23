'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeSlash, Check, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Kid } from '@/types';
import { useRouter } from 'next/navigation';

interface KidAccessManagerProps {
  kid: Kid;
}

export function KidAccessManager({ kid }: KidAccessManagerProps) {
  const router = useRouter();
  const [lastName, setLastName] = useState(kid.lastName || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(!!(kid.lastName && kid.passwordHash));

  // Determine if this is a first-time setup (migration) or update
  const isSetup = !hasCredentials;

  const handleSave = async () => {
    if (!lastName || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/kids/${kid.id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save credentials');
      }

      toast.success('Login credentials saved! 🌟');
      setHasCredentials(true);
      setPassword(''); // Clear password field
      router.refresh();
    } catch (err: unknown) {
      console.error('Failed to save credentials:', err);
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Lock size={24} className="text-[var(--lavender-500)]" weight="fill" />
        <h3 className="text-lg font-semibold text-heading">
          Student Login
        </h3>
      </div>

      <p className="text-sm text-muted">
        Your child needs a Last Name and a Password to log in independently at <span className="font-mono text-xs bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] px-1 py-0.5 rounded">/student</span>.
      </p>

      {/* Setup / Update Form */}
      <div className={cn(
        "p-5 rounded-xl border-2 transition-all",
        isSetup 
          ? "border-[var(--lavender-200)] bg-[var(--lavender-50)] dark:bg-[var(--lavender-900)]/10 dark:border-[var(--lavender-800)]"
          : "border-[var(--border)] dark:border-[var(--border)] bg-white dark:bg-[var(--night-900)]"
      )}>
        <div className="flex items-start gap-3 mb-6">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
             isSetup ? "bg-[var(--lavender-100)] text-[var(--lavender-600)]" : "bg-green-100 text-green-600"
          )}>
            {isSetup ? <Warning size={20} weight="fill" /> : <Check size={20} weight="bold" />}
          </div>
          <div>
            <h4 className="font-medium text-heading">
              {isSetup ? 'Enable Student Login' : 'Login Credentials Active'}
            </h4>
            <p className="text-xs text-muted mt-1">
              {isSetup 
                ? 'Set a Last Name and Password to enable login.' 
                : 'Last Name and Password are set. Use the form below to update them.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-heading dark:text-muted mb-1.5">
              Last Name {isSetup && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] focus:ring-2 focus:ring-[var(--lavender-500)] outline-none"
              />
              <p className="text-[10px] text-muted mt-1.5 ml-1">
                Used for login initial matching (e.g. "Stella A")
              </p>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-heading dark:text-muted mb-1.5">
              {isSetup ? 'Create Password' : 'Update Password'} {isSetup && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSetup ? "Enter a new password" : "Enter new password to change"}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] focus:ring-2 focus:ring-[var(--lavender-500)] outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isSetup && (
              <p className="text-[10px] text-muted mt-1.5 ml-1">
                Leave empty to keep current password
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !lastName || (!password && isSetup)}
              className={cn(
                "w-full py-2.5 rounded-lg font-medium transition-all shadow-sm",
                isSetup
                  ? "bg-[var(--lavender-500)] text-white hover:bg-[var(--lavender-600)]"
                  : "bg-white border border-[var(--border)] text-heading hover:bg-[var(--background-secondary)] dark:border-[var(--border)] dark:text-heading"
              )}
            >
              {isSaving ? 'Saving...' : (isSetup ? 'Enable Login' : 'Update Credentials')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
