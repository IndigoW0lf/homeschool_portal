'use client';

import { useState, useEffect } from 'react';
import { NotePencil, ArrowsClockwise, FastForward, Check, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { markAwarded, isAwarded } from '@/lib/progressState';
import { awardStars } from '@/lib/supabase/mutations';

interface JournalCardProps {
  kidId: string;
  date: string;
  journalEnabled?: boolean;
  journalAllowSkip?: boolean;
}

// Mood options
const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
] as const;

type MoodValue = typeof MOODS[number]['value'];

export function JournalCard({ 
  kidId, 
  date,
  journalEnabled = true,
  journalAllowSkip = true,
}: JournalCardProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [skippedPrompts, setSkippedPrompts] = useState<string[]>([]);

  // Check if already completed today
  useEffect(() => {
    const journalItemId = `journal-${date}`;
    if (isAwarded(kidId, date, journalItemId)) {
      setIsComplete(true);
    }
  }, [kidId, date]);

  // Fetch initial prompt
  useEffect(() => {
    if (!isComplete && journalEnabled) {
      fetchPrompt();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrompt = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId, skipPrompts: skippedPrompts }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPrompt(data.prompt);
      }
    } catch (error) {
      console.error('Failed to fetch journal prompt:', error);
      setPrompt("What's something interesting you learned today?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPrompt = () => {
    if (prompt) {
      setSkippedPrompts(prev => [...prev, prompt]);
    }
    fetchPrompt();
  };

  const handleSubmit = async () => {
    if (!response.trim() || !prompt) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/journal/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          date,
          prompt,
          response: response.trim(),
          mood,
          skipped: false,
        }),
      });

      if (res.ok) {
        const journalItemId = `journal-${date}`;
        // Use server action to award stars securely
        const awardRes = await awardStars(kidId, date, journalItemId, 1);
        
        if (awardRes.success || awardRes.alreadyAwarded) {
           markAwarded(kidId, date, journalItemId);
        }
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!prompt) return;
    
    setIsSaving(true);
    try {
      await fetch('/api/journal/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          date,
          prompt,
          response: null,
          mood: null,
          skipped: true,
        }),
      });

      const journalItemId = `journal-${date}`;
      markAwarded(kidId, date, journalItemId);
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to skip journal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!journalEnabled) {
    return null;
  }

  // Completed state - using success gradient
  if (isComplete) {
    return (
      <div className="card p-4 bg-gradient-forest border-[var(--success)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--background-elevated)]/20">
            <Check size={24} weight="bold" className="text-[var(--foreground)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              Journal Complete! ✨
            </h3>
            <p className="text-sm text-[var(--foreground)]/80">
              Great job reflecting today
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 bg-gradient-teal-pink border-[var(--nebula-purple)]/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[var(--background-elevated)]/20">
          <NotePencil size={24} weight="duotone" className="text-[var(--nebula-purple)]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--night-900)]">
            Daily Journal
          </h3>
          <p className="text-sm text-[var(--night-700)] flex items-center gap-1">
            <Sparkle size={14} weight="fill" className="text-[var(--ember-gold-400)]" />
            Earn 1 moon
          </p>
        </div>
      </div>

      {/* Prompt */}
      {isLoading ? (
        <div className="py-4 text-center text-[var(--nebula-purple)]">
          <ArrowsClockwise size={24} className="animate-spin mx-auto mb-2" />
          Thinking of a question...
        </div>
      ) : prompt ? (
        <>
          <div className="mb-4 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)]">
            <p className="text-heading font-medium">
              {prompt}
            </p>
          </div>

          {/* Mood Picker */}
          <div className="mb-4">
            <p className="text-sm text-muted mb-2">How are you feeling?</p>
            <div className="flex gap-2 justify-center">
              {MOODS.map(({ emoji, label, value }) => (
                <button
                  key={value}
                  onClick={() => setMood(value)}
                  className={cn(
                    "text-2xl p-2 rounded-lg transition-all",
                    mood === value
                      ? "bg-[var(--nebula-purple-light)] scale-110 ring-2 ring-[var(--nebula-purple)]"
                      : "hover:bg-[var(--hover-overlay)] hover:scale-105"
                  )}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Response textarea */}
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your thoughts here..."
            className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] text-heading focus:ring-2 focus:ring-[var(--nebula-purple)] focus:border-transparent resize-none"
            rows={4}
          />

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || isSaving}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                response.trim()
                  ? "bg-[var(--nebula-purple)] text-[var(--foreground)] hover:opacity-90"
                  : "bg-[var(--background-secondary)] text-muted cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <ArrowsClockwise size={18} className="animate-spin" />
              ) : (
                <Check size={18} weight="bold" />
              )}
              Submit
            </button>

            <button
              onClick={handleNewPrompt}
              disabled={isLoading}
              className="py-2 px-3 rounded-lg border border-[var(--nebula-purple)]/50 text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple-light)] transition-all"
              title="Get a different question"
            >
              <ArrowsClockwise size={18} />
            </button>

            {journalAllowSkip && (
              <button
                onClick={handleSkip}
                disabled={isSaving}
                className="py-2 px-3 rounded-lg border border-[var(--border)] text-muted hover:bg-[var(--hover-overlay)] transition-all"
                title="Skip today"
              >
                <FastForward size={18} />
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
