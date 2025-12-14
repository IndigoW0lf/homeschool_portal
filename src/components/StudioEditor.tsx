'use client';

import { useState, useEffect } from 'react';
import { StudioTemplates, StudioState } from '@/types';
import { getStudioState, setStudioState, getDefaultStudioState } from '@/lib/studioStorage';

interface StudioEditorProps {
  kidId: string;
  templates: StudioTemplates;
}

const COLOR_PALETTE = [
  { value: '--fabric-blue', label: 'Blue', color: '#5E7FB8' },
  { value: '--fabric-green', label: 'Green', color: '#6FAFA2' },
  { value: '--fabric-gold', label: 'Gold', color: '#E1B866' },
  { value: '--fabric-rose', label: 'Rose', color: '#D48A8A' },
  { value: '--fabric-lilac', label: 'Lilac', color: '#9C8FB8' },
  { value: '--leaf-500', label: 'Leaf', color: '#6F8F73' },
  { value: '--ember-500', label: 'Ember', color: '#E27D60' },
  { value: '--sky-400', label: 'Sky', color: '#7FB3D5' },
  { value: '--wood-400', label: 'Wood', color: '#B99A7A' },
  { value: '--stone-300', label: 'Stone', color: '#C9CED1' },
];

export function StudioEditor({ kidId, templates }: StudioEditorProps) {
  const [state, setState] = useState<StudioState>(getDefaultStudioState());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedState = getStudioState(kidId);
    if (savedState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(savedState);
    }
  }, [kidId]);

  const selectedTemplate = templates.templates.find(t => t.id === state.selectedTemplate) || templates.templates[0];

  const handleTemplateSelect = (templateId: string) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: templateId,
      colors: {
        primary: prev.colors.primary || '--fabric-blue',
        secondary: prev.colors.secondary || '--fabric-gold',
      },
    }));
  };

  const handleColorChange = (partName: string, colorVar: string) => {
    setState(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [partName]: colorVar,
      },
    }));
  };

  const handleSave = () => {
    setStudioState(kidId, state);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Art Studio</h2>
        
        {/* Template Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Choose a Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {templates.templates.map(template => {
              const isSelected = state.selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="w-full h-32 bg-[var(--paper-100)] rounded mb-2 flex items-center justify-center">
                    <img
                      src={template.src}
                      alt={template.label}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{template.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Preview</h3>
          <div className="flex justify-center">
            <div 
              className="relative w-64 h-64 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--paper-100)' }}
            >
              {/* When SVG templates have data-part attributes, colors will be applied via CSS variables */}
              <div
                className="w-full h-full"
                style={{
                  '--color-primary': state.colors.primary ? `var(${state.colors.primary})` : 'var(--fabric-blue)',
                  '--color-secondary': state.colors.secondary ? `var(${state.colors.secondary})` : 'var(--fabric-gold)',
                } as React.CSSProperties}
              >
                <img
                  src={selectedTemplate.src}
                  alt={selectedTemplate.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Colors</h3>
          <div className="space-y-4">
            {selectedTemplate.parts.map(part => (
              <div key={part.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {part.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map(color => {
                    const isSelected = state.colors[part.name] === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(part.name, color.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          isSelected
                            ? 'border-[var(--ink-900)] scale-110'
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.label}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 px-6 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saved ? '✓ Saved!' : 'Save Design'}
        </button>
      </div>
    </div>
  );
}

