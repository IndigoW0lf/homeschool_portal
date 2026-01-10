'use client';

import { useState } from 'react';
import { Heart, MusicNote, FilmStrip, Pizza, GraduationCap, GameController, User, PencilSimple, X, Check, Calendar } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { Kid } from '@/types';

interface KidProfileEditorProps {
  kidId: string;
  initialData: Kid;
}

interface ProfileField {
  key: keyof Kid;
  dbKey: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  multiline?: boolean;
}

const PROFILE_FIELDS: ProfileField[] = [
  {
    key: 'nickname',
    dbKey: 'nickname',
    label: 'What should we call you?',
    icon: <User size={20} className="text-[var(--ember-500)]" />,
    placeholder: 'Your nickname...',
  },
  {
    key: 'bio',
    dbKey: 'bio',
    label: 'About Me',
    icon: <PencilSimple size={20} className="text-blue-500" />,
    placeholder: 'Tell us a bit about yourself...',
    multiline: true,
  },
  {
    key: 'favoriteShows',
    dbKey: 'favorite_shows',
    label: 'Favorite Shows & Movies',
    icon: <FilmStrip size={20} className="text-pink-500" />,
    placeholder: 'What do you like to watch?',
  },
  {
    key: 'favoriteMusic',
    dbKey: 'favorite_music',
    label: 'Favorite Music',
    icon: <MusicNote size={20} className="text-purple-500" />,
    placeholder: 'Music or artists you love...',
  },
  {
    key: 'favoriteFoods',
    dbKey: 'favorite_foods',
    label: 'Foods I Really Like',
    icon: <Pizza size={20} className="text-orange-500" />,
    placeholder: 'Yummy foods you enjoy...',
  },
  {
    key: 'favoriteSubjects',
    dbKey: 'favorite_subjects',
    label: 'Favorite Subjects',
    icon: <GraduationCap size={20} className="text-green-500" />,
    placeholder: 'What do you love learning about?',
  },
  {
    key: 'hobbies',
    dbKey: 'hobbies',
    label: 'Hobbies & Fun Stuff',
    icon: <GameController size={20} className="text-indigo-500" />,
    placeholder: 'What do you do for fun?',
  },
];

// Check if profile has any data filled in
function hasProfileData(data: Kid): boolean {
  return !!(
    data.nickname || 
    data.bio || 
    data.favoriteShows || 
    data.favoriteMusic || 
    data.favoriteFoods || 
    data.favoriteSubjects || 
    data.hobbies || 
    data.favoriteColor ||
    data.birthday
  );
}

// Format birthday for display
function formatBirthday(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function KidProfileEditor({ kidId, initialData }: KidProfileEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!hasProfileData(initialData));
  const [formData, setFormData] = useState<Partial<Kid>>({
    nickname: initialData.nickname || '',
    bio: initialData.bio || '',
    favoriteShows: initialData.favoriteShows || '',
    favoriteMusic: initialData.favoriteMusic || '',
    favoriteFoods: initialData.favoriteFoods || '',
    favoriteSubjects: initialData.favoriteSubjects || '',
    hobbies: initialData.hobbies || '',
    favoriteColor: initialData.favoriteColor || '#ff6b6b',
    birthday: initialData.birthday || '',
    gradeBand: initialData.gradeBand || '3-5',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof Kid, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('kids')
        .update({
          nickname: formData.nickname || null,
          bio: formData.bio || null,
          favorite_shows: formData.favoriteShows || null,
          favorite_music: formData.favoriteMusic || null,
          favorite_foods: formData.favoriteFoods || null,
          favorite_subjects: formData.favoriteSubjects || null,
          hobbies: formData.hobbies || null,
          favorite_color: formData.favoriteColor || null,
          birthday: formData.birthday || null,
          grade_band: formData.gradeBand || null,
        })
        .eq('id', kidId);

      if (error) throw error;

      toast.success('Profile saved! ⭐');
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Oops! Could not save. Try again?');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to initial data
    setFormData({
      nickname: initialData.nickname || '',
      bio: initialData.bio || '',
      favoriteShows: initialData.favoriteShows || '',
      favoriteMusic: initialData.favoriteMusic || '',
      favoriteFoods: initialData.favoriteFoods || '',
      favoriteSubjects: initialData.favoriteSubjects || '',
      hobbies: initialData.hobbies || '',
      favoriteColor: initialData.favoriteColor || '#ff6b6b',
      birthday: initialData.birthday || '',
      gradeBand: initialData.gradeBand || '3-5',
    });
    setIsEditing(false);
  };

  // ============ VIEW MODE ============
  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Header with Edit Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ember-500)] hover:bg-[var(--ember-50)] dark:hover:bg-[var(--ember-900)]/20 rounded-lg transition-colors"
          >
            <PencilSimple size={18} />
            Edit Profile
          </button>
        </div>

        {/* Favorite Color Display - Simple label with colored bar */}
        {formData.favoriteColor && (
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              My Profile Color
            </p>
            <div 
              className="w-full h-3 rounded-full shadow-inner"
              style={{ 
                backgroundColor: formData.favoriteColor,
              }}
            />
          </div>
        )}

        {/* Birthday Display */}
        {formData.birthday && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
              <Calendar size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                🎂 My Birthday
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatBirthday(formData.birthday as string)}
              </p>
            </div>
          </div>

        )}

        {/* Grade Display */}
        {formData.gradeBand && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <GraduationCap size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                📚 My Grade
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                Grade {formData.gradeBand}
              </p>
            </div>
          </div>
        )}

        {/* Profile Fields Display */}
        <div className="grid gap-4">
          {PROFILE_FIELDS.map(field => {
            const value = formData[field.key] as string;
            if (!value) return null;
            
            return (
              <div 
                key={field.key}
                className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {field.icon}
                  {field.label}
                </div>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!hasProfileData(initialData) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No profile info yet!</p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 text-[var(--ember-500)] hover:underline"
            >
              Fill out your profile
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============ EDIT MODE ============
  return (
    <div className="space-y-6">
      {/* Edit Mode Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          ✏️ Editing Profile
        </h3>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {/* Color Picker */}
      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Heart size={20} className="text-red-500" weight="fill" />
          Pick your profile color!
        </label>
        <div className="flex items-center gap-4">
          {/* Color Preview + Click to Change */}
          <label className="cursor-pointer group relative">
            <div 
              className="w-16 h-16 rounded-full shadow-lg border-4 border-white dark:border-gray-600 transition-transform group-hover:scale-105"
              style={{ backgroundColor: formData.favoriteColor || '#ff6b6b' }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded-full">
                Change
              </span>
            </div>
            <input
              type="color"
              value={formData.favoriteColor || '#ff6b6b'}
              onChange={(e) => handleChange('favoriteColor', e.target.value)}
              className="sr-only"
            />
          </label>
          <div className="flex-1">
            <p className="font-medium text-gray-800 dark:text-white">
              {formData.favoriteColor || 'Pick a color!'}
            </p>
            <p className="text-xs text-gray-500">
              Click the circle to choose any color
            </p>
          </div>
        </div>
      </div>

      {/* Birthday Picker */}
      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Calendar size={20} className="text-pink-500" weight="fill" />
          When is your birthday? 🎂
        </label>
        <input
          type="date"
          value={(formData.birthday as string) || ''}
          onChange={(e) => handleChange('birthday', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
        />
      </div>

      {/* Grade Selector */}
      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <GraduationCap size={20} className="text-blue-500" weight="fill" />
          What grade are you in? 📚
        </label>
        <select
          value={formData.gradeBand || '3-5'}
          onChange={(e) => handleChange('gradeBand', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
        >
          <option value="K-2">K-2 (Ages 5-8)</option>
          <option value="3-5">3-5 (Ages 8-11)</option>
          <option value="6-8">6-8 (Ages 11-14)</option>
          <option value="9-12">9-12 (Ages 14-18)</option>
        </select>
      </div>

      {/* Profile Fields Form */}
      <div className="grid gap-4">
        {PROFILE_FIELDS.map(field => (
          <div 
            key={field.key}
            className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.icon}
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                value={(formData[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[var(--ember-500)] resize-none"
              />
            ) : (
              <input
                type="text"
                value={(formData[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={handleCancel}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-[var(--ember-500)] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[var(--ember-600)] disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
          <Check size={20} weight="bold" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
