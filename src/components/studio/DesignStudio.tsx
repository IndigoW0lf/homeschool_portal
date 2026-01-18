'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DesignTemplate, 
  DesignRegion, 
  StrokeData,
  DesignTemplatesManifest,
  DESIGN_COLOR_PALETTE,
  BRUSH_SIZES,
} from '@/types/design-studio';
import { DesignCanvas } from './DesignCanvas';
import { ColorPalette } from './ColorPalette';
import { PaintBucket, Pencil, Eraser, ArrowLeft, FloppyDisk, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';
import Link from 'next/link';

interface DesignStudioProps {
  kidId: string;
  templates: DesignTemplatesManifest;
  existingDesigns?: Record<string, DesignRegion>; // For editing existing design
  designId?: string; // If editing
}

type Tool = 'fill' | 'draw' | 'eraser';

export function DesignStudio({ kidId, templates, existingDesigns, designId }: DesignStudioProps) {
  // Get starter templates (unlocked ones)
  const starterTemplates = templates.categories.flatMap(cat => 
    cat.templates.filter(t => t.unlocked)
  );
  
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(
    starterTemplates[0] || null
  );
  const [tool, setTool] = useState<Tool>('fill');
  const [currentColor, setCurrentColor] = useState(DESIGN_COLOR_PALETTE[0].value);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<Record<string, DesignRegion>>({});
  const [designName, setDesignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize regions when template changes
  useEffect(() => {
    if (!selectedTemplate) return;
    
    if (existingDesigns) {
      setRegions(existingDesigns);
    } else {
      // Initialize empty regions for new design
      const initialRegions: Record<string, DesignRegion> = {};
      selectedTemplate.regions.forEach(regionId => {
        initialRegions[regionId] = {
          id: regionId,
          label: regionId.replace(/-/g, ' '),
          fillColor: '#E5E5E5', // Default gray
          strokes: [],
        };
      });
      setRegions(initialRegions);
    }
  }, [selectedTemplate, existingDesigns]);

  const handleRegionClick = useCallback((regionId: string) => {
    setActiveRegion(regionId);
  }, []);

  const handleRegionFill = useCallback((regionId: string, color: string) => {
    setRegions(prev => ({
      ...prev,
      [regionId]: {
        ...prev[regionId],
        fillColor: color,
      },
    }));
  }, []);

  const handleStrokeComplete = useCallback((stroke: StrokeData) => {
    // Add stroke to the appropriate region (or a general layer)
    // For now, add to first region or create a "strokes" layer
    setRegions(prev => {
      const regionId = activeRegion || Object.keys(prev)[0];
      if (!regionId) return prev;
      
      return {
        ...prev,
        [regionId]: {
          ...prev[regionId],
          strokes: [...(prev[regionId]?.strokes || []), stroke],
        },
      };
    });
  }, [activeRegion]);

  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!designName.trim()) {
      toast.error('Please give your design a name!');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/kids/${kidId}/designs`, {
        method: designId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: designId,
          templateId: selectedTemplate.id,
          name: designName.trim(),
          regions,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save design');
      }
      
      toast.success('Design saved! ✨');
    } catch (error) {
      console.error('Failed to save design:', error);
      toast.error('Could not save design. Try again?');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    // Simple undo: remove last stroke from active region
    if (!activeRegion || !regions[activeRegion]?.strokes.length) return;
    
    setRegions(prev => ({
      ...prev,
      [activeRegion]: {
        ...prev[activeRegion],
        strokes: prev[activeRegion].strokes.slice(0, -1),
      },
    }));
  };

  const handleClearRegion = () => {
    if (!activeRegion) return;
    
    setRegions(prev => ({
      ...prev,
      [activeRegion]: {
        ...prev[activeRegion],
        fillColor: '#E5E5E5',
        strokes: [],
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href={`/kids/${kidId}/avatar`}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🎨 Design Studio
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !designName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            <FloppyDisk size={18} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Design Name Input */}
      <div>
        <input
          type="text"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="Name your design..."
          className="w-full px-4 py-2 text-lg border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[var(--ember-300)] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Template Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Choose what to design
        </h3>
        <div className="flex flex-wrap gap-2">
          {templates.categories.map(category => (
            <div key={category.id} className="flex gap-2">
              {category.templates
                .filter(t => t.unlocked)
                .map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedTemplate?.id === template.id
                        ? 'bg-[var(--ember-500)] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {category.icon} {template.label}
                  </button>
                ))
              }
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="md:col-span-2">
          {selectedTemplate ? (
            <DesignCanvas
              template={selectedTemplate}
              regions={regions}
              activeRegion={activeRegion}
              tool={tool}
              currentColor={currentColor}
              brushSize={brushSize}
              onRegionClick={handleRegionClick}
              onRegionFill={handleRegionFill}
              onStrokeComplete={handleStrokeComplete}
            />
          ) : (
            <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">
                Select a template to start designing
              </p>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        <div className="space-y-4">
          {/* Tool Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Tools
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTool('fill')}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                  ${tool === 'fill'
                    ? 'bg-[var(--ember-100)] text-[var(--ember-600)] ring-2 ring-[var(--ember-300)]'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <PaintBucket size={24} />
                <span className="text-xs font-medium">Fill</span>
              </button>
              <button
                onClick={() => setTool('draw')}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                  ${tool === 'draw'
                    ? 'bg-[var(--ember-100)] text-[var(--ember-600)] ring-2 ring-[var(--ember-300)]'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <Pencil size={24} />
                <span className="text-xs font-medium">Draw</span>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                  ${tool === 'eraser'
                    ? 'bg-[var(--ember-100)] text-[var(--ember-600)] ring-2 ring-[var(--ember-300)]'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <Eraser size={24} />
                <span className="text-xs font-medium">Erase</span>
              </button>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <ColorPalette
              selectedColor={currentColor}
              onColorSelect={setCurrentColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              showBrushSize={tool === 'draw'}
            />
          </div>

          {/* Active Region Info */}
          {activeRegion && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Selected Area
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {activeRegion.replace(/-/g, ' ')}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleUndo}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Undo
                </button>
                <button
                  onClick={handleClearRegion}
                  className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
