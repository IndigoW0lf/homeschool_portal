'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/supabase/profile';
import { toast } from 'sonner';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'EST (Eastern)' },
  { value: 'America/Chicago', label: 'CST (Central)' },
  { value: 'America/Denver', label: 'MST (Mountain)' },
  { value: 'America/Los_Angeles', label: 'PST (Pacific)' },
  { value: 'America/Anchorage', label: 'AKST (Alaska)' },
  { value: 'Pacific/Honolulu', label: 'HST (Hawaii)' },
];

// DiceBear avatar styles that match our whimsical vibe
const AVATAR_STYLES = [
  'lorelei',        // Soft illustrated faces
  'adventurer',     // Fun adventure characters  
  'fun-emoji',      // Cute emoji-style
  'bottts',         // Friendly robots
  'thumbs',         // Simple thumbs-up characters
  'avataaars',      // Popular illustrated style
];

// Generate deterministic seeds for avatar variety
const AVATAR_SEEDS = [
  'luna', 'stella', 'atlas', 'nova', 'orion', 'sage',
  'echo', 'river', 'sky', 'meadow', 'willow', 'ember'
];

function getAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [timezone, setTimezone] = useState(profile.timezone || 'America/Chicago');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || getAvatarUrl('lorelei', 'luna'));
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await updateProfile({
        display_name: displayName || null,
        timezone,
        avatar_url: avatarUrl,
      });

      if (updated) {
        toast.success('All set! ✨');
        router.refresh();
      } else {
        toast.error('Hmm, that didn\'t work. Try again?');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center pb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          className="relative group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Your avatar"
            width={96}
            height={96}
            className="rounded-full bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-md group-hover:ring-[var(--ember-300)] transition-all"
          />
          <span className="absolute bottom-0 right-0 bg-[var(--ember-500)] text-white text-xs px-2 py-1 rounded-full shadow-sm">
            Change
          </span>
        </button>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Click to pick a new avatar
        </p>

        {/* Avatar Picker Grid */}
        {showAvatarPicker && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl w-full animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Pick one that feels like you ✨
            </p>
            <div className="grid grid-cols-6 gap-3">
              {AVATAR_STYLES.slice(0, 3).flatMap(style => 
                AVATAR_SEEDS.slice(0, 4).map(seed => {
                  const url = getAvatarUrl(style, seed);
                  const isSelected = avatarUrl === url;
                  return (
                    <button
                      key={`${style}-${seed}`}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(url);
                        setShowAvatarPicker(false);
                      }}
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
                        alt={`${style} ${seed} avatar`}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                      {isSelected && (
                        <Check 
                          size={16} 
                          weight="bold" 
                          className="absolute -top-1 -right-1 text-white bg-[var(--ember-500)] rounded-full p-0.5"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label 
          htmlFor="displayName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          What would you like to be called?
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name or nickname"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We&apos;ll use this to greet you on the dashboard
        </p>
      </div>

      {/* Email (read-only) */}
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
          value={profile.email || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Need to change your email? Head to{' '}
          <a 
            href="/parent/settings" 
            className="text-[var(--ember-500)] hover:underline"
          >
            Account Settings
          </a>
        </p>
      </div>

      {/* Timezone */}
      <div>
        <label 
          htmlFor="timezone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Your timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all"
        >
          {TIMEZONE_OPTIONS.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Helps us show the right dates and times
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

