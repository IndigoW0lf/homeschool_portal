'use client';

import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BookOpen, Globe, Layout, Tv, Pin, Calendar, Key, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagInput } from '@/components/ui/TagInput';
import { TAGS, STUDENTS } from '@/lib/mock-data';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { createResource, updateResource, deleteResource } from '@/lib/supabase/mutations';
import { useRouter } from 'next/navigation';

export const CATEGORIES = ['Reading', 'Logic & Math', 'Writing', 'Projects', 'Science', 'History', 'Life Skills', 'Art', 'Daily'] as const;
export const RESOURCE_TYPES = ['Video', 'Website', 'Book', 'App', 'Other'] as const;

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(CATEGORIES),
  type: z.enum(['website', 'video', 'book', 'app', 'other']).default('website'),
  
  // Logistics
  tags: z.array(z.string()).default([]),
  assignTo: z.array(z.string()).default([]), // Student IDs
  isPinned: z.boolean().default(false),
  showOnToday: z.boolean().default(false),
  frequency: z.enum(['Daily', 'Weekly', 'Optional', 'As Needed']).default('Optional'),
  accessInstructions: z.string().optional(),
  
  // Type-specific
  url: z.string().url().optional().or(z.literal('')),
  duration: z.number().optional(), // Minutes (Video)
  purposePrompt: z.string().optional(), // "Watch with purpose..." (Video)
  author: z.string().optional(), // Book
  readingLevel: z.string().optional(), // Book
  stopPoint: z.string().optional(), // Book (Chapter/Page)
  platform: z.string().optional(), // App (iOS, Web)
  loginHints: z.string().optional(), // App
  requiresAccount: z.boolean().default(false), // Website
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceFormProps {
  initialData?: Partial<ResourceFormData> & { id?: string };
  onSubmit?: (data: ResourceFormData) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function ResourceForm({ initialData, onSubmit: parentOnSubmit, onCancel, onDelete }: ResourceFormProps = {}) {
  const router = useRouter();
  const resolver = zodResolver(resourceSchema) as unknown as Resolver<ResourceFormData>;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ResourceFormData>({
    resolver,
    defaultValues: {
      tags: [],
      assignTo: [],
      isPinned: false,
      showOnToday: false, 
      type: 'website',
      frequency: 'Optional',
      ...initialData
    }
  });

  const tags = watch('tags');
  const type = watch('type');
  const assignedTo = watch('assignTo') || [];
  const isPinned = watch('isPinned');
  const showOnToday = watch('showOnToday');

  const toggleStudent = (studentId: string) => {
    const current = assignedTo;
    if (current.includes(studentId)) {
      setValue('assignTo', current.filter(id => id !== studentId));
    } else {
      setValue('assignTo', [...current, studentId]);
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
     try {
        const resourceData = {
           label: data.title,
           type: data.type,
           url: data.url || '',
           description: '', // TODO: Map fields to description or JSONB
           category: data.category,
           tags: data.tags,
           pinned_today: data.showOnToday,
           sort_order: 0,
           // Additional fields specific to resource types
           frequency: data.frequency,
           platform: data.platform || null,
           requires_account: data.requiresAccount || false,
           duration: data.duration || null,
           purpose_prompt: data.purposePrompt || null,
           author: data.author || null,
           reading_level: data.readingLevel || null,
           // stopPoint? loginHints? accessInstructions?
           access_instructions: (data.accessInstructions || data.loginHints) || null, 
           is_pinned: data.isPinned || false,
           show_on_today: data.showOnToday || false,
        };

        if (initialData?.id) {
           await updateResource(initialData.id, resourceData);
        } else {
           await createResource(resourceData);
        }

        router.refresh();
        if (parentOnSubmit) parentOnSubmit(data);
        else alert('Resource Saved!');
     } catch (err) {
        console.error(err);
        alert('Error saving resource');
     }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Layout className="text-[var(--ember-500)]" /> Add Resource
            </h2>
            <p className="text-sm text-gray-500">Add a reusable link, book, or app to the library.</p>
         </div>
         <div className="flex gap-2">
            <button 
               type="button" 
               onClick={() => setValue('isPinned', !isPinned)}
               className={cn("p-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium", isPinned ? "bg-amber-50 border-amber-300 text-amber-700" : "border-gray-200 text-gray-500")}
            >
               <Pin size={16} className={isPinned ? "fill-current" : ""} /> Pin to Top
            </button>
            <button 
               type="button" 
               onClick={() => setValue('showOnToday', !showOnToday)}
               className={cn("p-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium", showOnToday ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-500")}
            >
               <Calendar size={16} /> Show on Today
            </button>
         </div>
      </div>

      {/* 1. CORE DETAILS */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Title</label>
               <input 
                  {...register('title')}
                  placeholder="e.g. Khan Academy Kids"
                  className="w-full text-lg p-2 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-[var(--ember-500)] outline-none transition-colors placeholder:text-gray-300"
               />
               {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
               <select {...register('category')} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[var(--ember-500)] outline-none">
                  <option value="">Select Category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format Type</label>
               <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {RESOURCE_TYPES.map((t) => (
                     <button
                        key={t}
                        type="button"
                        onClick={() => setValue('type', t.toLowerCase() as ResourceFormData['type'])}
                        className={cn(
                           "flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-all",
                           type === t.toLowerCase() ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700"
                        )}
                     >
                        {t}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 2. DYNAMIC METADATA */}
      {/* Video */}
      {type === 'video' && (
         <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-900/30 animate-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-4">
               <Tv size={16} /> Video Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Video URL</label>
                  <input {...register('url')} placeholder="https://youtube.com/..." className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Duration (mins)</label>
                  <input {...register('duration', { valueAsNumber: true })} type="number" className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
               <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Purpose Question (&quot;Watch with purpose...&quot;)</label>
                  <input {...register('purposePrompt')} placeholder="e.g. What was the main idea?" className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
            </div>
         </div>
      )}

      {/* Book */}
      {type === 'book' && (
         <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-100 dark:border-amber-900/30 animate-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-4">
               <BookOpen size={16} /> Book Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Author</label>
                  <input {...register('author')} className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Reading Level (Lexile/Grade)</label>
                  <input {...register('readingLevel')} className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
            </div>
         </div>
      )}

      {/* Website */}
      {type === 'website' && (
         <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4">
               <Globe size={16} /> Website Details
            </h3>
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">URL</label>
                  <input {...register('url')} className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
               <div className="flex items-center gap-2">
                  <input type="checkbox" {...register('requiresAccount')} className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Requires Login?</span>
               </div>
            </div>
         </div>
      )}

      {/* 3. ASSIGNMENT & LOGISTICS */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
               <TagInput 
                  value={tags} 
                  onChange={(t) => setValue('tags', t)} 
                  placeholder="Add tags..." 
                  suggestions={TAGS} 
               />
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To</label>
               <div className="grid grid-cols-5 gap-2">
                  {STUDENTS.map(student => (
                     <div 
                        key={student.id} 
                        onClick={() => toggleStudent(student.id)}
                        className={cn(
                           "cursor-pointer p-1 rounded-full border-2 transition-all",
                           assignedTo.includes(student.id) ? "border-[var(--ember-500)] ring-2 ring-[var(--ember-500)]/20" : "border-transparent opacity-50 hover:opacity-100"
                        )}
                     >
                        <StudentAvatar name={student.name} className="w-10 h-10" />
                     </div>
                  ))}
               </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                     <Key size={14} /> Access Instructions / Login Hints
                  </label>
                  <input {...register('loginHints')} placeholder="e.g. Use shared family login" className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                  <select {...register('frequency')} className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                     <option value="Optional">Optional / As Needed</option>
                     <option value="Daily">Daily</option>
                     <option value="Weekly">Weekly</option>
                     <option value="As Needed">As Needed</option>
                  </select>
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
         {initialData?.id && (
           <button
              type="button"
              onClick={async () => {
                 if (confirm('Delete this resource?')) {
                    if (initialData.id) await deleteResource(initialData.id);
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
                {initialData?.id ? 'Save Changes' : 'Add Resource'}
             </button>
         </div>
      </div>

    </form>
  );
}
