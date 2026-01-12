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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send magic link';
      setMessage({
        type: 'error',
        text: errorMessage,
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setMessage({
        type: 'error',
        text: errorMessage,
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
      <div className="min-h-screen bg-galaxy-gradient flex items-center justify-center p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--brand-lilac)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--brand-coral)]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="glass-panel rounded-xl p-8 shadow-2xl max-w-md w-full text-center relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">
            Check your email
          </h1>
          <p className="text-gray-300 mb-6">
            We&apos;ve sent a magic link to <strong>{email}</strong>.
            <br />
            Click the link in the email to sign in.
          </p>
          <button
            onClick={() => {
              setIsMagicLinkSent(false);
              setMessage(null);
            }}
            className="text-[var(--brand-coral)] hover:text-[var(--brand-rose)] transition-colors hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-galaxy-gradient flex items-center justify-center p-4 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--brand-lilac)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--brand-coral)]/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-50" />
          <div className="absolute bottom-20 right-10 w-2 h-2 bg-white rounded-full opacity-30" />
          <div className="absolute top-1/2 left-10 w-1.5 h-1.5 bg-white rounded-full opacity-40" />
      </div>

      <div className="glass-panel rounded-2xl p-8 shadow-2xl max-w-md w-full relative z-10 border-t border-white/20">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
            Parent Portal
            </h1>
            <p className="text-gray-400">
            Sign in to manage your homeschool
            </p>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex p-1 bg-black/20 rounded-lg mb-6 backdrop-blur-sm">
          <button
            onClick={() => { setAuthMethod('magic_link'); setMessage(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              authMethod === 'magic_link'
                ? 'bg-[var(--brand-lilac)] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Magic Link
          </button>
          <button
            onClick={() => { setAuthMethod('password'); setMessage(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              authMethod === 'password'
                ? 'bg-[var(--brand-lilac)] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Password
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg border backdrop-blur-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
          >
            <p className="text-sm text-center">{message.text}</p>
          </div>
        )}

        <form onSubmit={authMethod === 'magic_link' ? handleMagicLink : handlePasswordLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--brand-coral)] focus:border-transparent outline-none transition-all"
              placeholder="parent@example.com"
            />
          </div>

          {authMethod === 'password' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--brand-coral)] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="mt-2 text-sm text-[var(--brand-coral)] hover:text-[var(--brand-rose)] transition-colors hover:underline"
              >
                {isResettingPassword ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>
          )}
          {/* Turnstile CAPTCHA */}
          <div className="py-2 flex justify-center">
            <Turnstile
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
              theme="dark"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || (authMethod === 'password' && !password) || !isVerified}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[var(--brand-lilac)] to-[var(--brand-coral)] text-white rounded-xl font-semibold shadow-lg shadow-purple-900/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
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









