'use client';

import { useState } from 'react';
import { Plus, Clock, Calendar, Book } from '@phosphor-icons/react';
import { SUBJECTS } from '@/lib/activityLogConstants';

interface Kid {
  id: string;
  name: string;
}

interface ActivityLogFormProps {
  kids: Kid[];
  onSubmit: (entry: {
    kidId: string;
    date: string;
    subject: string;
    title: string;
    description: string;
    durationMinutes: number;
  }) => Promise<void>;
}

export function ActivityLogForm({ kids, onSubmit }: ActivityLogFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [kidId, setKidId] = useState(kids[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kidId || !subject || !title) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        kidId,
        date,
        subject,
        title,
        description,
        durationMinutes: hours * 60 + minutes
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setHours(0);
      setMinutes(30);
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-[var(--ember-400)] hover:bg-[var(--ember-50)] dark:hover:bg-[var(--ember-900)/20] transition-all flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[var(--ember-600)]"
      >
        <Plus size={20} weight="bold" />
        Log an Activity
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Book size={20} weight="duotone" className="text-[var(--ember-500)]" />
          Log Activity
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kid Selector */}
        {kids.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Student
            </label>
            <select
              value={kidId}
              onChange={(e) => setKidId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {kids.map(kid => (
                <option key={kid.id} value={kid.id}>{kid.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Calendar size={16} className="inline mr-1" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select subject...</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock size={16} className="inline mr-1" />
            Duration
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="12"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">hours</span>
            </div>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          What was done?
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Practiced multiplication tables, Read chapter 5..."
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Description (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Additional details..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !subject || !title}
          className="px-6 py-2 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? 'Saving...' : 'Log Activity'}
        </button>
      </div>
    </form>
  );
}
