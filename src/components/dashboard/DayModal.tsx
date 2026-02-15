'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useFeedback } from '@/components/ui/FeedbackModal';
import { X, CheckCircle, Circle, Plus, Copy, Sparkle, Trash, DotsSixVertical } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { ItemDetailView, ItemDetailHeader } from './ItemDetailView';
import { toggleScheduleItemComplete, deleteScheduleItemAction, assignItemToSchedule } from '@/lib/supabase/mutations';
import { Kid, Lesson, AssignmentItemRow, ScheduleDisplayItem } from '@/types';

interface DayModalProps {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  schedule?: ScheduleDisplayItem[];
  students?: Kid[];
  lessons?: Lesson[];
  assignments?: AssignmentItemRow[];
  filterStudentId?: string | null;
}

export function DayModal({ date, isOpen, onClose, schedule = [], students = [], lessons = [], assignments = [], filterStudentId = null }: DayModalProps) {

  const router = useRouter();
  const feedback = useFeedback();
  const [activeVariationId, setActiveVariationId] = useState<string | null>(null);
  const [variationText, setVariationText] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pickerType, setPickerType] = useState<'lesson' | 'assignment' | null>(null);
  const [selectedKids, setSelectedKids] = useState<string[]>(students.map(s => s.id));
  const [viewingItem, setViewingItem] = useState<ScheduleDisplayItem | null>(null);

  // Reset selectedKids when students change
  const toggleKidSelection = (kidId: string) => {
    setSelectedKids(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  if (!isOpen) return null;

  const dateStr = format(date, 'yyyy-MM-dd');
  const allItems = schedule.filter(s => s.date === dateStr);
  
  // Filter items by student if filter is set
  const items = filterStudentId 
    ? allItems.filter(i => i.studentId === filterStudentId)
    : allItems;

  // Get filtered students list
  const displayStudents = filterStudentId 
    ? students.filter(s => s.id === filterStudentId)
    : students;

  // Group by student for grouped display
  const studentSchedules = displayStudents.map(student => {
     const myItems = items.filter(i => i.studentId === student.id);
     return {
        student,
        items: myItems
     };
  });


  const handleCloneWithVariation = (itemId: string) => {
    setActiveVariationId(itemId);
    setVariationText('');
    setShowAddMenu(false);
  };

  const applyVariation = (id: string) => {
    // In a real app, this would create a new item with the variation
    alert(`Applying variation: "${variationText}" to item ${id}`);
    setActiveVariationId(null);
  };

  const handleAddItem = (type: 'lesson' | 'assignment') => {
    setPickerType(type);
    setShowAddMenu(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    toast('Remove from schedule?', {
      description: "This will remove the item from this day's playlist.",
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            await deleteScheduleItemAction(id);
            feedback.show({ type: 'success', title: 'Removed', message: 'Item removed from schedule.' });
            router.refresh();
          } catch (err) {
            console.error(err);
            feedback.show({ type: 'error', title: 'Failed to remove item', message: 'Please try again.' });
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {} // Just dismiss
      },
      duration: 10000, // Give user time to decide
    });
  };
  
  const handleScheduleItem = async (item: Lesson | AssignmentItemRow) => {
     try {
        const type = pickerType || 'lesson';
        const targetStudentIds = selectedKids.length > 0 ? selectedKids : students.map(s => s.id);
        
        if (targetStudentIds.length === 0) {
          toast.error('Please select at least one student');
          return;
        }
        
        await assignItemToSchedule(type, item.id, dateStr, targetStudentIds);
        
        const kidNames = students
          .filter(s => targetStudentIds.includes(s.id))
          .map(s => s.name)
          .join(' & ');
        
        feedback.show({ type: 'success', title: 'Added to schedule', message: `"${item.title}" added for ${kidNames}.` });
        
        setPickerType(null); // return to list
        router.refresh();
     } catch (err) {
        console.error(err);
        feedback.show({ type: 'error', title: 'Could not schedule item', message: 'Please try again.' });
     }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--background-elevated)] dark:bg-[var(--night-900)] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] dark:border-[var(--border)]">
          <div>
             <h2 className="text-2xl font-bold text-heading">
                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </h2>
             <p className="text-sm text-muted">Day Plan & Playlist</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] rounded-full transition-colors" aria-label="Close">
            <X size={24} className="text-muted" />
          </button>
        </div>

         {/* Two-panel: list/picker left, item detail right when viewing */}
         <div className="flex-1 flex min-h-0">
           {/* Left: playlist or picker */}
           <div className={cn(
             "flex flex-col overflow-y-auto bg-[var(--background-secondary)]/50 dark:bg-black/20",
             viewingItem ? "w-full md:w-[40%] md:min-w-[240px] md:border-r md:border-[var(--border)]" : "w-full"
           )}>
             <div className="p-4 md:p-6 space-y-4">
           {pickerType ? (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-2 mb-4">
                    <button type="button" onClick={() => setPickerType(null)} className="p-1 hover:bg-[var(--background-secondary)] rounded-full" aria-label="Back to playlist">
                       <X size={20} />
                    </button>
                    <h3 className="font-bold text-lg flex-1">Select {pickerType === 'lesson' ? 'Lesson' : 'Assignment'}</h3>
                 </div>
                 
                 {/* Kid Selection */}
                 <div className="flex items-center gap-3 p-3 bg-[var(--background-elevated)] rounded-xl border border-[var(--border)]">
                    <span className="text-sm font-medium text-muted">Assign to:</span>
                    {students.map(student => (
                       <button
                          key={student.id}
                          type="button"
                          onClick={() => toggleKidSelection(student.id)}
                          className={cn(
                             "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm font-medium",
                             selectedKids.includes(student.id)
                               ? "border-[var(--ember-500)] bg-[var(--ember-50)] text-[var(--ember-600)]"
                               : "border-[var(--border)] text-muted hover:border-[var(--border)]"
                          )}
                       >
                          <StudentAvatar name={student.name} className="w-5 h-5 text-[8px]" />
                          {student.name}
                       </button>
                    ))}
                 </div>
                 
                 <div className="grid grid-cols-1 gap-2">
                    {(pickerType === 'lesson' ? lessons : assignments).map((item) => (
                       <div 
                          key={item.id}
                          onClick={() => handleScheduleItem(item)}
                          className="p-4 bg-[var(--background-elevated)] border border-[var(--border)] rounded-xl hover:border-[var(--ember-400)] cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
                       >
                          <div>
                             <h4 className="font-semibold text-heading">{item.title}</h4>
                             <p className="text-xs text-muted">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {item.type} • {(item as any).estimatedMinutes || (item as any).estimated_minutes || 20} mins
                             </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--ember-50)] text-[var(--ember-600)] rounded-full">
                             <Plus size={16} />
                          </div>
                       </div>
                    ))}
                    
                    {(pickerType === 'lesson' ? lessons : assignments).length === 0 && (
                       <div className="text-center py-10 text-muted">
                          <p>No items found in library.</p>
                       </div>
                    )}
                 </div>
              </div>
           ) : (
             <>
               {/* Normal Playlist View */}
    
               {/* Scheduled Items - Grouped by Student */}
               {studentSchedules.map(({ student, items: studentItems }) => (
                  <div key={student.id} className="space-y-3">
                     {/* Student Header - Only show when viewing multiple students */}
                     {!filterStudentId && students.length > 1 && (
                        <div className="flex items-center gap-2 pt-2 pb-1">
                           <StudentAvatar name={student.name} className="w-6 h-6 text-[10px]" />
                           <span className="font-semibold text-sm text-muted">{student.name}&apos;s Tasks</span>
                           <div className="flex-1 h-px bg-[var(--background-secondary)]" />
                        </div>
                     )}
                     
                     {studentItems.length === 0 && !filterStudentId && students.length > 1 && (
                        <p className="text-xs text-muted pl-8">No tasks scheduled</p>
                     )}
                     
                     {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                     {studentItems.map((item: any) => (
                        <div key={item.id} className="group relative bg-[var(--background-elevated)] rounded-xl border border-[var(--border)] shadow-sm transition-all hover:shadow-md hover:border-[var(--ember-200)]">
                          
                          {/* Variation Overlay */}
                          {activeVariationId === item.id && (
                             <div className="absolute inset-x-0 -top-12 z-10 bg-[var(--background-elevated)] p-3 rounded-t-xl border-x border-t border-[var(--ember-200)] shadow-lg animate-in slide-in-from-bottom-2">
                                <div className="flex gap-2">
                                   <Sparkle size={20} weight="duotone" color="#e7b58d" className="mt-2" />
                                   <div className="flex-1">
                                      <label className="text-xs font-bold text-[var(--ember-600)] uppercase block mb-1">Customize for Today</label>
                                      <input 
                                          autoFocus
                                          value={variationText}
                                          onChange={e => setVariationText(e.target.value)}
                                          placeholder="e.g. Read only pages 10-15..." 
                                          className="w-full text-sm bg-transparent outline-none placeholder:text-muted"
                                       />
                                   </div>
                                   <button onClick={() => applyVariation(item.id)} className="px-3 py-1 bg-[var(--ember-500)] text-[var(--foreground)] text-xs font-bold rounded-lg hover:opacity-90">
                                      Save
                                   </button>
                                </div>
                             </div>
                          )}
     
                          <div className="flex items-center gap-4 p-4">
                             <div className="text-muted cursor-grab active:cursor-grabbing hover:text-muted">
                                 <DotsSixVertical size={24} weight="duotone" color="#b6e1d8" />
                             </div>
                             
                             <div 
                                onClick={async () => {
                                   const newStatus = !item.status || item.status === 'pending';
                                   try {
                                      await toggleScheduleItemComplete(item.id, newStatus);
                                      
                                      // Optimistic / Feedback
                                      if (newStatus) {
                                         // Check if this was the last one
                                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                         const remaining = studentItems.filter((i: any) => i.id !== item.id && (!i.status || i.status === 'pending')).length;
                                         
                                         if (remaining === 0) {
                                            feedback.show({
                                              type: 'success',
                                              title: 'High five!',
                                              message: `${student.name} finished everything for today!`,
                                            });
                                         } else {
                                            feedback.show({ type: 'success', title: 'Good job!', message: 'Item marked as complete.' });
                                         }
                                      }
                                      router.refresh();
                                   } catch (e) {
                                      console.error('Error toggling completion:', e);
                                      feedback.show({ type: 'error', title: 'Could not update status', message: 'Please try again.' });
                                   }
                                }} 
                                className={cn("cursor-pointer transition-colors", item.status === 'completed' ? "text-[var(--herbal-500)]" : "text-muted hover:text-muted")}
                             >
                                {item.status === 'completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                             </div>
     
                             <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => setViewingItem(item)}
                             >
                                <div className="flex items-center gap-2 mb-1">
                                   <span className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                      item.type === 'lesson' ? "bg-[var(--celestial-400)]/20 text-[var(--celestial-500)]" : "bg-[var(--nebula-purple)]/20 text-[var(--nebula-purple)]"
                                   )}>
                                      {item.type}
                                   </span>
                                   {/* Show student avatar on item only when not filtered */}
                                   {filterStudentId && (
                                      <StudentAvatar name={student.name} className="w-5 h-5 text-[8px]" />
                                   )}
                                </div>
                                <h3 className="font-semibold text-heading text-lg hover:text-[var(--ember-600)] transition-colors">
                                   {item.title || 'Untitled Item'}
                                </h3>
                                {item.type && (
                                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                   <p className="text-sm text-muted">{item.title ? item.type : ''} • {item.details?.estimatedMinutes || (item as any).estimated_minutes || 20} mins</p>
                                )}
                             </div>
     
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleCloneWithVariation(item.id)}
                                    className="p-2 text-muted hover:text-[var(--ember-500)] hover:bg-[var(--ember-50)] rounded-lg tooltip-trigger"
                                    title="Tweak this item"
                                 >
                                    <Copy size={18} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteItem(item.id, e);
                                    }}
                                    className="p-2 text-muted hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg"
                                    title="Remove from schedule"
                                >
                                   <Trash size={22} weight="duotone" color="#ffcdf6" />
                                </button>
                             </div>
                          </div>
                        </div>
                     ))}
                  </div>
               ))}
    
               {/* Add Button */}
               {/* Add Button Area */}
                <div className="relative">
                   {!showAddMenu ? (
                      <button 
                       onClick={() => setShowAddMenu(true)}
                       className="w-full py-4 border-2 border-dashed border-[var(--border)] rounded-xl text-muted hover:border-[var(--ember-400)] hover:text-[var(--ember-600)] hover:bg-[var(--ember-50)] transition-all flex items-center justify-center gap-2 group"
                      >
                         <div className="w-8 h-8 rounded-full bg-[var(--background-secondary)] group-hover:bg-[var(--ember-200)] flex items-center justify-center transition-colors">
                            <Plus size={20} />
                         </div>
                         <span className="font-medium">Add to Playlist</span>
                      </button>
                   ) : (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                         <button 
                            onClick={() => handleAddItem('lesson')}
                            className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-[var(--celestial-100)] bg-[var(--celestial-50)]/50 hover:bg-[var(--celestial-400)]/20 hover:border-[var(--celestial-300)] transition-all text-[var(--celestial-500)]"
                         >
                            <div className="w-10 h-10 rounded-full bg-[var(--background-elevated)] flex items-center justify-center shadow-sm">
                               <Plus size={20} />
                            </div>
                            <span className="font-bold">Add Lesson</span>
                            <span className="text-xs opacity-70">From Library</span>
                         </button>
                         <button 
                            onClick={() => handleAddItem('assignment')}
                            className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-[var(--nebula-purple)]/20 bg-[var(--nebula-purple)]/10 hover:bg-[var(--nebula-purple)]/20 hover:border-[var(--nebula-purple)]/40 transition-all text-[var(--nebula-purple)]"
                         >
                            <div className="w-10 h-10 rounded-full bg-[var(--background-elevated)] flex items-center justify-center shadow-sm">
                               <Plus size={20} />
                            </div>
                            <span className="font-bold">Add Assignment</span>
                            <span className="text-xs opacity-70">From Library</span>
                         </button>
                         <button 
                            type="button"
                            onClick={() => setShowAddMenu(false)}
                            className="absolute -top-3 -right-3 p-1.5 bg-[var(--background-secondary)] rounded-full text-muted hover:bg-[var(--moon-200)]"
                            aria-label="Close add menu"
                         >
                            <X size={14} />
                         </button>
                      </div>
                   )}
                </div>
             </>
           )}
             </div>
           </div>

           {/* Right panel: item detail (same component as library modal) */}
           {viewingItem && (() => {
             const itemId = viewingItem.itemId || viewingItem.id || (viewingItem as ScheduleDisplayItem).lesson_id || (viewingItem as ScheduleDisplayItem).assignment_id;
             const itemType = ((viewingItem.itemType || viewingItem.type) || 'lesson') as 'lesson' | 'assignment';
             const fullItem = itemType === 'lesson'
               ? lessons.find(l => l.id === itemId)
               : assignments.find(a => a.id === itemId);
             return (
               <div className="flex-1 overflow-y-auto p-4 md:p-6 border-l border-[var(--border)] bg-[var(--background-elevated)]/30">
                 <ItemDetailHeader
                   item={fullItem || null}
                   itemType={itemType}
                   onEdit={() => router.push(itemType === 'lesson' ? `/parent/lessons/${itemId}` : `/parent/assignments/${itemId}`)}
                   onBack={() => setViewingItem(null)}
                   compact
                 />
                 <div className="mt-4">
                   <ItemDetailView item={fullItem || null} itemType={itemType} compact />
                 </div>
               </div>
             );
           })()}
         </div>
      </div>
    </div>
  );
}
