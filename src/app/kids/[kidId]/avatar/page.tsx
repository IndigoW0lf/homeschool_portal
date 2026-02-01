import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { OpenPeepsAvatarBuilder } from '@/components/OpenPeepsAvatarBuilder';
import { OpenPeepsAvatarState } from '@/types';

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

  // Fetch kid's purchased/unlocked avatar items
  const supabase = await createServiceRoleClient();
  const { data: unlockedItems } = await supabase
    .from('kid_avatar_items')
    .select('item_category, item_id')
    .eq('kid_id', kidId);

  const unlockedItemIds = (unlockedItems || []).map(
    (item: { item_category: string; item_id: string }) => 
      `${item.item_category}:${item.item_id}`
  );

  // Get existing Open Peeps avatar state if any
  // Check both the new open_peeps_avatar_state column and legacy data
  let initialState: Partial<OpenPeepsAvatarState> = {};
  
  // Try to get from kid record (will be added in migration)
  const kidRecord = kid as unknown as Record<string, unknown>;
  if (kidRecord.open_peeps_avatar_state) {
    initialState = kidRecord.open_peeps_avatar_state as Partial<OpenPeepsAvatarState>;
  }

  return (
    <div className="min-h-screen bg-[var(--background-secondary)] dark:bg-[var(--background)] pb-12">
      <OpenPeepsAvatarBuilder
        kidId={kidId}
        initialState={initialState}
        unlockedItems={unlockedItemIds}
      />
    </div>
  );
}

