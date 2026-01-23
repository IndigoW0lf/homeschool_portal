'use client';

import { WorksheetData } from '@/types';
import { WorksheetViewer } from './WorksheetViewer';

interface PrintPageClientProps {
  data: WorksheetData;
}

export function PrintPageClient({ data }: PrintPageClientProps) {
  return (
    <div className="bg-white min-h-screen">
       <style jsx global>{`
        @media print {
          @page { margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print Controls - Hidden when printing */}
      <div className="no-print fixed top-0 left-0 w-full bg-[var(--night-900)]/80 backdrop-blur-sm p-4 flex justify-between items-center text-white z-50">
        <div className="font-medium">
          Print Preview: {data.title}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.close()} 
            className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            Close
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2"
          >
            <span>🖨️</span> Print PDF
          </button>
        </div>
      </div>

      <div className="pt-20 print:pt-0">
        <WorksheetViewer data={data} /> 
      </div>
    </div>
  );
}
