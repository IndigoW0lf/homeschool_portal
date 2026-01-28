'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { Lock, ArrowLeft, Warning } from '@phosphor-icons/react';

interface UnlockPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export default function UnlockPage({ params }: UnlockPageProps) {
  const router = useRouter();
  const [kidId, setKidId] = useState<string>('');
  const [kidName, setKidName] = useState<string>('');
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<Date | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadKid() {
      const { kidId: id } = await params;
      setKidId(id);
      
      const { data: kid } = await supabase
        .from('kids')
        .select('name, failed_pin_attempts, pin_lockout_until')
        .eq('id', id)
        .single();
      
      if (kid) {
        setKidName(kid.name);
        setAttempts(kid.failed_pin_attempts || 0);
        
        if (kid.pin_lockout_until) {
          const lockoutTime = new Date(kid.pin_lockout_until);
          if (lockoutTime > new Date()) {
            setIsLockedOut(true);
            setLockoutEnd(lockoutTime);
          }
        }
      }
    }
    loadKid();
  }, [params]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Only keep last digit
    setPin(newPin);
    setError(null);

    // Auto-advance to next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newPin.every(d => d !== '') && newPin.join('').length === PIN_LENGTH) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (pinValue: string) => {
    if (isLockedOut) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Call API to verify PIN
      const response = await fetch('/api/kids/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId, pin: pinValue }),
      });

      const result = await response.json();

      if (result.success) {
        // Set trusted device cookie and redirect
        document.cookie = `kid_trust_${kidId}=true; max-age=${30 * 24 * 60 * 60}; path=/; samesite=strict`;
        router.push(`/kids/${kidId}`);
      } else {
        setError(result.error || 'Incorrect PIN');
        setPin(Array(PIN_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        
        if (result.attemptsRemaining !== undefined) {
          setAttempts(MAX_ATTEMPTS - result.attemptsRemaining);
        }
        
        if (result.lockedOut) {
          setIsLockedOut(true);
          setLockoutEnd(new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000));
        }
      }
    } catch (err) {
      setError('Something went wrong');
      setPin(Array(PIN_LENGTH).fill(''));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLockedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-950 flex items-center justify-center p-4">
        <div className="bg-[var(--background-elevated)] rounded-2xl p-8 shadow-lg max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Warning size={32} weight="fill" className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Too Many Attempts
          </h1>
          <p className="text-muted mb-4">
            Try again in {LOCKOUT_MINUTES} minutes, or ask a parent to unlock.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--ember-500)] hover:underline"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="bg-[var(--background-elevated)] rounded-2xl p-8 shadow-lg max-w-sm w-full">
        {/* Header */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-sm text-muted hover:text-[var(--foreground)] dark:text-muted dark:hover:text-[var(--foreground-muted)] mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-900)]/30 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} weight="duotone" className="text-[var(--lavender-500)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
            Hi, {kidName || 'friend'}!
          </h1>
          <p className="text-muted">
            Enter your secret code to continue
          </p>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-[var(--border)] rounded-xl bg-[var(--background-secondary)] text-[var(--foreground)] focus:border-[var(--lavender-500)] focus:ring-2 focus:ring-[var(--lavender-500)]/20 outline-none transition-all"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center mb-4">
            <p className="text-red-500 text-sm">{error}</p>
            {attempts > 0 && (
              <p className="text-muted text-xs mt-1">
                {MAX_ATTEMPTS - attempts} attempts remaining
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-muted">
            Checking...
          </div>
        )}

        {/* Help Text */}
        <p className="text-center text-xs text-muted mt-8">
          Forgot your code? Ask a parent to help.
        </p>
      </div>
    </div>
  );
}
