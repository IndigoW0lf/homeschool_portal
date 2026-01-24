'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CalendarPlus, Check } from '@phosphor-icons/react';
import { scheduleLesson, scheduleAssignment } from '@/lib/supabase/mutations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface Student {
  id: string;
  name: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'lesson' | 'assignment';
  itemTitle: string;
  students: Student[];
}

export function ScheduleModal({ 
  isOpen, 
  onClose, 
  itemId, 
  itemType, 
  itemTitle,
  students 
}: ScheduleModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStudents, setSelectedStudents] = useState<string[]>(students.map(s => s.id));
  
  // Recurring state
  const [scheduleMode, setScheduleMode] = useState<'single' | 'recurring'>('single');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleWeekday = (dayIdx: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]
    );
  };

  const handleSchedule = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsSubmitting(true);
    try {
      if (scheduleMode === 'single') {
        if (itemType === 'lesson') {
            await scheduleLesson(itemId, selectedStudents, selectedDate);
        } else {
            await scheduleAssignment(itemId, selectedStudents, selectedDate);
        }
      } else {
        // Recurring logic
        const startDate = new Date(selectedDate);
        // Fix timezone offset issue by treating the date string as local start of day? 
        // Actually new Date('yyyy-mm-dd') treats as UTC usually in JS, 
        // but input type=date returns yyyy-mm-dd. 
        // Let's use mapped date strings to be safe with formatted input.
        // Or simple iteration:
        
        let current = addDays(startDate, 1); // fix off-by-one? Validating...
        // new Date('2023-01-01') is UTC. 
        // Let's rely on date-fns parsing or basic string manipulation to avoid TZ chaos.
        // Actually, let's just use the string and increment.
        
        // Better:
        const [y, m, d] = selectedDate.split('-').map(Number);
        let currentObj = new Date(y, m - 1, d); // Local time
        
        const datesToSchedule: string[] = [];
        const totalDays = repeatWeeks * 7;

        for (let i = 0; i < totalDays; i++) {
           if (selectedWeekdays.includes(currentObj.getDay())) {
              datesToSchedule.push(format(currentObj, 'yyyy-MM-dd'));
           }
           currentObj = addDays(currentObj, 1);
        }
        
        if (datesToSchedule.length === 0) {
            toast.error('No dates selected based on your weekdays!');
            setIsSubmitting(false);
            return;
        }

        // Parallel Requests (might be heavy if 52 weeks, but fine for now)
        await Promise.all(datesToSchedule.map(date => 
           itemType === 'lesson' 
             ? scheduleLesson(itemId, selectedStudents, date)
             : scheduleAssignment(itemId, selectedStudents, date)
        ));
      }
      
      toast.success('Scheduled! 📅', { 
        description: `Added to ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}'s calendar` 
      });
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick date options
  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'Next Week', date: addDays(new Date(), 7) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[var(--background-elevated)] rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 flex items-center justify-center">
              <CalendarPlus size={24} weight="duotone" className="text-[var(--ember-500)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-heading">Schedule This</h2>
              <p className="text-sm text-muted truncate max-w-[200px]">{itemTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--hover-overlay)] rounded-lg">
            <X size={20} className="text-muted" />
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-heading dark:text-muted">
              When?
            </label>
            <div className="flex items-center gap-2 bg-[var(--background-secondary)] p-1 rounded-lg">
                <button 
                    onClick={() => setScheduleMode('single')}
                    className={cn(
                        "text-xs font-bold px-2 py-1 rounded transition-colors",
                        scheduleMode === 'single' ? "bg-[var(--background-elevated)] dark:bg-[var(--night-600)] shadow-sm text-heading" : "text-muted"
                    )}
                >
                    One Day
                </button>
                <button 
                    onClick={() => setScheduleMode('recurring')}
                    className={cn(
                        "text-xs font-bold px-2 py-1 rounded transition-colors",
                        scheduleMode === 'recurring' ? "bg-[var(--background-elevated)] dark:bg-[var(--night-600)] shadow-sm text-heading" : "text-muted"
                    )}
                >
                    Repeat
                </button>
            </div>
          </div>
          
          {scheduleMode === 'single' ? (
              <>
                <div className="flex gap-2 mb-3">
                    {quickDates.map(({ label, date }) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return (
                        <button
                        key={label}
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                            "px-3 py-1.5 text-sm rounded-lg font-medium transition-all",
                            selectedDate === dateStr
                            ? "bg-[var(--ember-500)] text-[var(--foreground)]"
                            : "bg-[var(--background-secondary)] text-heading dark:text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)]"
                        )}
                        >
                        {label}
                        </button>
                    );
                    })}
                </div>

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] dark:border-[var(--border)] bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)] text-heading"
                />
              </>
          ) : (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                    <label className="text-xs text-muted uppercase font-bold tracking-wider mb-2 block">Days of Week</label>
                    <div className="flex justify-between gap-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => {
                            const isSelected = selectedWeekdays.includes(idx);
                            return (
                                <button
                                    key={day}
                                    onClick={() => toggleWeekday(idx)}
                                    className={cn(
                                        "w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all",
                                        isSelected 
                                            ? "bg-[var(--ember-500)] text-[var(--foreground)]" 
                                            : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)]"
                                    )}
                                >
                                    {day[0]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-muted uppercase font-bold tracking-wider mb-1 block">Start Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] dark:border-[var(--border)] bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)]"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted uppercase font-bold tracking-wider mb-1 block">Duration</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={52}
                                value={repeatWeeks}
                                onChange={(e) => setRepeatWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] dark:border-[var(--border)] bg-[var(--background-elevated)] dark:bg-[var(--background-secondary)]"
                            />
                            <span className="text-sm text-muted">Weeks</span>
                        </div>
                    </div>
                </div>
                
                <p className="text-xs text-muted bg-[var(--background-secondary)] bg-[var(--background)] p-2 rounded">
                    Will schedule <strong>{selectedWeekdays.length * repeatWeeks}</strong> items starting from {selectedDate}.
                </p>
             </div>
          )}
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-heading dark:text-muted mb-2">
            Students
          </label>
          <div className="space-y-2">
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                  selectedStudents.includes(student.id)
                    ? "border-[var(--ember-400)] bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20"
                    : "border-[var(--border)] dark:border-[var(--border)] hover:border-[var(--border)] dark:hover:border-[var(--border)]"
                )}
              >
                <span className={cn(
                  "font-medium",
                  selectedStudents.includes(student.id) 
                    ? "text-[var(--ember-600)] dark:text-[var(--ember-400)]" 
                    : "text-heading dark:text-muted"
                )}>
                  {student.name}
                </span>
                {selectedStudents.includes(student.id) && (
                  <Check size={20} weight="bold" className="text-[var(--ember-500)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] dark:border-[var(--border)] text-heading dark:text-muted font-medium hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-700)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={isSubmitting || selectedStudents.length === 0}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-[var(--foreground)] font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
