'use client';

import { useState } from 'react';
import { X, MagicWand, Printer, FloppyDisk, Spinner, CheckCircle, PencilSimple } from '@phosphor-icons/react';
import { generateWorksheetAction, saveWorksheetAssignmentAction } from '@/lib/actions/worksheet';
import { WorksheetData } from '@/types';
import { WorksheetViewer } from './WorksheetViewer';
import { toast } from 'sonner';

interface WorksheetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextTopic?: string; // Pre-fill from lesson context?
  onAttach?: (worksheet: WorksheetData) => void; // If provided, attaches to parent instead of saving
}

export function WorksheetGeneratorModal({ isOpen, onClose, contextTopic = '', onAttach }: WorksheetGeneratorModalProps) {
  
  // Steps: 'input' -> 'generating' -> 'review' -> 'saving' -> 'success'
  const [step, setStep] = useState<'input' | 'generating' | 'review' | 'refining' | 'saving' | 'success'>('input');
  
  const [topic, setTopic] = useState(contextTopic);
  const [instructions, setInstructions] = useState('');
  const [age, setAge] = useState<string>(''); // Could be number or string like "9 years old"
  
  const [generatedData, setGeneratedData] = useState<WorksheetData | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  
  // Refinement state
  const [refinementFeedback, setRefinementFeedback] = useState('');
  
  const handleGenerate = async () => {
    if (!topic) return;
    
    setStep('generating');
    const res = await generateWorksheetAction(topic, age, instructions);
    
    if (res.success && res.data) {
      setGeneratedData(res.data);
      setStep('review');
    } else {
      setStep('input');
      toast.error('Failed to generate worksheet. Please try again.');
    }
  };
  
  const handleRefine = async () => {
    if (!generatedData || !refinementFeedback.trim()) return;
    
    setStep('refining');
    try {
      const res = await fetch('/api/refine-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worksheetData: generatedData,
          feedback: refinementFeedback,
        }),
      });
      
      if (!res.ok) throw new Error('Refinement failed');
      
      const { data } = await res.json();
      setGeneratedData(data);
      setRefinementFeedback('');
      setStep('review');
      toast.success('Worksheet refined!');
    } catch {
      setStep('review');
      toast.error('Failed to refine. Please try again.');
    }
  };
  
  const handleSave = async () => {
    if (!generatedData) return;
    
    // If onAttach is provided, attach to parent form instead of saving separately
    if (onAttach) {
      onAttach(generatedData);
      handleReset();
      return;
    }
    
    setStep('saving');
    const res = await saveWorksheetAssignmentAction(generatedData, `Worksheet: ${generatedData.title}`);
    
    if (res.success && res.assignmentId) {
      setSavedId(res.assignmentId);
      setStep('success');
    } else {
      setStep('review');
      alert(`Save failed: ${res.error || 'Unknown error'}`);
    }
  };
  
  const handleReset = () => {
    setStep('input');
    setGeneratedData(null);
    setSavedId(null);
    setTopic('');
    setInstructions('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
              <MagicWand size={20} weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Worksheet Generator
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel: Inputs (Hidden on mobile if reviewing?) */}
          <div className={`
            w-full md:w-1/3 p-6 border-r border-gray-100 dark:border-gray-800 overflow-y-auto bg-gray-50 dark:bg-black/20
            ${step === 'review' || step === 'success' ? 'hidden md:block' : 'block'}
          `}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Topic / Subject
                </label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Multiplication Tables, Photosynthesis, Ancient Rome"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Target Age / Grade (Optional)
                </label>
                <input 
                  type="text" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 9 years old, 4th Grade"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Specific Instructions (Optional)
                </label>
                <textarea 
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Include 5 word problems. Make it fun and space-themed."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={!topic || step === 'generating'}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 dark:shadow-none hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === 'generating' ? (
                  <>
                    <Spinner size={24} className="animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <MagicWand size={24} weight="fill" />
                    {generatedData ? 'Regenerate' : 'Generate Worksheet'}
                  </>
                )}
              </button>
              
              {/* Refinement Section - shown when reviewing */}
              {(step === 'review' || step === 'refining') && generatedData && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <PencilSimple size={18} className="text-purple-500" />
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Refine with AI
                    </label>
                  </div>
                  <textarea 
                    value={refinementFeedback}
                    onChange={(e) => setRefinementFeedback(e.target.value)}
                    placeholder="Describe changes, e.g. 'Remove the word external from question 2' or 'Add actual blanks to the fill-in-the-blank questions'"
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={!refinementFeedback.trim() || step === 'refining'}
                    className="w-full mt-3 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {step === 'refining' ? (
                      <>
                        <Spinner size={18} className="animate-spin" />
                        Refining...
                      </>
                    ) : (
                      <>
                        <MagicWand size={18} />
                        Apply Changes
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Or click directly on questions to edit them
                  </p>
                </div>
              )}
            </div>
            
            {step === 'success' && savedId && (
              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-2">
                  <CheckCircle size={24} weight="fill" />
                  Saved Successfully!
                </div>
                <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                  This worksheet has been saved to your assignments library.
                </p>
                <div className="flex flex-col gap-2">
                    <a 
                        href={`/print/worksheet/${savedId}`} 
                        target="_blank"
                        className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-center hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={20} />
                        Print Now
                    </a>
                    <button 
                        onClick={handleReset}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Create Another
                    </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel: Preview */}
          <div className="flex-1 bg-gray-100 dark:bg-black/50 p-4 md:p-8 overflow-y-auto">
            {step === 'input' || step === 'generating' ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <MagicWand size={48} weight="duotone" className="text-gray-400 dark:text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Ready to Create</h3>
                  <p className="text-sm max-w-md mx-auto mt-2">
                    Enter a topic on the left to generate a custom printable worksheet tailored to your child's needs.
                  </p>
                </div>
              </div>
            ) : generatedData ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-xl rounded-xl overflow-hidden mb-6">
                  {/* Worksheet Preview Header */}
                  <div className="bg-gray-50 border-b border-gray-100 p-2 flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <PencilSimple size={12} />
                      Click any text to edit
                    </span>
                    <span>A4 Size</span>
                  </div>
                  <div className="p-8 transform scale-90 origin-top">
                     <WorksheetViewer 
                       data={generatedData} 
                       editable={step === 'review' || step === 'refining'}
                       onDataChange={setGeneratedData}
                     />
                  </div>
                </div>
                
                {/* Actions Footer (Floating) */}
                {(step === 'review' || step === 'saving' || step === 'refining') && (
                    <div className="sticky bottom-4 flex justify-end gap-3">
                        <button 
                            onClick={handleSave}
                            disabled={step === 'saving' || step === 'refining'}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {step === 'saving' ? <Spinner size={20} className="animate-spin" /> : <FloppyDisk size={20} weight="fill" />}
                            {onAttach ? 'Attach to Activity' : 'Save to Library'}
                        </button>
                    </div>
                )}
              </div>
            ) : null}
          </div>
          
        </div>
      </div>
    </div>
  );
}
