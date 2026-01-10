'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Books, PencilSimple, File, FunnelSimple } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow } from '@/types';
import { ActivityModal } from './ActivityModal';
import { QuickStartPanel } from './QuickStartPanel';

interface ContentLibraryProps {
  lessons: Lesson[];
  assignments: AssignmentItemRow[];
  kids: { id: string; name: string; gradeBand?: string }[];
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
      case 'lesson': return <Books size={16} weight="duotone" className="text-blue-500" />;
      case 'assignment': return <PencilSimple size={16} weight="duotone" className="text-purple-500" />;
      case 'worksheet': return <File size={16} weight="duotone" className="text-green-500" />;
    }
  };

  const getTypeBadgeClass = (type: ContentItem['type']) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'assignment': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'worksheet': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  };

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center gap-3">
            <Image 
              src="/assets/titles/lessons.svg" 
              alt="Content Library" 
              width={200} 
              height={40}
              className="h-8 w-auto dark:brightness-110"
            />
          </div>
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <FunnelSimple size={16} className="text-gray-400" />
            {(['all', 'lesson', 'assignment', 'worksheet'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all capitalize",
                  filter === type
                    ? "bg-[var(--ember-500)] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
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
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowQuickStart(!showQuickStart)}
            className="text-sm text-[var(--ember-500)] hover:text-[var(--ember-600)] font-medium flex items-center gap-2"
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
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
          {filteredContent.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No content found. Create your first activity!</p>
            </div>
          ) : (
            filteredContent.slice(0, 10).map(item => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
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
