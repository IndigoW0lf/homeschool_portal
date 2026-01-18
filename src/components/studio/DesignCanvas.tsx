'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DesignTemplate, DesignRegion, StrokeData } from '@/types/design-studio';

interface DesignCanvasProps {
  template: DesignTemplate;
  regions: Record<string, DesignRegion>;
  activeRegion: string | null;
  tool: 'fill' | 'draw' | 'eraser';
  currentColor: string;
  brushSize: number;
  onRegionClick: (regionId: string) => void;
  onRegionFill: (regionId: string, color: string) => void;
  onStrokeComplete: (stroke: StrokeData) => void;
}

export function DesignCanvas({
  template,
  regions,
  tool,
  currentColor,
  brushSize,
  onRegionClick,
  onRegionFill,
  onStrokeComplete,
}: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [svgContent, setSvgContent] = useState<string>('');

  // Load and process SVG template
  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(template.src);
        let svg = await response.text();
        
        // Apply region fill colors from state
        Object.entries(regions).forEach(([regionId, region]) => {
          // Replace fill color for each region
          const fillRegex = new RegExp(`(id="${regionId}"[^>]*fill=")([^"]*)(")`, 'g');
          svg = svg.replace(fillRegex, `$1${region.fillColor}$3`);
        });
        
        setSvgContent(svg);
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
    if (tool !== 'fill') return;
    
    const target = e.target as SVGElement;
    const regionId = target.id;
    
    if (regionId && template.regions.includes(regionId)) {
      if (tool === 'fill') {
        onRegionFill(regionId, currentColor);
      }
      onRegionClick(regionId);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-[var(--paper-100)] rounded-xl overflow-hidden aspect-square max-w-md mx-auto border-2 border-gray-200 dark:border-gray-700"
    >
      {/* SVG Template Layer */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={handleSvgClick}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{ pointerEvents: tool === 'fill' ? 'auto' : 'none' }}
      />
      
      {/* Drawing Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="absolute inset-0 w-full h-full"
        style={{ 
          touchAction: 'none',
          pointerEvents: tool === 'draw' ? 'auto' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      
      {/* Tool indicator */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded capitalize">
        {tool} Mode
      </div>
    </div>
  );
}
