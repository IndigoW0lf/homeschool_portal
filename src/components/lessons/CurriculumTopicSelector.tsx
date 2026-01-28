'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Warning, Spinner, ArrowRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface CurriculumTopic {
  topic: string;
  subject: string;
  course: string;
  kidId: string;
  latestScore: number | null;
  masteryStatus: string;
  latestDate: string;
  practiceGenerated: boolean;
  itemCount: number;
}

interface CurriculumTopicSelectorProps {
  kidId?: string;
  onSelectTopic: (topic: CurriculumTopic) => void;
}

export function CurriculumTopicSelector({ kidId, onSelectTopic }: CurriculumTopicSelectorProps) {
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'weak'>('weak');

  useEffect(() => {
    async function fetchTopics() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (kidId) params.set('kidId', kidId);
        if (filter === 'weak') params.set('needsPractice', 'true');
        
        const res = await fetch(`/api/curriculum-topics?${params}`);
        if (!res.ok) throw new Error('Failed to fetch topics');
        
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    
    if (isExpanded) {
      fetchTopics();
    }
  }, [kidId, filter, isExpanded]);

  const getMasteryBadge = (status: string, score: number | null) => {
    switch (status) {
      case 'weak':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
            <Warning size={10} weight="fill" />
            {score !== null ? `${score}%` : 'Needs Practice'}
          </span>
        );
      case 'developing':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {score}% - Developing
          </span>
        );
      case 'mastered':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {score}% ✓
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            In Progress
          </span>
        );
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-[var(--celestial-400)] bg-[var(--celestial-100)]/30 dark:bg-[var(--celestial-900)]/20 hover:bg-[var(--celestial-100)]/50 dark:hover:bg-[var(--celestial-900)]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <GraduationCap size={20} className="text-[var(--celestial-500)]" weight="duotone" />
          <div className="text-left">
            <p className="font-medium text-sm text-[var(--celestial-700)] dark:text-[var(--celestial-400)]">
              Import from MiAcademy
            </p>
            <p className="text-xs text-muted">
              Create practice for topics your kid is learning
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="text-[var(--celestial-500)]" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--celestial-400)] bg-[var(--celestial-100)]/30 dark:bg-[var(--celestial-900)]/20 overflow-hidden">
      <div className="p-4 border-b border-[var(--celestial-300)] dark:border-[var(--celestial-800)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-[var(--celestial-500)]" weight="duotone" />
          <span className="font-medium text-sm text-[var(--celestial-700)] dark:text-[var(--celestial-400)]">
            MiAcademy Topics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('weak')}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-colors",
              filter === 'weak' 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                : "bg-[var(--background-secondary)] text-muted hover:text-[var(--foreground)]"
            )}
          >
            Needs Practice
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-colors",
              filter === 'all' 
                ? "bg-[var(--celestial-200)] text-[var(--celestial-700)] dark:bg-[var(--celestial-800)] dark:text-[var(--celestial-400)]" 
                : "bg-[var(--background-secondary)] text-muted hover:text-[var(--foreground)]"
            )}
          >
            All Topics
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs text-muted hover:text-[var(--foreground)] ml-2"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-3 max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size={24} className="animate-spin text-[var(--celestial-500)]" />
          </div>
        )}
        
        {error && (
          <div className="text-center py-4 text-red-500 text-sm">{error}</div>
        )}
        
        {!loading && !error && topics.length === 0 && (
          <div className="text-center py-6 text-muted text-sm">
            {filter === 'weak' 
              ? "No topics need extra practice! 🎉" 
              : "No imported curriculum found. Import from the Progress page."}
          </div>
        )}
        
        {!loading && !error && topics.length > 0 && (
          <div className="space-y-2">
            {topics.map((topic, idx) => (
              <button
                key={`${topic.kidId}-${topic.topic}-${idx}`}
                type="button"
                onClick={() => {
                  onSelectTopic(topic);
                  setIsExpanded(false);
                }}
                className="w-full p-3 rounded-lg bg-[var(--background-elevated)] hover:bg-[var(--hover-overlay)] border border-[var(--border)] text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-[var(--foreground)] group-hover:text-[var(--celestial-600)] dark:group-hover:text-[var(--celestial-400)]">
                      {topic.topic}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {topic.subject} • {topic.course}
                    </p>
                  </div>
                  {getMasteryBadge(topic.masteryStatus, topic.latestScore)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
