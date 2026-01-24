'use client';

import { useState, useMemo } from 'react';
import { 
  MagnifyingGlass, 
  Shuffle, 
  Tag, 
  Calendar, 
  Plus, 
  PencilSimple,
  Check,
  X
} from '@phosphor-icons/react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { JournalTag } from '@/lib/ai/journal-tags';
import { supabase } from '@/lib/supabase/browser';

interface JournalEntry {
  id: string;
  kid_id: string;
  date: string;
  prompt: string;
  response: string | null;
  mood: string | null;
  tags: string[] | null;
  skipped: boolean;
  created_at: string;
}

interface JournalBrowserProps {
  entries: JournalEntry[];
  kidName: string;
  kidId: string;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  thoughtful: '🤔',
  frustrated: '😤',
  sad: '😢',
};

const ENTRIES_PER_PAGE = 10;

export function JournalBrowser({ entries: initialEntries, kidName, kidId }: JournalBrowserProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<JournalTag | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [randomEntry, setRandomEntry] = useState<JournalEntry | null>(null);
  const [visibleCount, setVisibleCount] = useState(ENTRIES_PER_PAGE);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [newEntryMood, setNewEntryMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all unique tags from entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          entry.prompt.toLowerCase().includes(query) ||
          entry.response?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (selectedTag && !entry.tags?.includes(selectedTag)) {
        return false;
      }

      // Mood filter
      if (selectedMood && entry.mood !== selectedMood) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedTag, selectedMood]);

  // Paginate
  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  // Random memory function
  const pickRandomEntry = () => {
    if (entries.length === 0) return;
    const randomIndex = Math.floor(Math.random() * entries.length);
    setRandomEntry(entries[randomIndex]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setSelectedMood(null);
    setRandomEntry(null);
    setVisibleCount(ENTRIES_PER_PAGE);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + ENTRIES_PER_PAGE);
  };

  const handleNewEntry = async () => {
    if (!newEntryText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          kid_id: kidId,
          date: today,
          prompt: 'Free writing',
          response: newEntryText.trim(),
          mood: newEntryMood,
          skipped: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setEntries(prev => [data, ...prev]);
      setNewEntryText('');
      setNewEntryMood(null);
      setShowNewEntryForm(false);
    } catch (err) {
      console.error('Error creating journal entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async (entryId: string, newResponse: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ response: newResponse })
        .eq('id', entryId);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, response: newResponse } : e
      ));
    } catch (err) {
      console.error('Error updating journal entry:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* New Entry Button */}
      {!showNewEntryForm && (
        <button
          onClick={() => setShowNewEntryForm(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--nebula-purple)]/40 dark:border-[var(--nebula-purple)] text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/10 dark:hover:bg-[var(--nebula-purple)]/15 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} weight="bold" />
          Write a New Entry
        </button>
      )}

      {/* New Entry Form */}
      {showNewEntryForm && (
        <div className="p-4 bg-[var(--nebula-purple)]/10 dark:bg-[var(--nebula-purple)]/15 rounded-xl border border-[var(--nebula-purple)]/30 dark:border-[var(--nebula-purple)]">
          <h3 className="font-semibold text-[var(--nebula-purple)] dark:text-[var(--nebula-purple-light)] mb-3">
            New Journal Entry
          </h3>
          <textarea
            value={newEntryText}
            onChange={(e) => setNewEntryText(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full p-3 rounded-lg border border-[var(--nebula-purple)]/30 dark:border-[var(--nebula-purple)] bg-[var(--background-elevated)] text-[var(--foreground)] dark:text-gray-200 resize-none"
            rows={4}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Mood:</span>
              {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
                <button
                  key={mood}
                  onClick={() => setNewEntryMood(newEntryMood === mood ? null : mood)}
                  className={`text-xl p-1 rounded transition-all ${
                    newEntryMood === mood
                      ? 'bg-[var(--nebula-purple)]/30 dark:bg-[var(--nebula-purple)] scale-110'
                      : 'hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--background-elevated)]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewEntryForm(false);
                  setNewEntryText('');
                  setNewEntryMood(null);
                }}
                className="px-4 py-2 text-muted hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={handleNewEntry}
                disabled={!newEntryText.trim() || isSubmitting}
                className="px-4 py-2 bg-[var(--nebula-purple)] text-[var(--foreground)] rounded-lg hover:bg-[var(--nebula-purple)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Random Memory */}
      {randomEntry && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Random Memory</h3>
            <button 
              onClick={() => setRandomEntry(null)}
              className="ml-auto text-sm text-yellow-600 hover:underline"
            >
              Close
            </button>
          </div>
          <JournalEntryCard entry={randomEntry} onUpdate={handleUpdateEntry} />
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] text-[var(--foreground)] dark:text-gray-200"
          />
        </div>

        {/* Random button */}
        <button
          onClick={pickRandomEntry}
          className="px-4 py-2 rounded-lg bg-[var(--nebula-purple)]/20 dark:bg-[var(--nebula-purple)]/20 text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/30 dark:hover:bg-[var(--nebula-purple)]/30 transition-colors flex items-center gap-2"
        >
          <Shuffle size={18} />
          Random Memory
        </button>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Tag size={16} className="text-muted mt-1" />
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag as JournalTag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTag === tag
                  ? 'bg-[var(--nebula-purple)] text-[var(--foreground)]'
                  : 'bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] text-muted hover:bg-gray-200 dark:hover:bg-[var(--background-secondary)]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Mood Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Filter by mood:</span>
        {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
            className={`text-xl p-1 rounded-lg transition-all ${
              selectedMood === mood
                ? 'bg-[var(--nebula-purple)]/30 dark:bg-[var(--nebula-purple)] scale-110'
                : 'hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--background-elevated)]'
            }`}
            title={mood}
          >
            {emoji}
          </button>
        ))}
        {(searchQuery || selectedTag || selectedMood) && (
          <button
            onClick={clearFilters}
            className="ml-2 text-sm text-muted hover:text-[var(--foreground)] underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted">
        Showing {visibleEntries.length} of {filteredEntries.length} entries
      </p>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📔</div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No journal entries yet
          </h3>
          <p className="text-muted">
            Write your first journal entry above!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleEntries.map(entry => (
            <JournalEntryCard 
              key={entry.id} 
              entry={entry} 
              onUpdate={handleUpdateEntry}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-3 text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/10 dark:hover:bg-[var(--nebula-purple)]/15 rounded-lg transition-colors"
        >
          Load More ({filteredEntries.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

function JournalEntryCard({ 
  entry, 
  onUpdate 
}: { 
  entry: JournalEntry;
  onUpdate: (id: string, response: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(entry.response || '');
  
  const formattedDate = format(parseISO(entry.date), 'EEEE, MMMM d, yyyy');
  const relativeDate = formatDistanceToNow(parseISO(entry.date), { addSuffix: true });

  const handleSave = () => {
    onUpdate(entry.id, editedResponse);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedResponse(entry.response || '');
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-[var(--background-elevated)] rounded-xl border border-[var(--border)] shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Calendar size={14} />
          <span>{formattedDate}</span>
          <span className="text-[var(--foreground-muted)] dark:text-muted">•</span>
          <span>{relativeDate}</span>
        </div>
        <div className="flex items-center gap-2">
          {entry.mood && (
            <span className="text-xl" title={entry.mood}>
              {MOOD_EMOJIS[entry.mood]}
            </span>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-muted hover:text-[var(--nebula-purple)] transition-colors"
              title="Edit entry"
            >
              <PencilSimple size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Prompt */}
      {entry.prompt !== 'Free writing' && (
        <p className="text-sm text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] mb-2 italic">
          "{entry.prompt}"
        </p>
      )}

      {/* Response */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
            className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] dark:text-gray-200 resize-none"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="p-2 text-muted hover:text-[var(--foreground)]"
            >
              <X size={18} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 text-green-500 hover:text-green-600"
            >
              <Check size={18} weight="bold" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[var(--foreground)] dark:text-gray-200">
          {entry.response}
        </p>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entry.tags.map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 rounded-full bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-xs text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
