'use client';

import { useRouter } from 'next/navigation';
import { ResourceForm } from '@/components/resources/ResourceForm';

export default function ResourcesPage() {
  const router = useRouter();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only navigate if clicking directly on the backdrop (not on children)
    if (e.target === e.currentTarget) {
      router.push('/parent');
    }
  };

  return (
    <div 
      className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 cursor-pointer"
      onClick={handleBackdropClick}
    >
      <div 
        className="max-w-3xl mx-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Add Resource
          </h1>
          <p className="text-muted text-sm">
            Add books, videos, and websites to the library.
          </p>
        </div>

        <div className="bg-[var(--background-elevated)] rounded-xl shadow-sm border border-[var(--border)] p-6">
          <ResourceForm />
        </div>
      </div>
    </div>
  );
}
