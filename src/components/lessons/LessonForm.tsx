'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { BookOpen, Clock, Link, Plus, X, EyeClosed, Question, Stack, Users, MagicWand, Spinner } from '@phosphor-icons/react';
import { TagInput } from '@/components/ui/TagInput';
import { TAGS } from '@/lib/mock-data';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { cn } from '@/lib/utils';
import { Kid } from '@/types';
import { updateLesson, assignItemToSchedule } from '@/lib/supabase/mutations';
import { useRouter, useSearchParams } from 'next/navigation';
import { LunaTriggerButton } from '@/components/luna';
import { supabase } from '@/lib/supabase/browser';

const LESSON_TYPES = [
  // Academic
  'Math', 'Science', 'History', 'Language Arts', 'Art', 'Music', 'PE', 'Coding',
  // Life Skills
  'Self & Mind', 'Thinking & Truth', 'Agency & Responsibility', 
  'Relationships & Community', 'Body & Nervous System', 'Systems & Society',
  // Other
  'Life Skills'
];

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(LESSON_TYPES as [string, ...string[]]).default('Math'),
  description: z.string().default(''),
  keyQuestions: z.array(z.object({ text: z.string() })).default([]),
  estimatedMinutes: z.number().min(1).default(30),
  materials: z.string().default(''),
  parentNotes: z.string().default(''),
  assignTo: z.array(z.string()).default([]),
  date: z.string().optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(z.object({ 
    url: z.string().url(), 
    label: z.string() 
  })).default([]),
  isTemplate: z.boolean().default(true),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  initialData?: LessonFormData & { id: string };
  onSubmit?: (data: LessonFormData) => void;
  onCancel?: () => void;
  onDelete?: (id: string) => void;
  students?: Kid[];
}

export function LessonForm({ initialData, onSubmit: parentOnSubmit, students: propStudents = [] }: LessonFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromLuna = searchParams.get('from') === 'luna';
  const isFromQuickStart = searchParams.get('from') === 'quickstart';
  const shouldPrefill = isFromLuna || isFromQuickStart;
  const resolver = zodResolver(lessonSchema) as unknown as Resolver<LessonFormData>;
  
  // State for fetched students
  const [fetchedStudents, setFetchedStudents] = useState<Kid[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(propStudents.length === 0);
  // Track if we've already fetched to prevent infinite loops
  const hasFetchedRef = React.useRef(false);
  
  // Fetch students from database if not passed as prop
  useEffect(() => {
    // Only fetch if no students were passed as props
    if (propStudents.length > 0) {
      setFetchedStudents(propStudents);
      setStudentsLoading(false);
      return;
    }
    
    // Prevent re-fetching using ref (survives re-renders)
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    
    async function fetchKids() {
      try {
        const { data, error } = await supabase
          .from('kids')
          .select('id, name, grade_band')
          .order('name');
        
        if (error) throw error;
        
        // Map DB fields to Kid type
        const mappedKids: Kid[] = (data || []).map(k => ({
          id: k.id,
          name: k.name,
          gradeBand: k.grade_band || '3-5',
        }));
        
        setFetchedStudents(mappedKids);
      } catch (err) {
        console.error('Failed to fetch kids:', err);
      } finally {
        setStudentsLoading(false);
      }
    }
    
    fetchKids();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  const effectiveStudents = fetchedStudents;

  const defaultValues: LessonFormData = {
    title: '',
    type: 'Math',
    tags: [],
    links: [],
    keyQuestions: [{ text: '' }],
    isTemplate: true,
    estimatedMinutes: 20,
    materials: '',
    parentNotes: '',
    assignTo: initialData?.assignTo || [],
    description: '',
    date: new Date().toISOString().split('T')[0],
    ...initialData,
  };

  const { register, handleSubmit, setValue, watch, control, reset, formState: { errors } } = useForm<LessonFormData>({
    resolver,
    defaultValues,
  });

  // Check for Luna/QuickStart pre-fill data on mount
  useEffect(() => {
    if (shouldPrefill && typeof window !== 'undefined') {
      const prefillData = sessionStorage.getItem('luna-prefill');
      if (prefillData) {
        try {
          const { type, data } = JSON.parse(prefillData);
          if (type === 'lesson' && data) {
            reset({
              ...defaultValues,
              ...data,
            });
            sessionStorage.removeItem('luna-prefill');
          }
        } catch (e) {
          console.error('Failed to parse Luna pre-fill data:', e);
        }
      }
    }
  }, [isFromLuna, reset]);

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "keyQuestions"
  });

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: "links"
  });

  const tags = watch('tags');
  const assignedTo = watch('assignTo');

  // AI Refinement state (only for edit mode)
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    if (!refinementFeedback.trim()) return;
    
    setIsRefining(true);
    try {
      const currentData = {
        title: watch('title'),
        type: watch('type'),
        description: watch('description'),
        keyQuestions: watch('keyQuestions'),
        materials: watch('materials'),
        estimatedMinutes: watch('estimatedMinutes'),
        parentNotes: watch('parentNotes'),
        tags: watch('tags'),
        links: watch('links'),
      };

      const res = await fetch('/api/refine-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonData: currentData,
          feedback: refinementFeedback,
        }),
      });

      if (!res.ok) throw new Error('Refinement failed');

      const { data } = await res.json();
      
      // Update form with refined data
      reset({
        ...currentData,
        ...data,
        assignTo: watch('assignTo'),
        date: watch('date'),
        isTemplate: watch('isTemplate'),
      });

      setRefinementFeedback('');
      toast.success('Lesson refined! Review the changes below.');
    } catch {
      toast.error('Failed to refine. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    const current = assignedTo || [];
    if (current.includes(studentId)) {
      setValue('assignTo', current.filter(id => id !== studentId));
    } else {
      setValue('assignTo', [...current, studentId]);
    }
  };

  const onSubmit = async (data: LessonFormData) => {
     try {
        let savedId = initialData?.id;

        if (initialData?.id) {
           // Update existing lesson directly
           const lessonData = {
              title: data.title,
              type: data.type,
              instructions: data.description || '',
              description: data.description,
              key_questions: data.keyQuestions,
              materials: data.materials,
              links: data.links,
              tags: data.tags,
              estimated_minutes: data.estimatedMinutes,
              parent_notes: data.parentNotes,
           };
           await updateLesson(initialData.id, lessonData);
        } else {
           // Create new lesson via API (enables YouTube video + worksheet enrichment)
           const res = await fetch('/api/lessons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                 title: data.title,
                 type: data.type,
                 description: data.description,
                 instructions: data.description, // Pass both for flexibility
                 estimated_minutes: data.estimatedMinutes,
                 links: data.links,
                 assignTo: data.assignTo,
                 scheduleDate: data.date,
                 generateWorksheet: true, // Enable worksheet generation
              }),
           });
           
           if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || 'Failed to create lesson');
           }
           
           const result = await res.json();
           savedId = result.id;
           
           // Log enrichment results
           if (result.videoCount > 0) {
              console.log(`[LessonForm] Added ${result.videoCount} YouTube videos`);
           }
           if (result.hasWorksheet) {
              console.log('[LessonForm] Worksheet generated and attached');
           }
        }

        // Note: Scheduling is now handled by the API for new lessons
        // For updates, we still need to handle it here
        if (initialData?.id && savedId && data.date && data.assignTo.length > 0) {
          await assignItemToSchedule('lesson', savedId, data.date, data.assignTo);
        }
        
        router.refresh(); /* Refresh server components */
        if (parentOnSubmit) {
          parentOnSubmit(data);
        } else {
          // Fallback feedback if used standalone
          if (savedId && data.date && data.assignTo.length > 0) {
             toast.success('Lesson Scheduled! 📅', {
               description: `"${data.title}" added to calendar for ${data.date}.`,
               duration: 4000
             });
          } else if (savedId && data.date) {
             toast.warning('Lesson Saved, but NOT Scheduled', {
               description: 'You selected a date but no students. Please edit to assign.',
               duration: 5000
             });
          } else {
             toast.success('Lesson Saved to Library! 📚', {
               description: 'You can schedule it later from the details page.'
             });
          }
        }
     } catch (err) {
        console.error(err);
        toast.error('Uh oh! Could not save lesson.', {
           description: 'Please check your connection and try again.'
        });
     }
  };



  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
         <div>
             <h2 className="heading-lg flex items-center gap-2">
               <BookOpen className="text-[var(--ember-500)]" /> Create Lesson
             </h2>
             <p className="text-sm text-muted">Design a reusable teaching unit (Input / Teach)</p>
         </div>
         <div className="flex items-center gap-3">
            <LunaTriggerButton context="GENERAL" label="Need ideas?" iconOnly={false} />
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
               <span className="text-xs font-medium px-2 text-gray-500">Template?</span>
               <input type="checkbox" {...register('isTemplate')} className="w-4 h-4 text-[var(--ember-500)] rounded" />
            </div>
         </div>
      </div>

      {/* AI Refinement Section - shown when editing */}
      {initialData?.id && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-3">
            <MagicWand size={18} weight="fill" className="text-purple-500" />
            <label className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Refine with AI
            </label>
          </div>
          <textarea 
            value={refinementFeedback}
            onChange={(e) => setRefinementFeedback(e.target.value)}
            placeholder="Describe changes, e.g., 'Add a video about photosynthesis' or 'Include more hands-on activities' or 'Add 2 more discussion questions'"
            rows={2}
            className="w-full p-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 transition-all text-sm"
          />
          <button 
            type="button"
            onClick={handleRefine}
            disabled={!refinementFeedback.trim() || isRefining}
            className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold text-sm hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRefining ? (
              <>
                <Spinner size={16} className="animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <MagicWand size={16} />
                Apply Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* 1. CORE INFO */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
            <div>
               <label className="input-label">Lesson Title</label>
               <input
                  {...register('title')}
                  placeholder="e.g. Introduction to Fractions"
                  className="w-full text-lg p-2 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-[var(--ember-500)] outline-none transition-colors placeholder:text-gray-300"
               />
               {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Row 2: Schedule Date + Assign To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="input-label mb-2">Schedule Date</label>
                  <input 
                     type="date"
                     {...register('date')}
                     className="input"
                  />
               </div>

               {/* Students Selection - Right side */}
               <div>
                  <label className="input-label mb-2 flex items-center gap-1">
                     <Users size={14} className="text-[var(--ember-500)]" /> Assign To
                  </label>
                  {studentsLoading ? (
                    <div className="text-sm text-muted">Loading kids...</div>
                  ) : effectiveStudents.length === 0 ? (
                    <div className="text-sm text-muted italic">
                      No kids added yet. <a href="/parent/settings" className="text-[var(--ember-500)] underline">Add a kid</a> to assign lessons.
                    </div>
                  ) : (
                    <div className="flex gap-2">
                       {effectiveStudents.map(student => (
                          <div 
                             key={student.id} 
                             onClick={() => toggleStudent(student.id)}
                             className={cn(
                                "cursor-pointer p-1 rounded-full border-2 transition-all",
                                assignedTo?.includes(student.id) ? "border-[var(--ember-500)] ring-2 ring-[var(--ember-500)]/20" : "border-transparent opacity-50 hover:opacity-100"
                             )}
                          >
                             <StudentAvatar name={student.name} className="w-10 h-10" />
                          </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>

            {/* Row 3: Subject/Type only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="input-label mb-2">Subject / Type</label>
                  <select
                     {...register('type')}
                     className="select"
                  >
                     {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
            </div>
       </div>

      {/* 2. TEACHING CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Questions */}
           <div className="card p-6 space-y-4">
               <h3 className="heading-sm flex items-center gap-2">
                   <Question size={18} weight="duotone" color="#e7b58d" /> Key Questions
               </h3>
               <p className="text-xs text-muted">2-5 checks for understanding.</p>
               
               <div className="space-y-3">
                  {questionFields.map((field, index) => (
                     <div key={field.id} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-gray-300 w-4">{index + 1}</span>
                        <input
                           {...register(`keyQuestions.${index}.text` as const)}
                           className="input-sm flex-1"
                           placeholder="e.g. What is the numerator?"
                        />
                        <button type="button" onClick={() => removeQuestion(index)} className="text-gray-300 hover:text-red-400">
                           <X size={14} />
                        </button>
                     </div>
                  ))}
                  <button
                     type="button"
                     onClick={() => appendQuestion({ text: '' })}
                     className="text-xs flex items-center gap-1 text-[var(--ember-600)] font-medium hover:underline"
                  >
                     <Plus size={14} /> Add Question
                  </button>
               </div>
          </div>

          {/* Notes & Materials */}
          <div className="space-y-6">
             <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400">
                    <EyeClosed size={16} weight="duotone" color="#e7b58d" /> Parent Notes (Private)
                </label>
                <textarea
                   {...register('parentNotes')}
                   rows={3}
                   className="w-full text-sm p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                   placeholder="Tips, tricky concepts, reminders..."
                />
             </div>

             <div>
                <label className="input-label">Materials Needed</label>
                <textarea
                   {...register('materials')}
                   rows={2}
                   className="textarea text-sm"
                   placeholder="e.g. Ruler, graph paper, colored pencils"
                />
             </div>
          </div>
      </div>

      {/* 3. LOGISTICS & LINKS */}
       <div className="card p-6 space-y-6">
         <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
             <Stack size={18} weight="duotone" color="#e7b58d" /> Resources & Tags
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="input-label">Tags</label>
                <TagInput
                   value={tags}
                   onChange={(newTags) => setValue('tags', newTags)}
                   placeholder="Add tags..."
                   suggestions={TAGS}
                />
             </div>
             <div>
                <label className="input-label mb-2 flex items-center gap-1">
                   <Clock size={14} /> Est. Minutes
                </label>
                <input
                   type="number"
                   {...register('estimatedMinutes', { valueAsNumber: true })}
                   className="input"
                />
             </div>
         </div>
         
         <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-3">
                 <label className="input-label">Attachments & Links</label>
                <button type="button" onClick={() => appendLink({ url: '', label: '' })} className="text-xs flex items-center gap-1 text-[var(--ember-600)] hover:underline">
                   <Plus size={14} /> Add Resource
                </button>
             </div>
             
             <div className="space-y-2">
                {linkFields.map((field, index) => (
                   <div key={field.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                       <Link size={14} weight="duotone" color="#b6e1d8" />
                      <input {...register(`links.${index}.label`)} placeholder="Label" className="flex-1 min-w-[120px] p-1.5 text-sm rounded border border-gray-200 bg-white dark:bg-gray-800" />
                       <input {...register(`links.${index}.url`)} placeholder="URL" className="flex-1 min-w-[150px] p-1.5 text-sm rounded border border-gray-200 bg-white dark:bg-gray-800" />
                       {/* Link Type removed from schema for now to fix errors */}
                      <button type="button" onClick={() => removeLink(index)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                   </div>
                ))}
             </div>
         </div>
      </div>

      <div className="flex justify-end pt-4">
         <button
            type="submit"
             className="btn-primary px-8 py-3 shadow-lg shadow-[var(--ember-500)/20] hover:-translate-y-0.5"
         >
            Save Lesson to Library
         </button>
      </div>

    </form>
  );
}
