'use client';

import { X, Edit2, Trash2, Copy, Clock, BookOpen, PenTool, CheckSquare, FileText, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow } from '@/types';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Lesson | AssignmentItemRow | null;
  itemType: 'lesson' | 'assignment';
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
}

export function ItemDetailModal({ 
  isOpen, 
  onClose, 
  item, 
  itemType, 
  onEdit, 
  onDelete, 
  onClone 
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const isLesson = itemType === 'lesson';
  const lesson = isLesson ? (item as Lesson) : null;
  const assignment = !isLesson ? (item as AssignmentItemRow) : null;

  // Parse lesson instructions if it's JSON
  let lessonDetails = { description: '', keyQuestions: [] as string[], materials: '', links: [] as { label: string; url: string }[] };
  if (lesson?.instructions) {
    try {
      const parsed = JSON.parse(lesson.instructions);
      lessonDetails = { ...lessonDetails, ...parsed };
    } catch {
      // Plain text fallback
      lessonDetails.description = lesson.instructions;
    }
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isLesson ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
            )}>
              {isLesson ? <BookOpen size={24} /> : <PenTool size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                  isLesson ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                )}>
                  {item.type || (isLesson ? 'Lesson' : 'Assignment')}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  {isLesson ? lesson?.estimatedMinutes : assignment?.estimated_minutes || 15} min
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {item.title}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-black/20">
          
          {/* Lesson Details */}
          {isLesson && lesson && (
            <>
              {/* Description */}
              {lessonDetails.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {lessonDetails.description}
                  </p>
                </div>
              )}

              {/* Key Questions */}
              {lessonDetails.keyQuestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Key Questions
                  </h3>
                  <ul className="space-y-2">
                    {lessonDetails.keyQuestions.map((q, i) => {
                      // Handle both string and object formats
                      const questionText = typeof q === 'string' ? q : (q as { text?: string })?.text || '';
                      return questionText ? (
                        <li key={i} className="flex gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-blue-500">•</span>
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Materials
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {lessonDetails.materials}
                  </p>
                </div>
              )}

              {/* Links */}
              {(lesson.links?.length > 0 || lessonDetails.links?.length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Resources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...(lesson.links || []), ...(lessonDetails.links || [])].map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <LinkIcon size={14} />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {lesson.tags?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-sm">
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
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Expected Deliverable
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {assignment.deliverable}
                  </p>
                </div>
              )}

              {/* Steps */}
              {assignment.steps && Array.isArray(assignment.steps) && assignment.steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Steps
                  </h3>
                  <div className="space-y-2">
                    {assignment.steps.map((step: { text?: string }, i: number) => (
                      step.text && (
                        <div key={i} className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-gray-400 w-6 text-right">{i + 1}.</span>
                          <p className="text-gray-700 dark:text-gray-300 flex-1">{step.text}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Rubric */}
              {assignment.rubric && Array.isArray(assignment.rubric) && assignment.rubric.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckSquare size={16} className="text-green-500" />
                    Success Criteria
                  </h3>
                  <div className="space-y-2">
                    {assignment.rubric.map((item: { text?: string }, i: number) => (
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

              {/* Parent Notes */}
              {assignment.parent_notes && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                    Parent Notes (Private)
                  </h3>
                  <p className="text-amber-800 dark:text-amber-300 text-sm">
                    {assignment.parent_notes}
                  </p>
                </div>
              )}

              {/* Links */}
              {assignment.links && Array.isArray(assignment.links) && assignment.links.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <LinkIcon size={14} />
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {assignment.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-sm">
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
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClone}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <Copy size={18} />
              Clone
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
