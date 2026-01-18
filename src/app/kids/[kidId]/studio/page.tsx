import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { DesignStudio } from '@/components/studio';
import { DesignTemplatesManifest } from '@/types/design-studio';
import designTemplatesData from '../../../../../content/design-templates.json';

interface StudioPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  const templates = designTemplatesData as DesignTemplatesManifest;

  return (
    <main className="min-h-screen bg-[var(--paper-50)] dark:bg-gray-900">
      <DesignStudio 
        kidId={kidId} 
        templates={templates} 
      />
    </main>
  );
}

export const metadata = {
  title: 'Design Studio | Lunara Quest',
  description: 'Design your own avatar clothing and accessories',
};
