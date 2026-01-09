'use client';

import { useState, useEffect, useRef } from 'react';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { CaretLeft, Printer, Calendar, Clock, GraduationCap, FunnelSimple, ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { fetchActivityLogForKids } from '@/app/actions/activityLog';
import { SUBJECTS } from '@/lib/activityLogConstants';

interface Kid {
  id: string;
  name: string;
}

interface ActivityLogEntry {
  id: string;
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  source: string;
}

type DatePreset = 'week' | 'month' | '3months' | 'year' | 'custom';

interface ReportsClientProps {
  kids: Kid[];
}

export function ReportsClient({ kids }: ReportsClientProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedKid, setSelectedKid] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on preset
  useEffect(() => {
    const today = new Date();
    let start: Date, end: Date;
    
    switch (datePreset) {
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case '3months':
        start = subMonths(startOfMonth(today), 2);
        end = endOfMonth(today);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        return; // Don't update dates for custom
      default:
        start = subDays(today, 30);
        end = today;
    }
    
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  }, [datePreset]);

  // Fetch entries when date range changes
  useEffect(() => {
    if (!startDate || !endDate) return;
    
    async function loadEntries() {
      setLoading(true);
      const kidIds = selectedKid === 'all' ? kids.map(k => k.id) : [selectedKid];
      const data = await fetchActivityLogForKids(kidIds, startDate, endDate);
      setEntries(data);
      setLoading(false);
    }
    
    loadEntries();
  }, [startDate, endDate, selectedKid, kids]);

  // Filter entries by subject
  const filteredEntries = selectedSubject === 'all' 
    ? entries 
    : entries.filter(e => e.subject === selectedSubject);

  // Calculate summary stats
  const summary = {
    totalEntries: filteredEntries.length,
    totalMinutes: filteredEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0),
    bySubject: {} as Record<string, { count: number; minutes: number }>,
    byKid: {} as Record<string, { count: number; minutes: number }>
  };

  for (const entry of filteredEntries) {
    // By subject
    if (!summary.bySubject[entry.subject]) {
      summary.bySubject[entry.subject] = { count: 0, minutes: 0 };
    }
    summary.bySubject[entry.subject].count += 1;
    summary.bySubject[entry.subject].minutes += entry.durationMinutes || 0;
    
    // By kid
    if (!summary.byKid[entry.kidId]) {
      summary.byKid[entry.kidId] = { count: 0, minutes: 0 };
    }
    summary.byKid[entry.kidId].count += 1;
    summary.byKid[entry.kidId].minutes += entry.durationMinutes || 0;
  }

  const kidMap = Object.fromEntries(kids.map(k => [k.id, k.name]));

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            href="/parent/progress"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={28} weight="duotone" className="text-[var(--ember-500)]" />
              Activity Reports
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate printable homeschool activity logs
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-white font-medium rounded-lg transition-colors"
        >
          <Printer size={20} />
          Print Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <FunnelSimple size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Preset */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date Range</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {datePreset === 'custom' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </>
          )}

          {/* Kid Filter */}
          {kids.length > 1 && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Student</label>
              <select
                value={selectedKid}
                onChange={(e) => setSelectedKid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Students</option>
                {kids.map(kid => (
                  <option key={kid.id} value={kid.id}>{kid.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Filter */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Subjects</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Section */}
      <div ref={printRef} className="print:p-0">
        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Homeschool Activity Log</h1>
          <p className="text-sm text-gray-600">
            {format(parseISO(startDate || new Date().toISOString().split('T')[0]), 'MMMM d, yyyy')} - {format(parseISO(endDate || new Date().toISOString().split('T')[0]), 'MMMM d, yyyy')}
          </p>
          {selectedKid !== 'all' && (
            <p className="text-sm text-gray-600">Student: {kidMap[selectedKid]}</p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 print:border print:rounded-none print:mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Summary</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-[var(--ember-500)]">{summary.totalEntries}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Activities</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-[var(--ember-500)]">{formatDuration(summary.totalMinutes)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Time</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-[var(--ember-500)]">{Object.keys(summary.bySubject).length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Subjects</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-[var(--ember-500)]">
                {summary.totalMinutes > 0 ? formatDuration(Math.round(summary.totalMinutes / (summary.totalEntries || 1))) : '0 min'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Avg Duration</div>
            </div>
          </div>

          {/* Hours by Subject */}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time by Subject</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(summary.bySubject)
              .sort(([,a], [,b]) => b.minutes - a.minutes)
              .map(([subject, data]) => (
                <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{subject}</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatDuration(data.minutes)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Activity Log Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden print:border print:rounded-none">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                {kids.length > 1 && selectedKid === 'all' && (
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Student</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Activity</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No activities found for this period</td>
                </tr>
              ) : (
                filteredEntries
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {format(parseISO(entry.date), 'MMM d, yyyy')}
                      </td>
                      {kids.length > 1 && selectedKid === 'all' && (
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{kidMap[entry.kidId]}</td>
                      )}
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.subject}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800 dark:text-white">{entry.title}</div>
                        {entry.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {entry.durationMinutes ? formatDuration(entry.durationMinutes) : '-'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          #__next,
          #__next > div,
          [class*="max-w-"] {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}
