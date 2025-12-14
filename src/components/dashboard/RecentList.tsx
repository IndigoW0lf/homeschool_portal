'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string; // Date or description snippet
  badge?: string;    // Type or Tag
  badgeColor?: string;
}

interface RecentListProps {
  title: string;
  items: ListItem[];
  type?: 'lesson' | 'assignment' | 'resource';
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  createLink: string;
  createLabel: string;
  emptyMessage?: string;
}

export function RecentList({
  title,
  items,
  onView,
  onEdit,
  onDelete,
  createLink,
  createLabel,
  emptyMessage = "No items found."
}: RecentListProps) {


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <Link 
          href={createLink}
          className="text-xs flex items-center gap-1 bg-[var(--ember-50)] dark:bg-[var(--ember-900)/30] text-[var(--ember-600)] dark:text-[var(--ember-400)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--ember-100)] dark:hover:bg-[var(--ember-900)/50] transition-colors font-medium"
        >
          <Plus size={14} /> {createLabel}
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 p-2">
        {paginatedItems.length > 0 ? (
          <div className="space-y-1">
            {paginatedItems.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "group flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                  onView && "cursor-pointer"
                )}
              >
                <div 
                  className="min-w-0 flex-1"
                  onClick={() => onView?.(item.id)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                        item.badgeColor || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>


                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item.id)}
                       className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                       title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-8">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      {totalPages > 1 && (
         <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
           <span>Page {currentPage} of {totalPages}</span>
           <div className="flex gap-1">
             <button 
               onClick={prevPage} 
               disabled={currentPage === 1}
               className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
             >
               <ChevronLeft size={16} />
             </button>
             <button 
               onClick={nextPage} 
               disabled={currentPage === totalPages}
               className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
             >
               <ChevronRight size={16} />
             </button>
           </div>
         </div>
      )}
    </div>
  );
}
