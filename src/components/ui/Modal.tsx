'use client';

import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={cn(
           "modal-content animate-in zoom-in-95 duration-200",
           className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        {(title || description) && (
          <div className="flex-between p-6 border-b border-[var(--border)]">
            <div>
               {title && <h2 className="heading-lg">{title}</h2>}
               {description && <p className="text-sm text-muted">{description}</p>}
            </div>
            <button onClick={onClose} className="btn-icon">
              <X size={28} weight="duotone" className="text-[var(--nebula-pink)]" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--background-secondary)]">
           {children}
        </div>

      </div>
    </div>
  );
}
