'use client';

import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PenTool, CheckSquare, Clock, Link as LinkIcon, Plus, X, EyeOff, FileText, Layers, Users, Trash2 } from 'lucide-react';
import { TagInput } from '@/components/ui/TagInput';
import { TAGS, STUDENTS } from '@/lib/mock-data';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { cn } from '@/lib/utils';
import { createAssignment, updateAssignment, deleteAssignment } from '@/lib/supabase/mutations';
import { useRouter } from 'next/navigation';

export const ASSIGNMENT_TYPES = [
  'Practice', 'Project', 'Journal', 'Creative', 'Logic Drill', 'Experiment', 'Essay'
];

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(ASSIGNMENT_TYPES as [string, ...string[]]).default('Practice'),
  deliverable: z.string().min(1, 'What should the student turn in?'),
  steps: z.array(z.object({ text: z.string() })).default([]),
  rubric: z.array(z.object({ text: z.string() })).default([]),
  parentNotes: z.string().default(''),
  estimatedMinutes: z.number().min(1).default(15),
  tags: z.array(z.string()).default([]),
  links: z.array(z.object({ 
    url: z.string().url(), 
    label: z.string() 
  })).default([]),
  assignTo: z.array(z.string()).default([]),
  isTemplate: z.boolean().default(true),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  initialData?: Partial<AssignmentFormData> & { id?: string };
  onSubmit?: (data: AssignmentFormData) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function AssignmentForm({ initialData, onSubmit: parentOnSubmit, onDelete, onCancel }: AssignmentFormProps = {}) {
  const router = useRouter();
  const resolver = zodResolver(assignmentSchema) as unknown as Resolver<AssignmentFormData>;

  const defaultValues: AssignmentFormData = {
      title: '',
      type: 'Practice',
      deliverable: '',
      tags: [],
      links: [],
      rubric: [{ text: '' }],
      steps: [{ text: '' }],
      assignTo: [],
      estimatedMinutes: 15,
      isTemplate: true,
      parentNotes: '',
      ...initialData
  };

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AssignmentFormData>({
    resolver,
    defaultValues,
  });

  const { fields: rubricFields, append: appendRubric, remove: removeRubric } = useFieldArray({
    control,
    name: "rubric"
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: "steps"
  });

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: "links"
  });

  const tags = watch('tags');
  const assignedTo = watch('assignTo');

  const toggleStudent = (studentId: string) => {
    const current = assignedTo || [];
    if (current.includes(studentId)) {
      setValue('assignTo', current.filter(id => id !== studentId));
    } else {
      setValue('assignTo', [...current, studentId]);
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
     try {
        const assignmentData = {
           title: data.title,
           type: data.type,
           deliverable: data.deliverable,
           parent_notes: data.parentNotes,
           estimated_minutes: data.estimatedMinutes,
           tags: data.tags,
           is_template: data.isTemplate,
           // JSON/HACK Fields until schema update or JSONB column refinement
           rubric: data.rubric,
           steps: data.steps, 
           links: data.links,
        };

        if (initialData?.id) {
           await updateAssignment(initialData.id, assignmentData);
        } else {
           await createAssignment(assignmentData);
        }

        router.refresh();
        if (parentOnSubmit) parentOnSubmit(data);
        else alert('Assignment Saved!');
     } catch (err) {
        console.error(err);
        alert('Error saving assignment');
     }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
         <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PenTool className="text-[var(--ember-500)]" /> Create Assignment
             </h2>
             <p className="text-sm text-gray-500 mt-2">Design a task or project (Output / Do)</p>
          </div>
         <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <span className="text-xs font-medium px-2 text-gray-500">Template?</span>
            <input type="checkbox" {...register('isTemplate')} className="w-4 h-4 text-[var(--ember-500)] rounded" />
         </div>
      </div>

      {/* 1. CORE INFO & DELIVERABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 md:col-span-2">
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignment Title</label>
               <input
                  {...register('title')}
                  placeholder="e.g. Fraction Pizza Project"
                  className="w-full text-lg p-2 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-[var(--ember-500)] outline-none transition-colors placeholder:text-gray-300"
               />
               {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Process / Type</label>
                  <select
                     {...register('type')}
                     className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[var(--ember-500)] outline-none"
                  >
                     {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               
               {/* Students Selection */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                     <Users size={16} className="text-[var(--ember-500)]" /> Assign To
                  </label>
                  <div className="flex gap-2">
                     {STUDENTS.map(student => (
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
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" /> Expected Deliverable
               </label>
               <input
                  {...register('deliverable')}
                  placeholder="e.g. A drawing of 3 pizzas"
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[var(--ember-500)] outline-none"
               />
               {errors.deliverable && <p className="text-red-500 text-xs mt-1">{errors.deliverable.message}</p>}
            </div>
         </div>
      </div>

      {/* 2. RUBRIC & INSTRUCTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rubric / Criteria */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
               <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <CheckSquare size={18} className="text-green-500" /> Success Criteria (Rubric)
               </h3>
               <p className="text-xs text-gray-500">I can...</p>
               
               <div className="space-y-3">
                  {rubricFields.map((field, index) => (
                     <div key={field.id} className="flex gap-2 items-center">
                        <input type="checkbox" disabled className="text-gray-300 rounded" />
                        <input
                           {...register(`rubric.${index}.text` as const)}
                           className="flex-1 p-2 text-sm rounded bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 focus:ring-1 focus:ring-[var(--ember-500)] outline-none"
                           placeholder="e.g. I can identify 1/2 of a circle..."
                        />
                        <button type="button" onClick={() => removeRubric(index)} className="text-gray-300 hover:text-red-400">
                           <X size={14} />
                        </button>
                     </div>
                  ))}
                  <button
                     type="button"
                     onClick={() => appendRubric({ text: '' })}
                     className="text-xs flex items-center gap-1 text-[var(--ember-600)] font-medium hover:underline"
                  >
                     <Plus size={14} /> Add Criterion
                  </button>
               </div>
          </div>

          {/* Instructions & Notes */}
          <div className="space-y-6">
             <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Steps</label>
                 <div className="space-y-3">
                    {stepFields.map((field, index) => (
                       <div key={field.id} className="flex gap-2 items-start">
                          <span className="text-sm font-bold text-gray-400 w-6 pt-2 text-right">{index + 1}.</span>
                          <textarea
                             {...register(`steps.${index}.text` as const)}
                             className="flex-1 p-2 text-sm rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-[var(--ember-500)] outline-none resize-none"
                             rows={2}
                             placeholder={`Step ${index + 1}...`}
                          />
                          <button type="button" onClick={() => removeStep(index)} className="text-gray-300 hover:text-red-400 pt-2">
                             <X size={14} />
                          </button>
                       </div>
                    ))}
                    <button
                       type="button"
                       onClick={() => appendStep({ text: '' })}
                       className="text-xs flex items-center gap-1 text-[var(--ember-600)] font-medium hover:underline ml-8"
                    >
                       <Plus size={14} /> Add Step
                    </button>
                 </div>
             </div>

             <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400">
                   <EyeOff size={16} /> Parent Notes (Private)
                </label>
                <textarea
                   {...register('parentNotes')}
                   rows={2}
                   className="w-full text-sm p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                   placeholder="How to support them..."
                />
             </div>
          </div>
      </div>

      {/* 3. LOGISTICS & LINKS */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
         <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-[var(--ember-500)]" /> Resources & Tags
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                <TagInput
                   value={tags}
                   onChange={(newTags) => setValue('tags', newTags)}
                   placeholder="Add tags..."
                   suggestions={TAGS}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                   <Clock size={14} /> Est. Minutes
                </label>
                <input
                   type="number"
                   {...register('estimatedMinutes', { valueAsNumber: true })}
                   className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
                />
             </div>
         </div>
         
         <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments & Links</label>
                <button type="button" onClick={() => appendLink({ url: '', label: '' })} className="text-xs flex items-center gap-1 text-[var(--ember-600)] hover:underline">
                   <Plus size={14} /> Add Link
                </button>
             </div>
             
             <div className="space-y-2">
                {linkFields.map((field, index) => (
                   <div key={field.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                      <LinkIcon size={14} className="text-gray-400" />
                      <input {...register(`links.${index}.label`)} placeholder="Label" className="flex-1 min-w-[120px] p-1.5 text-sm rounded border border-gray-200 bg-white dark:bg-gray-800" />
                      <input {...register(`links.${index}.url`)} placeholder="URL" className="flex-1 min-w-[150px] p-1.5 text-sm rounded border border-gray-200 bg-white dark:bg-gray-800" />
                      <button type="button" onClick={() => removeLink(index)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                   </div>
                ))}
             </div>
         </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
         {initialData?.id && (
           <button
              type="button"
              onClick={async () => {
                 if (confirm('Are you sure you want to delete this assignment?')) {
                    if (initialData.id) await deleteAssignment(initialData.id);
                    if (onDelete) onDelete();
                    router.refresh();
                 }
              }}
              className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
           >
              <Trash2 size={16} /> Delete
           </button>
         )}
         <div className="flex gap-2 ml-auto">
             {onCancel && (
                <button
                   type="button"
                   onClick={onCancel}
                   className="px-6 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                >
                   Cancel
                </button>
             )}
             <button
                type="submit"
                className="px-8 py-3 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 shadow-lg shadow-[var(--ember-500)/20] transition-all hover:-translate-y-0.5"
             >
                {initialData?.id ? 'Save Changes' : 'Save Assignment to Library'}
             </button>
         </div>
      </div>

    </form>
  );
}
