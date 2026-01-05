import { WorksheetData, WorksheetQuestion } from '@/types';
import { cn } from '@/lib/utils'; // Assuming you have utility for classNames

interface WorksheetViewerProps {
  data: WorksheetData;
  className?: string;
}

export function WorksheetViewer({ data, className }: WorksheetViewerProps) {
  if (!data) return null;

  return (
    <div className={cn("max-w-4xl mx-auto bg-white p-8 print:p-0 min-h-screen", className)}>
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4 mb-8">
        <h1 className="text-3xl font-bold text-center mb-2 font-serif text-gray-900">{data.title}</h1>
        <div className="flex justify-between mt-6 text-sm font-semibold text-gray-600">
          <span>Name: ____________________</span>
          <span>Date: ____________________</span>
        </div>
      </div>

      {/* Instructions */}
      {data.instructions && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg print:border print:border-gray-300 print:bg-white">
          <h3 className="font-bold text-gray-900 mb-1 uppercase tracking-wider text-xs">Instructions:</h3>
          <p className="text-gray-800 leading-relaxed">{data.instructions}</p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-6">
            {section.title && (
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                {section.title}
              </h2>
            )}

            <div className="space-y-8">
              {section.items.map((item, qIdx) => (
                <div key={item.id} className="break-inside-avoid">
                  <WorksheetQuestionItem item={item} index={qIdx + 1} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer / Branding */}
      <div className="mt-16 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:left-0 print:w-full">
        Created with Lunara Quest
      </div>
    </div>
  );
}

function WorksheetQuestionItem({ item, index }: { item: WorksheetQuestion; index: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <span className="font-bold text-gray-900">{index}.</span>
        <div className="flex-1 text-gray-900 font-medium text-lg leading-snug">
          {renderQuestionText(item)}
        </div>
      </div>

      <div className="pl-6">
        {/* Answer Area */}
        {item.type === 'multiple_choice' && item.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {item.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                <span className="text-gray-700">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {item.type === 'text' && (
          <div 
            className="w-full mt-2 border-b border-gray-300" 
            style={{ height: `${(item.space_lines || 3) * 2}rem` }}
          >
            {/* Visual lines for writing */}
            {Array.from({ length: item.space_lines || 3 }).map((_, i) => (
              <div key={i} className="border-b border-gray-200 h-8 w-full"></div>
            ))}
          </div>
        )}
        
        {item.type === 'drawing_space' && (
          <div className="w-full h-64 border-2 border-gray-200 rounded-xl mt-2 bg-gray-50 print:bg-white print:border-gray-800">
            <div className="h-full flex items-center justify-center text-gray-300 text-sm print:hidden">
              Drawing Space
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderQuestionText(item: WorksheetQuestion) {
  if (item.type === 'fill_in_blank') {
    // If text contains underscores, render them nicely?
    // For now return text
    return item.question;
  }
  return item.question;
}
