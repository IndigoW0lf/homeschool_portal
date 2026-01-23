'use client';

interface SubjectData {
  subject: string;
  count: number;
  average?: number;
}

interface SubjectDonutProps {
  subjects: SubjectData[];
}

// Subject color mapping
const subjectColors: Record<string, string> = {
  'Reading': '#f59e0b',
  'Language Arts': '#10b981',
  'Math': '#8b5cf6',
  'Science': '#ef4444',
  'History': '#3b82f6',
  'Writing': '#06b6d4',
  'Social Studies': '#ec4899',
};

function getSubjectColor(subject: string): string {
  return subjectColors[subject] || '#6b7280';
}

export function SubjectDonut({ subjects }: SubjectDonutProps) {
  if (!subjects || subjects.length === 0) return null;

  const total = subjects.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  // Calculate conic gradient stops
  let cumulative = 0;
  const gradientStops = subjects.map(subject => {
    const start = (cumulative / total) * 100;
    const end = ((cumulative + subject.count) / total) * 100;
    cumulative += subject.count;
    return `${getSubjectColor(subject.subject)} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="flex items-center gap-4">
      {/* Donut Chart */}
      <div className="relative">
        <div 
          className="w-24 h-24 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops})`,
          }}
        >
          {/* Inner circle to make it a donut */}
          <div className="absolute inset-3 bg-[var(--background-elevated)] rounded-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-bold text-heading">{total}</p>
              <p className="text-[10px] text-muted uppercase">Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
        {subjects.slice(0, 6).map(subject => (
          <div key={subject.subject} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getSubjectColor(subject.subject) }}
            />
            <span className="text-xs text-muted truncate">
              {subject.subject}
            </span>
            <span className="text-xs text-muted ml-auto">
              {subject.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
