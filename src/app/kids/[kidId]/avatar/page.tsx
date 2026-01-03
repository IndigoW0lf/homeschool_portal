import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { UserCircle, Sparkle, TShirt } from '@phosphor-icons/react/dist/ssr';

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

  const displayName = kid.nickname || kid.name;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--lavender-400)] to-[var(--lavender-600)] text-white">
              <UserCircle size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Avatar Builder
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Customize your look, {displayName}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--lavender-100)] via-purple-100 to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="aspect-video flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center">
                <TShirt size={48} weight="duotone" className="text-[var(--lavender-500)]" />
              </div>
              <Sparkle 
                size={24} 
                weight="fill" 
                className="absolute -top-2 -right-2 text-[var(--lavender-500)] animate-pulse" 
              />
              <Sparkle 
                size={16} 
                weight="fill" 
                className="absolute -bottom-1 -left-3 text-purple-500 animate-pulse" 
                style={{ animationDelay: '0.5s' }}
              />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              👤 Avatar Builder Coming Soon!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Soon you'll be able to create your own unique avatar! Choose hairstyles, outfits, accessories, and more.
            </p>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-2xl mb-2">👕</div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Choose Outfits</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pick from cool outfits and accessories for your avatar!
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-2xl mb-2">💇</div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Style Your Hair</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pick a hairstyle and color that shows off your personality!
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-2xl mb-2">🛒</div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Unlock with Moons</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Earn moons to unlock special items for your avatar!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


