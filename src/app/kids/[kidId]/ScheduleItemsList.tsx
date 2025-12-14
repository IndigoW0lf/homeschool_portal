'use client';

import { useState } from 'react';
import { ScheduleItemCard } from '@/components/ScheduleItemCard';
import { Modal } from '@/components/ui/Modal';
import { Clock, BookOpen, PenTool, CheckSquare, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  } | null;
}

interface ScheduleItemsListProps {
  items: ScheduleItem[];
  kidId: string;
  date: string;
}

export function ScheduleItemsList({ items, kidId, date }: ScheduleItemsListProps) {
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const isLesson = selectedItem?.itemType === 'lesson';

  // Parse lesson instructions if it's JSON
  let lessonDetails = { description: '', keyQuestions: [] as string[], materials: '' };
  if (isLesson && selectedItem?.details?.instructions) {
    try {
      const parsed = JSON.parse(selectedItem.details.instructions);
      lessonDetails = { ...lessonDetails, ...parsed };
    } catch {
      // Plain text fallback
      lessonDetails.description = selectedItem.details.instructions;
    }
  }

  return (
    <>
      {items.map(item => (
        <ScheduleItemCard
          key={item.id}
          item={item}
          kidId={kidId}
          date={date}
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
                isLesson ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
              )}>
                {isLesson ? <BookOpen size={20} /> : <PenTool size={20} />}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                isLesson ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
              )}>
                {selectedItem.type}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} />
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
                    <p className="text-gray-700 dark:text-gray-300">
                      {lessonDetails.description}
                    </p>
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
                            <span className="text-blue-500">❓</span>
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
              </>
            )}

            {/* Assignment Details */}
            {!isLesson && selectedItem.details && (
              <>
                {/* Deliverable */}
                {selectedItem.details.deliverable && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
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
                      <CheckSquare size={16} className="text-green-500" />
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
              </>
            )}

            {/* Encouragement message */}
            <div className="bg-[var(--ember-50)] dark:bg-[var(--ember-900)/20] p-4 rounded-xl text-center">
              <p className="text-[var(--ember-600)] dark:text-[var(--ember-400)] font-medium">
                You've got this! 🌟
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
