'use client';

import { Lesson } from '@/types';
import { DoneToggle } from './DoneToggle';

interface AssignmentCardProps {
  lesson: Lesson;
  kidId: string;
  date: string;
  journalPrompt?: string;
  projectPrompt?: string | null;
}

const tagColors: Record<string, string> = {
  reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  writing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  logic: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  math: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  science: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'critical-thinking': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  project: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

export function AssignmentCard({ lesson, kidId, date, journalPrompt, projectPrompt }: AssignmentCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {lesson.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            {lesson.instructions}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {lesson.tags.map(tag => (
              <span
                key={tag}
                className={`text-xs px-2 py-1 rounded-full ${tagColors[tag] || tagColors.default}`}
              >
                {tag}
              </span>
            ))}
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              ⏱️ {lesson.estimatedMinutes} min
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
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  🔗 {link.label}
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
                  📎 {attachment.label}
                </a>
              ))}
            </div>
          )}

          {/* Prompts */}
          {journalPrompt && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ✏️ <strong>Journal:</strong> {journalPrompt}
              </p>
            </div>
          )}
          {projectPrompt && (
            <div className="mt-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <p className="text-sm text-pink-800 dark:text-pink-200">
                🎨 <strong>Project:</strong> {projectPrompt}
              </p>
            </div>
          )}
        </div>

        <DoneToggle kidId={kidId} date={date} lessonId={lesson.id} />
      </div>
    </div>
  );
}
