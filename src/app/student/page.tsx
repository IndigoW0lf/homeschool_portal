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
      router.push(data.redirectTo);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
      {/* Stars background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-100" />
        <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200" />
        <div className="absolute bottom-20 right-1/4 w-2 h-2 bg-white rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-40 left-20 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Student size={32} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Welcome Back!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Enter your info to start learning
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                required
                autoComplete="given-name"
              />
            </div>

            {/* Last Initial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Last Name Initial
              </label>
              <select
                value={lastInitial}
                onChange={(e) => setLastInitial(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                required
              >
                <option value="">Select...</option>
                {LAST_INITIALS.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12 text-gray-900 dark:text-white"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                Remember me
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Forgot password? Ask a parent!
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !firstName || !lastInitial || !password}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">Or continue with</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Parent Login Link */}
          <Link
            href="/login"
            className="w-full py-3 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2"
          >
            <Users size={20} />
            Parent Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-purple-300/60 text-xs mt-6">
          Lunara Quest • Learning is an adventure ✨
        </p>
      </div>
    </div>
  );
}
