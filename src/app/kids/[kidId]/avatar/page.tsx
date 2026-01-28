import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { SyntyAvatarBuilder } from '@/components/SyntyAvatarBuilder';
import { ItemDesignRow } from '@/types/design-studio';
import { AvatarState } from '@/types';

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
  // Look for any synty-related templates
  const supabase = await createServiceRoleClient();
  const { data: designs } = await supabase
    .from('kid_designs')
    .select('*')
    .eq('kid_id', kidId)
    .like('template_id', 'template-synty%')
    .order('created_at', { ascending: false });

  const savedDesigns = (designs || []) as ItemDesignRow[];
  
  // Determine currently equipped texture URLs
  const avatarState = (kid.avatarState || {}) as AvatarState;
  let initialTextureUrl: string | undefined;
  let initialTopUrl: string | undefined;
  let initialBottomUrl: string | undefined;
  let initialShoesUrl: string | undefined;

  // 1. Full Outfit (Legacy)
  if (avatarState.outfit?.startsWith('custom:')) {
    const designId = avatarState.outfit.split(':')[1];
    initialTextureUrl = savedDesigns.find(d => d.id === designId)?.texture_url;
    if (!initialTextureUrl) {
      const { data } = await supabase.from('kid_designs').select('texture_url').eq('id', designId).single();
      initialTextureUrl = data?.texture_url;
    }
  }

  // 2. Modular Pieces
  const fetchDesignUrl = async (id?: string) => {
    if (!id) return undefined;
    const local = savedDesigns.find(d => d.id === id);
    if (local) return local.texture_url;
    const { data } = await supabase.from('kid_designs').select('texture_url').eq('id', id).single();
    return data?.texture_url;
  };

  initialTopUrl = await fetchDesignUrl(avatarState.topId);
  initialBottomUrl = await fetchDesignUrl(avatarState.bottomId);
  initialShoesUrl = await fetchDesignUrl(avatarState.shoesId);

  return (
    <div className="min-h-screen bg-[var(--background-secondary)] dark:bg-[var(--background)] pb-12">
      <SyntyAvatarBuilder
        kidId={kidId}
        kidName={kid.nickname || kid.name}
        initialTextureUrl={initialTextureUrl}
        initialTopUrl={initialTopUrl}
        initialBottomUrl={initialBottomUrl}
        initialShoesUrl={initialShoesUrl}
        savedDesigns={savedDesigns}
        initialSkinColor={avatarState.skinTone || '#f2d3b1'}
      />
    </div>
  );
}
