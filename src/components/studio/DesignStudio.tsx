'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  DesignTemplate, 
  DesignRegion, 
  StrokeData,
  DesignTemplatesManifest,
  DESIGN_COLOR_PALETTE,
  BRUSH_SIZES,
} from '@/types/design-studio';
import { DesignCanvas, DesignCanvasRef } from './DesignCanvas';
import { useRef } from 'react';
import { ColorPalette } from './ColorPalette';
import { PaintBucket, Pencil, Eraser, ArrowLeft, FloppyDisk, Eye, Lock, TShirt } from '@phosphor-icons/react';
import { SyntyAvatarPreview } from '@/components/SyntyAvatarPreview';
import { ItemDesignRow } from '@/types/design-studio';

interface DesignStudioProps {
  kidId: string;
  templates: DesignTemplatesManifest;
  existingDesigns?: Record<string, DesignRegion>; // For editing specific design passed from parent (legacy/direct link)
  designId?: string; // If editing
  unlockedTemplateIds?: string[];
  initialDesigns?: ItemDesignRow[];
}

type Tool = 'fill' | 'draw' | 'eraser';
type ViewMode = 'create' | 'wardrobe';

export function DesignStudio({ 
  kidId, 
  templates, 
  existingDesigns, 
  designId: initialDesignId,
  unlockedTemplateIds = [],
  initialDesigns = []}: DesignStudioProps) {
  // Get starter templates (unlocked ones)
  const starterTemplates = templates.categories.flatMap(cat => 
    cat.templates.filter(t => t.unlocked)
  );
  
  // Ref for canvas to export texture
  const designCanvasRef = useRef<DesignCanvasRef>(null);
  
  const [view, setView] = useState<ViewMode>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(
    starterTemplates[0] || null
  );
  const [currentDesignId, setCurrentDesignId] = useState<string | undefined>(initialDesignId);

  const [tool, setTool] = useState<Tool>('fill');
  const [currentColor, setCurrentColor] = useState(DESIGN_COLOR_PALETTE[0].value);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<Record<string, DesignRegion>>({}); // Current canvas state
  
  const [designName, setDesignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTexture, setPreviewTexture] = useState<string | null>(null);

  // Update preview texture when regions change or when preview is opened
  useEffect(() => {
    if (showPreview && designCanvasRef.current) {
      const updateTexture = async () => {
        try {
          const dataUrl = await designCanvasRef.current?.toDataURL();
          if (dataUrl) setPreviewTexture(dataUrl);
        } catch (e) {
          console.error("Failed to generate preview texture:", e);
        }
      };
      
      // Debounce slightly to avoid rapid updates
      const timer = setTimeout(updateTexture, 100);
      return () => clearTimeout(timer);
    }
  }, [showPreview, regions]); // Re-run when regions (colors) change

  // Initialize regions when template changes OR when loading a wardrobe item
  useEffect(() => {
    if (!selectedTemplate) return;
    
    // If we have specific regions loaded (e.g. from wardrobe item click), keep them
    // Otherwise init from template
    // This logic needs to be careful not to overwrite work in progress if user just switches template?
    // For simplicity: switching template resets canvas.
    
    const templateRegionIds = selectedTemplate.regions || selectedTemplate.parts?.map(p => p.name) || [];
    const isNewTemplate = !regions || Object.keys(regions).length === 0 || 
                         !Object.keys(regions).some(k => templateRegionIds.includes(k));

    if (existingDesigns && !currentDesignId) {
       setRegions(existingDesigns);
    } else if (isNewTemplate) {
      // Initialize empty regions for new design
      const initialRegions: Record<string, DesignRegion> = {};
      
      // Handle standard parts (if available)
      if (selectedTemplate.parts) {
        selectedTemplate.parts.forEach(part => {
          initialRegions[part.name] = {
            id: part.name,
            label: part.label,
            fillColor: '#E5E5E5',
            strokes: [],
          };
        });
      }

      // Handle raw regions (skin templates)
      if ((selectedTemplate as any).regions) {
        (selectedTemplate as any).regions.forEach((regionId: string) => {
          initialRegions[regionId] = {
            id: regionId,
            label: regionId.replace(/-/g, ' '),
            fillColor: '#E5E5E5',
            strokes: [],
          };
        });
      }

      setRegions(initialRegions);
    }
  }, [selectedTemplate, existingDesigns, currentDesignId]); // removed regions dependency to avoid loops



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
      // Capture texture image from canvas
      let textureImage: string | undefined;
      if (designCanvasRef.current) {
        try {
          textureImage = await designCanvasRef.current.toDataURL();
        } catch (e) {
          console.error("Failed to generate texture:", e);
        }
      }

      const response = await fetch(`/api/kids/${kidId}/designs`, {
        method: currentDesignId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDesignId,
          templateId: selectedTemplate.id,
          name: designName.trim(),
          regions,
          textureImage, // Send base64 image to API
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

  const handleStartNew = () => {
    setView('create');
    setCurrentDesignId(undefined);
    setDesignName('');
    setRegions({});
    // Reset to first available template
    if (starterTemplates[0]) {
      setSelectedTemplate(starterTemplates[0]);
    }
  };

  const loadDesign = (design: ItemDesignRow) => {
    // Find the template
    const template = templates.categories
      .flatMap(c => c.templates)
      .find(t => t.id === design.template_id);
    
    if (!template) {
      toast.error('Template not found for this design');
      return;
    }

    setView('create');
    setSelectedTemplate(template);
    setCurrentDesignId(design.id);
    setDesignName(design.name);
    setRegions(design.design_data.regions);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href={`/kids/${kidId}/avatar`}
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] transition-colors"
          >
            <ArrowLeft size={24} className="text-muted" />
          </Link>
          <h1 className="text-2xl font-bold text-heading">
            🎨 Design Studio
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)]"
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

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] p-1 rounded-xl flex gap-1">
          <button
            onClick={handleStartNew}
            className={`
              px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${view === 'create'
                ? 'bg-white dark:bg-[var(--background-secondary)] shadow-sm text-heading'
                : 'text-muted hover:text-heading dark:hover:text-muted'
              }
            `}
          >
            <Pencil size={18} />
            Create New
          </button>
          <button
            onClick={() => setView('wardrobe')}
            className={`
              px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${view === 'wardrobe'
                ? 'bg-white dark:bg-[var(--background-secondary)] shadow-sm text-heading'
                : 'text-muted hover:text-heading dark:hover:text-muted'
              }
            `}
          >
            <TShirt size={18} />
            My Wardrobe
          </button>
        </div>
      </div>

      {view === 'wardrobe' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {initialDesigns.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted">
              <p>You haven't designed anything yet!</p>
              <button 
                onClick={handleStartNew}
                className="mt-4 text-[var(--ember-500)] hover:underline"
              >
                Start your first design
              </button>
            </div>
          ) : (
            initialDesigns.map(design => {
              // Find template info for icon
              const tmpl = templates.categories
                  .flatMap(c => c.templates)
                  .find(t => t.id === design.template_id);
              
              return (
                <button
                  key={design.id}
                  onClick={() => loadDesign(design)}
                  className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)] hover:border-[var(--ember-300)] transition-all text-left group"
                >
                  <div className="aspect-square bg-[var(--background-secondary)] dark:bg-[var(--night-900)] rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder preview - in future use actual thumbnail */}
                    <div className="text-4xl opacity-50 grayscale group-hover:grayscale-0 transition-all duration-300">
                       {/* Try to find category icon */}
                       {templates.categories.find(c => c.templates.some(t => t.id === design.template_id))?.icon || '👕'}
                    </div>
                    {tmpl && <span className="absolute bottom-1 right-1 text-xs text-muted">{tmpl.label}</span>}
                  </div>
                  <h3 className="font-semibold text-heading truncate">
                    {design.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {new Date(design.created_at).toLocaleDateString()}
                  </p>
                </button>
            )})
          )}
        </div>
      ) : (
        <>
          {/* Design Name Input */}
          <div>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Name your design..."
              className="w-full px-4 py-2 text-lg border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--ember-300)] focus:border-transparent bg-[var(--background-elevated)] text-heading"
            />
            <p className="text-sm text-muted mt-1">
              💡 Give your design a name to save it to your wardrobe
            </p>
          </div>

          {/* Template Selector */}
          <div className="bg-[var(--background-elevated)] rounded-xl p-4 border border-[var(--border)]">
            <h3 className="text-sm font-medium text-muted mb-3">
              Choose what to design
            </h3>
            <div className="flex flex-wrap gap-2">
              {templates.categories.map(category => (
                <div key={category.id} className="flex gap-2 p-1 bg-[var(--background-secondary)] bg-[var(--background)] rounded-lg">
                  {category.templates.map(template => {
                    const isUnlocked = template.unlocked || unlockedTemplateIds.includes(template.id);
                    const isSelected = selectedTemplate?.id === template.id;
                    
                    if (!isUnlocked) {
                      return (
                        <div
                          key={template.id}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-muted flex items-center gap-2 cursor-not-allowed border border-transparent"
                          title={`Unlock ${template.label} in the Moon Shop!`}
                        >
                          <Lock size={14} />
                          {template.label}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          // Reset if switching templates for a NEW design
                          if (!currentDesignId) {
                            setRegions({}); 
                          } else {
                            // If editing, warn or handle?
                            // For MVP, switching template while editing effectively starts a new design on that template
                            setCurrentDesignId(undefined); 
                            setDesignName('');
                            setRegions({});
                          }
                        }}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${isSelected
                            ? 'bg-[var(--ember-500)] text-white shadow-sm'
                            : 'bg-[var(--background-elevated)] text-heading dark:text-muted hover:bg-[var(--hover-overlay)] border border-[var(--border)]'
                          }
                        `}
                      >
                        {category.icon} {template.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Canvas Area */}
            <div className="md:col-span-2 relative">
              {showPreview && (
                <div className="absolute inset-0 z-10 bg-white/95 dark:bg-[var(--night-900)]/95 backdrop-blur-sm rounded-xl flex items-center justify-center border border-[var(--border)] p-6">
                  <div className="text-center flex flex-col items-center">
                    <div className="w-48 h-64 mb-4 rounded-xl overflow-hidden border border-[var(--border)] bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                      <SyntyAvatarPreview 
                        kidId="preview"
                        textureUrl={previewTexture || undefined}
                        skinColor="#f2d3b1"
                      />
                    </div>
                    <p className="text-sm text-muted max-w-xs mx-auto">
                      Previewing your design on the 3D character.
                    </p>
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              )}

              {selectedTemplate ? (
                <DesignCanvas
                  ref={designCanvasRef}
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
                <div className="aspect-square flex items-center justify-center bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] rounded-xl">
                  <p className="text-muted">
                    Select a template to start designing
                  </p>
                </div>
              )}
            </div>

            {/* Tools Panel */}
            <div className="space-y-4">
              {/* Tool Selection */}
              <div className="bg-[var(--background-elevated)] rounded-xl p-4 border border-[var(--border)]">
                <h3 className="text-sm font-medium text-muted mb-3">
                  Tools
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTool('fill')}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                      ${tool === 'fill'
                        ? 'bg-[var(--ember-100)] text-[var(--ember-600)] ring-2 ring-[var(--ember-300)]'
                        : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]'
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
                        : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]'
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
                        : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]'
                      }
                    `}
                  >
                    <Eraser size={24} />
                    <span className="text-xs font-medium">Erase</span>
                  </button>
                </div>
              </div>

              {/* Color Palette */}
              <div className="bg-[var(--background-elevated)] rounded-xl p-4 border border-[var(--border)]">
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
                <div className="bg-[var(--background-elevated)] rounded-xl p-4 border border-[var(--border)]">
                  <h3 className="text-sm font-medium text-muted mb-2">
                    Selected Area
                  </h3>
                  <p className="text-lg font-semibold text-heading capitalize">
                    {activeRegion.replace(/-/g, ' ')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleUndo}
                      className="flex-1 px-3 py-1.5 text-sm bg-[var(--background-secondary)] rounded-lg hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]"
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
        </>
      )}
    </div>
  );
}
