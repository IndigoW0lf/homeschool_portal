'use client';

import { useState } from 'react';
import { Plus, Books, PencilSimple, File, FunnelSimple } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow } from '@/types';
import { ActivityModal } from './ActivityModal';
import { QuickStartPanel } from './QuickStartPanel';
import { LunaraTitle } from '@/components/ui/LunaraTitle';

interface ContentLibraryProps {
  lessons: Lesson[];
  assignments: AssignmentItemRow[];
  kids: { id: string; name: string; gradeBand?: string; grades?: string[] }[];
  onViewLesson?: (id: string) => void;
  onViewAssignment?: (id: string) => void;
}

type ContentType = 'all' | 'lesson' | 'assignment' | 'worksheet';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'assignment' | 'worksheet';
  subtitle: string;
  category?: string | null;
}

export function ContentLibrary({ 
  lessons, 
  assignments, 
  kids,
  onViewLesson,
  onViewAssignment 
}: ContentLibraryProps) {
  const [filter, setFilter] = useState<ContentType>('all');
  const [showModal, setShowModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Combine all content into unified list
  const allContent: ContentItem[] = [
    ...lessons.map(l => ({
      id: l.id,
      title: l.title,
      type: 'lesson' as const,
      subtitle: l.type || 'Lesson',
      category: l.type
    })),
    ...assignments.map(a => ({
      id: a.id,
      title: a.title,
      type: a.worksheet_data ? 'worksheet' as const : 'assignment' as const,
      subtitle: a.type || 'Assignment',
      category: a.type
    }))
  ];

  // Apply filter
  const filteredContent = filter === 'all' 
    ? allContent 
    : allContent.filter(c => c.type === filter);

  const handleItemClick = (item: ContentItem) => {
    if (item.type === 'lesson' && onViewLesson) {
      onViewLesson(item.id);
    } else if ((item.type === 'assignment' || item.type === 'worksheet') && onViewAssignment) {
      onViewAssignment(item.id);
    }
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'lesson': return <Books size={16} weight="duotone" className="text-[var(--celestial-500)]" />;
      case 'assignment': return <PencilSimple size={16} weight="duotone" className="text-[var(--nebula-purple)]" />;
      case 'worksheet': return <File size={16} weight="duotone" className="text-[var(--success)]" />;
    }
  };

  const getTypeBadgeClass = (type: ContentItem['type']) => {
    switch (type) {
      case 'lesson': return 'badge-celestial';
      case 'assignment': return 'badge-purple';
      case 'worksheet': return 'badge-success';
    }
  };

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center gap-3">
            <LunaraTitle 
              gradient="herbal-bloom" 
              size="md"
            >
              Lessons
            </LunaraTitle>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <FunnelSimple size={16} className="text-muted" />
            {(['all', 'lesson', 'assignment', 'worksheet'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all capitalize",
                  filter === type
                    ? "bg-[var(--celestial-500)] text-[var(--foreground)] shadow-md"
                    : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
                )}
              >
                {type === 'all' ? 'All' : type + 's'}
              </button>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} weight="bold" />
            New Activity
          </button>
        </div>

        {/* Quick Start Toggle */}
        <div className="px-4 py-2 border-b border-[var(--border)]">
          <button
            onClick={() => setShowQuickStart(!showQuickStart)}
            className="text-sm text-ember-gold font-medium flex items-center gap-2 hover:text-[var(--ember-gold-600)] transition-colors"
          >
            ⚡ Quick Start Templates
            <span className={cn("transition-transform", showQuickStart && "rotate-180")}>▼</span>
          </button>
          {showQuickStart && (
            <div className="mt-3">
              <QuickStartPanel kids={kids} compact />
            </div>
          )}
        </div>

        {/* Content List */}
        <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto custom-scrollbar">
          {filteredContent.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No content found. Create your first activity!</p>
            </div>
          ) : (
            filteredContent.slice(0, 10).map(item => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="w-full p-4 flex items-center gap-4 hover:bg-[var(--hover-overlay)] transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-heading truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted truncate">{item.subtitle}</p>
                </div>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getTypeBadgeClass(item.type))}>
                  {item.type}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Unified Activity Modal */}
      <ActivityModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        kids={kids}
      />
    </>
  );
}
