'use client';

import { useMemo } from 'react';

interface LifeSkillsChartProps {
  completedItems: Array<{ type: string }>;
}

// The 6 life skills categories
const LIFE_SKILLS_CATEGORIES = [
  { key: 'Self & Mind', color: '#8b5cf6', description: 'Psychology, mindset, emotional regulation' },
  { key: 'Thinking & Truth', color: '#0ea5e9', description: 'Critical thinking, logic, media literacy' },
  { key: 'Agency & Responsibility', color: '#f59e0b', description: 'Locus of control, habits, accountability' },
  { key: 'Relationships & Community', color: '#ec4899', description: 'Communication, conflict, empathy' },
  { key: 'Body & Nervous System', color: '#10b981', description: 'Health, stress, movement, sleep' },
  { key: 'Systems & Society', color: '#6366f1', description: 'Economics, institutions, power, ethics' },
];

export function LifeSkillsChart({ completedItems }: LifeSkillsChartProps) {
  // Count completions by life skills category
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    LIFE_SKILLS_CATEGORIES.forEach(cat => counts[cat.key] = 0);
    
    completedItems.forEach(item => {
      const category = LIFE_SKILLS_CATEGORIES.find(c => c.key === item.type);
      if (category) {
        counts[category.key]++;
      }
    });
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    return LIFE_SKILLS_CATEGORIES.map(cat => ({
      ...cat,
      count: counts[cat.key],
      percentage: total > 0 ? Math.round((counts[cat.key] / total) * 100) : 0
    }));
  }, [completedItems]);

  const total = categoryData.reduce((acc, cat) => acc + cat.count, 0);
  
  // Calculate pie chart segments
  const segments = useMemo(() => {
    let currentAngle = -90; // Start from top
    return categoryData.map(cat => {
      const angle = total > 0 ? (cat.count / total) * 360 : 0;
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...cat, startAngle, angle };
    }).filter(s => s.angle > 0);
  }, [categoryData, total]);

  // Convert angle to path
  const getArcPath = (startAngle: number, angle: number, radius: number) => {
    const start = polarToCartesian(50, 50, radius, startAngle);
    const end = polarToCartesian(50, 50, radius, startAngle + angle);
    const largeArc = angle > 180 ? 1 : 0;
    return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No life skills activities completed yet.</p>
        <p className="text-xs mt-1">Assign lessons with these categories to track them!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center">
      {/* Pie Chart */}
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-40 h-40">
          {segments.map((seg, i) => (
            <path
              key={seg.key}
              d={getArcPath(seg.startAngle, seg.angle, 45)}
              fill={seg.color}
              className="transition-all hover:opacity-80"
            />
          ))}
          {/* Center circle */}
          <circle cx="50" cy="50" r="25" className="fill-white dark:fill-gray-800" />
          <text x="50" y="48" textAnchor="middle" className="fill-gray-900 dark:fill-white text-xs font-bold">
            {total}
          </text>
          <text x="50" y="56" textAnchor="middle" className="fill-gray-500 text-[6px]">
            items
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {categoryData.map(cat => (
          <div key={cat.key} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {cat.key}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {cat.count}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
