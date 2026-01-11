'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightning, Play, Clock, Shuffle, CaretDown, CaretUp, Sparkle, CheckCircle, CalendarBlank, Palette, Books, MagnifyingGlass, PersonSimpleRun } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { QuickStartTemplate, QUICK_START_TEMPLATES, getRandomTemplate, DAILY_LINEUP_SUGGESTION } from '@/lib/templates/quick-start';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickStartPanelProps {
  kids: { id: string; name: string }[];
  onSchedule?: (template: QuickStartTemplate, kidId: string) => Promise<void>;
  compact?: boolean;
}

type CategoryFilter = 'all' | 'daily' | 'creative' | 'academic' | 'exploration' | 'movement';

const CATEGORY_CONFIG: Record<CategoryFilter, { label: string; Icon: Icon }> = {
  all: { label: 'All', Icon: Sparkle },
  daily: { label: 'Daily', Icon: CalendarBlank },
  creative: { label: 'Creative', Icon: Palette },
  academic: { label: 'Academic', Icon: Books },
  exploration: { label: 'Exploration', Icon: MagnifyingGlass },
  movement: { label: 'Movement', Icon: PersonSimpleRun },
};

export function QuickStartPanel({ kids, onSchedule, compact = false }: QuickStartPanelProps) {
  const router = useRouter();
  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || '');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<Set<string>>(new Set());

  const filteredTemplates = category === 'all' 
    ? QUICK_START_TEMPLATES 
    : QUICK_START_TEMPLATES.filter(t => t.category === category);

  const handleQuickSchedule = async (template: QuickStartTemplate) => {
    if (!selectedKid) {
      toast.error('Please select a child first');
      return;
    }

    setSchedulingId(template.id);
    try {
      if (onSchedule) {
        await onSchedule(template, selectedKid);
      } else {
        // Default: Navigate to form with pre-filled data
        const prefillData = template.type === 'lesson' 
          ? { type: 'lesson', data: template.lessonData }
          : { type: 'assignment', data: template.assignmentData };
        
        sessionStorage.setItem('luna-prefill', JSON.stringify(prefillData));
        sessionStorage.setItem('quickstart-assign', selectedKid);
        
        router.push(`/parent/${template.type === 'lesson' ? 'lessons' : 'assignments'}?from=quickstart`);
        return;
      }
      
      setScheduled(prev => new Set([...prev, template.id]));
      toast.success(`Added "${template.title}" to today's schedule!`);
    } catch (err) {
      console.error('Schedule error:', err);
      toast.error('Could not schedule - try again');
    } finally {
      setSchedulingId(null);
    }
  };

  const handleSurpriseMe = () => {
    const template = getRandomTemplate();
    handleQuickSchedule(template);
  };

  const handleDailyLineup = async () => {
    const lineup = DAILY_LINEUP_SUGGESTION.map(id => 
      QUICK_START_TEMPLATES.find(t => t.id === id)!
    ).filter(Boolean);

    for (const template of lineup) {
      await handleQuickSchedule(template);
    }
  };

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Lightning size={20} weight="fill" className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Quick Start</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">One-click lesson starters</p>
            </div>
          </div>
          <CaretDown size={20} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Lightning size={20} weight="fill" className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Quick Start</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">One-click lesson starters</p>
            </div>
          </div>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CaretUp size={18} />
            </button>
          )}
        </div>

        {/* Kid selector */}
        {kids.length > 1 && (
          <div className="mt-3">
            <select
              value={selectedKid}
              onChange={(e) => setSelectedKid(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {kids.map(kid => (
                <option key={kid.id} value={kid.id}>{kid.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSurpriseMe}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Shuffle size={16} />
            Surprise Me!
          </button>
          <button
            onClick={handleDailyLineup}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Sparkle size={16} />
            Daily Lineup
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 p-2 overflow-x-auto border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {(Object.keys(CATEGORY_CONFIG) as CategoryFilter[]).map(cat => {
          const config = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1",
                category === cat
                  ? "bg-purple-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <config.Icon size={12} weight="bold" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Templates grid */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
        {filteredTemplates.map(template => {
          const isScheduling = schedulingId === template.id;
          const isScheduled = scheduled.has(template.id);
          
          return (
            <button
              key={template.id}
              onClick={() => !isScheduled && handleQuickSchedule(template)}
              disabled={isScheduling || isScheduled}
              className={cn(
                "flex items-center gap-3 p-3 text-left rounded-lg border transition-all",
                isScheduled
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm",
                isScheduling && "opacity-50"
              )}
            >
              <span className="text-2xl flex-shrink-0">{template.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {template.title}
                  </h4>
                  {isScheduled && (
                    <CheckCircle size={16} weight="fill" className="text-green-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {template.duration} min
                  </span>
                  <span className="text-xs text-purple-500 dark:text-purple-400">
                    {template.subject}
                  </span>
                </div>
              </div>
              {!isScheduled && (
                <Play size={18} weight="fill" className="text-purple-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
