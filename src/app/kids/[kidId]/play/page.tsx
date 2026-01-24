import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { GameController, Sparkle, Rocket } from '@phosphor-icons/react/dist/ssr';

interface PlayPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);

  if (!kid) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-[var(--background-elevated)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--ember-400)] to-[var(--ember-600)] text-[var(--foreground)]">
              <GameController size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Play Zone
              </h1>
              <p className="text-muted">
                Time for adventure, {kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Game Embed Placeholder */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--sage-100)] via-[var(--lavender-100)] to-[var(--ember-100)] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border-2 border-dashed border-[var(--border)]">
          <div className="aspect-video flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-[var(--background-elevated)] shadow-lg flex items-center justify-center">
                <Rocket size={48} weight="duotone" className="text-[var(--ember-500)]" />
              </div>
              <Sparkle 
                size={24} 
                weight="fill" 
                className="absolute -top-2 -right-2 text-[var(--lavender-500)] animate-pulse" 
              />
              <Sparkle 
                size={16} 
                weight="fill" 
                className="absolute -bottom-1 -left-3 text-[var(--sage-500)] animate-pulse" 
                style={{ animationDelay: '0.5s' }}
              />
            </div>
            
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
              🚀 Game Coming Soon!
            </h2>
            <p className="text-muted max-w-md">
              This is where your adventure awaits. The Lunara Quest game will be embedded here soon!
            </p>
            
            {/* Placeholder for future game embed */}
            {/* 
              To embed the game, replace this placeholder with:
              <iframe 
                src="YOUR_GAME_URL_HERE" 
                className="w-full h-full absolute inset-0"
                allow="fullscreen"
              />
            */}
          </div>
        </div>

        {/* Game Tips Section */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-[var(--background-elevated)] rounded-xl p-4 shadow-sm border border-[var(--border)]">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Complete Quests</h3>
            <p className="text-sm text-muted">
              Finish your daily assignments to unlock new adventures!
            </p>
          </div>
          <div className="bg-[var(--background-elevated)] rounded-xl p-4 shadow-sm border border-[var(--border)]">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Earn Stars</h3>
            <p className="text-sm text-muted">
              Collect stars to spend in the Rewards Shop!
            </p>
          </div>
          <div className="bg-[var(--background-elevated)] rounded-xl p-4 shadow-sm border border-[var(--border)]">
            <div className="text-2xl mb-2">🔥</div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Keep Your Streak</h3>
            <p className="text-sm text-muted">
              Play every day to build your streak and unlock bonuses!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
