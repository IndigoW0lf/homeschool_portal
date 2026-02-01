'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/supabase/profile';
import { toast } from 'sonner';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';
import { LocalOpenPeepsAvatar, generateLocalOpenPeepsUrl } from '@/components/LocalOpenPeepsAvatar';
import type { OpenPeepsState } from '@/components/OpenPeepsAvatarBuilder';

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'EST (Eastern)' },
  { value: 'America/Chicago', label: 'CST (Central)' },
  { value: 'America/Denver', label: 'MST (Mountain)' },
  { value: 'America/Los_Angeles', label: 'PST (Pacific)' },
  { value: 'America/Anchorage', label: 'AKST (Alaska)' },
  { value: 'Pacific/Honolulu', label: 'HST (Hawaii)' },
];

// Avatar category - Open Peeps only
const AVATAR_CATEGORIES = [
  { id: 'open-peeps', label: '✨ Open Peeps', styles: [] },
];

// Varied seeds for different looks
const AVATAR_SEEDS = ['luna', 'sage', 'morgan', 'alex', 'riley', 'quinn'];

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
  const [teachingStyle, setTeachingStyle] = useState(profile.teaching_style || '');
  const [favoriteColor, setFavoriteColor] = useState(profile.favorite_color || '#9c8fb8');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || getAvatarUrl('micah', 'luna'));
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('open-peeps');
  
  // Open Peeps state
  const [openPeepsState, setOpenPeepsState] = useState<OpenPeepsState>({
    face: 'smile',
    head: 'short1',
    accessories: 'none',
    facialHair: 'none',
    body: 'hoodie',
    skinColor: 'd08b5b',
    clothingColor: '8fa7df',
    backgroundColor: 'b6e3f4',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await updateProfile({
        display_name: displayName || null,
        timezone,
        avatar_url: avatarUrl,
        teaching_style: teachingStyle || undefined,
        favorite_color: favoriteColor,
      });

      if (updated) {
        toast.success('Profile updated! ✨');
        setIsEditing(false);
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

  const currentCategory = AVATAR_CATEGORIES.find(c => c.id === avatarCategory) || AVATAR_CATEGORIES[0];

  // View Mode
  if (!isEditing) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-center pb-8 border-b border-[var(--border)] dark:border-[var(--border)]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Your avatar"
              width={120}
              height={120}
              className="rounded-full bg-[var(--celestial-50)] bg-[var(--background-secondary)]/50 shadow-lg ring-4 ring-[var(--background-elevated)] dark:ring-gray-800"
            />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-heading">
            {displayName || 'Parent'}
          </h2>
          <p className="text-muted">{profile.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-[var(--background-secondary)]/50 border border-[var(--border)] dark:border-[var(--border)]">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-1">
              Timezone
            </h3>
            <p className="font-medium text-heading">
              {TIMEZONE_OPTIONS.find(tz => tz.value === timezone)?.label || timezone}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--background-secondary)]/50 border border-[var(--border)] dark:border-[var(--border)]">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-1">
              Account Type
            </h3>
            <p className="font-medium text-heading">
              Parent / Admin
            </p>
          </div>
        </div>

        {/* Teaching Style Section */}
        <div className="rounded-xl border border-[var(--celestial-100)] dark:border-[var(--celestial-900)]/30 bg-[var(--celestial-50)]/50 dark:bg-[var(--celestial-900)]/10 p-6">
          <h3 className="text-lg font-semibold text-heading mb-2 flex items-center gap-2">
            🧑‍🏫 Teaching Style
          </h3>
          {teachingStyle ? (
            <p className="text-heading dark:text-muted leading-relaxed">
              {teachingStyle}
            </p>
          ) : (
            <p className="text-muted italic">
              No teaching style set yet. Add one to help our AI customize lesson plans for you!
            </p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 bg-[var(--background-elevated)] border border-[var(--border)] text-heading dark:text-muted rounded-xl font-medium hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-700)] transition-colors shadow-sm"
          >
            Edit Profile
          </button>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
      {/* Avatar Section */}
      <div className="flex flex-col items-center pb-6 border-b border-[var(--border)]">
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
            className="rounded-full bg-[var(--background-secondary)] ring-4 ring-white dark:ring-gray-800 shadow-md group-hover:ring-[var(--ember-300)] transition-all"
          />
          <span className="absolute bottom-0 right-0 bg-[var(--ember-500)] text-[var(--foreground)] text-xs px-2 py-1 rounded-full shadow-sm">
            Change
          </span>
        </button>
        <p className="mt-3 text-sm text-muted">
          Click to pick a new avatar
        </p>

        {/* Avatar Picker with Tabs */}
        {showAvatarPicker && (
          <div className="mt-4 p-4 bg-[var(--background-secondary)]/50 rounded-xl w-full animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[var(--border)] pb-3">
              {AVATAR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setAvatarCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                    avatarCategory === cat.id
                      ? "bg-[var(--ember-500)] text-[var(--foreground)]"
                      : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--moon-200)] dark:hover:bg-[var(--night-600)]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Avatar Grid for Selected Category */}
            {avatarCategory === 'open-peeps' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <LocalOpenPeepsAvatar
                    size={100}
                    {...openPeepsState}
                  />
                </div>
                
                {/* Quick face options */}
                <div>
                  <p className="text-xs font-medium text-muted mb-2">Face</p>
                  <div className="flex flex-wrap gap-1">
                    {['smile', 'smileBig', 'cute', 'calm', 'cheeky', 'awe', 'driven', 'serious'].map(face => (
                      <button
                        key={face}
                        type="button"
                        onClick={() => setOpenPeepsState(s => ({ ...s, face }))}
                        className={cn(
                          "w-10 h-10 rounded-lg overflow-hidden border-2 transition-all",
                          openPeepsState.face === face
                            ? "border-[var(--ember-500)]"
                            : "border-transparent hover:border-[var(--border)]"
                        )}
                      >
                        <LocalOpenPeepsAvatar size={36} face={face} head={openPeepsState.head} skinColor={openPeepsState.skinColor} backgroundColor="transparent" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick hair options */}
                <div>
                  <p className="text-xs font-medium text-muted mb-2">Hair</p>
                  <div className="flex flex-wrap gap-1">
                    {['short1', 'short2', 'medium1', 'long', 'afro', 'bun', 'bangs', 'noHair1'].map(head => (
                      <button
                        key={head}
                        type="button"
                        onClick={() => setOpenPeepsState(s => ({ ...s, head }))}
                        className={cn(
                          "w-10 h-10 rounded-lg overflow-hidden border-2 transition-all",
                          openPeepsState.head === head
                            ? "border-[var(--ember-500)]"
                            : "border-transparent hover:border-[var(--border)]"
                        )}
                      >
                        <LocalOpenPeepsAvatar size={36} face={openPeepsState.face} head={head} skinColor={openPeepsState.skinColor} backgroundColor="transparent" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin tones */}
                <div>
                  <p className="text-xs font-medium text-muted mb-2">Skin Tone</p>
                  <div className="flex flex-wrap gap-2">
                    {['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '694d3d', '4a3728'].map(skin => (
                      <button
                        key={skin}
                        type="button"
                        onClick={() => setOpenPeepsState(s => ({ ...s, skinColor: skin }))}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          openPeepsState.skinColor === skin
                            ? "ring-2 ring-[var(--ember-500)] scale-110"
                            : "border-[var(--border)]"
                        )}
                        style={{ backgroundColor: `#${skin}` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Clothing colors */}
                <div>
                  <p className="text-xs font-medium text-muted mb-2">Shirt Color</p>
                  <div className="flex flex-wrap gap-2">
                    {['e78276', 'ff6b6b', 'ffcf77', 'fdea6b', '78e185', '4ecdc4', '9ddadb', '8fa7df', '5e7fb8', 'e279c7', 'be6adf', '9c8fb8', 'e27d60', 'f5f5f5', '2c2c2c', '6b4423'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setOpenPeepsState(s => ({ ...s, clothingColor: color }))}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          openPeepsState.clothingColor === color
                            ? "ring-2 ring-[var(--ember-500)] scale-110"
                            : "border-[var(--border)]"
                        )}
                        style={{ backgroundColor: `#${color}` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background colors */}
                <div>
                  <p className="text-xs font-medium text-muted mb-2">Background</p>
                  <div className="flex flex-wrap gap-2">
                    {['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'ffeeb4', 'd5f5e3', 'ffe8d6', 'fff3cd', 'e2f0cb', 'cce5ff', 'f8d7da'].map(bg => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setOpenPeepsState(s => ({ ...s, backgroundColor: bg }))}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          openPeepsState.backgroundColor === bg
                            ? "ring-2 ring-[var(--ember-500)] scale-110"
                            : "border-[var(--border)]"
                        )}
                        style={{ backgroundColor: `#${bg}` }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const url = generateLocalOpenPeepsUrl({ ...openPeepsState, size: 256 });
                    setAvatarUrl(url);
                    setShowAvatarPicker(false);
                  }}
                  className="w-full py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90"
                >
                  Use This Avatar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {currentCategory.styles.flatMap((style) => 
                  AVATAR_SEEDS.map((seed) => {
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
                            : "hover:bg-[var(--hover-overlay)]"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${style} avatar`}
                          width={44}
                          height={44}
                          className="rounded-lg"
                        />
                        {isSelected && (
                          <Check 
                            size={14} 
                            weight="bold" 
                            className="absolute -top-1 -right-1 text-[var(--foreground)] bg-[var(--ember-500)] rounded-full p-0.5"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Display Name */}
        <div>
          <label 
            htmlFor="displayName"
            className="block text-sm font-medium text-heading dark:text-muted mb-1"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading dark:text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Timezone */}
        <div>
          <label 
            htmlFor="timezone"
            className="block text-sm font-medium text-heading dark:text-muted mb-1"
          >
            Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading dark:text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all"
          >
            {TIMEZONE_OPTIONS.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Favorite Color */}
      <div>
        <label className="block text-sm font-medium text-heading dark:text-muted mb-1">
          Favorite Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={favoriteColor}
            onChange={(e) => setFavoriteColor(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-[var(--border)] dark:border-[var(--border)]"
          />
          <div 
            className="flex-1 h-12 rounded-lg flex items-center justify-center text-[var(--foreground)] font-medium"
            style={{ backgroundColor: favoriteColor }}
          >
            {displayName || 'Preview'}
          </div>
          <span className="text-xs text-muted">Just for fun! 🌈</span>
        </div>
      </div>
      
      {/* Teaching Style Input */}
      <div>
        <label 
          htmlFor="teachingStyle"
          className="block text-sm font-medium text-heading dark:text-muted mb-1"
        >
          Teaching Style & Goals
        </label>
        <textarea
          id="teachingStyle"
          rows={4}
          value={teachingStyle}
          onChange={(e) => setTeachingStyle(e.target.value)}
          placeholder="e.g., We follow a Montessori approach with a focus on self-directed learning. My goal is to foster curiosity..."
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading dark:text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none transition-all resize-none"
        />
        <p className="mt-1 text-xs text-muted">
          This helps our AI understand your preferences when suggesting lesson plans.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            // Reset fields
            setDisplayName(profile.display_name || '');
            setTimezone(profile.timezone || 'America/Chicago');
            setTeachingStyle(profile.teaching_style || '');
            setAvatarUrl(profile.avatar_url || getAvatarUrl('micah', 'luna'));
          }}
          className="px-6 py-2 bg-[var(--background-secondary)] text-heading dark:text-muted rounded-lg font-medium hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[var(--ember-500)] text-[var(--foreground)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

