'use client';

import { useState } from 'react';
import { ActivityLogForm } from './ActivityLogForm';
import { ActivityLogList } from './ActivityLogList';
import { logActivity, removeActivity } from '@/app/actions/activityLog';
import { useRouter } from 'next/navigation';
import { Book, FileText } from '@phosphor-icons/react';
import Link from 'next/link';

interface ActivityLogEntry {
  id: string;
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  source: string;
}

interface Kid {
  id: string;
  name: string;
}

interface ActivityLogSectionProps {
  kids: Kid[];
  initialEntries: ActivityLogEntry[];
}

export function ActivityLogSection({ kids, initialEntries }: ActivityLogSectionProps) {
  const [entries, setEntries] = useState(initialEntries);
  const router = useRouter();

  const handleSubmit = async (formData: {
    kidId: string;
    date: string;
    subject: string;
    title: string;
    description: string;
    durationMinutes: number;
  }) => {
    const result = await logActivity(formData);
    
    if (result.success && result.id) {
      // Optimistically add to list
      setEntries(prev => [{
        id: result.id!,
        kidId: formData.kidId,
        date: formData.date,
        subject: formData.subject,
        title: formData.title,
        description: formData.description || null,
        durationMinutes: formData.durationMinutes || null,
        source: 'manual'
      }, ...prev]);
      
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await removeActivity(id);
    
    if (result.success) {
      setEntries(prev => prev.filter(e => e.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with link to reports */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-heading dark:text-white flex items-center gap-2">
          <Book size={20} weight="duotone" className="text-[var(--ember-500)]" />
          Activity Log
        </h3>
        <Link 
          href="/parent/progress/reports"
          className="text-sm text-[var(--ember-500)] hover:text-[var(--ember-600)] flex items-center gap-1"
        >
          <FileText size={16} />
          View Reports
        </Link>
      </div>

      {/* Form */}
      <ActivityLogForm kids={kids} onSubmit={handleSubmit} />

      {/* List - show most recent 10 */}
      <ActivityLogList 
        entries={entries.slice(0, 10)} 
        kids={kids}
        onDelete={handleDelete}
        showKidName={kids.length > 1}
      />

      {/* Show all link if more than 10 */}
      {entries.length > 10 && (
        <div className="text-center">
          <Link 
            href="/parent/progress/reports"
            className="text-sm text-muted hover:text-[var(--ember-500)]"
          >
            View all {entries.length} entries →
          </Link>
        </div>
      )}
    </div>
  );
}
