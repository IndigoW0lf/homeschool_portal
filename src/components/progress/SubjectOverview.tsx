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

// Normalize subject names to handle case differences (reading -> Reading)
function normalizeSubjectName(name: string): string {
  const normalized = name.toLowerCase().replace(/_/g, ' ');
  // Map common variations
  const mappings: Record<string, string> = {
    'reading': 'Reading',
    'writing': 'Writing',
    'math': 'Math',
    'math & logic': 'Math & Logic',
    'science': 'Science',
    'social studies': 'Social Studies',
    'social_studies': 'Social Studies',
    'arts': 'Arts',
    'electives': 'Electives',
    'life skills': 'Life Skills',
    'life_skills': 'Life Skills',
    'pe': 'PE',
    'pe & movement': 'PE & Movement',
    'language arts': 'Language Arts',
    'computer science': 'Computer Science',
    'history': 'History',
  };
  return mappings[normalized] || name.charAt(0).toUpperCase() + name.slice(1);
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
        // Merge all sources, combining counts for same subjects (case-insensitive)
        const merged: Record<string, SubjectData> = {};
        [...lunaraSubjects, ...manualSubjects, ...externalSubjects].forEach(s => {
          const normalizedName = normalizeSubjectName(s.subject);
          if (merged[normalizedName]) {
            merged[normalizedName].count += s.count;
            // Average the averages if both have them
            if (s.average !== undefined && s.average !== null) {
              if (merged[normalizedName].average !== undefined && merged[normalizedName].average !== null) {
                merged[normalizedName].average = Math.round(
                  ((merged[normalizedName].average || 0) + s.average) / 2
                );
              } else {
                merged[normalizedName].average = s.average;
              }
            }
          } else {
            merged[normalizedName] = { ...s, subject: normalizedName };
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

      {/* Two-column layout: Donut + Performance/Activity Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Distribution Donut - larger and centered */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div 
              className="w-32 h-32 rounded-full shadow-lg"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="absolute inset-4 bg-[var(--background-elevated)] rounded-full flex items-center justify-center shadow-inner">
                <div className="text-center">
                  <p className="text-2xl font-bold text-heading">{total}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wide">Activities</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Performance Bars (MiAcademy only) OR Activity Distribution (other sources) */}
        <div className="space-y-3">
          {activeFilter === 'external' && hasGrades ? (
            <>
              {/* MiAcademy: Show performance bars with percentages */}
              <h4 className="text-xs font-medium text-muted uppercase tracking-wider">
                Performance
              </h4>
              <div className="space-y-1.5">
                {subjects.slice(0, 5).map(subject => (
                  <div key={subject.subject} className="flex items-center gap-2">
                    <span className="w-24 text-xs text-muted truncate">{subject.subject}</span>
                    <div className="flex-1 h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${subject.average || 0}%`,
                          backgroundColor: (subject.average || 0) >= 80 
                            ? 'var(--celestial-500)' 
                            : (subject.average || 0) >= 60 
                              ? 'var(--herbal-gold)' 
                              : 'var(--cosmic-rust-500)'
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-10 text-right ${
                      (subject.average || 0) >= 80 ? 'text-[var(--celestial-500)]' :
                      (subject.average || 0) >= 60 ? 'text-[var(--herbal-gold)]' : 'text-[var(--cosmic-rust-500)]'
                    }`}>
                      {subject.average || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Lunara/Manual/All: Show activity distribution as numbers */}
              <h4 className="text-xs font-medium text-muted uppercase tracking-wider">
                Activity Distribution
              </h4>
              <div className="space-y-1.5">
                {subjects.slice(0, 5).map(subject => {
                  const percentage = Math.round((subject.count / total) * 100);
                  return (
                    <div key={subject.subject} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded flex-shrink-0"
                        style={{ backgroundColor: getSubjectColor(subject.subject) }}
                      />
                      <span className="flex-1 text-xs text-[var(--foreground)] truncate">{subject.subject}</span>
                      <span className="text-xs font-medium text-[var(--foreground)]">{subject.count}</span>
                      <span className="text-xs text-muted w-10 text-right">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
              {subjects.length > 5 && (
                <p className="text-[10px] text-muted">+ {subjects.length - 5} more subjects</p>
              )}

              {/* When "All" is selected and MiAcademy data exists, show separate performance summary */}
              {activeFilter === 'all' && hasExternal && externalSubjects.some(s => s.average !== undefined && s.average !== null) && (
                <div className="pt-2 mt-2 border-t border-[var(--border)]">
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <GraduationCap size={12} className="text-[var(--celestial-500)]" />
                    MiAcademy Performance
                  </h4>
                  <div className="space-y-1">
                    {externalSubjects.filter(s => s.average !== undefined && s.average !== null).slice(0, 3).map(subject => (
                      <div key={subject.subject} className="flex items-center gap-2">
                        <span className="flex-1 text-xs text-muted truncate">{subject.subject}</span>
                        <div className="w-16 h-1.5 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ 
                              width: `${subject.average || 0}%`,
                              backgroundColor: (subject.average || 0) >= 80 
                                ? 'var(--celestial-500)' 
                                : (subject.average || 0) >= 60 
                                  ? 'var(--herbal-gold)' 
                                  : 'var(--cosmic-rust-500)'
                            }}
                          />
                        </div>
                        <span className={`text-xs font-medium w-8 text-right ${
                          (subject.average || 0) >= 80 ? 'text-[var(--celestial-500)]' :
                          (subject.average || 0) >= 60 ? 'text-[var(--herbal-gold)]' : 'text-[var(--cosmic-rust-500)]'
                        }`}>
                          {subject.average}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
