import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';
import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { DesignStudio } from '@/components/studio/DesignStudio';
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

  // Check for kid session to bypass RLS if needed
  const kidSession = await getKidSession();
  let supabase;
  
  if (kidSession && kidSession.kidId === kidId) {
    supabase = await createServiceRoleClient();
  } else {
    supabase = await createServerClient();
  }

  const templates = designTemplatesData as DesignTemplatesManifest;

  // 1. Fetch unlocked templates
  const { data: unlocks } = await supabase
    .from('student_unlocks')
    .select('unlock_id')
    .eq('kid_id', kidId);
  
  const unlockedTemplateIds = unlocks?.map(u => u.unlock_id) || [];

  // 2. Fetch existing designs (Wardrobe)
  const { data: designs } = await supabase
    .from('kid_designs')
    .select('*')
    .eq('kid_id', kidId)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[var(--paper-50)] dark:bg-[var(--background)]">
      <DesignStudio 
        kidId={kidId} 
        templates={templates}
        unlockedTemplateIds={unlockedTemplateIds}
        initialDesigns={designs || []}
      />
    </main>
  );
}

export const metadata = {
  title: 'Design Studio | Lunara Quest',
  description: 'Design your own avatar clothing and accessories',
};
