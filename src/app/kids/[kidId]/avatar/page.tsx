import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getKidByIdFromDB } from '@/lib/supabase/data';

interface AvatarPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function AvatarPage({ params }: AvatarPageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Avatar Builder
          </h1>
          
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <span className="text-6xl">🚧</span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The avatar builder is coming soon! We're working on a proper full-body character customization system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/kids/${kidId}`}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to Portal
            </Link>
            <Link
              href={`/kids/${kidId}/studio`}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              🎨 Design Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
