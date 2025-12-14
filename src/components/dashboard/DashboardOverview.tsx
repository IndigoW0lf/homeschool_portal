'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addWeeks, subWeeks } from 'date-fns';
import { WeekView } from './WeekView';
import { DayModal } from './DayModal';
import { RecentList } from './RecentList';
import { ItemDetailModal } from './ItemDetailModal';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { Modal } from '@/components/ui/Modal';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { LessonForm } from '@/components/lessons/LessonForm';
import { Lesson, AssignmentItemRow, ResourceRow, Kid } from '@/types';
import { deleteLesson, deleteAssignment, cloneLesson, cloneAssignment } from '@/lib/supabase/mutations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  const handleCloneItem = async () => {
    if (!viewingItemId) return;
    try {
      if (viewingItemType === 'lesson') {
        await cloneLesson(viewingItemId);
      } else {
        await cloneAssignment(viewingItemId);
      }
      toast.success('Cloned successfully! 📋', { description: 'Check your library for the copy.' });
      setViewingItemId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to clone');
    }
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
        
        {/* Student Filter Pills */}
        <div className="flex-center gap-3 mt-6">
           <button
              onClick={() => setFilterStudentId(null)}
              className={cn(
                 "btn-pill",
                 filterStudentId === null ? "btn-pill-active" : "btn-pill-inactive"
              )}
           >
              All Students
           </button>
           {students.map(s => (
              <button
                 key={s.id}
                 onClick={() => setFilterStudentId(filterStudentId === s.id ? null : s.id)}
                 className={cn(
                    "btn-pill flex items-center gap-2",
                    filterStudentId === s.id ? "btn-pill-active" : "btn-pill-inactive"
                 )}
              >
                 <StudentAvatar name={s.name} className="w-6 h-6 text-[10px]" />
                 {s.name}
              </button>
           ))}
        </div>
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
      />

      {/* 3. Library Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecentList
          title="Your Lessons"
          titleImage="/assets/titles/lessons.svg"
          items={lessons.slice(0, 5).map(l => ({ id: l.id, title: l.title, subtitle: 'Lesson' }))}
          type="lesson"
          createLink="/parent/lessons"
          createLabel="New Lesson"
          onView={handleViewLesson}
          onEdit={(id: string) => setEditingLessonId(id)}
        />
        <RecentList
          title="Upcoming Assignments"
          titleImage="/assets/titles/assignments.svg"
          items={assignments.slice(0, 5).map(a => ({ id: a.id, title: a.title, subtitle: a.type || 'Practice' }))}
          type="assignment"
          createLink="/parent/assignments"
          createLabel="New Assignment"
          onView={handleViewAssignment}
          onEdit={(id: string) => setEditingAssignmentId(id)}
        />
        <RecentList
          title="Active Resources"
          titleImage="/assets/titles/resources.svg"
          items={resources.slice(0, 5).map(r => ({ id: r.id, title: r.label, subtitle: r.category }))}
          type="resource"
          createLink="/parent/resources"
          createLabel="Add Resource"
        />
      </div>

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
            />
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
            
            // Parse instructions JSON back to form fields
            let extra = { description: '', keyQuestions: [], materials: '', links: [] };
            try {
               if (rawLesson.instructions) {
                  const items = JSON.parse(rawLesson.instructions);
                  extra = { ...extra, ...items };
               }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
               // Fallback for plain text legacy
               extra.description = rawLesson.instructions || '';
            }

            const formData = {
               id: rawLesson.id,
               title: rawLesson.title,
               type: rawLesson.type || 'Math', // TODO: Fix specific type match
               estimatedMinutes: rawLesson.estimatedMinutes,
               tags: rawLesson.tags,
               assignTo: [], // TODO: fetch from schedule or junction if needed
               date: new Date().toISOString().split('T')[0],
               isTemplate: true,
               ...extra
            };

            return (
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
        onClone={handleCloneItem}
      />

    </div>
  );
}
