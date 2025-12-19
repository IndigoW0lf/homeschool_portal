import { notFound } from 'next/navigation';
import { getKidById, getStudioTemplates } from '@/lib/content';
import { StudioEditor } from '@/components/StudioEditor';
import { Palette } from '@phosphor-icons/react/dist/ssr';

interface StudioPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { kidId } = await params;
  const kid = getKidById(kidId);
  
  if (!kid) {
    notFound();
  }

  const templates = getStudioTemplates();

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 text-white">
              <Palette size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Art Studio
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Recolor templates, {kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <StudioEditor kidId={kidId} templates={templates} />
      </div>
    </div>
  );
}







