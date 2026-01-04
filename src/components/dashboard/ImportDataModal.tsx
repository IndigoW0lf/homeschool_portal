'use client';

import { useState, useCallback } from 'react';
import { X, Upload, FileText, Check, Warning, Spinner, Sparkle, CaretDown, CaretUp, Trash, PencilSimple } from '@phosphor-icons/react';
import { importExternalCurriculum } from '@/app/actions/import';
import { toast } from 'sonner';

interface Kid {
  id: string;
  name: string;
}

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: Kid[];
}

interface ParsedRow {
  taskName: string;
  course: string;
  date: string;
  score: string | null;
}

interface AIParsedItem {
  taskName: string;
  course: string;
  subject: string;
  date: string;
  score: number | null;
  itemType: string;
}

// Available subjects - users can define their own too
const SUBJECT_OPTIONS = [
  'Reading',
  'Math',
  'Science',
  'Language Arts',
  'Writing',
  'History',
  'Social Studies',
  'Art',
  'Music',
  'Social-Emotional',
  'Technology',
  'Logic',
  'Health',
  'Physical Education',
  'Other',
];

export function ImportDataModal({ isOpen, onClose, kids }: ImportDataModalProps) {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || '');
  const [source, setSource] = useState('miacademy');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [aiParsedData, setAIParsedData] = useState<AIParsedItem[]>([]);
  const [aiWarnings, setAIWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [step, setStep] = useState<'upload' | 'parsing' | 'preview' | 'complete'>('upload');
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [useAI] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  
  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');

  // AI-powered parsing
  const parseWithAI = async (text: string) => {
    setIsParsing(true);
    try {
      const response = await fetch('/api/ai/parse-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text, source }),
      });

      if (!response.ok) {
        throw new Error('AI parsing failed');
      }

      const data = await response.json();
      setAIParsedData(data.items);
      const realWarnings = (data.warnings || []).filter((w: string) => 
        !w.toLowerCase().includes('local rules') && 
        !w.toLowerCase().includes('unavailable')
      );
      setAIWarnings(realWarnings);
      toast.success(`✨ Organized ${data.validCount} learning activities!`);
    } catch (err) {
      console.error('AI parse error:', err);
      toast.error('Oops! Falling back to basic import');
      const rows = parseCSVManual(text);
      setParsedData(rows);
    } finally {
      setIsParsing(false);
    }
  };

  // Manual CSV parsing (fallback)
  const parseCSVManual = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    const rows: ParsedRow[] = [];

    const skipPatterns = [
      'grade report was printed',
      'curriculum provider',
      'not an official transcript',
    ];

    const firstDataLine = lines.find(l =>
      l.trim() && !skipPatterns.some(p => l.toLowerCase().includes(p))
    );
    const delimiter = firstDataLine?.includes('\t') ? '\t' : ',';
    const startIdx = lines[0]?.toLowerCase().includes('task') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (skipPatterns.some(p => line.toLowerCase().includes(p))) continue;

      const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        rows.push({
          taskName: parts[0],
          course: parts[1],
          date: parts[2],
          score: parts[3] || null,
        });
      }
    }

    return rows;
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStep('parsing');
    setSelectedRows(new Set());

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setRawText(text);

      if (useAI) {
        await parseWithAI(text);
      } else {
        const rows = parseCSVManual(text);
        setParsedData(rows);
      }
      setStep('preview');
    };
    reader.readAsText(file);
  }, [parseCSVManual, useAI, source]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setFileName(file.name);
    setStep('parsing');
    setSelectedRows(new Set());

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setRawText(text);

      if (useAI) {
        await parseWithAI(text);
      } else {
        const rows = parseCSVManual(text);
        setParsedData(rows);
      }
      setStep('preview');
    };
    reader.readAsText(file);
  }, [parseCSVManual, useAI, source]);

  const handlePasteData = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error('Clipboard is empty');
        return;
      }

      setFileName('Pasted data');
      setStep('parsing');
      setSelectedRows(new Set());
      setRawText(text);

      if (useAI) {
        await parseWithAI(text);
      } else {
        const rows = parseCSVManual(text);
        setParsedData(rows);
      }
      setStep('preview');
    } catch (err) {
      console.error('Paste error:', err);
      toast.error('Could not read clipboard');
    }
  }, [parseCSVManual, useAI, source]);

  // Row management functions
  const toggleRowSelection = (idx: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === aiParsedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(aiParsedData.map((_, i) => i)));
    }
  };

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return;
    const newData = aiParsedData.filter((_, i) => !selectedRows.has(i));
    setAIParsedData(newData);
    setSelectedRows(new Set());
    toast.success(`Removed ${selectedRows.size} items`);
  };

  const applyBulkSubject = () => {
    const newSubject = bulkSubject === 'custom' ? customSubject : bulkSubject;
    if (!newSubject) return;
    
    const newData = aiParsedData.map((item, i) => 
      selectedRows.has(i) ? { ...item, subject: newSubject } : item
    );
    setAIParsedData(newData);
    setSelectedRows(new Set());
    setShowBulkEdit(false);
    setBulkSubject('');
    setCustomSubject('');
    toast.success(`Updated ${selectedRows.size} items to "${newSubject}"`);
  };

  const handleImport = async () => {
    if (!selectedKidId) return;

    const dataToImport = useAI && aiParsedData.length > 0 ? aiParsedData : parsedData;
    if (dataToImport.length === 0) return;

    setIsImporting(true);
    try {
      const rows: ParsedRow[] = useAI && aiParsedData.length > 0
        ? aiParsedData.map(item => ({
          taskName: item.taskName,
          course: item.course,
          date: item.date,
          score: item.score !== null ? `${item.score}%` : null,
        }))
        : parsedData;

      const res = await importExternalCurriculum(selectedKidId, source, rows);
      setResult({ imported: res.imported, errors: res.errors });
      setStep('complete');

      if (res.success) {
        toast.success(`Imported ${res.imported} items!`);
      } else {
        toast.error('Import had issues - check results');
      }
    } catch (err) {
      console.error(err);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedData([]);
    setAIParsedData([]);
    setAIWarnings([]);
    setFileName('');
    setRawText('');
    setResult(null);
    setSelectedRows(new Set());
    setShowBulkEdit(false);
    onClose();
  };

  const displayData = useAI && aiParsedData.length > 0 ? aiParsedData : parsedData;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Import External Curriculum
            </h2>
            {useAI && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                <Sparkle size={12} weight="fill" />
                Smart Import
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Kid Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Child
                </label>
                <select
                  value={selectedKidId}
                  onChange={(e) => setSelectedKidId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {kids.map(kid => (
                    <option key={kid.id} value={kid.id}>{kid.name}</option>
                  ))}
                </select>
              </div>

              {/* Source Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Where is this from?
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="miacademy">MiAcademy</option>
                  <option value="khan">Khan Academy</option>
                  <option value="other">Other Curriculum</option>
                </select>
              </div>

              {/* Smart Import Info */}
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Sparkle size={18} weight="fill" className="text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  We&apos;ll automatically organize everything by subject ✨
                </span>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--ember-500)] transition-colors"
              >
                <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop a file here, or
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <label className="inline-block px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium cursor-pointer hover:opacity-90">
                    Browse Files
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handlePasteData}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Paste from Clipboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'parsing' && (
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900/50"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                <Sparkle size={24} weight="fill" className="absolute inset-0 m-auto text-purple-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reading Your File... 📚
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {fileName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                This may take a moment for larger files
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Hang tight! ✨
              </p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {isParsing ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900/50"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    <Sparkle size={24} weight="fill" className="absolute inset-0 m-auto text-purple-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Organizing by subject... 🎨
                  </h3>
                  <p className="text-sm text-gray-500">Hang tight! ✨</p>
                </div>
              ) : (
                <>
                  {/* File info header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <FileText size={20} />
                      <span className="font-medium">{fileName}</span>
                      <span className="text-gray-500">• {displayData.length} items</span>
                    </div>
                    {useAI && aiParsedData.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                        <Sparkle size={12} />
                        Organized by subject
                      </span>
                    )}
                  </div>

                  {/* Selection toolbar */}
                  {aiParsedData.length > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === aiParsedData.length && aiParsedData.length > 0}
                            onChange={toggleAllRows}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedRows.size > 0 ? `${selectedRows.size} selected` : 'Select all'}
                          </span>
                        </label>
                      </div>
                      
                      {selectedRows.size > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowBulkEdit(!showBulkEdit)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
                          >
                            <PencilSimple size={14} />
                            Change Subject
                          </button>
                          <button
                            onClick={deleteSelectedRows}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                          >
                            <Trash size={14} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bulk edit panel */}
                  {showBulkEdit && selectedRows.size > 0 && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Change subject for {selectedRows.size} selected items:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={bulkSubject}
                          onChange={(e) => setBulkSubject(e.target.value)}
                          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="">Choose a subject...</option>
                          {SUBJECT_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          <option value="custom">✏️ Custom subject...</option>
                        </select>
                        {bulkSubject === 'custom' && (
                          <input
                            type="text"
                            placeholder="Enter custom subject"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        )}
                        <button
                          onClick={applyBulkSubject}
                          disabled={!bulkSubject || (bulkSubject === 'custom' && !customSubject)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => setShowBulkEdit(false)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Warnings */}
                  {aiWarnings.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                        <Warning size={16} />
                        <span className="text-sm font-medium">Heads up!</span>
                      </div>
                      <ul className="text-xs text-amber-600 dark:text-amber-300 list-disc list-inside">
                        {aiWarnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className={`${isPreviewExpanded ? 'max-h-[400px]' : 'max-h-64'} overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300`}>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                        <tr>
                          {aiParsedData.length > 0 && (
                            <th className="px-2 py-2 w-8"></th>
                          )}
                          <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Task</th>
                          {useAI && aiParsedData.length > 0 && (
                            <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Subject</th>
                          )}
                          <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(isPreviewExpanded ? displayData : displayData.slice(0, 15)).map((row, idx) => (
                          <tr 
                            key={idx} 
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                              selectedRows.has(idx) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                            }`}
                            onClick={() => aiParsedData.length > 0 && toggleRowSelection(idx)}
                          >
                            {aiParsedData.length > 0 && (
                              <td className="px-2 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(idx)}
                                  onChange={() => toggleRowSelection(idx)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                              </td>
                            )}
                            <td className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-[200px]">
                              {'taskName' in row ? row.taskName : ''}
                            </td>
                            {useAI && aiParsedData.length > 0 && (
                              <td className="px-3 py-2">
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                  {(row as AIParsedItem).subject}
                                </span>
                              </td>
                            )}
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              {'date' in row ? row.date : ''}
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              {useAI && aiParsedData.length > 0
                                ? ((row as AIParsedItem).score !== null ? `${(row as AIParsedItem).score}%` : '-')
                                : ((row as ParsedRow).score || '-')
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Expand/Collapse Toggle */}
                  {displayData.length > 15 && (
                    <button
                      onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                      className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      {isPreviewExpanded ? (
                        <>
                          <CaretUp size={16} weight="bold" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <CaretDown size={16} weight="bold" />
                          Show All {displayData.length} Items
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setStep('upload');
                        setParsedData([]);
                        setAIParsedData([]);
                        setSelectedRows(new Set());
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isImporting || displayData.length === 0}
                      className="px-6 py-2 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <Spinner size={18} className="animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          Import {displayData.length} Items
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'complete' && result && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} weight="bold" className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Import Complete! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Successfully imported <strong>{result.imported}</strong> learning activities
              </p>

              {result.errors.length > 0 && (
                <div className="text-left p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <Warning size={16} />
                    <span className="font-medium">{result.errors.length} items skipped</span>
                  </div>
                  <ul className="text-xs text-amber-600 dark:text-amber-300 list-disc list-inside space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
