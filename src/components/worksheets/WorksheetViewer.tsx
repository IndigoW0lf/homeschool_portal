'use client';

import { useState } from 'react';
import { WorksheetData, WorksheetQuestion, WorksheetSection } from '@/types';
import { cn } from '@/lib/utils';
import { PencilSimple, Check } from '@phosphor-icons/react';

interface WorksheetViewerProps {
  data: WorksheetData;
  className?: string;
  editable?: boolean;
  onDataChange?: (data: WorksheetData) => void;
}

export function WorksheetViewer({ data, className, editable = false, onDataChange }: WorksheetViewerProps) {
  if (!data) return null;

  const updateSection = (sectionIndex: number, updates: Partial<WorksheetSection>) => {
    if (!onDataChange) return;
    const newSections = [...data.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
    onDataChange({ ...data, sections: newSections });
  };

  const updateItem = (sectionIndex: number, itemIndex: number, updates: Partial<WorksheetQuestion>) => {
    if (!onDataChange) return;
    const newSections = [...data.sections];
    const newItems = [...newSections[sectionIndex].items];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
    newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
    onDataChange({ ...data, sections: newSections });
  };

  const updateOption = (sectionIndex: number, itemIndex: number, optionIndex: number, value: string) => {
    if (!onDataChange) return;
    const newSections = [...data.sections];
    const newItems = [...newSections[sectionIndex].items];
    const newOptions = [...(newItems[itemIndex].options || [])];
    newOptions[optionIndex] = value;
    newItems[itemIndex] = { ...newItems[itemIndex], options: newOptions };
    newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
    onDataChange({ ...data, sections: newSections });
  };

  return (
    <div className={cn("max-w-4xl mx-auto bg-[var(--background-elevated)] p-8 print:p-0 min-h-screen", className)}>
      {/* Header */}
      <div className="border-b-2 border-[var(--night-900)] pb-4 mb-8">
        <EditableText
          value={data.title}
          editable={editable}
          onChange={(title) => onDataChange?.({ ...data, title })}
          className="text-3xl font-bold text-center mb-2 font-serif text-heading"
          inputClassName="text-3xl font-bold text-center font-serif"
        />
        <div className="flex justify-between mt-6 text-sm font-semibold text-muted">
          <span>Name: ____________________</span>
          <span>Date: ____________________</span>
        </div>
      </div>

      {/* Instructions */}
      {(data.instructions || editable) && (
        <div className="mb-8 p-4 bg-[var(--background-secondary)] rounded-lg print:border print:border-[var(--border)] print:bg-[var(--background-elevated)]">
          <h3 className="font-bold text-heading mb-1 uppercase tracking-wider text-xs">Instructions:</h3>
          <EditableText
            value={data.instructions || ''}
            editable={editable}
            onChange={(instructions) => onDataChange?.({ ...data, instructions })}
            className="text-heading leading-relaxed"
            multiline
          />
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-6">
            {(section.title || editable) && (
              <EditableText
                value={section.title || ''}
                editable={editable}
                onChange={(title) => updateSection(sIdx, { title })}
                className="text-xl font-bold text-heading border-b border-[var(--border)] pb-2 mb-4"
                placeholder="Section Title"
              />
            )}

            <div className="space-y-8">
              {section.items.map((item, qIdx) => (
                <div key={item.id} className="break-inside-avoid">
                  <WorksheetQuestionItem 
                    item={item} 
                    index={qIdx + 1}
                    editable={editable}
                    onQuestionChange={(updates) => updateItem(sIdx, qIdx, updates)}
                    onOptionChange={(optIdx, value) => updateOption(sIdx, qIdx, optIdx, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer / Branding */}
      <div className="mt-16 pt-4 border-t border-[var(--border)] text-center text-xs text-muted print:fixed print:bottom-4 print:left-0 print:w-full">
        Created with Lunara Quest
      </div>
    </div>
  );
}

// Editable text component
interface EditableTextProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  multiline?: boolean;
}

function EditableText({ value, editable, onChange, className, inputClassName, placeholder, multiline }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (!editable) {
    return <div className={className}>{value || placeholder}</div>;
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            rows={3}
            className={cn(
              "flex-1 p-2 border border-[var(--nebula-purple)]/40 rounded-lg focus:ring-2 focus:ring-[var(--nebula-purple)] focus:border-transparent resize-none",
              inputClassName
            )}
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className={cn(
              "flex-1 p-2 border border-[var(--nebula-purple)]/40 rounded-lg focus:ring-2 focus:ring-[var(--nebula-purple)] focus:border-transparent",
              inputClassName
            )}
          />
        )}
        <button
          onClick={handleSave}
          className="p-2 bg-[var(--nebula-purple)] text-[var(--foreground)] rounded-lg hover:bg-[var(--nebula-purple)] transition-colors"
        >
          <Check size={16} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        setEditValue(value);
        setIsEditing(true);
      }}
      className={cn(
        className,
        "cursor-pointer hover:bg-[var(--nebula-purple)]/10 hover:outline hover:outline-2 hover:outline-[var(--nebula-purple)]/30 rounded px-1 -mx-1 transition-colors group relative"
      )}
    >
      {value || <span className="text-muted italic">{placeholder || 'Click to edit'}</span>}
      <PencilSimple 
        size={14} 
        className="absolute -right-5 top-1/2 -translate-y-1/2 text-[var(--nebula-purple)] opacity-0 group-hover:opacity-100 transition-opacity" 
      />
    </div>
  );
}

// Question item with edit support
interface QuestionItemProps {
  item: WorksheetQuestion;
  index: number;
  editable?: boolean;
  onQuestionChange?: (updates: Partial<WorksheetQuestion>) => void;
  onOptionChange?: (optionIndex: number, value: string) => void;
}

function WorksheetQuestionItem({ item, index, editable = false, onQuestionChange, onOptionChange }: QuestionItemProps) {
  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <span className="font-bold text-heading">{index}.</span>
        <div className="flex-1">
          <EditableText
            value={item.question}
            editable={editable}
            onChange={(question) => onQuestionChange?.({ question })}
            className="text-heading font-medium text-lg leading-snug"
          />
        </div>
      </div>

      <div className="pl-6">
        {/* Answer Area */}
        {item.type === 'multiple_choice' && item.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {item.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] flex-shrink-0"></div>
                <EditableText
                  value={opt}
                  editable={editable}
                  onChange={(value) => onOptionChange?.(i, value)}
                  className="text-heading"
                />
              </div>
            ))}
          </div>
        )}

        {item.type === 'text' && (
          <div 
            className="w-full mt-2 border-b border-[var(--border)]" 
            style={{ height: `${(item.space_lines || 3) * 2}rem` }}
          >
            {/* Visual lines for writing */}
            {Array.from({ length: item.space_lines || 3 }).map((_, i) => (
              <div key={i} className="border-b border-[var(--border)] h-8 w-full"></div>
            ))}
          </div>
        )}

        {item.type === 'fill_in_blank' && (
          <div 
            className="w-full mt-2 border-b border-[var(--border)]" 
            style={{ height: `${(item.space_lines || 2) * 2}rem` }}
          >
            {Array.from({ length: item.space_lines || 2 }).map((_, i) => (
              <div key={i} className="border-b border-[var(--border)] h-8 w-full"></div>
            ))}
          </div>
        )}
        
        {item.type === 'drawing_space' && (
          <div className="w-full h-64 border-2 border-[var(--border)] rounded-xl mt-2 bg-[var(--background-secondary)] print:bg-[var(--background-elevated)] print:border-black">
            <div className="h-full flex items-center justify-center text-muted text-sm print:hidden">
              Drawing Space
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
