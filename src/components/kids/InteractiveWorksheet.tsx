'use client';

import { useState } from 'react';
import { WorksheetData } from '@/types';
import { Check, PencilSimple, ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { saveWorksheetResponsesAction } from '@/lib/actions/worksheet-responses';

interface InteractiveWorksheetProps {
  data: WorksheetData;
  kidId: string;
  assignmentId: string;
  onComplete?: () => void;
}

interface WorksheetResponse {
  [questionId: string]: string | string[] | null;
}

export function InteractiveWorksheet({ data, kidId, assignmentId, onComplete }: InteractiveWorksheetProps) {
  const [responses, setResponses] = useState<WorksheetResponse>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const updateResponse = (questionId: string, value: string | string[]) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveWorksheetResponsesAction(kidId, assignmentId, responses);
      setIsComplete(true);
      onComplete?.();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save your answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = data.sections?.reduce((acc, section) => acc + (section.items?.length || 0), 0) || 0;
  const answeredQuestions = Object.keys(responses).filter(k => responses[k]).length;
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center text-white">
            <Check size={48} weight="bold" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Great Job! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You completed the worksheet!
          </p>
          <Link
            href={`/kids/${kidId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to My Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/kids/${kidId}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div className="flex-1 mx-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {data.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredQuestions === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Done!'}
          </button>
        </div>
      </header>

      {/* Instructions */}
      {data.instructions && (
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-blue-800 dark:text-blue-300">
            {data.instructions}
          </div>
        </div>
      )}

      {/* Sections */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {data.sections?.map((section, sectionIdx) => (
          <section key={sectionIdx} className="space-y-4">
            {section.title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {section.title}
              </h2>
            )}
            <div className="space-y-6">
              {section.items?.map((item, itemIdx) => (
                <QuestionCard
                  key={item.id || `${sectionIdx}-${itemIdx}`}
                  item={item}
                  value={responses[item.id || `${sectionIdx}-${itemIdx}`]}
                  onChange={(val) => updateResponse(item.id || `${sectionIdx}-${itemIdx}`, val)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

interface QuestionCardProps {
  item: {
    id?: string;
    type: string;
    question: string;
    options?: string[];
    space_lines?: number;
  };
  value?: string | string[] | null;
  onChange: (value: string | string[]) => void;
}

function QuestionCard({ item, value, onChange }: QuestionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-gray-900 dark:text-white font-medium mb-4">
        {item.question}
      </p>

      {/* Text/Open Response */}
      {(item.type === 'text' || item.type === 'creative_prompt') && (
        <textarea
          className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={item.space_lines || 4}
          placeholder="Type your answer here..."
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* Multiple Choice */}
      {item.type === 'multiple_choice' && item.options && (
        <div className="space-y-2">
          {item.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onChange(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                value === option
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
              }`}
            >
              <span className={`font-medium ${value === option ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {option}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* True/False */}
      {item.type === 'true_false' && (
        <div className="flex gap-4">
          {['True', 'False'].map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`flex-1 py-4 rounded-lg border-2 font-bold transition-all ${
                value === option
                  ? option === 'True' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-600 dark:text-gray-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Fill in Blank */}
      {item.type === 'fill_in_blank' && (
        <input
          type="text"
          className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg"
          placeholder="Your answer..."
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* Word Bank */}
      {item.type === 'word_bank' && item.options && (
        <div>
          <input
            type="text"
            className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center mb-4"
            placeholder="Select from words below..."
            value={(value as string) || ''}
            readOnly
          />
          <div className="flex flex-wrap gap-2">
            {item.options.map((word, idx) => (
              <button
                key={idx}
                onClick={() => onChange(word)}
                className={`px-4 py-2 rounded-full border transition-all ${
                  value === word
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-purple-100'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drawing Space */}
      {item.type === 'drawing_space' && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-[200px] flex flex-col items-center justify-center">
          <PencilSimple size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Drawing space - use paper or a drawing app!
          </p>
          <button
            onClick={() => onChange('completed')}
            className={`px-4 py-2 rounded-lg border transition-all ${
              value === 'completed'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-green-50'
            }`}
          >
            {value === 'completed' ? '✓ Done drawing!' : 'Mark as done'}
          </button>
        </div>
      )}

      {/* Matching - simplified as select */}
      {item.type === 'matching' && item.options && (
        <div className="space-y-2">
          {item.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onChange(option)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                value === option
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
