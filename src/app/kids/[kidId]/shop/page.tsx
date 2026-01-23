import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';
import { Shop } from '@/components/Shop';
import { Moon } from '@phosphor-icons/react/dist/ssr';
import { ShopItem } from '@/types';
import { DesignTemplatesManifest } from '@/types/design-studio';
import designTemplatesData from '../../../../../content/design-templates.json';

interface ShopPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  // Check if this is a kid session - use Service Role to bypass RLS
  const kidSession = await getKidSession();
  let supabase;
  
  if (kidSession && kidSession.kidId === kidId) {
    // Kid viewing their own shop → Use Service Role (bypass RLS)
    supabase = await createServiceRoleClient();
  } else {
    // Parent/other user → Use standard client (RLS)
    supabase = await createServerClient();
  }

  // 1. Get real-world rewards (parent-created)
  const { data: kidRewards } = await supabase
    .from('kid_rewards')
    .select('*')
    .eq('kid_id', kidId)
    .eq('is_active', true);

  const rewardItems: ShopItem[] = (kidRewards || []).map(reward => ({
    id: reward.id,
    name: reward.name,
    type: 'reward' as const,
    cost: reward.moon_cost,
    description: reward.description || '',
    emoji: reward.emoji,
  }));

  // 2. Get unlocked templates for this kid
  const { data: unlocks } = await supabase
    .from('student_unlocks')
    .select('unlock_id')
    .eq('kid_id', kidId);
  
  const unlockedIds = new Set(unlocks?.map(u => u.unlock_id) || []);

  // 3. Get lockable templates from manifest
  const templates = designTemplatesData as DesignTemplatesManifest;
  const templateItems: ShopItem[] = [];

  templates.categories.forEach(category => {
    category.templates.forEach(template => {
      // Only include if it's a shop item, NOT initially unlocked, and NOT already owned
      if (
        !template.unlocked && 
        template.unlockType === 'shop' && 
        template.unlockCost && 
        !unlockedIds.has(template.id)
      ) {
        templateItems.push({
          id: template.id,
          name: template.label,
          type: 'template',
          cost: template.unlockCost,
          description: `Design your own ${template.label}!`,
          // We can use the category icon as a fallback emoji if needed
          emoji: category.icon 
        });
      }
    });
  });

  const allItems = [...rewardItems, ...templateItems];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-[var(--background-elevated)] dark:bg-[var(--night-700)]/80 dark:backdrop-blur-sm border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white">
              <Moon size={28} weight="fill" />
            </div>
            <div>
              <h1 className="heading-lg">
                Moons Shop
              </h1>
              <p className="text-muted">
                Spend your moons, {kid.nickname || kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <Shop kidId={kidId} items={allItems} />
      </div>
    </div>
  );
}
