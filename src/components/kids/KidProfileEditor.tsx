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

        {/* Favorite Color Display */}
        {formData.favoriteColor && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div 
              className="w-12 h-12 rounded-full shadow-inner border-2 border-white dark:border-gray-600"
              style={{ backgroundColor: formData.favoriteColor }}
            />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Heart size={14} weight="fill" className="text-red-400" /> My Favorite Color
              </p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {formData.favoriteColor.startsWith('#') ? formData.favoriteColor : formData.favoriteColor}
              </p>
            </div>
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
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-100 via-yellow-100 via-green-100 via-blue-100 to-purple-100 dark:from-red-900/20 dark:via-yellow-900/20 dark:via-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Heart size={20} className="text-red-500" weight="fill" />
          Pick your favorite color!
        </label>
        <div className="flex items-center gap-4">
          {/* Color Picker Input */}
          <div className="relative">
            <input
              type="color"
              value={formData.favoriteColor || '#ff6b6b'}
              onChange={(e) => handleChange('favoriteColor', e.target.value)}
              className="w-16 h-16 rounded-full cursor-pointer border-4 border-white dark:border-gray-700 shadow-lg"
              style={{ 
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac', '#20c997', '#343a40'].map(color => (
              <button
                key={color}
                onClick={() => handleChange('favoriteColor', color)}
                className={`w-8 h-8 rounded-full transition-all border-2 ${
                  formData.favoriteColor === color 
                    ? 'border-gray-800 dark:border-white scale-110' 
                    : 'border-white dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Click the big circle to pick any color you want!</p>
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
