'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, PencilSimple, Trash, CalendarPlus, Clock, BookOpen, Pencil, CheckSquare, FileText, Link, Printer, MagicWand } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow, WorksheetData } from '@/types';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { WorksheetGeneratorModal } from '@/components/worksheets/WorksheetGeneratorModal';
import { saveWorksheetAssignmentAction } from '@/lib/actions/worksheet';
import { attachWorksheetToLessonAction } from '@/lib/actions/lesson';
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
  
  if (!isOpen || !item) return null;

  const isLesson = itemType === 'lesson';
  const lesson = isLesson ? (item as Lesson) : null;
  const assignment = !isLesson ? (item as AssignmentItemRow) : null;

  // Build lessonDetails from DIRECT lesson properties, with JSON parsing as fallback
  let lessonDetails = { 
    description: '', 
    keyQuestions: [] as Array<string | { text: string }>, 
    materials: '', 
    links: [] as { label: string; url: string }[] 
  };
  
  if (lesson) {
    // Use direct properties first (the correct way)
    lessonDetails.description = lesson.description || '';
    lessonDetails.keyQuestions = lesson.keyQuestions || [];
    lessonDetails.materials = lesson.materials || '';
    lessonDetails.links = lesson.links || [];
    
    // If no description from direct field, try parsing instructions JSON (legacy fallback)
    if (!lessonDetails.description && lesson.instructions) {
      try {
        const parsed = JSON.parse(lesson.instructions);
        if (!lessonDetails.description && parsed.description) {
          lessonDetails.description = parsed.description;
        }
        if (lessonDetails.keyQuestions.length === 0 && parsed.keyQuestions) {
          lessonDetails.keyQuestions = parsed.keyQuestions;
        }
        if (!lessonDetails.materials && parsed.materials) {
          lessonDetails.materials = parsed.materials;
        }
      } catch {
        // Plain text instructions become description
        if (!lessonDetails.description) {
          lessonDetails.description = lesson.instructions;
        }
      }
    }
  }

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
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] dark:border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isLesson ? "bg-[var(--celestial-400)]/20 text-[var(--celestial-500)]" : "bg-[var(--nebula-purple)]/20 text-[var(--nebula-purple)]"
            )}>
              {isLesson ? <BookOpen size={28} weight="duotone" color="#b6e1d8" /> : <Pencil size={28} weight="duotone" color="#caa2d8" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                  isLesson ? "bg-[var(--celestial-400)]/20 text-[var(--celestial-500)]" : "bg-[var(--nebula-purple)]/20 text-[var(--nebula-purple)]"
                )}>
                  {item.type || (isLesson ? 'Lesson' : 'Assignment')}
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <Clock size={12} />
                  {isLesson ? lesson?.estimatedMinutes : assignment?.estimated_minutes || 15} min
                </span>
              </div>
              <h2 className="text-xl font-bold text-heading">
                {item.title}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] rounded-full transition-colors"
          >
            <X size={24} className="text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--background-secondary)]/50 dark:bg-black/20">
          
          {/* Lesson Details */}
          {isLesson && lesson && (
            <>
              {/* Description */}
              {lessonDetails.description && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <MarkdownText 
                    content={lessonDetails.description} 
                    className="bg-[var(--background-elevated)]/50 p-4 rounded-xl border border-[var(--border)]"
                  />
                </div>
              )}

              {/* Key Questions */}
              {lessonDetails.keyQuestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Key Questions
                  </h3>
                  <ul className="space-y-2">
                    {lessonDetails.keyQuestions.map((q, i) => {
                      // Handle both string and object formats
                      const questionText = typeof q === 'string' ? q : (q as { text?: string })?.text || '';
                      return questionText ? (
                        <li key={i} className="flex gap-2 text-heading dark:text-muted">
                          <span className="text-[var(--celestial-500)]">•</span>
                          {questionText}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}

              {/* Materials */}
              {lessonDetails.materials && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Materials
                  </h3>
                  <MarkdownText 
                    content={lessonDetails.materials} 
                    className="text-heading dark:text-muted"
                  />
                </div>
              )}

              {/* Links */}
              {(lessonDetails.links?.length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Resources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lessonDetails.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--celestial-500)] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Link size={18} weight="duotone" color="#b6e1d8" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {lesson.tags?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-muted rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Assignment Details */}
          {!isLesson && assignment && (
            <>
              {/* Deliverable */}
              {assignment.deliverable && (
                <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-[var(--celestial-500)]" />
                    Expected Deliverable
                  </h3>
                  <MarkdownText 
                    content={assignment.deliverable} 
                    className="text-heading dark:text-muted font-medium"
                  />
                </div>
              )}

              {/* Steps */}
              {assignment.steps && Array.isArray(assignment.steps) && assignment.steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                    Steps
                  </h3>
                  <div className="space-y-2">
                    {assignment.steps.map((step: { text?: string }, i: number) => (
                      step.text && (
                        <div key={i} className="flex gap-3 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)]">
                          <span className="font-bold text-muted w-6 text-right">{i + 1}.</span>
                          <p className="text-heading dark:text-muted flex-1">{step.text}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Rubric */}
              {assignment.rubric && Array.isArray(assignment.rubric) && assignment.rubric.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckSquare size={16} className="text-green-500" />
                    Success Criteria
                  </h3>
                  <div className="space-y-2">
                    {assignment.rubric.map((item: { text?: string }, i: number) => (
                      item.text && (
                        <div key={i} className="flex items-center gap-2 text-heading dark:text-muted">
                          <div className="w-4 h-4 rounded border-2 border-[var(--border)] dark:border-[var(--border)]" />
                          <span>{item.text}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Parent Notes */}
              {assignment.parent_notes && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                    Parent Notes (Private)
                  </h3>
                  <MarkdownText 
                    content={assignment.parent_notes} 
                    className="text-amber-800 dark:text-amber-300"
                  />
                </div>
              )}

              {/* Links */}
              {assignment.links && Array.isArray(assignment.links) && assignment.links.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {assignment.links.map((link: { url?: string; label?: string }, i: number) => (
                      link.url && (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--celestial-500)] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Link size={18} weight="duotone" color="#b6e1d8" />
                          {link.label || 'Link'}
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {assignment.tags?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {assignment.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-muted rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] dark:border-[var(--border)] flex justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash size={22} weight="duotone" color="#ffcdf6" />
            Delete
          </button>
          <div className="flex gap-2">
            {assignment?.worksheet_data && (
              <a
                href={`/print/worksheet/${item.id}`}
                target="_blank"
                className="px-4 py-2 text-[var(--celestial-500)] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 font-medium"
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
          contextTopic={`${lesson.title}: ${lessonDetails.description}`}
          onAttach={handleWorksheetAttach}
        />
      )}
    </div>
  );
}
