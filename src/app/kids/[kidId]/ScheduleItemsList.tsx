'use client';

import { useState, useEffect } from 'react';
import { ScheduleItemCard } from '@/components/ScheduleItemCard';
import { Modal } from '@/components/ui/Modal';
import { Clock, BookOpen, Pencil, CheckSquare, FileText, Link as LinkIcon, Question, LinkSimple, Sparkle, Check, Notebook } from '@phosphor-icons/react';
import Link from 'next/link';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { cn } from '@/lib/utils';
import { isDone, setDone, hydrateDoneState } from '@/lib/storage';
import { addStars, isAwarded, markAwarded } from '@/lib/progressState';

interface ScheduleItem {
  id: string;
  date: string;
  studentId: string;
  itemType: string;
  status: string;
  completedAt: string | null;
  itemId: string | null;
  title: string;
  type: string;
  estimatedMinutes: number;
  hasWorksheet?: boolean; // True if assignment has worksheet_data
  assignmentId?: string; // The assignment ID for worksheet link
  details?: {
    id: string;
    title: string;
    type: string;
    estimated_minutes?: number;
    instructions?: string;
    parent_notes?: string;
    steps?: { text: string }[];
    deliverable?: string;
    rubric?: { text: string }[];
    links?: { url: string; label: string }[];
  } | null;
}

interface ScheduleItemsListProps {
  items: ScheduleItem[];
  kidId: string;
  date: string;  // Default date for items without date
  showDates?: boolean;  // Show date on each item (for upcoming items)
}

export function ScheduleItemsList({ items, kidId, date, showDates }: ScheduleItemsListProps) {
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [, setAutoCompleted] = useState(false);
  
  // Hydrate localStorage from DB on mount - ensures completion state persists across devices
  useEffect(() => {
    hydrateDoneState(kidId, items.map(item => ({
      date: item.date,
      itemId: item.itemId,
      status: item.status
    })));
  }, [kidId, items]);
  
  // Sort items by date (earliest first) if showing dates
  const sortedItems = showDates 
    ? [...items].sort((a, b) => a.date.localeCompare(b.date))
    : items;

  const isLesson = selectedItem?.itemType === 'lesson';

  // Parse lesson instructions if it's JSON
  let lessonDetails = { description: '', keyQuestions: [] as string[], materials: '' };
  // Links come from the separate links column, not from parsed instructions
  const lessonLinks = (isLesson && selectedItem?.details?.links) || [] as { url: string; label: string }[];
  
  if (isLesson && selectedItem?.details?.instructions) {
    try {
      const parsed = JSON.parse(selectedItem.details.instructions);
      lessonDetails = { ...lessonDetails, ...parsed };
    } catch {
      // Plain text fallback
      lessonDetails.description = selectedItem.details.instructions;
    }
  }

  // Function to auto-mark item as done when clicking a link
  const handleLinkClick = async () => {
    if (!selectedItem) return;
    const scheduleItemId = selectedItem.id;
    const itemId = selectedItem.itemId || scheduleItemId;
    const itemDate = selectedItem.date || date; // Use item's date, fallback to prop
    
    // Check if already done
    if (isDone(kidId, itemDate, itemId)) return;
    
    // Mark as done - syncs to database for cross-device visibility!
    await setDone(kidId, itemDate, itemId, true, scheduleItemId);
    setAutoCompleted(true);
    
    // Award star if not already awarded
    if (!isAwarded(kidId, itemDate, itemId)) {
      addStars(kidId, 1);
      markAwarded(kidId, itemDate, itemId);
    }
  };

  return (
    <>
      {sortedItems.map(item => (
        <ScheduleItemCard
          key={item.id}
          item={item}
          kidId={kidId}
          date={item.date || date}
          showDate={showDates}
          readOnly={showDates}
          onClick={() => setSelectedItem(item)}
        />
      ))}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || 'Item Details'}
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className={cn(
                "p-2 rounded-lg",
                isLesson ? "bg-blue-100" : "bg-purple-100"
              )}>
                {isLesson ? <BookOpen size={28} weight="duotone" color="#b6e1d8" /> : <Pencil size={28} weight="duotone" color="#caa2d8" />}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                isLesson ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
              )}>
                {selectedItem.type}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={18} weight="duotone" color="#e7b58d" />
                {selectedItem.estimatedMinutes || 20} min
              </span>
            </div>

            {/* Lesson Details */}
            {isLesson && (
              <>
                {lessonDetails.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      What You'll Learn
                    </h4>
                    <MarkdownText content={lessonDetails.description} />
                  </div>
                )}

                {lessonDetails.keyQuestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Key Questions
                    </h4>
                    <ul className="space-y-2">
                      {lessonDetails.keyQuestions.map((q, i) => {
                        // Handle both string and object formats
                        const questionText = typeof q === 'string' ? q : (q as { text?: string })?.text || '';
                        return questionText ? (
                          <li key={i} className="flex gap-2 text-gray-700 dark:text-gray-300">
                            <Question size={18} weight="duotone" className="text-blue-500 flex-shrink-0 mt-0.5" />
                            {questionText}
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}

                {lessonDetails.materials && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Materials Needed
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {lessonDetails.materials}
                    </p>
                  </div>
                )}

                {/* Links - clicking auto-marks as done */}
                {lessonLinks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <LinkIcon size={20} weight="duotone" color="#caa2d8" />
                      Resources & Links
                    </h4>
                    <div className="space-y-2">
                      {lessonLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleLinkClick}
                          className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-[var(--ember-300)] hover:bg-[var(--ember-50)] dark:hover:bg-[var(--ember-900)/20] transition-all group"
                        >
                          <LinkSimple size={18} weight="duotone" className="text-[var(--ember-500)]" />
                          <span className="text-gray-700 dark:text-gray-300 flex-1 group-hover:text-[var(--ember-600)]">
                            {link.label || link.url}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            Opens link <Check size={12} weight="bold" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Assignment Details */}
            {!isLesson && selectedItem.details && (
              <>
                {/* Deliverable */}
                {selectedItem.details.deliverable && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={24} weight="duotone" color="#b6e1d8" />
                      What to Turn In
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {selectedItem.details.deliverable}
                    </p>
                  </div>
                )}

                {/* Steps */}
                {selectedItem.details.steps && selectedItem.details.steps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Steps to Complete
                    </h4>
                    <div className="space-y-2">
                      {selectedItem.details.steps.map((step, i) => (
                        step.text && (
                          <div key={i} className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="font-bold text-[var(--ember-500)] w-6 text-right">{i + 1}.</span>
                            <p className="text-gray-700 dark:text-gray-300 flex-1">{step.text}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Rubric / Success Criteria */}
                {selectedItem.details.rubric && selectedItem.details.rubric.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckSquare size={24} weight="duotone" color="#b6e1d8" />
                      Success Criteria
                    </h4>
                    <div className="space-y-2">
                      {selectedItem.details.rubric.map((item, i) => (
                        item.text && (
                          <div key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600" />
                            <span>{item.text}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment Links */}
                {selectedItem.details.links && selectedItem.details.links.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <LinkIcon size={20} weight="duotone" color="#caa2d8" />
                      Resources & Links
                    </h4>
                    <div className="space-y-2">
                      {selectedItem.details.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleLinkClick}
                          className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-[var(--ember-300)] hover:bg-[var(--ember-50)] dark:hover:bg-[var(--ember-900)/20] transition-all group"
                        >
                          <LinkSimple size={18} weight="duotone" className="text-[var(--ember-500)]" />
                          <span className="text-gray-700 dark:text-gray-300 flex-1 group-hover:text-[var(--ember-600)]">
                            {link.label || link.url}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            Go! <Check size={12} weight="bold" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Interactive Worksheet Button */}
            {!isLesson && selectedItem?.hasWorksheet && selectedItem?.assignmentId && (
              <Link
                href={`/kids/${kidId}/worksheet/${selectedItem.assignmentId}`}
                className="block w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-center hover:opacity-90 transition-opacity shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <Notebook size={24} weight="duotone" />
                  Do Worksheet
                </div>
                <div className="text-sm opacity-80 mt-1">Complete it right here!</div>
              </Link>
            )}

            {/* Encouragement message */}
            <div className="bg-[var(--ember-50)] dark:bg-[var(--ember-900)/20] p-4 rounded-xl text-center">
              <p className="text-[var(--ember-600)] dark:text-[var(--ember-400)] font-medium flex items-center justify-center gap-2">
                You've got this! <Sparkle size={18} weight="fill" className="text-yellow-500" />
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
