'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  DesignTemplate, 
  DesignTemplatesManifest,
  DESIGN_COLOR_PALETTE,
  BRUSH_SIZES,
  ItemDesignRow
} from '@/types/design-studio';
import { DesignCanvas, DesignCanvasRef } from './DesignCanvas';
import { ColorPalette } from './ColorPalette';
import { PaintBucket, Pencil, Eraser, ArrowLeft, FloppyDisk, Eye, Lock, TShirt, ArrowUUpLeft, ArrowUUpRight, Trash, Crown } from '@phosphor-icons/react';
import { getTierLimits, getNextTierInfo, canSaveDesign, isToolAvailable } from '@/lib/avatar/tier-limits';
import { TierUpgradeModal } from './TierUpgradeModal';
import { LockedFeatureBadge } from './LockedFeatureBadge';

interface DesignStudioProps {
  kidId: string;
  templates: DesignTemplatesManifest;
  existingDesigns?: any; // Legacy prop, unused in new pixel flow
  designId?: string; // If editing
  unlockedTemplateIds?: string[];
  initialDesigns?: ItemDesignRow[];
  currentTier: 1 | 2 | 3 | 4;
  moonBalance: number;
}

type Tool = 'fill' | 'draw' | 'eraser' | 'paintbucket';
type ViewMode = 'create' | 'wardrobe';

export function DesignStudio({ 
  kidId, 
  templates, 
  designId: initialDesignId,
  unlockedTemplateIds = [],
  initialDesigns = [],
  currentTier,
  moonBalance: initialMoonBalance
}: DesignStudioProps) {
  // Get starter templates (unlocked ones)
  const starterTemplates = templates.categories.flatMap(cat => 
    cat.templates.filter(t => t.unlocked)
  );
  
  const designCanvasRef = useRef<DesignCanvasRef>(null);
  
  // Tier system state
  const tierLimits = getTierLimits(currentTier);
  const nextTierInfo = getNextTierInfo(currentTier);
  const [moonBalance, setMoonBalance] = useState(initialMoonBalance);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [view, setView] = useState<ViewMode>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(
    starterTemplates[0] || null
  );
  const [currentDesignId, setCurrentDesignId] = useState<string | undefined>(initialDesignId);

  const [tool, setTool] = useState<Tool>('paintbucket');
  const [currentColor, setCurrentColor] = useState(DESIGN_COLOR_PALETTE[0].value);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
  
  const [designName, setDesignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTexture, setPreviewTexture] = useState<string | null>(null);
  const [initialPaintData, setInitialPaintData] = useState<string | undefined>(undefined);

  // Update preview texture when preview is opened
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
      
      const timer = setTimeout(updateTexture, 100);
      return () => clearTimeout(timer);
    }
  }, [showPreview]);

  // Load design logic
  useEffect(() => {
    if (initialDesignId) {
        // Find design in initialDesigns if possible, or fetch?
        // For now assume passed in via Props mostly or state management.
        // If passed via URL, page loads existingDesigns.
    }
  }, [initialDesignId]);


  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!designName.trim()) {
      toast.error('Please give your design a name!');
      return;
    }
    
    // Check tier limits before saving new designs (not updates)
    if (!currentDesignId) {
      const canSave = canSaveDesign(currentTier, initialDesigns.length);
      if (!canSave) {
        toast.error(`Design limit reached! Upgrade to ${nextTierInfo.limits?.name} to save more.`);
        setShowUpgradeModal(true);
        return;
      }
    }
    
    setIsSaving(true);
    try {
      let textureImage: string | undefined;
      let paintData: string | undefined;
      
      if (designCanvasRef.current) {
        try {
          textureImage = await designCanvasRef.current.toDataURL(); // Full composite
          paintData = designCanvasRef.current.toPaintDataURL(); // Just paint layer
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
          regions: {}, // Legacy compat: Empty regions
          design_data: { paintData }, // New storage for paint layer
          textureImage,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Design limit reached') {
          toast.error(`Can't save more! Upgrade to save up to ${errorData.limit} designs.`);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(errorData.error || 'Failed to save design');
      }
      
      toast.success('Design saved! ✨');
      // Refresh page to update design list
      window.location.reload();
    } catch (error) {
      console.error('Failed to save design:', error);
      toast.error('Could not save design. Try again?');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNew = () => {
    setView('create');
    setCurrentDesignId(undefined);
    setDesignName('');
    setInitialPaintData(undefined);
    designCanvasRef.current?.clear();
    
    // Reset to first available template
    if (starterTemplates[0]) {
      setSelectedTemplate(starterTemplates[0]);
    }
  };

  const loadDesign = (design: ItemDesignRow) => {
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
    
    // Load paint data if available
    const paintData = design.design_data?.paintData;
    setInitialPaintData(paintData); // DesignCanvas will pick this up on remount/update
    
    // If we switch template, DesignCanvas remounts/updates
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
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] text-[var(--foreground)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
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
                ? 'bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] shadow-sm text-heading'
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
                ? 'bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] shadow-sm text-heading'
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
                    {/* Use updated texture if available, or placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                         {/* We don't have texture saved in item row by default unless we updated types. 
                             Assuming we pass it or it's fetched? 
                             The `ItemDesignRow` has `preview_url`. Use that.
                         */}
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         {design.preview_url ? (
                             <img src={design.preview_url} alt={design.name} className="w-full h-full object-contain" />
                         ) : (
                             <span className="text-4xl opacity-50">👕</span>
                         )}
                    </div>
                    {tmpl && <span className="absolute bottom-1 right-1 text-xs text-muted bg-white/50 px-1 rounded">{tmpl.label}</span>}
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
          </div>

          {/* Template Selector */}
          <div className="bg-[var(--background-elevated)] rounded-xl p-4 border border-[var(--border)]">
            <h3 className="text-sm font-medium text-muted mb-3">
              Choose template
            </h3>
            <div className="flex flex-wrap gap-2">
              {templates.categories.map(category => (
                <div key={category.id} className="flex gap-2 p-1 bg-[var(--background-secondary)] rounded-lg">
                  {category.templates.map(template => {
                    const isUnlocked = template.unlocked || unlockedTemplateIds.includes(template.id);
                    const isSelected = selectedTemplate?.id === template.id;
                    
                    if (!isUnlocked) {
                      return (
                        <div
                          key={template.id}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--background-secondary)] text-muted flex items-center gap-2 cursor-not-allowed border border-transparent"
                          title={`Unlock in Shop!`}
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
                          if (!currentDesignId) {
                            setInitialPaintData(undefined); // Reset canvas for new template
                          } else {
                            // If switching templates while editing, treat as reset
                            setCurrentDesignId(undefined); 
                            setDesignName('');
                            setInitialPaintData(undefined);
                          }
                        }}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${isSelected
                            ? 'bg-[var(--ember-500)] text-[var(--foreground)] shadow-sm'
                            : 'bg-[var(--background-elevated)] text-heading hover:bg-[var(--hover-overlay)] border border-[var(--border)]'
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
                <div className="absolute inset-0 z-10 bg-[var(--background-elevated)]/95 dark:bg-[var(--night-900)]/95 backdrop-blur-sm rounded-xl flex items-center justify-center border border-[var(--border)] p-6">
                  <div className="text-center flex flex-col items-center">
                    <div className="w-48 h-64 mb-4 rounded-xl overflow-hidden border border-[var(--border)] bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      {previewTexture ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={previewTexture} alt="Design preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-4xl">👕</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="mt-4 px-6 py-2 bg-[var(--celestial-500)] text-[var(--foreground)] rounded-lg hover:bg-[var(--celestial-600)] transition-colors font-medium text-sm"
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
                  tool={tool}
                  currentColor={currentColor}
                  brushSize={brushSize}
                  initialPaintData={initialPaintData as string} // Fix type mapping if needed
                />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-[var(--background-secondary)] rounded-xl">
                  <p className="text-muted">Select a template</p>
                </div>
              )}
              
              {/* Canvas Controls (Undo/Redo) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-[var(--background-elevated)] p-2 rounded-lg shadow-sm border border-[var(--border)]">
                 <button 
                   onClick={() => designCanvasRef.current?.undo()}
                   className="p-2 hover:bg-[var(--background-secondary)] rounded text-muted hover:text-heading"
                   title="Undo"
                 >
                   <ArrowUUpLeft size={20} />
                 </button>
                 <button 
                   onClick={() => designCanvasRef.current?.redo()}
                   className="p-2 hover:bg-[var(--background-secondary)] rounded text-muted hover:text-heading"
                   title="Redo"
                 >
                   <ArrowUUpRight size={20} />
                 </button>
                 <div className="w-px bg-[var(--border)] mx-1" />
                 <button 
                   onClick={() => designCanvasRef.current?.clear()}
                   className="p-2 hover:bg-red-50 text-red-400 hover:text-red-500 rounded"
                   title="Clear All"
                 >
                   <Trash size={20} />
                 </button>
              </div>
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
                    onClick={() => setTool('paintbucket')}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                      ${tool === 'paintbucket'
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
                  showBrushSize={tool === 'draw' || tool === 'eraser'}
                />
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Tier Upgrade Modal */}
      <TierUpgradeModal
       isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        kidId={kidId}
        currentTier={currentTier}
        nextTier={nextTierInfo.nextTier}
        nextTierLimits={nextTierInfo.limits}
        moonCost={nextTierInfo.cost}
        currentMoonBalance={moonBalance}
        onUpgradeSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
