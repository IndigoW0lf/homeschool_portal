'use client';

import { useState } from 'react';
import { Heart, MusicNote, FilmStrip, Pizza, GraduationCap, GameController, User, PencilSimple, X, Check, Calendar } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { Kid } from '@/types';
import { INDIVIDUAL_GRADES } from '@/lib/constants';

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
    icon: <PencilSimple size={20} className="text-[var(--celestial-500)]" />,
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
    icon: <MusicNote size={20} className="text-[var(--nebula-purple)]" />,
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
    icon: <GameController size={20} className="text-[var(--celestial-500)]" />,
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
    grades: initialData.grades || [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof Kid, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleGrade = (grade: string) => {
    const currentGrades = formData.grades || [];
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade];
    setFormData(prev => ({ ...prev, grades: newGrades }));
  };



  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use Server Action to handle auth (works for both Parent and Kid Session)
      const { updateKidProfileAction } = await import('@/lib/actions/kid');
      const result = await updateKidProfileAction(kidId, {
        nickname: formData.nickname || undefined,
        bio: formData.bio || undefined,
        favoriteShows: formData.favoriteShows || undefined,
        favoriteMusic: formData.favoriteMusic || undefined,
        favoriteFoods: formData.favoriteFoods || undefined,
        favoriteSubjects: formData.favoriteSubjects || undefined,
        hobbies: formData.hobbies || undefined,
        favoriteColor: formData.favoriteColor || undefined,
        birthday: formData.birthday || undefined,
        gradeBand: formData.gradeBand || undefined,
        grades: formData.grades || undefined,
      });

      if (!result.success) throw new Error(result.error);

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
      grades: initialData.grades || [],
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
          <div className="p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm">
            <p className="text-sm text-muted mb-2">
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
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
              <Calendar size={24} weight="fill" className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-xs text-muted flex items-center gap-1">
                🎂 My Birthday
              </p>
              <p className="font-medium text-heading">
                {formatBirthday(formData.birthday as string)}
              </p>
            </div>
          </div>

        )}

        {/* Grade Display */}
        {(formData.grades?.length || formData.gradeBand) && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <GraduationCap size={24} weight="fill" className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-xs text-muted flex items-center gap-1">
                📚 My Grade
              </p>
              <p className="font-medium text-heading">
                Grade {formData.grades && formData.grades.length > 0 ? formData.grades.join(', ') : formData.gradeBand}
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
                className="p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs text-muted mb-1">
                  {field.icon}
                  {field.label}
                </div>
                <p className="text-heading whitespace-pre-wrap">
                  {value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!hasProfileData(initialData) && (
          <div className="text-center py-8 text-muted">
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
        <h3 className="font-semibold text-heading">
          ✏️ Editing Profile
        </h3>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 text-sm text-muted hover:text-heading dark:text-muted dark:hover:text-muted"
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {/* Color Picker */}
      <div className="p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-heading dark:text-muted mb-3">
          <Heart size={20} className="text-red-500" weight="fill" />
          Pick your profile color!
        </label>
        <div className="flex items-center gap-4">
          {/* Color Preview + Click to Change */}
          <label className="cursor-pointer group relative">
            <div 
              className="w-16 h-16 rounded-full shadow-lg border-4 border-white dark:border-[var(--border)] transition-transform group-hover:scale-105"
              style={{ backgroundColor: formData.favoriteColor || '#ff6b6b' }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium text-[var(--foreground)] bg-black/50 px-2 py-1 rounded-full">
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
            <p className="font-medium text-heading dark:text-[var(--foreground)]">
              {formData.favoriteColor || 'Pick a color!'}
            </p>
            <p className="text-xs text-muted">
              Click the circle to choose any color
            </p>
          </div>
        </div>
      </div>

      {/* Birthday Picker */}
      <div className="p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-heading dark:text-muted mb-2">
          <Calendar size={20} className="text-pink-500" weight="fill" />
          When is your birthday? 🎂
        </label>
        <input
          type="date"
          value={(formData.birthday as string) || ''}
          onChange={(e) => handleChange('birthday', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-secondary)] dark:bg-[var(--night-900)] outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
        />
      </div>

      {/* Grade Selector */}
      <div className="p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-heading dark:text-muted mb-2">
          <GraduationCap size={20} className="text-[var(--celestial-500)]" weight="fill" />
          What grade are you in? 📚 <span className="text-xs font-normal text-muted">(Multi-select!)</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
           {INDIVIDUAL_GRADES.map((grade) => {
             const isSelected = formData.grades?.includes(grade);
             return (
               <button
                 key={grade}
                 onClick={() => toggleGrade(grade)}
                 className={`
                   px-2 py-2 rounded-lg text-sm font-medium border transition-all
                   ${isSelected 
                     ? "border-[var(--ember-500)] bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20 text-[var(--ember-600)] dark:text-[var(--ember-400)] shadow-sm"
                     : "border-[var(--border)] dark:border-[var(--border)] hover:border-[var(--border)] dark:hover:border-[var(--border)] bg-[var(--background-elevated)]"}
                 `}
               >
                 {grade}
               </button>
             );
           })}
        </div>
      </div>

      {/* Profile Fields Form */}
      <div className="grid gap-4">
        {PROFILE_FIELDS.map(field => (
          <div 
            key={field.key}
            className="p-4 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] shadow-sm"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-heading dark:text-muted mb-2">
              {field.icon}
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                value={(formData[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-secondary)] dark:bg-[var(--night-900)] outline-none focus:ring-2 focus:ring-[var(--ember-500)] resize-none"
              />
            ) : (
              <input
                type="text"
                value={(formData[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-secondary)] dark:bg-[var(--night-900)] outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={handleCancel}
          className="px-6 py-3 text-muted rounded-xl font-medium hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-[var(--ember-500)] text-[var(--foreground)] rounded-xl font-semibold text-lg shadow-lg hover:bg-[var(--ember-600)] disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
          <Check size={20} weight="bold" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
