'use client';

import { useState, useCallback } from 'react';
import { X, Upload, FileText, Check, Warning, Spinner } from '@phosphor-icons/react';
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

export function ImportDataModal({ isOpen, onClose, kids }: ImportDataModalProps) {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || '');
  const [source, setSource] = useState('miacademy');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    const rows: ParsedRow[] = [];
    
    // Skip known non-data lines (Miacademy disclaimers, etc.)
    const skipPatterns = [
      'grade report was printed',
      'curriculum provider',
      'not an official transcript',
      'miacademy is a',
    ];
    
    // Auto-detect delimiter: check if first data line has tabs
    const firstDataLine = lines.find(l => 
      l.trim() && 
      !skipPatterns.some(p => l.toLowerCase().includes(p))
    );
    const delimiter = firstDataLine?.includes('\t') ? '\t' : ',';
    
    // Skip header row if it looks like headers
    const startIdx = lines[0]?.toLowerCase().includes('task') ? 1 : 0;
    
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip disclaimer/non-data lines
      if (skipPatterns.some(p => line.toLowerCase().includes(p))) continue;
      
      // Split by detected delimiter and clean up quotes
      const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));
      
      // Need at least task name, course, and date
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      setParsedData(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      setParsedData(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleImport = async () => {
    if (!selectedKidId || parsedData.length === 0) return;
    
    setIsImporting(true);
    try {
      const res = await importExternalCurriculum(selectedKidId, source, parsedData);
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
    setFileName('');
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Import External Curriculum
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
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
                  <option value="other">Other Curriculum</option>
                </select>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--ember-500)] transition-colors"
              >
                <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop a CSV file here, or
                </p>
                <label className="inline-block px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium cursor-pointer hover:opacity-90">
                  Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-3">
                  Expected columns: Task Name, Course, Date, Score
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <FileText size={20} />
                <span className="font-medium">{fileName}</span>
                <span className="text-gray-500">• {parsedData.length} rows</span>
              </div>

              {/* Preview Table */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Task</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Course</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-[200px]">{row.taskName}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{row.course}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.date}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.score || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-center py-2 text-gray-500 text-xs">
                    + {parsedData.length - 10} more rows
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-6 py-2 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Spinner size={18} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {parsedData.length} Items
                    </>
                  )}
                </button>
              </div>
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
                <div className="text-left p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <Warning size={16} />
                    <span className="font-medium">{result.errors.length} warnings</span>
                  </div>
                  <ul className="text-xs text-amber-600 dark:text-amber-300 list-disc list-inside">
                    {result.errors.slice(0, 3).map((err, i) => (
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
