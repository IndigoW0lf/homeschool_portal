import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { SyntyAvatarBuilder } from '@/components/SyntyAvatarBuilder';
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
  // Specifically look for 'template-synty' designs
  const supabase = await createServiceRoleClient();
  const { data: designs } = await supabase
    .from('kid_designs')
    .select('*')
    .eq('kid_id', kidId)
    .eq('template_id', 'template-synty')
    .order('created_at', { ascending: false });

  const savedDesigns = (designs || []) as ItemDesignRow[];
  
  // Determine currently equipped texture URL
  let initialTextureUrl: string | undefined;
  if (kid.avatarState?.outfit && kid.avatarState.outfit.startsWith('custom:')) {
    const designId = kid.avatarState.outfit.split(':')[1];
    
    // Check if the equipped design is in our fetched list
    const equippedDesign = savedDesigns.find(d => d.id === designId);
    if (equippedDesign) {
      initialTextureUrl = equippedDesign.texture_url;
    } else {
      // If not in fetched list (maybe older?), try to fetch it specifically
      const { data: specificDesign } = await supabase
        .from('kid_designs')
        .select('texture_url')
        .eq('id', designId)
        .single();
        
      if (specificDesign) {
        initialTextureUrl = specificDesign.texture_url;
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <SyntyAvatarBuilder
        kidId={kidId}
        kidName={kid.nickname || kid.name}
        initialTextureUrl={initialTextureUrl}
        savedDesigns={savedDesigns}
      />
    </div>
  );
}
