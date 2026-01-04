'use client';

import { useState, useCallback } from 'react';
import { X, Upload, FileText, Check, Warning, Spinner, Sparkle, CaretDown, CaretUp } from '@phosphor-icons/react';
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

export function ImportDataModal({ isOpen, onClose, kids }: ImportDataModalProps) {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || '');
  const [source, setSource] = useState('miacademy');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [aiParsedData, setAIParsedData] = useState<AIParsedItem[]>([]);
  const [aiWarnings, setAIWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

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
      setAIWarnings(data.warnings || []);
      toast.success(`AI parsed ${data.validCount} items`);
    } catch (err) {
      console.error('AI parse error:', err);
      toast.error('AI parsing failed, falling back to manual parsing');
      // Fall back to manual parsing
      const rows = parseCSVManual(text);
      setParsedData(rows);
      setUseAI(false);
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

  const handleImport = async () => {
    if (!selectedKidId) return;

    const dataToImport = useAI && aiParsedData.length > 0 ? aiParsedData : parsedData;
    if (dataToImport.length === 0) return;

    setIsImporting(true);
    try {
      // Convert AI parsed data to the format expected by importExternalCurriculum
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
    onClose();
  };

  const displayData = useAI && aiParsedData.length > 0 ? aiParsedData : parsedData;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Import External Curriculum
            </h2>
            {useAI && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                <Sparkle size={12} weight="fill" />
                AI-Powered
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

        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
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
                  Data Source
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

              {/* AI Toggle */}
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkle size={18} className="text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use AI to parse data
                  </span>
                </div>
                <button
                  onClick={() => setUseAI(!useAI)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${useAI ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${useAI ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--ember-500)] transition-colors"
              >
                <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop a CSV/TSV file here, or
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
                <p className="text-xs text-gray-400 mt-3">
                  AI will automatically detect columns and parse your data
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {isParsing ? (
                <div className="text-center py-12">
                  {/* Animated Loading Indicator */}
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900/50"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    <Sparkle size={24} weight="fill" className="absolute inset-0 m-auto text-purple-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    AI is analyzing your data
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    Parsing and categorizing each item...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This may take up to <span className="font-medium text-purple-600 dark:text-purple-400">30 seconds</span> for large files.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                    Please be patient and don&apos;t close this window.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <FileText size={20} />
                      <span className="font-medium">{fileName}</span>
                      <span className="text-gray-500">• {displayData.length} items</span>
                    </div>
                    {useAI && aiParsedData.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                        <Sparkle size={12} />
                        Parsed by AI
                      </span>
                    )}
                  </div>

                  {/* AI Warnings */}
                  {aiWarnings.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                        <Warning size={16} />
                        <span className="text-sm font-medium">AI Notes</span>
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
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                Import Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Successfully imported <strong>{result.imported}</strong> items
              </p>

              {result.errors.length > 0 && (
                <div className="text-left p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <Warning size={16} />
                    <span className="font-medium">{result.errors.length} warnings</span>
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
