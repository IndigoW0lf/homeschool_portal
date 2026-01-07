'use client';

import { useState } from 'react';
import { Notebook, CaretDown, CaretRight, CheckCircle, Clock } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';

interface WorksheetResponse {
  id: string;
  kidId: string;
  kidName: string;
  assignmentId: string;
  assignmentTitle: string;
  responses: Record<string, string | string[] | null>;
  submittedAt: string;
  worksheetData: {
    title?: string;
    sections?: Array<{
      title?: string;
      items?: Array<{
        id?: string;
        type: string;
        question: string;
        options?: string[];
        answer?: string;
      }>;
    }>;
  };
}

interface WorksheetResponseViewerProps {
  responses: WorksheetResponse[];
}

export function WorksheetResponseViewer({ responses }: WorksheetResponseViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Notebook size={48} className="mx-auto mb-4 opacity-50" />
        <p>No worksheet responses yet.</p>
        <p className="text-sm mt-1">Completed worksheets will appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <div
          key={response.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header - Click to expand */}
          <button
            onClick={() => setExpandedId(expandedId === response.id ? null : response.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle size={20} weight="fill" className="text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {response.worksheetData?.title || response.assignmentTitle}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span>{response.kidName}</span>
                  <span>•</span>
                  <Clock size={14} />
                  <span>{formatDistanceToNow(new Date(response.submittedAt), { addSuffix: true })}</span>
                </p>
              </div>
            </div>
            {expandedId === response.id ? (
              <CaretDown size={20} className="text-gray-400" />
            ) : (
              <CaretRight size={20} className="text-gray-400" />
            )}
          </button>

          {/* Expanded content */}
          {expandedId === response.id && (
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
              {response.worksheetData?.sections?.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  {section.title && (
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {section.title}
                    </h4>
                  )}
                  <div className="space-y-3">
                    {section.items?.map((item, itemIdx) => {
                      const questionId = item.id || `${sectionIdx}-${itemIdx}`;
                      const answer = response.responses[questionId];
                      const isCorrect = item.answer && answer === item.answer;

                      return (
                        <div
                          key={questionId}
                          className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3"
                        >
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Q: {item.question}
                          </p>
                          <div className="flex items-start gap-2">
                            <span className="text-xs uppercase text-gray-500 mt-0.5">A:</span>
                            <p className={`text-sm flex-1 ${
                              isCorrect 
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {answer || <span className="italic text-gray-400">No answer</span>}
                            </p>
                            {item.answer && (
                              <div className={`text-xs px-2 py-0.5 rounded ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {isCorrect ? '✓ Correct' : `Answer: ${item.answer}`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Raw responses if no worksheet structure */}
              {!response.worksheetData?.sections && (
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(response.responses, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
