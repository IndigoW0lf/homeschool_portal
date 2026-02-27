'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash, CalendarPlus, PencilSimple, Printer, MagicWand, ClockCounterClockwise } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow, WorksheetData } from '@/types';
import { ItemDetailView, ItemDetailHeader } from './ItemDetailView';
import { WorksheetGeneratorModal } from '@/components/worksheets/WorksheetGeneratorModal';
import { saveWorksheetAssignmentAction } from '@/lib/actions/worksheet';
import { attachWorksheetToLessonAction } from '@/lib/actions/lesson';
import { getLessonHistory, HistoryItem } from '@/lib/actions/history';
import { toast } from 'sonner';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Lesson | AssignmentItemRow | null;
  itemType: 'lesson' | 'assignment';
  onEdit: () => void;
  onDelete: () => void;
  onSchedule: () => void;
}

export function ItemDetailModal({ 
  isOpen, 
  onClose, 
  item, 
  itemType, 
  onEdit, 
  onDelete, 
  onSchedule 
}: ItemDetailModalProps) {
  const router = useRouter();
  const [worksheetModalOpen, setWorksheetModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  
  const isLesson = itemType === 'lesson';
  const lesson = isLesson ? (item as Lesson) : null;
  const assignment = !isLesson ? (item as AssignmentItemRow) : null;
  const loadingHistory = isOpen && isLesson && history === null;

  useEffect(() => {
    if (isOpen && item && isLesson) {
      setHistory(null); // triggers loading state
      getLessonHistory(item.id).then(data => {
        setHistory(data);
      });
    } else {
      setHistory([]);
    }
  }, [isOpen, item, isLesson]);
  
  if (!isOpen || !item) return null;

  // Worksheet attach handler needs lesson title + description for modal context
  const lessonDetailsForWorksheet = lesson
    ? { title: lesson.title, description: lesson.description || lesson.instructions || '' }
    : { title: '', description: '' };

  const handleWorksheetAttach = async (worksheet: WorksheetData) => {
    try {
      // 1. Save the worksheet as an assignment
      const saveRes = await saveWorksheetAssignmentAction(
        worksheet, 
        `Worksheet: ${worksheet.title}`
      );

      if (!saveRes.success || !saveRes.assignmentId) {
        toast.error('Failed to save worksheet assignment');
        return;
      }

      // 2. Attach it to the lesson (if viewing a lesson)
      if (isLesson && lesson) {
        const attachRes = await attachWorksheetToLessonAction(
          lesson.id,
          saveRes.assignmentId,
          worksheet.title
        );

        if (!attachRes.success) {
          toast.error('Saved assignment but failed to attach to lesson');
          // Don't return, still generic success since assignment exists
        }
      }

      toast.success('Worksheet created & attached!', {
        description: `"${worksheet.title}" has been saved and linked to this lesson.`
      });
      setWorksheetModalOpen(false);
      
      // Refresh to show new link
      router.refresh(); 
    } catch (error) {
      toast.error('An error occurred while saving the worksheet');
      console.error(error);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) {
      onDelete();
    }
  };


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--background-elevated)] dark:bg-[var(--night-900)] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: shared component + close */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] dark:border-[var(--border)]">
          <ItemDetailHeader item={item} itemType={itemType} onEdit={onEdit} />
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-muted" />
          </button>
        </div>

        {/* Content: Activity History (lesson only) + shared detail body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--background-secondary)]/50 dark:bg-black/20">
          {isLesson && (
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <ClockCounterClockwise size={16} />
                Activity History
              </h3>
              {loadingHistory ? (
                <div className="text-sm text-muted animate-pulse">Loading history...</div>
              ) : !history || history.length === 0 ? (
                <p className="text-sm text-muted italic">Never assigned</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {history.map(h => (
                    <li key={h.id} className="text-sm flex justify-between items-center border-b border-[var(--border)] last:border-0 pb-1">
                      <span className="text-heading font-medium">{h.student.name}</span>
                      <div className="flex flex-col items-end">
                        <span className="text-muted">{h.date}</span>
                        <span className={cn(
                          "text-[10px] uppercase font-bold",
                          h.status === 'completed' ? "text-green-500" : "text-amber-500"
                        )}>
                          {h.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <ItemDetailView item={item} itemType={itemType} />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] dark:border-[var(--border)] flex justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 dark:hover:bg-[var(--destructive)]/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash size={22} weight="duotone" color="#ffcdf6" />
            Delete
          </button>
          <div className="flex gap-2">
            {assignment?.worksheet_data && (
              <a
                href={`/print/worksheet/${item.id}`}
                target="_blank"
                className="px-4 py-2 text-[var(--celestial-500)] dark:text-[var(--celestial-400)] hover:bg-[var(--celestial-50)] dark:hover:bg-[var(--celestial-900)]/20 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <Printer size={18} weight="duotone" />
                Print Worksheet
              </a>
            )}
            {isLesson && (
              <button
                onClick={() => setWorksheetModalOpen(true)}
                className="px-4 py-2 text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/10 dark:hover:bg-[var(--nebula-purple)]/15 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <MagicWand size={18} weight="duotone" />
                Generate Worksheet
              </button>
            )}
            <button
              onClick={onSchedule}
              className="px-4 py-2 text-muted dark:text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] rounded-lg transition-colors flex items-center gap-2"
            >
              <CalendarPlus size={18} weight="duotone" />
              Schedule
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-[var(--ember-500)] text-[var(--foreground)] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <PencilSimple size={22} weight="duotone" color="#e7b58d" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Worksheet Generator Modal */}
      {isLesson && lesson && (
        <WorksheetGeneratorModal
          isOpen={worksheetModalOpen}
          onClose={() => setWorksheetModalOpen(false)}
          contextTopic={`${lessonDetailsForWorksheet.title}: ${lessonDetailsForWorksheet.description}`}
          onAttach={handleWorksheetAttach}
        />
      )}
    </div>
  );
}
