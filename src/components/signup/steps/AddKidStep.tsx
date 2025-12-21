'use client';

import { useState, useRef } from 'react';
import { SignupData } from '../SignupWizard';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { ArrowLeft, Check, Lock } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface AddKidStepProps {
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
  userId: string | null;
}

const GRADE_BANDS = [
  { value: 'K-2', label: 'K-2 (Ages 5-8)' },
  { value: '3-5', label: '3-5 (Ages 8-11)' },
  { value: '6-8', label: '6-8 (Ages 11-14)' },
  { value: '9-12', label: '9-12 (Ages 14-18)' },
];

// Simple avatar options using DiceBear
const AVATAR_OPTIONS = [
  { style: 'adventurer', seed: 'luna' },
  { style: 'adventurer', seed: 'atlas' },
  { style: 'fun-emoji', seed: 'star' },
  { style: 'fun-emoji', seed: 'happy' },
  { style: 'bottts', seed: 'robot1' },
  { style: 'bottts', seed: 'robot2' },
];

function getAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

// Simple hash function for PINs (matches server-side)
function simpleHash(pin: string): string {
  let hash = 0;
  const salt = 'lunara_pin_salt_2024';
  const salted = salt + pin + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function AddKidStep({ data, updateData, onNext, onBack, userId }: AddKidStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // PIN must be exactly 4 digits
  const isPinValid = /^\d{4}$/.test(data.kidPin);
  const canContinue = data.kidName && data.gradeBand && isPinValid;

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const currentPin = data.kidPin.split('');
    currentPin[index] = value.slice(-1);
    const newPin = currentPin.join('').slice(0, 4);
    updateData({ kidPin: newPin });

    // Auto-advance
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !data.kidPin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleAddKid = async () => {
    if (!canContinue || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Hash the PIN before storing
      const pinHash = simpleHash(data.kidPin);
      
      // Generate a unique ID for the kid
      const kidId = crypto.randomUUID();

      // Create kid in database with PIN
      const { error: kidError } = await supabase
        .from('kids')
        .insert({
          id: kidId,
          name: data.kidName,
          grade_band: data.gradeBand,
          user_id: userId,
          pin_hash: pinHash,
        });

      if (kidError) throw kidError;

      toast.success(`${data.kidName} added! 🌟`);
      onNext();
    } catch (err: unknown) {
      console.error('Failed to add kid:', err);
      // Handle various error types including Supabase errors
      let message = 'Failed to add kid';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as { message: unknown }).message);
      }
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Add your first kiddo
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You can add more kids later from your dashboard
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Kid Name */}
        <div>
          <label htmlFor="kidName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Child's name *
          </label>
          <input
            id="kidName"
            type="text"
            value={data.kidName}
            onChange={(e) => updateData({ kidName: e.target.value })}
            placeholder="What's their name?"
            required
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none"
          />
        </div>

        {/* Grade Band */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grade level *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GRADE_BANDS.map((band) => (
              <button
                key={band.value}
                type="button"
                onClick={() => updateData({ gradeBand: band.value })}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                  data.gradeBand === band.value
                    ? "border-[var(--ember-500)] bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20 text-[var(--ember-600)] dark:text-[var(--ember-400)]"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                )}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>

        {/* PIN Entry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Lock size={16} className="inline mr-1" />
            Secret PIN (4 digits) *
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Your child will use this to access their portal. You can reset it anytime.
          </p>
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={el => { pinInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={data.kidPin[index] || ''}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[var(--lavender-500)] focus:ring-2 focus:ring-[var(--lavender-500)]/20 outline-none transition-all"
              />
            ))}
          </div>
        </div>

        {/* Avatar Selection (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pick an avatar (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((avatar, idx) => {
              const url = getAvatarUrl(avatar.style, avatar.seed);
              const isSelected = data.kidAvatarUrl === url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateData({ kidAvatarUrl: isSelected ? '' : url })}
                  className={cn(
                    "relative p-1 rounded-xl transition-all",
                    isSelected
                      ? "ring-2 ring-[var(--ember-500)] bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Avatar option"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  {isSelected && (
                    <Check
                      size={14}
                      weight="bold"
                      className="absolute -top-1 -right-1 text-white bg-[var(--ember-500)] rounded-full p-0.5"
                    />
                  )}
                </button>
              );
            })}
          </div>
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
          className="flex items-center gap-1 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handleAddKid}
          disabled={!canContinue || isLoading}
          className="flex-1 py-2.5 px-4 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Adding...' : 'Add Kid & Continue'}
        </button>
      </div>
    </div>
  );
}
