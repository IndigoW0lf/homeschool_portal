'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Sparkle, Clock, Link as LinkIcon, Plus, X, EyeClosed, Question, Stack, Users, 
  CheckSquare, FileText, ListNumbers, MagicWand, File
} from '@phosphor-icons/react';
import { TagInput } from '@/components/ui/TagInput';
import { TAGS } from '@/lib/mock-data';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { cn } from '@/lib/utils';
import { Kid, WorksheetData } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { LunaTriggerButton } from '@/components/luna';
import { supabase } from '@/lib/supabase/browser';
import { WorksheetGeneratorModal } from '@/components/worksheets/WorksheetGeneratorModal';

// Merged types from both Lesson and Assignment
const ACTIVITY_TYPES = [
  // Academic (from Lessons)
  'Math', 'Science', 'History', 'Language Arts', 'Art', 'Music', 'PE', 'Coding',
  // Life Skills
  'Self & Mind', 'Thinking & Truth', 'Agency & Responsibility', 
  'Relationships & Community', 'Body & Nervous System', 'Systems & Society',
  // Practice Types (from Assignments)
  'Practice', 'Project', 'Journal', 'Creative', 'Logic Drill', 'Experiment', 'Essay',
  // Other
  'Life Skills', 'Other'
];

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(ACTIVITY_TYPES as [string, ...string[]]).default('Math'),
  description: z.string().default(''),
  deliverable: z.string().default(''),
  keyQuestions: z.array(z.object({ text: z.string() })).default([]),
  steps: z.array(z.object({ text: z.string() })).default([]),
  rubric: z.array(z.object({ text: z.string() })).default([]),
  materials: z.string().default(''),
  parentNotes: z.string().default(''),
  estimatedMinutes: z.number().min(1).default(30),
  assignTo: z.array(z.string()).default([]),
  date: z.string().optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(z.object({ 
    url: z.string().url(), 
    label: z.string() 
  })).default([]),
  isTemplate: z.boolean().default(false),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  initialData?: ActivityFormData & { id?: string };
  onSubmit?: (data: ActivityFormData) => void;
  onCancel?: () => void;
}

export function ActivityForm({ initialData, onSubmit: parentOnSubmit }: ActivityFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromLuna = searchParams.get('from') === 'luna';
  const isFromQuickStart = searchParams.get('from') === 'quickstart';
  const shouldPrefill = isFromLuna || isFromQuickStart;
  const resolver = zodResolver(activitySchema) as unknown as Resolver<ActivityFormData>;
  
  // State
  const [students, setStudents] = useState<Kid[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [worksheetModalOpen, setWorksheetModalOpen] = useState(false);
  const [attachedWorksheets, setAttachedWorksheets] = useState<WorksheetData[]>([]);
  const [autoGenerateWorksheet, setAutoGenerateWorksheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasFetchedRef = React.useRef(false);
  
  // Collapsible sections - expanded by default if content exists
  const [showTeaching, setShowTeaching] = useState(true);
  const [showPractice, setShowPractice] = useState(false);
  
  // Fetch students
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    async function fetchKids() {
      try {
        const { data, error } = await supabase
          .from('kids')
          .select('id, name, grade_band')
          .order('name');
        
        if (error) throw error;
        
        const mappedKids: Kid[] = (data || []).map(k => ({
          id: k.id,
          name: k.name,
          gradeBand: k.grade_band || '3-5',
        }));
        
        setStudents(mappedKids);
      } catch (err) {
        console.error('Failed to fetch kids:', err);
      } finally {
        setStudentsLoading(false);
      }
    }
    
    fetchKids();
  }, []);

  const defaultValues: ActivityFormData = {
    title: '',
    type: 'Math',
    description: '',
    deliverable: '',
    keyQuestions: [],
    steps: [],
    rubric: [],
    materials: '',
    parentNotes: '',
    estimatedMinutes: 30,
    assignTo: [],
    date: new Date().toISOString().split('T')[0],
    tags: [],
    links: [],
    isTemplate: false,
    ...initialData,
  };

  const { register, handleSubmit, setValue, watch, control, reset, formState: { errors } } = useForm<ActivityFormData>({
    resolver,
    defaultValues,
  });

  // Luna pre-fill
  useEffect(() => {
    if (shouldPrefill && typeof window !== 'undefined') {
      const prefillData = sessionStorage.getItem('luna-prefill');
      if (prefillData) {
        try {
          const { data } = JSON.parse(prefillData);
          if (data) {
            reset({ ...defaultValues, ...data });
            sessionStorage.removeItem('luna-prefill');
          }
        } catch (e) {
          console.error('Failed to parse Luna pre-fill data:', e);
        }
      }
    }
  }, [isFromLuna, reset]);

  // Field arrays
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "keyQuestions"
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: "steps"
  });

  const { fields: rubricFields, append: appendRubric, remove: removeRubric } = useFieldArray({
    control,
    name: "rubric"
  });

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: "links"
  });

  const tags = watch('tags');
  const assignedTo = watch('assignTo');
  const title = watch('title');
  const type = watch('type');

  const toggleStudent = (studentId: string) => {
    const current = assignedTo || [];
    if (current.includes(studentId)) {
      setValue('assignTo', current.filter(id => id !== studentId));
    } else {
      setValue('assignTo', [...current, studentId]);
    }
  };

  // Handle worksheet attachment
  const handleWorksheetAttach = (worksheet: WorksheetData) => {
    setAttachedWorksheets(prev => [...prev, worksheet]);
    setWorksheetModalOpen(false);
    toast.success('Worksheet attached! 📝');
  };

  const removeWorksheet = (index: number) => {
    setAttachedWorksheets(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ActivityFormData) => {
    try {
      setIsSubmitting(true);
      
      // Use API endpoint for integrated worksheet + YouTube support
      const payload = {
        title: data.title,
        type: data.type,
        description: data.description,
        instructions: data.description,
        estimated_minutes: data.estimatedMinutes,
        steps: data.steps?.map(s => s.text).filter(Boolean),
        links: data.links,
        assignTo: data.assignTo,
        scheduleDate: data.date,
        generateWorksheet: autoGenerateWorksheet || attachedWorksheets.length > 0,
        // Additional data for lessons
        keyQuestions: data.keyQuestions,
        materials: data.materials,
        parentNotes: data.parentNotes,
        tags: data.tags,
      };
      
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        router.refresh();
        
        if (parentOnSubmit) {
          parentOnSubmit(data);
        } else {
          const extras = [];
          if (result.hasWorksheet) extras.push('worksheet generated');
          if (result.videoCount > 0) extras.push(`${result.videoCount} videos found`);
          
          if (data.date && data.assignTo.length > 0) {
            toast.success('Activity Scheduled! 📅', {
              description: `"${data.title}" added to calendar.${extras.length ? ' Plus: ' + extras.join(', ') : ''}`,
              duration: 5000
            });
            router.push('/parent');
          } else {
            toast.success('Activity Saved! 📚', {
              description: extras.length ? `Plus: ${extras.join(', ')}` : 'You can schedule it later.'
            });
          }
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not save activity.', {
        description: err instanceof Error ? err.message : 'Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto pb-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-lg flex items-center gap-2">
              <Sparkle size={24} weight="duotone" className="text-[var(--ember-500)]" /> 
              Create Activity
            </h2>
            <p className="text-sm text-muted">Combine teaching, practice, and worksheets into one learning experience</p>
          </div>
          <div className="flex items-center gap-3">
            <LunaTriggerButton context="GENERAL" label="Need ideas?" iconOnly={false} />
          </div>
        </div>

        {/* CORE INFO */}
        <div className="card p-6 space-y-6">
          <div>
            <label className="input-label">Title</label>
            <input
              {...register('title')}
              placeholder="e.g. Introduction to Fractions"
              className="w-full text-lg p-2 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-[var(--ember-500)] outline-none transition-colors placeholder:text-gray-300"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label mb-2">Subject / Type</label>
              <select {...register('type')} className="select">
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div>
              <label className="input-label mb-2">Schedule Date</label>
              <input type="date" {...register('date')} className="input" />
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

          {/* Students Selection */}
          <div>
            <label className="input-label mb-2 flex items-center gap-1">
              <Users size={14} className="text-[var(--ember-500)]" /> Assign To
            </label>
            {studentsLoading ? (
              <div className="text-sm text-muted">Loading kids...</div>
            ) : students.length === 0 ? (
              <div className="text-sm text-muted italic">
                No kids added yet. <a href="/parent/settings" className="text-[var(--ember-500)] underline">Add a kid</a> to assign activities.
              </div>
            ) : (
              <div className="flex gap-2">
                {students.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => toggleStudent(student.id)}
                    className={cn(
                      "cursor-pointer p-1 rounded-full border-2 transition-all",
                      assignedTo?.includes(student.id) 
                        ? "border-[var(--ember-500)] ring-2 ring-[var(--ember-500)]/20" 
                        : "border-transparent opacity-50 hover:opacity-100"
                    )}
                  >
                    <StudentAvatar name={student.name} className="w-10 h-10" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TEACHING CONTENT (Collapsible) */}
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTeaching(!showTeaching)}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700"
          >
            <span className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Question size={18} /> Teaching Content (Lesson)
            </span>
            <span className="text-sm text-blue-600">{showTeaching ? '−' : '+'}</span>
          </button>
          
          {showTeaching && (
            <div className="p-6 space-y-6">
              <div>
                <label className="input-label">Instructions / Content</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="textarea"
                  placeholder="Explain what you'll be teaching, key concepts, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Question size={16} className="text-amber-500" /> Key Questions
                  </h4>
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

                <div>
                  <label className="input-label">Materials Needed</label>
                  <textarea
                    {...register('materials')}
                    rows={3}
                    className="textarea text-sm"
                    placeholder="e.g. Ruler, graph paper, colored pencils"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRACTICE CONTENT (Collapsible) */}
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPractice(!showPractice)}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-100 dark:border-gray-700"
          >
            <span className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
              <ListNumbers size={18} /> Practice / Assignment
            </span>
            <span className="text-sm text-green-600">{showPractice ? '−' : '+'}</span>
          </button>
          
          {showPractice && (
            <div className="p-6 space-y-6">
              <div>
                <label className="input-label flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" /> Expected Deliverable
                </label>
                <input
                  {...register('deliverable')}
                  placeholder="e.g. A completed worksheet, a drawing, a written paragraph"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ListNumbers size={16} className="text-blue-500" /> Student Steps
                  </h4>
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

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CheckSquare size={16} className="text-green-500" /> Success Criteria
                  </h4>
                  {rubricFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input type="checkbox" disabled className="text-gray-300 rounded" />
                      <input
                        {...register(`rubric.${index}.text` as const)}
                        className="input-sm flex-1"
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
            </div>
          )}
        </div>

        {/* WORKSHEETS */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <MagicWand size={18} className="text-purple-500" /> Worksheets
            </h3>
            <button
              type="button"
              onClick={() => setWorksheetModalOpen(true)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <MagicWand size={16} /> Generate Worksheet
            </button>
          </div>

          {/* Auto-generate checkbox */}
          <label className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl cursor-pointer border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <input
              type="checkbox"
              checked={autoGenerateWorksheet}
              onChange={e => setAutoGenerateWorksheet(e.target.checked)}
              className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <span className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-purple-500" />
                Auto-generate worksheet on save
              </span>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">
                AI will create practice questions based on this activity
              </p>
            </div>
          </label>
          
          {attachedWorksheets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attachedWorksheets.map((ws, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <File size={24} className="text-purple-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-purple-800 dark:text-purple-300">{ws.title}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {ws.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0} questions
                    </p>
                  </div>
                  <button type="button" onClick={() => removeWorksheet(idx)} className="text-purple-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Or click "Generate Worksheet" to customize one yourself!</p>
          )}
        </div>

        {/* NOTES & LINKS */}
        <div className="card p-6 space-y-6">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Stack size={18} className="text-amber-500" /> Resources & Notes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400">
                <EyeClosed size={16} /> Parent Notes (Private)
              </label>
              <textarea
                {...register('parentNotes')}
                rows={3}
                className="w-full text-sm p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                placeholder="Tips, tricky concepts, reminders..."
              />
            </div>

            <div>
              <label className="input-label mb-2">Tags</label>
              <TagInput
                value={tags}
                onChange={(newTags) => setValue('tags', newTags)}
                placeholder="Add tags..."
                suggestions={TAGS}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="input-label">Links & Attachments</label>
              <button type="button" onClick={() => appendLink({ url: '', label: '' })} className="text-xs flex items-center gap-1 text-[var(--ember-600)] hover:underline">
                <Plus size={14} /> Add Link
              </button>
            </div>
            
            <div className="space-y-2">
              {linkFields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <LinkIcon size={14} className="text-teal-500" />
                  <input {...register(`links.${index}.label`)} placeholder="Label" className="flex-1 min-w-[120px] p-1.5 text-sm rounded border border-gray-200 bg-white dark:bg-gray-800" />
                  <input {...register(`links.${index}.url`)} placeholder="URL" className="flex-1 min-w-[150px] p-1.5 text-sm rounded border border-gray-200 bg-white dark:bg-gray-800" />
                  <button type="button" onClick={() => removeLink(index)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "btn-primary px-8 py-3 shadow-lg shadow-[var(--ember-500)/20] hover:-translate-y-0.5",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Creating...' : 'Save Activity'}
          </button>
        </div>
      </form>

      {/* Worksheet Generator Modal */}
      <WorksheetGeneratorModal
        isOpen={worksheetModalOpen}
        onClose={() => setWorksheetModalOpen(false)}
        contextTopic={`${title} (${type})`}
        onAttach={handleWorksheetAttach}
      />
    </>
  );
}
