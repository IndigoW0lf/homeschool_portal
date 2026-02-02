'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DesignTemplate } from '@/types/design-studio';
import { floodFill, hexToRgba } from '@/utils/floodFill';

export interface DesignCanvasRef {
  toDataURL: () => Promise<string>;
  toPaintDataURL: () => string; // Export just the paint layer
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

interface DesignCanvasProps {
  template: DesignTemplate;
  tool: 'fill' | 'draw' | 'eraser' | 'paintbucket';
  currentColor: string;
  brushSize: number;
  initialPaintData?: string; // Load existing paint
  readonly?: boolean;
  transparent?: boolean;
}

export const DesignCanvas = forwardRef<DesignCanvasRef, DesignCanvasProps>(({
  template,
  tool,
  currentColor,
  brushSize,
  initialPaintData,
  readonly = false,
  transparent = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Layer contents
  const [baseSvgContent, setBaseSvgContent] = useState<string>('');
  const [inkSvgContent, setInkSvgContent] = useState<string>('');
  
  // Image cache for flood fill detection
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);

  // History for undo/redo (Canvas Image Data)
  const historyStack = useRef<ImageData[]>([]);
  const historyPointer = useRef<number>(-1);

  // Initialize canvas with blank state or handle resize
  useEffect(() => {
    const canvas = paintCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx && historyStack.current.length === 0) {
        if (initialPaintData) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, 400, 400); // Scale to fit
            saveState();
          };
          img.src = initialPaintData;
        } else {
          saveState();
        }
      }
    }
  }, [initialPaintData]);

  const saveState = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Truncate future if we are in middle of stack
    if (historyPointer.current < historyStack.current.length - 1) {
      historyStack.current = historyStack.current.slice(0, historyPointer.current + 1);
    }

    // Save
    historyStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyPointer.current++;
  };

  useImperativeHandle(ref, () => ({
    toDataURL: async () => {
      // Create composite for export
      // Order: Base -> Paint -> Ink
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 400;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return '';

      // 1. Draw Base (from template image if separated, or just draw white background?)
      // Actually we need the Base SVG rendered. 
      // Simplified export: Grab current visual composite from DOM? No, unsafe.
      // Re-render layers.
      
      // If we have separated Base SVG content:
      if (baseSvgContent) {
        const baseImg = await loadImageFromSvg(baseSvgContent);
        ctx.drawImage(baseImg, 0, 0, 400, 400);
      }

      // 2. Draw Paint
      if (paintCanvasRef.current) {
        ctx.drawImage(paintCanvasRef.current, 0, 0, 400, 400);
      }

      // 3. Draw Ink
      if (inkSvgContent) {
        const inkImg = await loadImageFromSvg(inkSvgContent);
        ctx.drawImage(inkImg, 0, 0, 400, 400);
      }

      return tempCanvas.toDataURL('image/png');
    },
    toPaintDataURL: () => {
      if (paintCanvasRef.current) {
        return paintCanvasRef.current.toDataURL('image/png');
      }
      return '';
    },
    undo: () => {
      if (historyPointer.current > 0) {
        historyPointer.current--;
        restoreState();
      }
    },
    redo: () => {
      if (historyPointer.current < historyStack.current.length - 1) {
        historyPointer.current++;
        restoreState();
      }
    },
    clear: () => {
        const canvas = paintCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            saveState();
        }
    }
  }));

  const restoreState = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = historyStack.current[historyPointer.current];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  };

  const loadImageFromSvg = (svgString: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    });
  };

  // Load and split SVG
  useEffect(() => {
    const loadAndProcessSvg = async () => {
      try {
        const response = await fetch(template.src);
        const svgText = await response.text();
        
        // 1. Create Base SVG (Remove Ink)
        // Find Ink Group or Path -> usually id="🖍-Ink" or similar
        // We can hide it using CSS in the SVG or remove the node.
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        
        // Logic: Find Ink node. clone doc. remove ink from doc1 (Base). remove BG from doc2 (Ink).
        
        // Prepare Base Layer (No Ink)
        const baseDoc = doc.cloneNode(true) as Document;
        const inkInBase = baseDoc.getElementById('🖍-Ink') || baseDoc.querySelector('[id*="Ink"]');
        if (inkInBase && inkInBase.parentNode) {
            inkInBase.parentNode.removeChild(inkInBase);
        }
        setBaseSvgContent(new XMLSerializer().serializeToString(baseDoc));

        // Prepare Ink Layer (No Background)
        const inkDoc = doc.cloneNode(true) as Document;
        const bgInInk = inkDoc.getElementById('🎨-Background') || inkDoc.querySelector('[id*="Background"]');
        if (bgInInk && bgInInk.parentNode) {
            bgInInk.parentNode.removeChild(bgInInk);
        }
        // Also remove any other fills?? Usually just Background is fine.
        setInkSvgContent(new XMLSerializer().serializeToString(inkDoc));

        // Prepare composite image for detection (Original SVG)
        // We can just use the fetched text
        loadImageFromSvg(svgText).then(setTemplateImage);

      } catch (e) {
        console.error('Failed to load SVG layer:', e);
      }
    };
    loadAndProcessSvg();
  }, [template.src]);

  // Handle Drawing / Pointers
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<{ x: number, y: number } | null>(null);

  const getCanvasPoint = (e: React.PointerEvent) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readonly) return;
    
    // Handle Paint Bucket
    if (tool === 'paintbucket') {
      handlePaintBucket(e);
      return;
    }

    // Handle Draw/Eraser
    if (tool === 'draw' || tool === 'eraser') {
      setIsDrawing(true);
      const point = getCanvasPoint(e);
      lastPoint.current = point;
      
      // Draw single dot
      drawStroke(point, point);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    if (lastPoint.current) {
      drawStroke(lastPoint.current, point);
    }
    lastPoint.current = point;
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPoint.current = null;
      saveState(); // Save after stroke
    }
  };

  const drawStroke = (start: {x:number, y:number}, end: {x:number, y:number}) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'; // Erase alpha
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }
    
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over'; // Reset
  };

  const handlePaintBucket = (e: React.PointerEvent) => {
    const canvas = paintCanvasRef.current;
    if (!canvas || !templateImage) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const point = getCanvasPoint(e);
    const startX = Math.floor(point.x);
    const startY = Math.floor(point.y);

    // 1. Create a composite buffer for detection (Template + Current Paint)
    const cw = canvas.width;
    const ch = canvas.height;
    
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = cw;
    compositeCanvas.height = ch;
    const compCtx = compositeCanvas.getContext('2d', { willReadFrequently: true });
    if (!compCtx) return;

    // Draw Template (White BG + Ink)
    compCtx.drawImage(templateImage, 0, 0, cw, ch);
    // Draw Current Paint on top
    compCtx.drawImage(canvas, 0, 0, cw, ch);

    const readData = compCtx.getImageData(0, 0, cw, ch);
    
    // 2. Prepare write buffer (Current Paint)
    const writeData = ctx.getImageData(0, 0, cw, ch);

    // 3. Flood Fill
    const fillColorRgba = hexToRgba(currentColor);
    
    // If using Eraser as fill (clear area), mode is different. assuming just Paint Bucket fills color.
    // If fill color is transparent/eraser, handle separately? For now assume opaque fill.
    
    floodFill(readData, startX, startY, fillColorRgba, 40 /* tolerance */, writeData);

    // 4. Write back
    ctx.putImageData(writeData, 0, 0);
    saveState();
  };

  return (
    <div 
      ref={containerRef}
      className={`
        relative overflow-hidden aspect-square max-w-md mx-auto
        ${transparent ? '' : 'bg-[var(--paper-100)] rounded-xl border-2 border-[var(--border)]'}
      `}
    >
      {/* 1. Base Layer (Background Fill) */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
        dangerouslySetInnerHTML={{ __html: baseSvgContent }}
      />
      
      {/* 2. Paint Canvas Layer (Interactive) */}
      <canvas
        ref={paintCanvasRef}
        width={400}
        height={400}
        className="absolute inset-0 w-full h-full"
        style={{ 
          touchAction: 'none',
          cursor: tool === 'paintbucket' ? 'crosshair' : 'default'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* 3. Ink Layer (Outlines - Top) */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
        dangerouslySetInnerHTML={{ __html: inkSvgContent }}
      />
    </div>
  );
});

DesignCanvas.displayName = 'DesignCanvas';
