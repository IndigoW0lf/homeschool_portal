'use client';

import { useState } from 'react';
import { ChartPie, Sparkle, PencilSimple, GraduationCap, ListChecks } from '@phosphor-icons/react';

interface SubjectData {
  subject: string;
  count: number;
  average?: number | null;
}

interface SubjectOverviewProps {
  // Lunara Quest data (from scheduled activities)
  lunaraSubjects: SubjectData[];
  // Manual activity log data
  manualSubjects: SubjectData[];
  // External curriculum data (MiAcademy)
  externalSubjects: SubjectData[];
}

type SourceFilter = 'all' | 'lunara' | 'manual' | 'external';

// Subject color mapping - using design system colors
const subjectColors: Record<string, string> = {
  'Reading': 'var(--ember-500)',
  'Language Arts': 'var(--solar-500)',
  'Math': 'var(--celestial-500)',
  'Math & Logic': 'var(--celestial-500)',
  'Science': 'var(--celestial-400)',
  'History': 'var(--night-600)',
  'Writing': 'var(--muted)',
  'Social Studies': 'var(--nebula-purple)',
  'U.S. Government': 'var(--nebula-pink)',
  'Arts': 'var(--nebula-pink)',
  'Life Skills': 'var(--nebula-purple)',
  'Electives': 'var(--nebula-teal)',
  'PE': 'var(--ember-400)',
  'Computer Science': 'var(--celestial-600)',
};

function getSubjectColor(subject: string): string {
  // Try exact match first
  if (subjectColors[subject]) return subjectColors[subject];
  // Try partial match
  for (const [key, color] of Object.entries(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return 'var(--slate-500)';
}

export function SubjectOverview({ 
  lunaraSubjects, 
  manualSubjects, 
  externalSubjects 
}: SubjectOverviewProps) {
  const [activeFilter, setActiveFilter] = useState<SourceFilter>('all');

  // Merge subjects based on filter
  const getFilteredSubjects = (): SubjectData[] => {
    let subjects: SubjectData[] = [];
    
    switch (activeFilter) {
      case 'lunara':
        subjects = lunaraSubjects;
        break;
      case 'manual':
        subjects = manualSubjects;
        break;
      case 'external':
        subjects = externalSubjects;
        break;
      case 'all':
      default:
        // Merge all sources, combining counts for same subjects
        const merged: Record<string, SubjectData> = {};
        [...lunaraSubjects, ...manualSubjects, ...externalSubjects].forEach(s => {
          if (merged[s.subject]) {
            merged[s.subject].count += s.count;
            // Average the averages if both have them
            if (s.average !== undefined && s.average !== null) {
              if (merged[s.subject].average !== undefined && merged[s.subject].average !== null) {
                merged[s.subject].average = Math.round(
                  ((merged[s.subject].average || 0) + s.average) / 2
                );
              } else {
                merged[s.subject].average = s.average;
              }
            }
          } else {
            merged[s.subject] = { ...s };
          }
        });
        subjects = Object.values(merged);
        break;
    }
    
    // Sort by count descending
    return subjects.sort((a, b) => b.count - a.count);
  };

  const subjects = getFilteredSubjects();
  const total = subjects.reduce((sum, s) => sum + s.count, 0);
  const hasGrades = subjects.some(s => s.average !== undefined && s.average !== null);

  // Calculate which sources have data
  const hasLunara = lunaraSubjects.length > 0 && lunaraSubjects.some(s => s.count > 0);
  const hasManual = manualSubjects.length > 0 && manualSubjects.some(s => s.count > 0);
  const hasExternal = externalSubjects.length > 0 && externalSubjects.some(s => s.count > 0);

  if (total === 0) {
    return (
      <div className="card p-6 text-center">
        <ChartPie size={32} className="mx-auto mb-2 text-muted opacity-50" />
        <p className="text-sm text-muted">No activity data yet</p>
      </div>
    );
  }

  // Build donut gradient
  let cumulative = 0;
  const gradientStops = subjects.map(subject => {
    const start = (cumulative / total) * 100;
    const end = ((cumulative + subject.count) / total) * 100;
    cumulative += subject.count;
    return `${getSubjectColor(subject.subject)} ${start}% ${end}%`;
  }).join(', ');

  const filterTabs: { key: SourceFilter; label: string; Icon: typeof Sparkle; show: boolean }[] = [
    { key: 'all', label: 'All', Icon: ListChecks, show: true },
    { key: 'lunara', label: 'Lunara Quest', Icon: Sparkle, show: hasLunara },
    { key: 'manual', label: 'Manual', Icon: PencilSimple, show: hasManual },
    { key: 'external', label: 'MiAcademy', Icon: GraduationCap, show: hasExternal },
  ];

  return (
    <div className="card p-5 space-y-4">
      {/* Header with filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-heading">
          <ChartPie size={16} weight="duotone" className="text-[var(--celestial-500)]" />
          Subject Overview
        </h3>
        
        {/* Filter tabs */}
        <div className="flex gap-1 bg-[var(--background-secondary)] rounded-lg p-1">
          {filterTabs.filter(t => t.show).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeFilter === tab.key
                  ? 'bg-[var(--background-elevated)] text-[var(--foreground)] shadow-sm'
                  : 'text-muted hover:text-[var(--foreground)]'
              }`}
            >
              <tab.Icon size={12} weight={activeFilter === tab.key ? 'fill' : 'regular'} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout: Donut + Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Distribution Donut */}
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-24 h-24 rounded-full"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="absolute inset-3 bg-[var(--background-elevated)] rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-heading">{total}</p>
                  <p className="text-[10px] text-muted uppercase">Items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1">
            {subjects.slice(0, 6).map(subject => (
              <div key={subject.subject} className="flex items-center gap-1.5 min-w-0">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getSubjectColor(subject.subject) }}
                />
                <span className="text-xs text-muted truncate">{subject.subject}</span>
                <span className="text-xs text-muted ml-auto">{subject.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Performance Bars */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted uppercase tracking-wider">
            {hasGrades ? 'Performance' : 'Activity Count'}
          </h4>
          <div className="space-y-1.5">
            {subjects.slice(0, 5).map(subject => (
              <div key={subject.subject} className="flex items-center gap-2">
                <span className="w-24 text-xs text-muted truncate">{subject.subject}</span>
                <div className="flex-1 h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: hasGrades && subject.average !== undefined && subject.average !== null
                        ? `${subject.average}%`
                        : `${Math.min((subject.count / Math.max(...subjects.map(s => s.count))) * 100, 100)}%`,
                      backgroundColor: hasGrades && subject.average !== undefined && subject.average !== null
                        ? subject.average >= 80 ? 'var(--celestial-500)' :
                          subject.average >= 60 ? 'var(--herbal-gold)' : 'var(--cosmic-rust-500)'
                        : getSubjectColor(subject.subject)
                    }}
                  />
                </div>
                {hasGrades && subject.average !== undefined && subject.average !== null ? (
                  <span className={`text-xs font-medium w-10 text-right ${
                    subject.average >= 80 ? 'text-[var(--celestial-500)]' :
                    subject.average >= 60 ? 'text-[var(--herbal-gold)]' : 'text-[var(--cosmic-rust-500)]'
                  }`}>
                    {subject.average}%
                  </span>
                ) : (
                  <span className="text-xs text-muted w-10 text-right">{subject.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
