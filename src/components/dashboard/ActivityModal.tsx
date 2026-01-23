'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CaretDown, Sparkle, Clock, Users, CalendarBlank, 
  Link as LinkIcon, Books, PencilSimple, Plus, Trash, Spinner, MagicWand,
  // Category icons
  MathOperations, Flask, Scroll, BookOpen, Palette, MusicNote,
  PersonSimpleRun, Code, Brain, Lightbulb, Lightning, Handshake, Heart, Globe
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: { id: string; name: string; gradeBand?: string }[];
}

// Life skills + academic categories with Phosphor icons
const CATEGORIES = [
  { value: 'Math', group: 'Academic', icon: MathOperations },
  { value: 'Science', group: 'Academic', icon: Flask },
  { value: 'History', group: 'Academic', icon: Scroll },
  { value: 'Language Arts', group: 'Academic', icon: BookOpen },
  { value: 'Art', group: 'Academic', icon: Palette },
  { value: 'Music', group: 'Academic', icon: MusicNote },
  { value: 'PE', group: 'Academic', icon: PersonSimpleRun },
  { value: 'Coding', group: 'Academic', icon: Code },
  { value: 'Self & Mind', group: 'Life Skills', icon: Brain },
  { value: 'Thinking & Truth', group: 'Life Skills', icon: Lightbulb },
  { value: 'Agency & Responsibility', group: 'Life Skills', icon: Lightning },
  { value: 'Relationships & Community', group: 'Life Skills', icon: Handshake },
  { value: 'Body & Nervous System', group: 'Life Skills', icon: Heart },
  { value: 'Systems & Society', group: 'Life Skills', icon: Globe },
];

interface LinkItem {
  label: string;
  url: string;
}

interface FormData {
  title: string;
  activityType: 'lesson' | 'assignment' | 'worksheet';
  category: string;
  description: string;
  estimatedMinutes: number;
  steps: string[];
  keyQuestions: string[];
  materials: string;
  links: LinkItem[];
  assignTo: string[];
  scheduleDate: string;
  generateWorksheet: boolean;
}

export function ActivityModal({ isOpen, onClose, kids }: ActivityModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [form, setForm] = useState<FormData>({
    title: '',
    activityType: 'lesson',
    category: 'Math',
    description: '',
    estimatedMinutes: 30,
    steps: [],
    keyQuestions: [],
    materials: '',
    links: [],
    assignTo: kids.map(k => k.id),
    scheduleDate: new Date().toISOString().split('T')[0],
    generateWorksheet: false,
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  // AI Generation handler
  const handleGenerate = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title first');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedKids = kids.filter(k => form.assignTo.includes(k.id));
      const kidNames = selectedKids.map(k => k.name);
      
      // Derive grade level context from selected kids
      // e.g. "3rd Grade" or "3rd Grade, 5th Grade"
      const gradeLevels = selectedKids
        .map(k => k.gradeBand)
        .filter((g): g is string => !!g); // Filter out undefined/null
        
      const derivedGradeLevel = [...new Set(gradeLevels)].join(', ');

      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          activityType: form.activityType,
          description: form.description, // Pass any notes user already entered
          kidNames,
          gradeLevel: derivedGradeLevel || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate');
      }

      const { data } = await res.json();
      
      // Populate form with generated content
      updateForm({
        description: data.description || form.description,
        steps: data.steps || form.steps,
        keyQuestions: data.keyQuestions || form.keyQuestions,
        materials: data.materials || form.materials,
        estimatedMinutes: data.estimatedMinutes || form.estimatedMinutes,
        links: data.suggestedLinks?.length > 0 ? data.suggestedLinks : form.links,
      });

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

  // Steps helpers
  const addStep = () => updateForm({ steps: [...form.steps, ''] });
  const updateStep = (idx: number, value: string) => {
    const newSteps = [...form.steps];
    newSteps[idx] = value;
    updateForm({ steps: newSteps });
  };
  const removeStep = (idx: number) => {
    updateForm({ steps: form.steps.filter((_, i) => i !== idx) });
  };

  // Links helpers
  const addLink = () => updateForm({ links: [...form.links, { label: '', url: '' }] });
  const updateLink = (idx: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...form.links];
    newLinks[idx][field] = value;
    updateForm({ links: newLinks });
  };
  const removeLink = (idx: number) => {
    updateForm({ links: form.links.filter((_, i) => i !== idx) });
  };

  const toggleKid = (kidId: string) => {
    if (form.assignTo.includes(kidId)) {
      updateForm({ assignTo: form.assignTo.filter(id => id !== kidId) });
    } else {
      updateForm({ assignTo: [...form.assignTo, kidId] });
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use unified /api/activities endpoint
      // It handles both lessons and assignments with proper AI enrichment
      const payload = {
        title: form.title,
        activityType: form.activityType,  // 'lesson' or 'assignment'
        category: form.category,
        description: form.description,
        estimatedMinutes: form.estimatedMinutes,
        steps: form.steps.filter(s => s.trim()),
        keyQuestions: form.keyQuestions.filter(q => q.trim()),
        materials: form.materials,
        deliverable: '',  // Not collected in modal
        rubric: [],  // Not collected in modal
        parentNotes: '',  // Not collected in modal
        tags: [form.category],
        links: form.links.filter(l => l.label && l.url),
        assignTo: form.assignTo,
        scheduleDate: form.scheduleDate,
        generateWorksheet: form.generateWorksheet,
        searchYouTube: true,  // Enable YouTube video search
      };
      
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const extras = [];
        if (result.hasWorksheet) extras.push('worksheet generated');
        if (result.videoCount > 0) extras.push(`${result.videoCount} videos found`);
        
        const activityTypeName = form.activityType === 'lesson' ? 'Lesson' : 
                                  form.activityType === 'worksheet' ? 'Worksheet' : 
                                  'Assignment';
        
        toast.success(`${activityTypeName} created!`, {
          description: extras.length > 0 ? extras.join(', ') : undefined,
        });
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === form.category);
  const CategoryIcon = selectedCategory?.icon || BookOpen;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-heading">Create Activity</h2>
        </div>

        {/* Type Toggle - Prominent */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => updateForm({ activityType: 'lesson' })}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              form.activityType === 'lesson'
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-[var(--border)] hover:border-[var(--border)]"
            )}
          >
            <Books size={28} weight="duotone" className={form.activityType === 'lesson' ? "text-blue-500" : "text-muted"} />
            <span className={cn("font-semibold", form.activityType === 'lesson' ? "text-blue-600 dark:text-blue-400" : "text-muted")}>
              Lesson
            </span>
            <span className="text-xs text-muted">Teaching content</span>
          </button>
          <button
            type="button"
            onClick={() => updateForm({ activityType: 'assignment' })}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              form.activityType === 'assignment'
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                : "border-[var(--border)] hover:border-[var(--border)]"
            )}
          >
            <PencilSimple size={28} weight="duotone" className={form.activityType === 'assignment' ? "text-purple-500" : "text-muted"} />
            <span className={cn("font-semibold", form.activityType === 'assignment' ? "text-purple-600 dark:text-purple-400" : "text-muted")}>
              Assignment
            </span>
            <span className="text-xs text-muted">Practice work</span>
          </button>
          <button
            type="button"
            onClick={() => updateForm({ activityType: 'worksheet', generateWorksheet: true })}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              form.activityType === 'worksheet'
                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                : "border-[var(--border)] hover:border-[var(--border)]"
            )}
          >
            <MagicWand size={28} weight="duotone" className={form.activityType === 'worksheet' ? "text-green-500" : "text-muted"} />
            <span className={cn("font-semibold", form.activityType === 'worksheet' ? "text-green-600 dark:text-green-400" : "text-muted")}>
              Worksheet
            </span>
            <span className="text-xs text-muted">AI-generated</span>
          </button>
        </div>

        {/* Title + AI Generate Button */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              type="text"
              value={form.title}
              onChange={e => updateForm({ title: e.target.value })}
              placeholder="What are we learning today?"
              className="w-full text-lg font-medium bg-transparent border-0 border-b-2 border-[var(--border)] focus:border-[var(--ember-500)] focus:ring-0 py-2 px-0 placeholder:text-muted"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !form.title.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all",
              "bg-gradient-sunset text-white shadow-lg",
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
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Category + Time Row */}
        <div className="flex gap-3">
          {/* Category Dropdown */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1.5">Category</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={e => updateForm({ category: e.target.value })}
                className="w-full appearance-none bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg py-2.5 pl-10 pr-8 text-sm font-medium focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent"
              >
                <optgroup label="Academic">
                  {CATEGORIES.filter(c => c.group === 'Academic').map(c => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </optgroup>
                <optgroup label="Life Skills">
                  {CATEGORIES.filter(c => c.group === 'Life Skills').map(c => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </optgroup>
              </select>
              <CategoryIcon 
                size={18} 
                weight="duotone" 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ember-500)]" 
              />
              <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            </div>
          </div>

          {/* Time Pills */}
          <div className="w-40">
            <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
              <Clock size={12} /> Duration
            </label>
            <div className="flex flex-wrap gap-1">
              {[15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => updateForm({ estimatedMinutes: mins })}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded-md transition-all",
                    form.estimatedMinutes === mins
                      ? "bg-[var(--ember-500)] text-white"
                      : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)]"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Instructions</label>
          <textarea
            value={form.description}
            onChange={e => updateForm({ description: e.target.value })}
            placeholder="Describe what the student should do..."
            className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Steps (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted">Steps (optional)</label>
            <button type="button" onClick={addStep} className="text-xs text-[var(--ember-500)] hover:underline flex items-center gap-1">
              <Plus size={12} /> Add Step
            </button>
          </div>
          {form.steps.length > 0 && (
            <div className="space-y-2 bg-[var(--background-secondary)]/50 rounded-lg p-3">
              {form.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[var(--ember-500)] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                    placeholder={`Step ${idx + 1}...`}
                    className="flex-1 bg-[var(--background-elevated)] border border-[var(--border)] rounded-md py-1.5 px-2 text-sm"
                  />
                  <button type="button" onClick={() => removeStep(idx)} className="text-muted hover:text-red-500">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              <LinkIcon size={12} /> Links (optional)
            </label>
            <button type="button" onClick={addLink} className="text-xs text-[var(--ember-500)] hover:underline flex items-center gap-1">
              <Plus size={12} /> Add Link
            </button>
          </div>
          {form.links.length > 0 && (
            <div className="space-y-2 bg-[var(--background-secondary)]/50 rounded-lg p-3">
              {form.links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(idx, 'label', e.target.value)}
                    placeholder="Label"
                    className="w-24 bg-[var(--background-elevated)] border border-[var(--border)] rounded-md py-1.5 px-2 text-sm"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[var(--background-elevated)] border border-[var(--border)] rounded-md py-1.5 px-2 text-sm"
                  />
                  <button type="button" onClick={() => removeLink(idx)} className="text-muted hover:text-red-500">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Section - Card Style */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-heading text-sm flex items-center gap-2">
            <CalendarBlank size={16} className="text-[var(--ember-500)]" />
            Schedule
          </h4>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Kids */}
            <div>
              <label className="block text-xs text-muted mb-1.5">
                <Users size={12} className="inline mr-1" /> Assign to
              </label>
              <div className="flex gap-2">
                {kids.map(kid => (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => toggleKid(kid.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      form.assignTo.includes(kid.id)
                        ? "bg-[var(--ember-500)] text-white shadow-sm"
                        : "bg-white dark:bg-[var(--background-secondary)] text-muted border border-[var(--border)] dark:border-[var(--border)]"
                    )}
                  >
                    {kid.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs text-muted mb-1.5">Date</label>
              <input
                type="date"
                value={form.scheduleDate}
                onChange={e => updateForm({ scheduleDate: e.target.value })}
                className="bg-white dark:bg-[var(--background-secondary)] border border-[var(--border)] dark:border-[var(--border)] rounded-lg py-1.5 px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* AI Worksheet Toggle - only show for lessons/assignments */}
        {form.activityType !== 'worksheet' && (
          <label className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl cursor-pointer border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <input
              type="checkbox"
              checked={form.generateWorksheet}
              onChange={e => updateForm({ generateWorksheet: e.target.checked })}
              className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <span className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-purple-500" />
                Auto-generate worksheet
              </span>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">
                AI will create practice questions based on this activity
              </p>
            </div>
          </label>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          {/* Debug: Show why button might be disabled */}
          {!form.title.trim() && (
            <span className="text-xs text-red-400 self-center">
              Title required ({form.title.length} chars)
            </span>
          )}
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted hover:text-heading dark:text-muted dark:hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.title.trim()}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
              form.activityType === 'lesson'
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : form.activityType === 'worksheet'
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white",
              (isSubmitting || !form.title.trim()) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Creating...' : `Create ${
              form.activityType === 'lesson' ? 'Lesson' : 
              form.activityType === 'worksheet' ? 'Worksheet' : 
              'Assignment'
            }`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
