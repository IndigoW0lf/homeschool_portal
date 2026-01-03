import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { getShopItems } from '@/lib/content';
import { createServerClient } from '@/lib/supabase/server';
import { Shop } from '@/components/Shop';
import { Moon } from '@phosphor-icons/react/dist/ssr';
import { ShopItem } from '@/types';

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

  // Get digital items from content
  const digitalItems = getShopItems().items;

  // Get real-world rewards from database
  const supabase = await createServerClient();
  const { data: kidRewards } = await supabase
    .from('kid_rewards')
    .select('*')
    .eq('kid_id', kidId)
    .eq('is_active', true);

  // Convert kid_rewards to ShopItem format
  const rewardItems: ShopItem[] = (kidRewards || []).map(reward => ({
    id: reward.id,
    name: reward.name,
    type: 'reward' as const,
    cost: reward.moon_cost,
    description: reward.description || '',
    emoji: reward.emoji,
  }));

  // Combine all items
  const allItems = [...rewardItems, ...digitalItems];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white">
              <Moon size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Moons Shop
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
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
