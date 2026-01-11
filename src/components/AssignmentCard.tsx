import { Lesson } from '@/types';
import { DoneToggle } from './DoneToggle';
import { cn } from '@/lib/utils';
import { Timer, Link as LinkIcon, Paperclip, PencilSimple, Palette } from '@phosphor-icons/react';

interface AssignmentCardProps {
  lesson: Lesson;
  kidId: string;
  date: string;
  journalPrompt?: string;
  projectPrompt?: string | null;
  onClick?: () => void;
}


export function AssignmentCard({ lesson, kidId, date, journalPrompt, projectPrompt, onClick }: AssignmentCardProps) {
  return (
    <div 
      id={`today-item-${lesson.id}`}
      onClick={(e) => {
        // Don't trigger if clicking buttons or links
        if ((e.target as HTMLElement).closest('button, a, input, label')) return;
        onClick?.();
      }}
      className={cn(
        "card p-5 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-[var(--ember-200)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="heading-sm mb-2">
            {lesson.title}
          </h3>
          <p className="text-muted text-sm mb-3">
            {lesson.instructions}
          </p>
          
          {/* Duration */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="tag flex items-center gap-1">
              <Timer size={14} weight="regular" /> {lesson.estimatedMinutes} min
            </span>
          </div>

          {/* Links */}
          {lesson.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {lesson.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link text-sm flex items-center gap-1"
                >
                  <LinkIcon size={14} /> {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Attachments */}
          {lesson.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {lesson.attachments.map((attachment, i) => (
                <a
                  key={i}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                >
                  <Paperclip size={14} /> {attachment.label}
                </a>
              ))}
            </div>
          )}

          {/* Prompts */}
          {journalPrompt && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-1.5">
                <PencilSimple size={16} className="flex-shrink-0 mt-0.5" weight="duotone" />
                <span><strong>Journal:</strong> {journalPrompt}</span>
              </p>
            </div>
          )}
          {projectPrompt && (
            <div className="mt-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <p className="text-sm text-pink-800 dark:text-pink-200 flex items-start gap-1.5">
                <Palette size={16} className="flex-shrink-0 mt-0.5" weight="duotone" />
                <span><strong>Project:</strong> {projectPrompt}</span>
              </p>
            </div>
          )}
        </div>

        <DoneToggle kidId={kidId} date={date} lessonId={lesson.id} />
      </div>
    </div>
  );
}
