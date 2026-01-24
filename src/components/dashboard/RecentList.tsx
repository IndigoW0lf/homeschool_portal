'use client';

import { useState } from 'react';
import { CaretLeft, CaretRight, PencilSimple, Trash, Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string; // Date or description snippet
  badge?: string;    // Type or Tag
  badgeColor?: string;
}

interface RecentListProps {
  title: string;
  titleImage?: string; // SVG path like '/lessons.svg'
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
  titleImage,
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
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="card-header min-h-[3.5rem]">
        {titleImage ? (
          <Image 
            src={titleImage} 
            alt={title} 
            width={120} 
            height={30}
            className="h-6 w-auto svg-title flex-shrink-0"
          />
        ) : (
          <h3 className="heading-sm">{title}</h3>
        )}
        <Link 
          href={createLink}
          className="btn-sm btn-ghost text-[var(--ember-600)] dark:text-[var(--ember-400)] whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} weight="bold" color="#e7b58d" /> {createLabel}
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
                  "list-item group",
                  onView && "cursor-pointer"
                )}
              >
                <div 
                  className="min-w-0 flex-1"
                  onClick={() => onView?.(item.id)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-heading dark:text-muted truncate">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                        item.badgeColor || "bg-[var(--background-secondary)] text-muted dark:bg-[var(--background-secondary)] dark:text-muted"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-muted truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>


                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item.id)}
                      className="p-1.5 text-muted hover:text-[var(--celestial-500)] hover:bg-[var(--celestial-50)] dark:hover:bg-[var(--celestial-900)]/30 rounded-md transition-colors"
                      title="Edit"
                    >
                      <PencilSimple size={18} weight="duotone" color="#caa2d8" />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item.id)}
                       className="p-1.5 text-muted hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 dark:hover:bg-[var(--destructive)]/20 rounded-md transition-colors"
                       title="Delete"
                    >
                      <Trash size={18} weight="duotone" color="#ffcdf6" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted py-8">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      {totalPages > 1 && (
         <div className="p-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted">
           <span>Page {currentPage} of {totalPages}</span>
           <div className="flex gap-1">
             <button 
               onClick={prevPage} 
               disabled={currentPage === 1}
               className="p-1 hover:bg-[var(--hover-overlay)] rounded disabled:opacity-30 disabled:hover:bg-transparent"
             >
                <CaretLeft size={20} weight="duotone" color="#b6e1d8" />
             </button>
             <button 
               onClick={nextPage} 
               disabled={currentPage === totalPages}
               className="p-1 hover:bg-[var(--hover-overlay)] rounded disabled:opacity-30 disabled:hover:bg-transparent"
             >
                <CaretRight size={20} weight="duotone" color="#b6e1d8" />
             </button>
           </div>
         </div>
      )}
    </div>
  );
}
