'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CaretDown, Sparkle, Clock, Users, CalendarBlank, Link as LinkIcon, Paperclip, Books, PencilSimple } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LunaTriggerButton } from '@/components/luna';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: { id: string; name: string }[];
}

// Life skills + academic categories
const CATEGORIES = [
  // Academic
  { value: 'Math', group: 'Academic' },
  { value: 'Science', group: 'Academic' },
  { value: 'History', group: 'Academic' },
  { value: 'Language Arts', group: 'Academic' },
  { value: 'Art', group: 'Academic' },
  { value: 'Music', group: 'Academic' },
  { value: 'PE', group: 'Academic' },
  { value: 'Coding', group: 'Academic' },
  // Life Skills
  { value: 'Self & Mind', group: 'Life Skills' },
  { value: 'Thinking & Truth', group: 'Life Skills' },
  { value: 'Agency & Responsibility', group: 'Life Skills' },
  { value: 'Relationships & Community', group: 'Life Skills' },
  { value: 'Body & Nervous System', group: 'Life Skills' },
  { value: 'Systems & Society', group: 'Life Skills' },
];

interface LinkItem {
  label: string;
  url: string;
}

interface FormData {
  title: string;
  activityType: 'lesson' | 'assignment';
  category: string;
  description: string;
  estimatedMinutes: number;
  includeSteps: boolean;
  steps: string[];
  includeWorksheet: boolean;
  includeRubric: boolean;
  rubric: string[];
  links: LinkItem[];
  assignTo: string[];
  scheduleDate: string;
}

export function ActivityModal({ isOpen, onClose, kids }: ActivityModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [form, setForm] = useState<FormData>({
    title: '',
    activityType: 'lesson',
    category: 'Math',
    description: '',
    estimatedMinutes: 30,
    includeSteps: false,
    steps: [''],
    includeWorksheet: false,
    includeRubric: false,
    rubric: [''],
    links: [],
    assignTo: kids.map(k => k.id), // Default: all kids
    scheduleDate: new Date().toISOString().split('T')[0],
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const addStep = () => updateForm({ steps: [...form.steps, ''] });
  const updateStep = (idx: number, value: string) => {
    const newSteps = [...form.steps];
    newSteps[idx] = value;
    updateForm({ steps: newSteps });
  };
  const removeStep = (idx: number) => {
    updateForm({ steps: form.steps.filter((_, i) => i !== idx) });
  };

  const addRubricItem = () => updateForm({ rubric: [...form.rubric, ''] });
  const updateRubricItem = (idx: number, value: string) => {
    const newRubric = [...form.rubric];
    newRubric[idx] = value;
    updateForm({ rubric: newRubric });
  };

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
      // Create based on type
      const endpoint = form.activityType === 'lesson' ? '/api/lessons' : '/api/assignments';
      
      const payload = {
        title: form.title,
        type: form.category,
        description: form.description,
        instructions: form.description,
        estimated_minutes: form.estimatedMinutes,
        steps: form.includeSteps ? form.steps.filter(s => s.trim()) : [],
        rubric: form.includeRubric ? form.rubric.filter(r => r.trim()) : [],
        links: form.links.filter(l => l.label && l.url),
        // Schedule info
        assignTo: form.assignTo,
        scheduleDate: form.scheduleDate,
        // Will trigger worksheet generation if checked
        generateWorksheet: form.includeWorksheet,
      };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`${form.activityType === 'lesson' ? 'Lesson' : 'Assignment'} created!`);
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create activity');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Activity">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Luna Helper */}
        <div className="flex justify-end -mt-2 -mb-2">
          <LunaTriggerButton 
            context="GENERAL" 
            label="Get ideas from Luna" 
            iconOnly={false}
          />
        </div>

        {/* Activity Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateForm({ activityType: 'lesson' })}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all font-medium",
                form.activityType === 'lesson'
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400"
              )}
            >
              <Books size={20} weight="duotone" />
              Lesson
            </button>
            <button
              type="button"
              onClick={() => updateForm({ activityType: 'assignment' })}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all font-medium",
                form.activityType === 'assignment'
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400"
              )}
            >
              <PencilSimple size={20} weight="duotone" />
              Assignment
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => updateForm({ title: e.target.value })}
            placeholder="e.g., Understanding Fractions, Morning Journaling"
            className="input-field"
            autoFocus
          />
        </div>

        {/* Category + Time - side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={e => updateForm({ category: e.target.value })}
              className="input-field"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Clock size={14} className="inline mr-1" />
              Time
            </label>
            <select
              value={form.estimatedMinutes}
              onChange={e => updateForm({ estimatedMinutes: Number(e.target.value) })}
              className="input-field"
            >
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description / Instructions
          </label>
          <textarea
            value={form.description}
            onChange={e => updateForm({ description: e.target.value })}
            placeholder="What should the student do? Any materials needed?"
            className="input-field min-h-[80px]"
            rows={3}
          />
        </div>

        {/* Links Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <LinkIcon size={14} />
              Links
            </label>
            <button 
              type="button" 
              onClick={addLink} 
              className="text-xs text-[var(--ember-500)] hover:text-[var(--ember-600)] font-medium"
            >
              + Add Link
            </button>
          </div>
          {form.links.length > 0 && (
            <div className="space-y-2">
              {form.links.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(idx, 'label', e.target.value)}
                    placeholder="Label"
                    className="input-field w-1/3"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    className="input-field flex-1"
                  />
                  <button type="button" onClick={() => removeLink(idx)} className="text-red-400 hover:text-red-600 p-2">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.links.length === 0 && (
            <p className="text-xs text-muted">No links added yet</p>
          )}
        </div>

        {/* Assign To + Schedule - side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users size={14} className="inline mr-1" />
              Assign To
            </label>
            <div className="flex gap-2 flex-wrap">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => toggleKid(kid.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    form.assignTo.includes(kid.id)
                      ? "bg-[var(--ember-500)] text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  )}
                >
                  {kid.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <CalendarBlank size={14} className="inline mr-1" />
              Schedule For
            </label>
            <input
              type="date"
              value={form.scheduleDate}
              onChange={e => updateForm({ scheduleDate: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
        >
          <CaretDown size={16} className={cn("transition-transform", showAdvanced && "rotate-180")} />
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
            {/* Include Steps */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeSteps}
                onChange={e => updateForm({ includeSteps: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Add step-by-step instructions</span>
            </label>
            {form.includeSteps && (
              <div className="space-y-2 ml-6">
                {form.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={e => updateStep(idx, e.target.value)}
                      placeholder={`Step ${idx + 1}`}
                      className="input-field flex-1 text-sm"
                    />
                    {form.steps.length > 1 && (
                      <button type="button" onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addStep} className="text-xs text-[var(--ember-500)] ml-6">
                  + Add Step
                </button>
              </div>
            )}

            {/* Include Worksheet */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeWorksheet}
                onChange={e => updateForm({ includeWorksheet: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm flex items-center gap-1">
                <Sparkle size={14} className="text-purple-500" />
                Auto-generate worksheet (AI)
              </span>
            </label>

            {/* Include Rubric */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeRubric}
                onChange={e => updateForm({ includeRubric: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Add success criteria (rubric)</span>
            </label>
            {form.includeRubric && (
              <div className="space-y-2 ml-6">
                {form.rubric.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={e => updateRubricItem(idx, e.target.value)}
                      placeholder="I can..."
                      className="input-field flex-1 text-sm"
                    />
                  </div>
                ))}
                <button type="button" onClick={addRubricItem} className="text-xs text-[var(--ember-500)] ml-6">
                  + Add Criteria
                </button>
              </div>
            )}

            {/* Attachments note */}
            <div className="flex items-center gap-2 text-sm text-muted">
              <Paperclip size={14} />
              <span>File attachments can be added after creation</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Creating...' : `Create ${form.activityType === 'lesson' ? 'Lesson' : 'Assignment'}`}
        </button>
      </div>
    </Modal>
  );
}
