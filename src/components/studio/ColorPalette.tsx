'use client';

import { DESIGN_COLOR_PALETTE, BRUSH_SIZES } from '@/types/design-studio';

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  showBrushSize?: boolean;
}

export function ColorPalette({
  selectedColor,
  onColorSelect,
  brushSize,
  onBrushSizeChange,
  showBrushSize = true,
}: ColorPaletteProps) {
  return (
    <div className="space-y-4">
      {/* Color Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="grid grid-cols-6 gap-2">
          {DESIGN_COLOR_PALETTE.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorSelect(color.value)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                ${selectedColor === color.value 
                  ? 'border-[var(--ember-500)] ring-2 ring-[var(--ember-300)] scale-110' 
                  : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }
              `}
              style={{ 
                backgroundColor: color.value,
                boxShadow: color.value === '#FFFFFF' ? 'inset 0 0 0 1px #E5E5E5' : undefined,
              }}
              title={color.label}
              aria-label={`Select ${color.label} color`}
            />
          ))}
        </div>
      </div>
      
      {/* Brush Size (only for draw tool) */}
      {showBrushSize && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Brush Size
          </label>
          <div className="flex gap-3">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => onBrushSizeChange(size.value)}
                className={`
                  flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                  ${brushSize === size.value
                    ? 'border-[var(--ember-500)] bg-[var(--ember-50)] text-[var(--ember-700)]'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="rounded-full bg-current"
                    style={{ 
                      width: size.value * 1.5,
                      height: size.value * 1.5,
                    }}
                  />
                  <span>{size.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
