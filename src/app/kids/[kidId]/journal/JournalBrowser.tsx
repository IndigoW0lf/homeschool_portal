'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlass, Shuffle, Tag, Calendar } from '@phosphor-icons/react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { JournalTag } from '@/lib/ai/journal-tags';

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
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  thoughtful: '🤔',
  frustrated: '😤',
  sad: '😢',
};

export function JournalBrowser({ entries, kidName }: JournalBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<JournalTag | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [randomEntry, setRandomEntry] = useState<JournalEntry | null>(null);

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

  // Random memory function
  const pickRandomEntry = () => {
    if (entries.length === 0) return;
    const randomIndex = Math.floor(Math.random() * entries.length);
    setRandomEntry(entries[randomIndex]);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setSelectedMood(null);
    setRandomEntry(null);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📔</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No journal entries yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Complete your daily journal to start building your collection!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <JournalEntryCard entry={randomEntry} />
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Random button */}
        <button
          onClick={pickRandomEntry}
          className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors flex items-center gap-2"
        >
          <Shuffle size={18} />
          Random Memory
        </button>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Tag size={16} className="text-gray-400 mt-1" />
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag as JournalTag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTag === tag
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Mood Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Filter by mood:</span>
        {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
            className={`text-xl p-1 rounded-lg transition-all ${
              selectedMood === mood
                ? 'bg-purple-200 dark:bg-purple-800 scale-110'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={mood}
          >
            {emoji}
          </button>
        ))}
        {(searchQuery || selectedTag || selectedMood) && (
          <button
            onClick={clearFilters}
            className="ml-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredEntries.length} of {entries.length} entries
      </p>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.map(entry => (
          <JournalEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const formattedDate = format(parseISO(entry.date), 'EEEE, MMMM d, yyyy');
  const relativeDate = formatDistanceToNow(parseISO(entry.date), { addSuffix: true });

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar size={14} />
          <span>{formattedDate}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>{relativeDate}</span>
        </div>
        {entry.mood && (
          <span className="text-xl" title={entry.mood}>
            {MOOD_EMOJIS[entry.mood]}
          </span>
        )}
      </div>

      {/* Prompt */}
      <p className="text-sm text-purple-600 dark:text-purple-400 mb-2 italic">
        "{entry.prompt}"
      </p>

      {/* Response */}
      <p className="text-gray-800 dark:text-gray-200">
        {entry.response}
      </p>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entry.tags.map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
