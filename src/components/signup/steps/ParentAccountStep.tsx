'use client';

import { useState } from 'react';
import { SignupData } from '../SignupWizard';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { EnvelopeSimple, Lock, User, ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react';

interface ParentAccountStepProps {
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
  setUserId: (id: string) => void;
}

export function ParentAccountStep({ data, updateData, onNext, onBack, setUserId }: ParentAccountStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canContinue = data.email && data.password && data.password.length >= 6;

  const handleCreateAccount = async () => {
    if (!canContinue) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/parent`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // Sign in immediately after signup to ensure session is active
      // This is needed for RLS policies to work correctly
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.warn('Auto sign-in failed, but account was created:', signInError);
        // Continue anyway - the account was created
      }

      // Update profile with display name if provided
      if (data.displayName) {
        await supabase
          .from('profiles')
          .update({ display_name: data.displayName })
          .eq('id', authData.user.id);
      }

      setUserId(authData.user.id);
      toast.success('Account created! 🎉');
      onNext();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-heading mb-1">
          Create your account
        </h2>
        <p className="text-sm text-muted">
          This will be your parent/educator login
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-heading dark:text-muted mb-1">
            What should we call you? (optional)
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="displayName"
              type="text"
              value={data.displayName}
              onChange={(e) => updateData({ displayName: e.target.value })}
              placeholder="Your name"
              className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-heading dark:text-muted mb-1">
            Email address *
          </label>
          <div className="relative">
            <EnvelopeSimple size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-heading dark:text-muted mb-1">
            Create a password *
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => updateData({ password: e.target.value })}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full pl-10 pr-12 py-2.5 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-muted dark:hover:text-muted transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-muted mt-1">Must be at least 6 characters</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2.5 text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handleCreateAccount}
          disabled={!canContinue || isLoading}
          className="flex-1 py-2.5 px-4 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Creating account...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
