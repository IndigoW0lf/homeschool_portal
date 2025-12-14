'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { X, CheckCircle, Circle, Plus, Copy, Sparkles, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { toggleScheduleItemComplete, deleteScheduleItemAction, assignItemToSchedule } from '@/lib/supabase/mutations';
import { Kid, Lesson, AssignmentItemRow } from '@/types';

interface DayModalProps {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedule?: any[];
  students?: Kid[];
  lessons?: Lesson[];
  assignments?: AssignmentItemRow[];
}

export function DayModal({ date, isOpen, onClose, schedule = [], students = [], lessons = [], assignments = [] }: DayModalProps) {

  const router = useRouter();
  const [activeVariationId, setActiveVariationId] = useState<string | null>(null);
  const [variationText, setVariationText] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pickerType, setPickerType] = useState<'lesson' | 'assignment' | null>(null);

  if (!isOpen) return null;

  const dateStr = format(date, 'yyyy-MM-dd');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = schedule.filter((s: any) => s.date === dateStr);

  // Group by student
  const studentSchedules = students.map(student => {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const myItems = items.filter((i: any) => i.studentId === student.id);
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
      description: 'This will remove the item from this day\'s playlist.',
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            await deleteScheduleItemAction(id);
            toast.success('Removed! 🗑️', { description: 'Item removed from schedule.' });
            router.refresh();
          } catch (err) {
            console.error(err);
            toast.error('Failed to remove item');
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
        // Default to all students for now if no specific logic, or better: just the "Primary" one?
        // Let's toggle all active students for this day context? 
        // For simplicity, let's just pick the first student or all students.
        // The user request didn't specify student picker in the library picker, so let's default to ALL students in the Modal context.
        const targetStudentIds = students.map(s => s.id);
        
        await assignItemToSchedule(type, item.id, dateStr, targetStudentIds);
        
        toast.success('Added to Schedule! 📅', {
           description: `"${item.title}" added for ${targetStudentIds.length} student(s).`
        });
        
        setPickerType(null); // return to list
        router.refresh();
     } catch (err) {
        console.error(err);
        toast.error('Could not schedule item');
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </h2>
             <p className="text-sm text-gray-500">Day Plan & Playlist</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

         {/* Scrollable Playlist OR Picker */}
         <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-black/20">
           
           {pickerType ? (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setPickerType(null)} className="p-1 hover:bg-gray-200 rounded-full">
                       <X size={20} />
                    </button>
                    <h3 className="font-bold text-lg">Select {pickerType === 'lesson' ? 'Lesson' : 'Assignment'}</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-2">
                    {(pickerType === 'lesson' ? lessons : assignments).map((item) => (
                       <div 
                          key={item.id}
                          onClick={() => handleScheduleItem(item)}
                          className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-[var(--ember-400)] cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
                       >
                          <div>
                             <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                             <p className="text-xs text-gray-500">
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
                       <div className="text-center py-10 text-gray-400">
                          <p>No items found in library.</p>
                       </div>
                    )}
                 </div>
              </div>
           ) : (
             <>
               {/* Normal Playlist View */}
               {/* Pinned Morning Routine (Mock) */}
               <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl relative group">
                  <div className="pt-1 text-amber-400"><CheckCircle size={20} /></div>
                  <div className="flex-1">
                     <h3 className="font-semibold text-gray-900 dark:text-white">Morning Routine</h3>
                     <p className="text-sm text-gray-500">Breakfast, Teeth, MiAcademy</p>
                  </div>
                  <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 rounded-full">Pinned</div>
               </div>
    
               {/* Scheduled Items */}
               {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
               {items.map((item: any) => (
                 <div key={item.id} className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-[var(--ember-200)]">
                   
                   {/* Variation Overlay */}
                   {activeVariationId === item.id && (
                      <div className="absolute inset-x-0 -top-12 z-10 bg-white dark:bg-gray-800 p-3 rounded-t-xl border-x border-t border-[var(--ember-200)] shadow-lg animate-in slide-in-from-bottom-2">
                         <div className="flex gap-2">
                            <Sparkles size={16} className="text-[var(--ember-500)] mt-2" />
                            <div className="flex-1">
                               <label className="text-xs font-bold text-[var(--ember-600)] uppercase block mb-1">Customize for Today</label>
                               <input 
                                   autoFocus
                                   value={variationText}
                                   onChange={e => setVariationText(e.target.value)}
                                   placeholder="e.g. Read only pages 10-15..." 
                                   className="w-full text-sm bg-transparent outline-none placeholder:text-gray-400"
                                />
                            </div>
                            <button onClick={() => applyVariation(item.id)} className="px-3 py-1 bg-[var(--ember-500)] text-white text-xs font-bold rounded-lg hover:opacity-90">
                               Save
                            </button>
                         </div>
                      </div>
                   )}
    
                   <div className="flex items-center gap-4 p-4">
                      <div className="text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500">
                         <GripVertical size={20} />
                      </div>
                      
                      <div 
                         onClick={async () => {
                            const newStatus = !item.status || item.status === 'pending';
                            try {
                               await toggleScheduleItemComplete(item.id, newStatus);
                               
                               // Optimistic / Feedback
                               if (newStatus) {
                                  // Check if this was the last one (simple heuristic based on current props)
                                  const studentItems = studentSchedules.find(s => s.student.id === item.studentId)?.items || [];
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  const remaining = studentItems.filter((i: any) => i.id !== item.id && (!i.status || i.status === 'pending')).length;
                                  
                                  if (remaining === 0) {
                                     toast.success('High Five! 🙌', {
                                        description: 'You finished everything for today!',
                                        duration: 5000,
                                        action: {
                                           label: 'Close',
                                           onClick: () => onClose()
                                        }
                                     });
                                  } else {
                                     toast.success('Good job! 🌟', {
                                        description: 'Item marked as complete.',
                                        duration: 2000
                                     });
                                  }
                               }
                               router.refresh();
                            } catch (e) {
                               console.error('Error toggling completion:', e);
                               toast.error('Could not update status');
                            }
                         }} 
                         className={cn("cursor-pointer transition-colors", item.status === 'completed' ? "text-green-500" : "text-gray-300 hover:text-gray-400")}
                      >
                         {item.status === 'completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                      </div>
    
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                               "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                               item.type === 'lesson' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            )}>
                               {item.type}
                            </span>
                            {item.studentIds && (item.studentIds as string[]).map((sid: string) => {
                               const s = students.find(stu => stu.id === sid);
                               return s ? <StudentAvatar key={s.id} name={s.name} className="w-5 h-5 text-[8px]" /> : null;
                            })}
                         </div>
                         <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {item.title || 'Untitled Item'}
                         </h3>
                         {item.type && (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            <p className="text-sm text-gray-500">{item.title ? item.type : ''} • {item.details?.estimatedMinutes || (item as any).estimated_minutes || 20} mins</p>
                         )}
                      </div>
    
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                             onClick={() => handleCloneWithVariation(item.id)}
                             className="p-2 text-gray-400 hover:text-[var(--ember-500)] hover:bg-[var(--ember-50)] rounded-lg tooltip-trigger"
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
                             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                             title="Remove from schedule"
                         >
                            <Trash2 size={18} />
                         </button>
                      </div>
                   </div>
                 </div>
               ))}
    
               {/* Add Button */}
               {/* Add Button Area */}
                <div className="relative">
                   {!showAddMenu ? (
                      <button 
                       onClick={() => setShowAddMenu(true)}
                       className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:border-[var(--ember-400)] hover:text-[var(--ember-600)] hover:bg-[var(--ember-50)] transition-all flex items-center justify-center gap-2 group"
                      >
                         <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[var(--ember-200)] flex items-center justify-center transition-colors">
                            <Plus size={20} />
                         </div>
                         <span className="font-medium">Add to Playlist</span>
                      </button>
                   ) : (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                         <button 
                            onClick={() => handleAddItem('lesson')}
                            className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 transition-all text-blue-700"
                         >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                               <Plus size={20} />
                            </div>
                            <span className="font-bold">Add Lesson</span>
                            <span className="text-xs opacity-70">From Library</span>
                         </button>
                         <button 
                            onClick={() => handleAddItem('assignment')}
                            className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-purple-100 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300 transition-all text-purple-700"
                         >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                               <Plus size={20} />
                            </div>
                            <span className="font-bold">Add Assignment</span>
                            <span className="text-xs opacity-70">From Library</span>
                         </button>
                         <button 
                            onClick={() => setShowAddMenu(false)}
                            className="absolute -top-3 -right-3 p-1.5 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300"
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
    </div>
  );
}
