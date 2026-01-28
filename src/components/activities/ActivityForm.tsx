'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Sparkle, Clock, Link as LinkIcon, Plus, X, EyeClosed, Stack, Users, 
  ListNumbers, MagicWand, Books, PencilSimple, Spinner
} from '@phosphor-icons/react';
import { TagInput } from '@/components/ui/TagInput';
import { TAGS } from '@/lib/mock-data';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { cn } from '@/lib/utils';
import { Kid } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { LunaTriggerButton } from '@/components/luna';
import { supabase } from '@/lib/supabase/browser';

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
  const [autoGenerateWorksheet, setAutoGenerateWorksheet] = useState(false);
  const [autoSearchYouTube, setAutoSearchYouTube] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activityType, setActivityType] = useState<'lesson' | 'assignment' | 'worksheet'>('lesson');
  const hasFetchedRef = React.useRef(false);
  
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

  const toggleStudent = (studentId: string) => {
    const current = assignedTo || [];
    if (current.includes(studentId)) {
      setValue('assignTo', current.filter(id => id !== studentId));
    } else {
      setValue('assignTo', [...current, studentId]);
    }
  };

  // AI Generate from title
  const handleGenerateFromTitle = async () => {
    const titleValue = watch('title');
    if (!titleValue?.trim()) {
      toast.error('Please enter a title first');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedStudents = students.filter(s => assignedTo?.includes(s.id));
      const kidNames = selectedStudents.map(s => s.name);
      const gradeLevels = selectedStudents
        .map(s => s.gradeBand)
        .filter((g): g is string => !!g);
      const derivedGradeLevel = [...new Set(gradeLevels)].join(', ');

      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleValue,
          category: watch('type'),
          activityType: activityType,
          description: watch('description'),
          kidNames,
          gradeLevel: derivedGradeLevel || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate');
      }

      const { data } = await res.json();
      
      // Populate form with generated content
      if (data.description) setValue('description', data.description);
      if (data.steps?.length) {
        // Clear existing and add new
        while (stepFields.length > 0) removeStep(0);
        data.steps.forEach((step: string) => appendStep({ text: step }));
      }
      if (data.materials) setValue('materials', data.materials);
      if (data.estimatedMinutes) setValue('estimatedMinutes', data.estimatedMinutes);

      toast.success('Activity generated!', {
        description: 'Review and edit the content below.',
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate activity. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: ActivityFormData) => {
    try {
      setIsSubmitting(true);
      
      // Build ActivityInput for the unified API
      // This uses the new /api/activities endpoint which handles:
      // - YouTube video search
      // - Worksheet generation
      // - Proper scheduling
      const payload = {
        title: data.title,
        activityType: activityType,  // Use selected type from tabs
        category: data.type,
        description: data.description,
        estimatedMinutes: data.estimatedMinutes,
        // Convert {text: string}[] to string[]
        keyQuestions: data.keyQuestions?.map(q => q.text).filter(Boolean) || [],
        steps: data.steps?.map(s => s.text).filter(Boolean) || [],
        rubric: data.rubric?.map(r => r.text).filter(Boolean) || [],
        materials: data.materials,
        deliverable: data.deliverable,
        parentNotes: data.parentNotes,
        tags: data.tags,
        links: data.links,
        assignTo: data.assignTo,
        scheduleDate: data.date,
        // AI enrichment options (user-controlled)
        generateWorksheet: autoGenerateWorksheet,
        searchYouTube: autoSearchYouTube,
      };
      
      const res = await fetch('/api/activities', {
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
          {/* Title + Generate Row */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="input-label">Title</label>
              <input
                {...register('title')}
                placeholder="e.g. Introduction to Fractions"
                className="w-full text-lg p-2 border-b-2 border-[var(--border)] bg-transparent focus:border-[var(--ember-500)] outline-none transition-colors placeholder:text-muted"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <button
              type="button"
              onClick={handleGenerateFromTitle}
              disabled={isGenerating || !watch('title')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all mb-1",
                "bg-gradient-sunset text-[var(--foreground)] shadow-lg",
                "hover:shadow-xl hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isGenerating ? (
                <>
                  <Spinner size={18} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <MagicWand size={18} weight="fill" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col: Subject & Date */}
            <div className="space-y-4">
              <div>
                <label className="input-label mb-2">Subject / Type</label>
                <select {...register('type')} className="select w-full">
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <div>
                <label className="input-label mb-2">Schedule Date</label>
                <input type="date" {...register('date')} className="input w-full" />
              </div>
            </div>

            {/* Right Col: Duration & Assign To */}
            <div className="space-y-4">
              {/* Duration */}
              <div>
                <label className="input-label mb-2 flex items-center gap-1">
                  <Clock size={14} /> Duration
                </label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setValue('estimatedMinutes', mins)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all border",
                        watch('estimatedMinutes') === mins
                          ? "bg-[var(--ember-500)] text-[var(--foreground)] border-[var(--ember-500)]"
                          : "bg-[var(--background-secondary)] text-muted border-transparent hover:border-[var(--border)]"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign To */}
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
                        title={student.name}
                      >
                        <StudentAvatar name={student.name} className="w-10 h-10" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TYPE TABS */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActivityType('lesson')}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              activityType === 'lesson'
                ? "border-[var(--celestial-500)] bg-[var(--celestial-50)] dark:bg-[var(--celestial-900)]/30"
                : "border-[var(--border)] hover:border-[var(--border)]"
            )}
          >
            <Books size={28} weight="duotone" className={activityType === 'lesson' ? "text-[var(--celestial-500)]" : "text-muted"} />
            <span className={cn("font-semibold", activityType === 'lesson' ? "text-[var(--celestial-500)] dark:text-[var(--celestial-400)]" : "text-muted")}>
              Lesson
            </span>
            <span className="text-xs text-muted">Teaching content</span>
          </button>
          <button
            type="button"
            onClick={() => setActivityType('assignment')}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              activityType === 'assignment'
                ? "border-[var(--nebula-purple)] bg-[var(--nebula-purple)]/10 dark:bg-[var(--nebula-purple)]/20"
                : "border-[var(--border)] hover:border-[var(--border)]"
            )}
          >
            <PencilSimple size={28} weight="duotone" className={activityType === 'assignment' ? "text-[var(--nebula-purple)]" : "text-muted"} />
            <span className={cn("font-semibold", activityType === 'assignment' ? "text-[var(--nebula-purple)]" : "text-muted")}>
              Assignment
            </span>
            <span className="text-xs text-muted">Practice work</span>
          </button>
          <button
            type="button"
            onClick={() => { setActivityType('worksheet'); setAutoGenerateWorksheet(true); }}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              activityType === 'worksheet'
                ? "border-[var(--herbal-500)] bg-[var(--herbal-50)] dark:bg-[var(--herbal-900)]/30"
                : "border-[var(--border)] hover:border-[var(--border)]"
            )}
          >
            <MagicWand size={28} weight="duotone" className={activityType === 'worksheet' ? "text-[var(--herbal-500)]" : "text-muted"} />
            <span className={cn("font-semibold", activityType === 'worksheet' ? "text-[var(--herbal-600)] dark:text-[var(--herbal-400)]" : "text-muted")}>
              Worksheet
            </span>
            <span className="text-xs text-muted">AI-generated</span>
          </button>
        </div>

        {/* INSTRUCTIONS */}
        <div className="card p-6 space-y-4">
          <div>
            <label className="input-label">Instructions / Content</label>
            <textarea
              {...register('description')}
              rows={4}
              className="textarea"
              placeholder="Describe what the student should learn or do..."
            />
          </div>

          {/* STEPS (Optional - expandable) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted flex items-center gap-1">
                <ListNumbers size={14} /> Steps (optional)
              </label>
              <button type="button" onClick={() => appendStep({ text: '' })} className="text-xs text-[var(--ember-500)] hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Step
              </button>
            </div>
            {stepFields.length > 0 && (
              <div className="space-y-2 bg-[var(--background-secondary)]/50 rounded-lg p-3">
                {stepFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[var(--ember-500)] text-[var(--foreground)] text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <input
                      {...register(`steps.${index}.text` as const)}
                      placeholder={`Step ${index + 1}...`}
                      className="flex-1 bg-[var(--background-elevated)] border border-[var(--border)] rounded-md py-1.5 px-2 text-sm"
                    />
                    <button type="button" onClick={() => removeStep(index)} className="text-muted hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WORKSHEETS */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-heading dark:text-[var(--foreground)] flex items-center gap-2">
            <MagicWand size={18} className="text-[var(--nebula-purple)]" /> Additional Enrichment (optional)
          </h3>

          {/* Additional enrichment options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Auto-generate worksheet */}
            <label className="flex items-center gap-3 p-4 bg-[var(--nebula-purple)]/10 dark:bg-[var(--nebula-purple)]/15 rounded-xl cursor-pointer border border-[var(--nebula-purple)]/30 dark:border-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/20 dark:hover:bg-[var(--nebula-purple)]/20 transition-colors">
              <input
                type="checkbox"
                checked={autoGenerateWorksheet}
                onChange={e => setAutoGenerateWorksheet(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--nebula-purple)]/40 text-[var(--nebula-purple)] focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className="font-medium text-[var(--nebula-purple)] dark:text-[var(--nebula-purple-light)] flex items-center gap-2">
                  <Sparkle size={18} weight="fill" className="text-[var(--nebula-purple)]" />
                  Generate worksheet
                </span>
                <p className="text-xs text-[var(--nebula-purple)]/70 dark:text-[var(--nebula-purple)]/70 mt-0.5">
                  AI creates practice questions
                </p>
              </div>
            </label>

            {/* Auto-find YouTube videos */}
            <label className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/15 rounded-xl cursor-pointer border border-red-500/30 dark:border-red-500/50 hover:bg-red-500/20 dark:hover:bg-red-500/20 transition-colors">
              <input
                type="checkbox"
                checked={autoSearchYouTube}
                onChange={e => setAutoSearchYouTube(e.target.checked)}
                className="w-5 h-5 rounded border-red-500/40 text-red-500 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                  <LinkIcon size={18} weight="bold" className="text-red-500" />
                  Find YouTube videos
                </span>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                  AI searches for relevant videos
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* NOTES & LINKS */}
        <div className="card p-6 space-y-6">
          <h3 className="font-semibold text-heading dark:text-[var(--foreground)] flex items-center gap-2">
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
                className="w-full text-sm p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-[var(--background-elevated)]/50 dark:bg-black/20 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
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
          
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <label className="input-label">Links & Attachments</label>
              <button type="button" onClick={() => appendLink({ url: '', label: '' })} className="text-xs flex items-center gap-1 text-[var(--ember-600)] hover:underline">
                <Plus size={14} /> Add Link
              </button>
            </div>
            
            <div className="space-y-2">
              {linkFields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-center gap-3 p-3 bg-[var(--background-secondary)] bg-[var(--background)] rounded-lg border border-[var(--border)]">
                  <LinkIcon size={14} className="text-teal-500" />
                  <input {...register(`links.${index}.label`)} placeholder="Label" className="flex-1 min-w-[120px] p-1.5 text-sm rounded border border-[var(--border)] bg-[var(--background-elevated)]" />
                  <input {...register(`links.${index}.url`)} placeholder="URL" className="flex-1 min-w-[150px] p-1.5 text-sm rounded border border-[var(--border)] bg-[var(--background-elevated)]" />
                  <button type="button" onClick={() => removeLink(index)} className="text-muted hover:text-red-500"><X size={16} /></button>
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
    </>
  );
}
