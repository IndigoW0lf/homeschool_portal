import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import Link from 'next/link';
import { SyntyAvatarPreview } from '@/components/SyntyAvatarPreview';

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Avatar Builder
            </h1>
            <Link
              href={`/kids/${kidId}/studio`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
            >
              🎨 Design Studio
            </Link>
          </div>

          {/* 3D Avatar Preview */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-80 h-[28rem] rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
              <SyntyAvatarPreview kidId={kidId} />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {kid.nickname || kid.name}'s Avatar
            </p>
          </div>

          {/* Coming Soon Notice */}
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              🚧 Full avatar customization is coming soon!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You'll be able to customize your character's skin, hair, and clothing.
              <br />
              Design your own outfits in the Design Studio!
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-6 flex justify-center">
            <Link
              href={`/kids/${kidId}`}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
