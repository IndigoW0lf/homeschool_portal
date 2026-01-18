import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AvatarBuilder } from '@/components/AvatarBuilder';
import assetsData from '@/../content/avatar-assets.json';
import { AvatarAssets } from '@/types';
import { ItemDesignRow } from '@/types/design-studio';

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

  // Fetch saved designs for the "Wardrobe"
  const supabase = await createServiceRoleClient();
  const { data: designs } = await supabase
    .from('kid_designs')
    .select('*')
    .eq('kid_id', kidId)
    .order('created_at', { ascending: false });

  const savedDesigns = (designs || []) as ItemDesignRow[];
  const assets = assetsData as AvatarAssets;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <AvatarBuilder 
        kidId={kidId} 
        assets={assets}
        initialAvatarState={kid.avatarState}
        customDesigns={savedDesigns}
      />
    </div>
  );
}



