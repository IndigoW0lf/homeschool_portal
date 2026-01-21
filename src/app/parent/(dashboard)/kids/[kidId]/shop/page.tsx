import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Shop } from '@/components/Shop';
import { Moon, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { ShopItem } from '@/types';
import { DesignTemplatesManifest } from '@/types/design-studio';
import designTemplatesData from '../../../../../../../content/design-templates.json';
import Link from 'next/link';

interface Props {
  params: Promise<{ kidId: string }>;
}

export default async function ParentViewKidShopPage({ params }: Props) {
  const { kidId } = await params;
  const supabase = await createServerClient();

  // Get the current user (parent)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/parent/login');

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!familyMember) redirect('/parent');

  // Get kid data (make sure they're in the user's family)
  const { data: kid, error } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .eq('family_id', familyMember.family_id)
    .single();

  if (error || !kid) notFound();

  // Use Service Role to fetch shop items (bypass RLS for parent viewing)
  const serviceSupabase = await createServiceRoleClient();

  // 1. Get real-world rewards (parent-created)
  const { data: kidRewards } = await serviceSupabase
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
  const { data: unlocks } = await serviceSupabase
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
          emoji: category.icon 
        });
      }
    });
  });

  const allItems = [...rewardItems, ...templateItems];
  const displayName = kid.nickname || kid.name;

  return (
    <div className="min-h-screen">
      {/* Parent View Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200 dark:border-blue-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                Parent View
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Viewing {displayName}'s shop as admin
              </p>
            </div>
            <Link
              href={`/kids/${kidId}/shop`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowSquareOut size={16} />
              Open Kid Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white">
              <Moon size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayName}'s Moons Shop
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                View and manage shop items
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
