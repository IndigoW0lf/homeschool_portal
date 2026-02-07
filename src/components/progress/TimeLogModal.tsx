'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/browser';

// Missouri core subjects
const CORE_SUBJECTS = [
  'Math',
  'Science', 
  'Reading',
  'Language Arts',
  'Social Studies',
  'History',
  'Geography',
  'Government',
  'US Government',
];

const NON_CORE_SUBJECTS = [
  'PE',
  'Physical Education',
  'Art',
  'Music',
  'Home Economics',
  'Foreign Language',
  'Spanish',
  'Technology',
  'Life Skills',
  'Other',
];

const ALL_SUBJECTS = [...CORE_SUBJECTS, ...NON_CORE_SUBJECTS];

// Common time presets in minutes
const TIME_PRESETS = [15, 30, 45, 60, 90];

interface SubjectEntry {
  id: string;
  subject: string;
  minutes: number;
}

interface TimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  kidId: string;
  kidName: string;
  date: string; // YYYY-MM-DD
  initialSubject?: string;
  onSaved?: () => void;
}

export function TimeLogModal({
  isOpen,
  onClose,
  kidId,
  kidName,
  date,
  initialSubject,
  onSaved,
}: TimeLogModalProps) {
  const [entries, setEntries] = useState<SubjectEntry[]>([
    {
      id: crypto.randomUUID(),
      subject: initialSubject || 'Math',
      minutes: 30,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addEntry = () => {
    // Pick a subject not already used
    const usedSubjects = entries.map((e) => e.subject);
    const availableSubject = ALL_SUBJECTS.find((s) => !usedSubjects.includes(s)) || 'Other';
    
    setEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        subject: availableSubject,
        minutes: 30,
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: 'subject' | 'minutes', value: string | number) => {
    setEntries(
      entries.map((e) =>
        e.id === id ? { ...e, [field]: field === 'minutes' ? Number(value) : value } : e
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      
      // Insert each entry into activity_log
      const insertData = entries
        .filter((e) => e.minutes > 0)
        .map((e) => ({
          kid_id: kidId,
          date: date,
          subject: e.subject,
          title: `${e.subject} - Daily Work`,
          description: `Logged ${e.minutes} minutes of ${e.subject}`,
          duration_minutes: e.minutes,
          source: 'manual',
        }));

      if (insertData.length === 0) {
        setError('Please enter at least one subject with time.');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('activity_log')
        .insert(insertData);

      if (insertError) {
        console.error('Failed to save time log:', insertError);
        setError('Failed to save. Please try again.');
        setSaving(false);
        return;
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error saving time log:', err);
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Log School Hours</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-muted">
            How long did <span className="font-medium text-[var(--foreground)]">{kidName}</span> work today?
          </p>

          {/* Subject entries */}
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 p-3 bg-[var(--background-secondary)] rounded-xl"
              >
                <div className="flex-1 space-y-2">
                  {/* Subject select */}
                  <select
                    value={entry.subject}
                    onChange={(e) => updateEntry(entry.id, 'subject', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  >
                    <optgroup label="Core Subjects">
                      {CORE_SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Non-Core Subjects">
                      {NON_CORE_SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Time input with presets */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="480"
                      value={entry.minutes}
                      onChange={(e) => updateEntry(entry.id, 'minutes', e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-muted">min</span>
                    
                    {/* Quick presets */}
                    <div className="flex gap-1 ml-auto">
                      {TIME_PRESETS.slice(0, 3).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => updateEntry(entry.id, 'minutes', preset)}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            entry.minutes === preset
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--background)] hover:bg-[var(--background-elevated)] border border-[var(--border)]'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add another subject */}
          <button
            onClick={addEntry}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another subject
          </button>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted">Total time:</span>
            <span className="font-semibold">
              {totalMinutes} min ({totalHours} hrs)
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--background-elevated)] transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={saving || totalMinutes === 0}
              className="flex-1 py-2 px-4 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Hours'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
