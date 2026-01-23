'use client';

import { useState } from 'react';
import { BookmarkSimple, X, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Suggestion } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { VideoResourceList } from './VideoResourceCard';
import { WorksheetResourceList } from './WorksheetResourceCard';
import type { VideoResource } from '@/lib/resources/types';
import type { WorksheetResource } from '@/lib/resources/tavily';

// Extended suggestion type with optional enriched resources
interface EnrichedSuggestion extends Suggestion {
  videos?: VideoResource[];
  worksheets?: WorksheetResource[];
}

interface LunaSuggestionCardProps {
  suggestion: EnrichedSuggestion;
  userMessage?: string;  // The parent's original message for context
  onSave?: (suggestion: Suggestion) => Promise<void>;
}

/**
 * Suggestion card with Save/Ignore actions
 * 
 * - Title, why_this_might_help, steps
 * - [Save to my ideas] → calls onSave (writes to ideas table)
 * - [Ignore] → removes from view (no DB write)
 */
export function LunaSuggestionCard({ suggestion, userMessage, onSave }: LunaSuggestionCardProps) {
  const [status, setStatus] = useState<'visible' | 'saving' | 'saved' | 'ignored'>('visible');

  const handleSave = async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          content: suggestion.why_this_might_help || 'No description provided',
          user_message: userMessage,
          suggestion_data: suggestion,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      if (onSave) {
        await onSave(suggestion);
      }
      setStatus('saved');
      toast.success('Idea saved!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save idea');
      setStatus('visible');
    }
  };

  const handleIgnore = () => {
    setStatus('ignored');
  };

  if (status === 'ignored') {
    return null;
  }

  if (status === 'saved') {
    return (
      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
        <Check size={16} weight="bold" />
        Saved to your ideas
      </div>
    );
  }

  return (
    <div className={cn(
      "card p-4 space-y-3",
      "border-l-2 border-[var(--fabric-lilac)]"
    )}>
      {/* Title */}
      <h4 className="font-medium text-heading">
        {suggestion.title}
      </h4>

      {/* Why this might help */}
      <p className="text-sm text-muted">
        {suggestion.why_this_might_help}
      </p>

      {/* Steps */}
      {(suggestion.steps?.length ?? 0) > 0 && (
        <ul className="space-y-1.5 text-sm text-heading dark:text-muted">
          {suggestion.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[var(--paper-100)] dark:bg-[var(--background-secondary)] flex items-center justify-center text-xs font-medium text-muted">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      )}

      {/* Video Resources - shown when enriched with YouTube videos */}
      {suggestion.videos && suggestion.videos.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)]">
          <VideoResourceList videos={suggestion.videos} compact />
        </div>
      )}

      {/* Worksheet Resources - shown when enriched with Tavily search */}
      {suggestion.worksheets && suggestion.worksheets.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)]">
          <WorksheetResourceList worksheets={suggestion.worksheets} />
        </div>
      )}

      {/* Other Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="btn-sm bg-[var(--fabric-lilac)]/10 hover:bg-[var(--fabric-lilac)]/20 text-[var(--fabric-lilac)] dark:text-[var(--fabric-lilac)]"
        >
          <BookmarkSimple size={16} weight="duotone" />
          {status === 'saving' ? 'Saving...' : 'Save to my ideas'}
        </button>
        <button
          onClick={handleIgnore}
          className="btn-sm text-muted hover:text-heading dark:hover:text-muted"
        >
          <X size={16} />
          Ignore
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted pt-1">
        Just a thought — your judgment is what matters.
      </p>
    </div>
  );
}

