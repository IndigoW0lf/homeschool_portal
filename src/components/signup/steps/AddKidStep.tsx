'use client';

import { useState } from 'react';
import { SignupData } from '../SignupWizard';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { ArrowLeft, Check, Lock, Eye, EyeSlash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import bcrypt from 'bcryptjs';

interface AddKidStepProps {
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
  userId: string | null;
}

import { INDIVIDUAL_GRADES } from '@/lib/constants';

// Cute avatar options using DiceBear
const AVATAR_OPTIONS = [
  { style: 'lorelei', seed: 'Luna' },
  { style: 'lorelei', seed: 'Sunshine' },
  { style: 'lorelei', seed: 'Starlight' },
  { style: 'adventurer-neutral', seed: 'Buddy' },
  { style: 'adventurer-neutral', seed: 'Happy' },
  { style: 'adventurer-neutral', seed: 'Sparkle' },
  { style: 'thumbs', seed: 'yay' },
  { style: 'thumbs', seed: 'woohoo' },
  { style: 'fun-emoji', seed: 'love' },
  { style: 'fun-emoji', seed: 'rainbow' },
  { style: 'fun-emoji', seed: 'star' },
  { style: 'fun-emoji', seed: 'sunshine' },
];

function getAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function AddKidStep({ data, updateData, onNext, onBack, userId }: AddKidStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for password form
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Need at least one grade selected
  const hasGrades = data.grades && data.grades.length > 0;
  
  // Validation
  const canContinue = data.kidName && lastName && password.length >= 4 && (hasGrades || data.gradeBand);

  const toggleGrade = (grade: string) => {
    const currentGrades = data.grades || [];
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade];
    updateData({ grades: newGrades });
  };
  
  const handleAddKid = async () => {
    if (!canContinue || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Hash password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Generate a unique ID for the kid
      const kidId = crypto.randomUUID();

      // Create kid in database with password
      const { error: kidError } = await supabase
        .from('kids')
        .insert({
          id: kidId,
          name: data.kidName,
          last_name: lastName,
          grade_band: data.gradeBand || (data.grades?.[0] ? `${data.grades[0]}+` : null), 
          grades: data.grades || [],
          user_id: userId,
          password_hash: passwordHash,
        });

      if (kidError) throw kidError;

      toast.success(`${data.kidName} added! 🌟`);
      onNext();
    } catch (err: unknown) {
      console.error('Failed to add kid:', err);
      let message = 'Failed to add kid';
      if (err instanceof Error) {
        message = err.message;
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
          Set up their profile so they can login safely.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Kid Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="kidName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name *
            </label>
            <input
              id="kidName"
              type="text"
              value={data.kidName}
              onChange={(e) => updateData({ kidName: e.target.value })}
              placeholder="First Name"
              required
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">Needed for login (Initial only)</p>
          </div>
        </div>

        {/* Grade Multi-Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grade level(s) * <span className="text-xs font-normal text-gray-500">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {INDIVIDUAL_GRADES.map((grade) => {
               const isSelected = data.grades?.includes(grade);
               return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={cn(
                      "px-2 py-2 rounded-lg text-sm font-medium border transition-all",
                      isSelected
                        ? "border-[var(--ember-500)] bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20 text-[var(--ember-600)] dark:text-[var(--ember-400)] shadow-sm"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                    )}
                  >
                    {grade}
                  </button>
               );
            })}
          </div>
        </div>

        {/* Password Entry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Lock size={16} className="inline mr-1" />
            Create Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 4 chars)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            They'll use their <strong>First Name</strong>, <strong>Last Initial</strong>, and this <strong>Password</strong> to log in.
          </p>
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
