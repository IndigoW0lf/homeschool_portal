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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSchedule = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsSubmitting(true);
    try {
      if (itemType === 'lesson') {
        await scheduleLesson(itemId, selectedStudents, selectedDate);
      } else {
        await scheduleAssignment(itemId, selectedStudents, selectedDate);
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
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 flex items-center justify-center">
              <CalendarPlus size={24} weight="duotone" className="text-[var(--ember-500)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Schedule This</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{itemTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date
          </label>
          
          {/* Quick date buttons */}
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
                      ? "bg-[var(--ember-500)] text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Date input */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                )}
              >
                <span className={cn(
                  "font-medium",
                  selectedStudents.includes(student.id) 
                    ? "text-[var(--ember-600)] dark:text-[var(--ember-400)]" 
                    : "text-gray-700 dark:text-gray-300"
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
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={isSubmitting || selectedStudents.length === 0}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-white font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
