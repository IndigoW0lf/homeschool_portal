'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { Sparkle, Check, User, Palette } from '@phosphor-icons/react';

interface WelcomeSetupModalProps {
  userId: string;
  familyName?: string;
}

export function WelcomeSetupModal({ userId, familyName = 'the family' }: WelcomeSetupModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [favoriteColor, setFavoriteColor] = useState('#9c8fb8');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show modal when user just joined a family
    if (searchParams.get('joined') === 'true') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          favorite_color: favoriteColor,
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Welcome to the family! 🎉');
      setIsOpen(false);
      // Remove the query param
      router.replace('/parent');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    router.replace('/parent');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background-elevated)] rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#9c8fb8] to-[#E27D60] rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkle size={32} weight="fill" className="text-[var(--foreground)]" />
          </div>
          <h2 className="text-2xl font-bold text-heading mb-2">
            Welcome to {familyName}!
          </h2>
          <p className="text-muted">
            Let's set up your profile so everyone knows who you are
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-heading dark:text-muted mb-2">
              <User size={16} />
              What should we call you?
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Mom, Dad, Alex..."
              className="w-full px-4 py-3 border border-[var(--border)] dark:border-[var(--border)] rounded-xl bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent outline-none text-lg"
              autoFocus
            />
          </div>

          {/* Favorite Color */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-heading dark:text-muted mb-2">
              <Palette size={16} />
              Pick your favorite color (just for fun!)
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
                {displayName || 'Your name here'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 px-4 text-muted rounded-xl hover:bg-[var(--hover-overlay)] transition-colors font-medium"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-[var(--foreground)] rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>
                <Check size={18} weight="bold" />
                Let's Go!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
