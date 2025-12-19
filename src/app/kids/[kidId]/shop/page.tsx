import { notFound } from 'next/navigation';
import { getKidById, getShopItems } from '@/lib/content';
import { Shop } from '@/components/Shop';
import { Moon } from '@phosphor-icons/react/dist/ssr';

interface ShopPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { kidId } = await params;
  const kid = getKidById(kidId);
  
  if (!kid) {
    notFound();
  }

  const shopItems = getShopItems();

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
                Spend your moons, {kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <Shop kidId={kidId} items={shopItems.items} />
      </div>
    </div>
  );
}




