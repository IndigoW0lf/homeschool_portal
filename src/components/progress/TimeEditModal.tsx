'use client';

import { useState } from 'react';
import { X, Clock, Check } from '@phosphor-icons/react';
import { updateActivityTime } from '@/app/actions/activityTime';

interface TimeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityTitle: string;
  scheduleItemId: string;
  estimatedMinutes?: number;
  currentMinutes?: number;
  onSave?: (minutes: number) => void;
}

export function TimeEditModal({
  isOpen,
  onClose,
  activityTitle,
  scheduleItemId,
  estimatedMinutes,
  currentMinutes,
  onSave
}: TimeEditModalProps) {
  const [hours, setHours] = useState(Math.floor((currentMinutes || estimatedMinutes || 30) / 60));
  const [minutes, setMinutes] = useState((currentMinutes || estimatedMinutes || 30) % 60);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const totalMinutes = hours * 60 + minutes;
    
    const result = await updateActivityTime(scheduleItemId, totalMinutes);
    
    if (result.success) {
      onSave?.(totalMinutes);
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--background-elevated)] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted hover:text-muted dark:hover:text-muted"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-[var(--celestial-400)]/20 dark:bg-[var(--celestial-500)]/20 rounded-lg">
            <Clock size={20} className="text-[var(--celestial-500)]" weight="duotone" />
          </div>
          <h3 className="font-semibold text-heading">Log Time</h3>
        </div>
        
        <p className="text-sm text-muted mb-4 line-clamp-2">
          {activityTitle}
        </p>
        
        {estimatedMinutes && (
          <p className="text-xs text-muted mb-3">
            Estimated: {Math.floor(estimatedMinutes / 60)}h {estimatedMinutes % 60}m
          </p>
        )}
        
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Hours</label>
            <input
              type="number"
              min="0"
              max="12"
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-center text-lg font-medium border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end pb-2 text-2xl text-muted">:</div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Minutes</label>
            <input
              type="number"
              min="0"
              max="59"
              step="5"
              value={minutes}
              onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full px-3 py-2 text-center text-lg font-medium border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-muted dark:text-muted hover:bg-[var(--hover-overlay)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-[var(--celestial-500)] hover:bg-[var(--celestial-600)] text-[var(--foreground)] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Check size={16} weight="bold" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
