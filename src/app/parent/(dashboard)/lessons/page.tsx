'use client';

import { useRouter } from 'next/navigation';
import { ActivityForm } from '@/components/activities/ActivityForm';

export default function LessonsPage() {
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <ActivityForm />
        </div>
      </div>
    </div>
  );
}

