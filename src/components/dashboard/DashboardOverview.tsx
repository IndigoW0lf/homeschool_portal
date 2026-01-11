'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addWeeks, subWeeks } from 'date-fns';
import { WeekView } from './WeekView';
import { DayModal } from './DayModal';
import { ItemDetailModal } from './ItemDetailModal';
import { Modal } from '@/components/ui/Modal';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { LessonForm } from '@/components/lessons/LessonForm';
import { LunaTriggerButton } from '@/components/luna';
import { ContentLibrary } from './ContentLibrary';
import { Lesson, AssignmentItemRow, ResourceRow, Kid } from '@/types';
import { deleteLesson, deleteAssignment } from '@/lib/supabase/mutations';
import { ScheduleModal } from './ScheduleModal';
import { toast } from 'sonner';

interface DashboardOverviewProps {
  lessons: Lesson[];
  assignments: AssignmentItemRow[];
  resources: ResourceRow[];
  students: Kid[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedule: any[]; // TODO: Define strict type
}

export function DashboardOverview({ lessons = [], assignments = [], resources = [], students = [], schedule = [] }: DashboardOverviewProps) {
  // Debug hydration mismatch
  if (typeof window !== 'undefined') {
    console.log('Client Lessons:', lessons);
    console.log('Client Lesson 0:', lessons[0]);
  }

  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [viewingItemType, setViewingItemType] = useState<'lesson' | 'assignment'>('lesson');
  const [filterStudentId, setFilterStudentId] = useState<string | null>(null); // null = show all

  // Filter schedule by selected student
  const filteredSchedule = filterStudentId 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? schedule.filter((s: any) => s.studentId === filterStudentId)
    : schedule;

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const editingAssignment = assignments.find(a => a.id === editingAssignmentId);
  const viewingItem = viewingItemType === 'lesson' 
    ? lessons.find(l => l.id === viewingItemId)
    : assignments.find(a => a.id === viewingItemId);

  // Handlers for viewing items
  const handleViewLesson = (id: string) => {
    setViewingItemId(id);
    setViewingItemType('lesson');
  };

  const handleViewAssignment = (id: string) => {
    setViewingItemId(id);
    setViewingItemType('assignment');
  };

  const handleCloseItemDetail = () => {
    setViewingItemId(null);
  };

  const handleDeleteItem = async () => {
    if (!viewingItemId) return;
    try {
      if (viewingItemType === 'lesson') {
        await deleteLesson(viewingItemId);
      } else {
        await deleteAssignment(viewingItemId);
      }
      toast.success('Deleted successfully');
      setViewingItemId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const handleEditItem = () => {
    if (viewingItemType === 'lesson') {
      setEditingLessonId(viewingItemId);
    } else {
      setEditingAssignmentId(viewingItemId);
    }
    setViewingItemId(null);
  };

  // Schedule modal state (replaced clone)
  const [scheduleItemId, setScheduleItemId] = useState<string | null>(null);
  const [scheduleItemType, setScheduleItemType] = useState<'lesson' | 'assignment'>('lesson');
  const [scheduleItemTitle, setScheduleItemTitle] = useState('');

  const handleScheduleItem = () => {
    if (!viewingItemId || !viewingItem) return;
    setScheduleItemId(viewingItemId);
    setScheduleItemType(viewingItemType);
    setScheduleItemTitle(viewingItem.title);
    setViewingItemId(null);
  };

  // Helper to map DB row to Form Data
  const mapAssignmentToForm = (row: AssignmentItemRow) => ({
      id: row.id,
      title: row.title,
      type: (row.type as string) || 'Practice',
      deliverable: row.deliverable || '',
      parentNotes: row.parent_notes || '',
      estimatedMinutes: row.estimated_minutes,
      tags: row.tags || [],
      isTemplate: row.is_template,
      rubric: (Array.isArray(row.rubric) ? row.rubric : [{ text: '' }]) as { text: string }[],
      steps: (Array.isArray(row.steps) ? row.steps : [{ text: '' }]) as { text: string }[],
      links: (Array.isArray(row.links) ? row.links : []) as { url: string; label: string }[],
      assignTo: [], // TODO: assignments don't store student IDs directly on the item row anymore, need logic if we want this pre-filled
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header - Custom SVG title */}
      <div className="text-center py-6">
        <Image 
          src="/assets/titles/weekly_overview.svg" 
          alt="Weekly Overview" 
          width={560} 
          height={100}
          className="h-20 w-auto mx-auto mb-2 dark:brightness-110"
        />
        <p className="text-muted">
          Manage the learning playlist for the week
        </p>
      </div>

      {/* 2. Week View (The new core) */}
      <WeekView 
         currentDate={currentDate}
         selectedDate={selectedDay}
         onSelectDate={setSelectedDay}
         onPrevWeek={handlePrevWeek}
         onNextWeek={handleNextWeek}
         schedule={filteredSchedule}
         students={students}
         filterStudentId={filterStudentId}
         onFilterChange={setFilterStudentId}
      />

      {/* 3. Unified Content Library */}
      <ContentLibrary
        lessons={lessons}
        assignments={assignments}
        kids={students.map(s => ({ id: s.id, name: s.name, gradeBand: s.gradeBand || undefined }))}
        onViewLesson={handleViewLesson}
        onViewAssignment={handleViewAssignment}
      />

      {/* 4. The Day Modal */}
      {selectedDay && (
         <DayModal 
            date={selectedDay}
            isOpen={!!selectedDay}
            onClose={() => setSelectedDay(null)}
            schedule={schedule}
            students={students}
            lessons={lessons}
            assignments={assignments}
            filterStudentId={filterStudentId}
         />
      )}

      {/* 5. Item Edit Modals */}
      <Modal
         isOpen={!!editingAssignmentId}
         onClose={() => setEditingAssignmentId(null)}
         title="Edit Assignment"
      >
         {editingAssignment && (
            <div className="space-y-4">
               <div className="flex justify-end">
                  <LunaTriggerButton 
                     context="GENERAL" 
                     label="Need ideas?" 
                     iconOnly={false}
                  />
               </div>
               <AssignmentForm
                  initialData={mapAssignmentToForm(editingAssignment)} 
                  onCancel={() => setEditingAssignmentId(null)}
                  onDelete={() => {
                     setEditingAssignmentId(null);
                     // Refresh happens via router.refresh in form
                  }}
                  onSubmit={() => {
                     setEditingAssignmentId(null);
                  }}
                  students={students}
               />
            </div>
         )}
      </Modal>

      <Modal
         isOpen={!!editingLessonId}
         onClose={() => setEditingLessonId(null)}
         title="Edit & Schedule Lesson"
      >
         {editingLessonId && (() => {
            const rawLesson = lessons.find(l => l.id === editingLessonId);
            if (!rawLesson) return null;
            
            // Prepare initial data from structured columns
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const keyQuestions = (rawLesson.keyQuestions || []).map((q: any) => ({ text: typeof q === 'string' ? q : q.text }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const links = (rawLesson.links || []).map((l: any) => ({ url: l.url, label: l.label || l.title || 'Link' }));
            let description = rawLesson.description || '';
            let materials = rawLesson.materials || '';

            // Fallback: If description is missing, check legacy instructions
            if (!description && rawLesson.instructions) {
               try {
                  // If instructions is JSON strings (legacy format)
                  if (rawLesson.instructions.trim().startsWith('{')) {
                     const parsed = JSON.parse(rawLesson.instructions);
                     description = parsed.description || '';
                     if (!materials) materials = parsed.materials || '';
                     
                     if (keyQuestions.length === 0 && parsed.keyQuestions) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        parsed.keyQuestions.forEach((q: any) => keyQuestions.push({ text: typeof q === 'string' ? q : q.text }));
                     }
                  } else {
                     description = rawLesson.instructions;
                  }
               } catch (e) {
                  description = rawLesson.instructions;
               }
            }

            const formData = {
               id: rawLesson.id,
               title: rawLesson.title,
               type: rawLesson.type || 'Math',
               estimatedMinutes: rawLesson.estimatedMinutes,
               tags: rawLesson.tags,
               assignTo: [], 
               date: new Date().toISOString().split('T')[0],
               isTemplate: true,
               description,
               keyQuestions,
               materials,
               links,
               parentNotes: rawLesson.parentNotes
            };

            return (
               <div className="space-y-4">
                  <div className="flex justify-end">
                     <LunaTriggerButton 
                        context="LESSON_STUCK" 
                        lessonId={rawLesson.id}
                        label="Need ideas?" 
                        iconOnly={false}
                     />
                  </div>
                  <LessonForm
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     initialData={formData as any} // Keeping this any for now as formData structure is loose vs Zod schema
                     onCancel={() => setEditingLessonId(null)}
                     onDelete={() => setEditingLessonId(null)}
                     onSubmit={() => {
                        toast.success('Lesson Updated! ✨');
                        setEditingLessonId(null);
                     }}
                     students={students}
                  />
               </div>
            );
         })()}
      </Modal>

      {/* 6. Item Detail Modal */}
      <ItemDetailModal
        isOpen={!!viewingItemId}
        onClose={handleCloseItemDetail}
        item={viewingItem || null}
        itemType={viewingItemType}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onSchedule={handleScheduleItem}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={!!scheduleItemId}
        onClose={() => setScheduleItemId(null)}
        itemId={scheduleItemId || ''}
        itemType={scheduleItemType}
        itemTitle={scheduleItemTitle}
        students={students}
      />

    </div>
  );
}
