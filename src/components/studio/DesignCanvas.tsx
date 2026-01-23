'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DesignTemplate, DesignRegion, StrokeData } from '@/types/design-studio';

export interface DesignCanvasRef {
  toDataURL: () => Promise<string>;
}

interface DesignCanvasProps {
  template: DesignTemplate;
  regions: Record<string, DesignRegion>;
  activeRegion: string | null;
  tool: 'fill' | 'draw' | 'eraser';
  currentColor: string;
  brushSize: number;
  onRegionClick?: (regionId: string) => void;
  onRegionFill?: (regionId: string, color: string) => void;
  onStrokeComplete?: (stroke: StrokeData) => void;
  readonly?: boolean;
  transparent?: boolean;
}

export const DesignCanvas = forwardRef<DesignCanvasRef, DesignCanvasProps>(({
  template,
  regions,
  tool,
  currentColor,
  brushSize,
  onRegionClick = () => {},
  onRegionFill = () => {},
  onStrokeComplete = () => {},
  readonly = false,
  transparent = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [svgContent, setSvgContent] = useState<string>('');

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      // Create a temporary canvas to combine SVG and Drawing layers
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400; // Match standard size
      tempCanvas.height = 400;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return Promise.resolve('');

      // Draw background if not transparent
      if (!transparent) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }

      // Draw SVG (Regions)
      // This is tricky because we have SVG string. We can try submitting the SVG to the canvas context?
      // Or cleaner: since we need a texture for Unity, we just need the composite image.
      // Standard way: draw the DOM image of the SVG.
      
      return new Promise<string>((resolve) => {
        const img = new Image();
        // Use the current SVG content which has the fills applied
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 400, 400); // Scale to fit
          URL.revokeObjectURL(url);
          
          // Draw the strokes (Drawing Layer) on top
          if (canvasRef.current) {
            ctx.drawImage(canvasRef.current, 0, 0, 400, 400);
          }
          
          resolve(tempCanvas.toDataURL('image/png'));
        };
        img.src = url;
      });
    }
  }));

  // But accessing ref function synchronously might be expected to return string
  // If we need async, we should change interface. 
  // DesignCanvasRef.toDataURL needs to return Promise<string> actually for the image load.
  // Let's adjust interface.

  // Load and process SVG template
  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(template.src);
        let svgText = await response.text();
        
        // Apply region fill colors from state
        // Only apply if the color has been changed from default (don't overwrite original SVG colors)
        Object.entries(regions).forEach(([regionId, region]) => {
          // Skip applying default gray - preserve original SVG colors
          if (region.fillColor === '#E5E5E5') {
            return;
          }
          
          // Robust regex to find the element by ID and update/add fill attribute
          // Handles both existing fill attributes and elements without fill
          const idRegex = new RegExp(`id="${regionId}"[^>]*>`, 'g');
          svgText = svgText.replace(idRegex, (match) => {
            if (match.includes('fill=')) {
              return match.replace(/fill="[^"]*"/, `fill="${region.fillColor}"`);
            } else {
              // Handle self-closing tags
              if (match.endsWith('/>')) {
                return match.replace(/\/>$/, ` fill="${region.fillColor}" />`);
              }
              return match.replace(/>$/, ` fill="${region.fillColor}">`);
            }
          });
        });
        
        setSvgContent(svgText);
      } catch (error) {
        console.error('Failed to load SVG template:', error);
      }
    };
    
    loadSvg();
  }, [template.src, regions]);

  // Redraw strokes when regions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes from all regions
    Object.values(regions).forEach(region => {
      region.strokes.forEach(stroke => {
        drawStroke(ctx, stroke);
      });
    });
  }, [regions]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: StrokeData) => {
    if (stroke.points.length < 2) return;
    
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    
    ctx.stroke();
  };

  const getCanvasPoint = useCallback((e: React.PointerEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (tool !== 'draw') return;
    
    e.preventDefault();
    setIsDrawing(true);
    
    const point = getCanvasPoint(e);
    if (point) {
      setCurrentStroke([point]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || tool !== 'draw') return;
    
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;
    
    setCurrentStroke(prev => [...prev, point]);
    
    // Draw current stroke in real-time
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && currentStroke.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }
    
    const stroke: StrokeData = {
      id: `stroke-${Date.now()}`,
      points: currentStroke,
      color: currentColor,
      width: brushSize,
      timestamp: Date.now(),
    };
    
    onStrokeComplete(stroke);
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'fill' && tool !== 'eraser') return;
    
    const target = e.target as SVGElement;
    const regionId = target.id;
    
    if (regionId && (template.regions?.includes(regionId) || template.parts?.some(p => p.name === regionId))) {
      if (tool === 'fill') {
        onRegionFill(regionId, currentColor);
      } else if (tool === 'eraser') {
        // Reset region to default gray
        onRegionFill(regionId, '#E5E5E5');
      }
      onRegionClick(regionId);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        relative overflow-hidden aspect-square max-w-md mx-auto
        ${transparent ? '' : 'bg-[var(--paper-100)] rounded-xl border-2 border-[var(--border)]'}
      `}
    >
      {/* SVG Template Layer */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(e) => !readonly && handleSvgClick(e)}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{ pointerEvents: !readonly && tool === 'fill' ? 'auto' : 'none' }}
      />
      
      {/* Drawing Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="absolute inset-0 w-full h-full"
        style={{ 
          touchAction: 'none',
          pointerEvents: !readonly && tool === 'draw' ? 'auto' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      
      {/* Tool indicator */}
      {!readonly && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded capitalize">
          {tool} Mode
        </div>
      )}
    </div>
  );
});
DesignCanvas.displayName = 'DesignCanvas';
