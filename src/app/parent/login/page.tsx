'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { Turnstile } from '@/components/ui/Turnstile';

export default function ParentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<'magic_link' | 'password'>('magic_link');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setIsVerified(true);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setIsVerified(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Verify turnstile token first
      if (turnstileToken) {
        const verifyRes = await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const verifyResult = await verifyRes.json();
        if (!verifyResult.success) {
          setMessage({ type: 'error', text: 'Security verification failed' });
          setIsLoading(false);
          return;
        }
      }

      // Use environment variable for redirect URL, fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/parent`,
        },
      });

      if (authError) throw authError;

      setIsMagicLinkSent(true);
      setMessage({
        type: 'success',
        text: 'Magic link sent! Check your email to log in.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to send magic link',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Verify turnstile token first
      if (turnstileToken) {
        const verifyRes = await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const verifyResult = await verifyRes.json();
        if (!verifyResult.success) {
          setMessage({ type: 'error', text: 'Security verification failed' });
          setIsLoading(false);
          return;
        }
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push('/parent');
      router.refresh();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address first' });
      return;
    }
    setIsResettingPassword(true);
    setMessage(null);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/parent/settings`,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password reset link sent! Check your email.' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset link';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isMagicLinkSent) {
    return (
      <div className="min-h-screen bg-[var(--paper-50)] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Check your email
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We&apos;ve sent a magic link to <strong>{email}</strong>.
            <br />
            Click the link in the email to sign in.
          </p>
          <button
            onClick={() => {
              setIsMagicLinkSent(false);
              setMessage(null);
            }}
            className="text-[var(--ember-500)] hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper-50)] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Parent Login
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Sign in to manage lessons and assignments
        </p>

        {/* Auth Method Toggle */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
          <button
            onClick={() => { setAuthMethod('magic_link'); setMessage(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              authMethod === 'magic_link'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Magic Link
          </button>
          <button
            onClick={() => { setAuthMethod('password'); setMessage(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              authMethod === 'password'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Password
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <form onSubmit={authMethod === 'magic_link' ? handleMagicLink : handlePasswordLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all"
              placeholder="parent@example.com"
            />
          </div>

          {authMethod === 'password' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="mt-2 text-sm text-[var(--ember-500)] hover:underline"
              >
                {isResettingPassword ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>
          )}
          {/* Turnstile CAPTCHA */}
          <div className="py-2">
            <Turnstile
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
              theme="auto"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || (authMethod === 'password' && !password) || !isVerified}
            className="w-full py-2 px-4 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading
              ? 'Processing...'
              : authMethod === 'magic_link'
              ? 'Send Magic Link'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}







