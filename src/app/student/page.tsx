'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Student, Eye, EyeSlash, SpinnerGap, Users } from '@phosphor-icons/react';
import Link from 'next/link';
import { toast } from 'sonner';

const LAST_INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function StudentLoginPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/kid-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastInitial,
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      toast.success(`Welcome back, ${data.name}! 🌟`);
      window.location.href = data.redirectTo;
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic bg-starfield flex items-center justify-center p-4">
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--nebula-purple)]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--cosmic-rust-400)]/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--ember-gold-400)]/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 relative shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-ember rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg glow-gold">
              <Student size={32} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome Back!
            </h1>
            <p className="text-[var(--slate-300)] text-sm">
              Enter your info to start learning
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--slate-300)] mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 rounded-xl border border-[var(--night-600)] bg-[var(--night-700)] focus:ring-2 focus:ring-[var(--celestial-400)] focus:border-transparent transition-all text-white placeholder-[var(--slate-500)]"
                required
                autoComplete="given-name"
              />
            </div>

            {/* Last Initial */}
            <div>
              <label className="block text-sm font-medium text-[var(--slate-300)] mb-1.5">
                Last Name Initial
              </label>
              <select
                value={lastInitial}
                onChange={(e) => setLastInitial(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--night-600)] bg-[var(--night-700)] focus:ring-2 focus:ring-[var(--celestial-400)] focus:border-transparent transition-all text-white appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-[var(--night-800)]">Select...</option>
                {LAST_INITIALS.map((letter) => (
                  <option key={letter} value={letter} className="bg-[var(--night-800)]">
                    {letter}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--slate-300)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--night-600)] bg-[var(--night-700)] focus:ring-2 focus:ring-[var(--celestial-400)] focus:border-transparent transition-all pr-12 text-white placeholder-[var(--slate-500)]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--slate-400)] hover:text-white"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--slate-300)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[var(--celestial-400)] rounded focus:ring-[var(--celestial-400)] bg-[var(--night-700)] border-[var(--night-600)]"
                />
                Remember me
              </label>
              <p className="text-xs text-[var(--slate-500)]">
                Forgot password? Ask a parent!
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !firstName || !lastInitial || !password}
              className="w-full py-3.5 bg-gradient-ember text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <SpinnerGap size={20} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[var(--night-600)]" />
            <span className="text-xs text-[var(--slate-500)]">Or continue with</span>
            <div className="flex-1 h-px bg-[var(--night-600)]" />
          </div>

          {/* Parent Login Link */}
          <Link
            href="/parent/login"
            className="w-full py-3 border-2 border-[var(--night-600)] text-[var(--slate-300)] font-medium rounded-xl hover:bg-[var(--night-700)] transition-all flex items-center justify-center gap-2"
          >
            <Users size={20} />
            Parent Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--celestial-400)] text-xs mt-6 opacity-60">
          Lunara Quest • Learning is an adventure ✨
        </p>
      </div>
    </div>
  );
}
