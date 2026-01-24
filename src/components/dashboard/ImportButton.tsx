'use client';

import { useState } from 'react';
import { Upload } from '@phosphor-icons/react';
import { ImportDataModal } from '@/components/dashboard/ImportDataModal';

interface Kid {
  id: string;
  name: string;
}

interface ImportButtonProps {
  kids: Kid[];
}

export function ImportButton({ kids }: ImportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-[var(--foreground)] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
      >
        <Upload size={18} />
        Import Data
      </button>
      
      <ImportDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kids={kids}
      />
    </>
  );
}
