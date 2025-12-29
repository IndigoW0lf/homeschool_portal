'use client';

import { useState } from 'react';
import { Heart, MusicNote, FilmStrip, Pizza, GraduationCap, GameController, User, PencilSimple } from '@phosphor-icons/react';
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

export function KidProfileEditor({ kidId, initialData }: KidProfileEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Kid>>({
    nickname: initialData.nickname || '',
    bio: initialData.bio || '',
    favoriteShows: initialData.favoriteShows || '',
    favoriteMusic: initialData.favoriteMusic || '',
    favoriteFoods: initialData.favoriteFoods || '',
    favoriteSubjects: initialData.favoriteSubjects || '',
    hobbies: initialData.hobbies || '',
    favoriteColor: initialData.favoriteColor || '',
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
        })
        .eq('id', kidId);

      if (error) throw error;

      toast.success('Profile saved! ⭐');
      router.refresh();
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Oops! Could not save. Try again?');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Favorite Color Picker */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-100 via-yellow-100 via-green-100 via-blue-100 to-purple-100 dark:from-red-900/20 dark:via-yellow-900/20 dark:via-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Heart size={20} className="text-red-500" weight="fill" />
          What's your favorite color?
        </label>
        <div className="flex flex-wrap gap-2">
          {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'teal'].map(color => (
            <button
              key={color}
              onClick={() => handleChange('favoriteColor', color)}
              className={`w-10 h-10 rounded-full transition-all ${
                formData.favoriteColor === color 
                  ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' 
                  : 'hover:scale-105'
              }`}
              style={{ 
                backgroundColor: color === 'teal' ? '#14b8a6' : color,
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Profile Fields */}
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
      <div className="flex justify-center pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-[var(--ember-500)] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[var(--ember-600)] disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
          {isSaving ? 'Saving...' : 'Save My Profile ⭐'}
        </button>
      </div>
    </div>
  );
}
