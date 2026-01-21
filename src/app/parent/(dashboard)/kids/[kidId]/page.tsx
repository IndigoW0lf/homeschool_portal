import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { Moon, CheckCircle, Calendar, ArrowSquareOut, Gift } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

interface Props {
  params: Promise<{ kidId: string }>;
}

export default async function ParentKidProfilePage({ params }: Props) {
  const { kidId } = await params;
  const supabase = await createServerClient();

  // Get the current user
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

  // Get moons from student_progress
  const { data: progress } = await supabase
    .from('student_progress')
    .select('total_stars')
    .eq('kid_id', kidId)
    .single();

  const moons = progress?.total_stars || 0;

  // Get this week's schedule items for completion tracking
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const { data: scheduleItems } = await supabase
    .from('schedule_items')
    .select('id, status')
    .eq('student_id', kidId)
    .gte('date', startOfWeek.toISOString().split('T')[0])
    .lte('date', endOfWeek.toISOString().split('T')[0]);

  const totalActivities = scheduleItems?.length || 0;
  const completedActivities = scheduleItems?.filter(item => item.status === 'completed').length || 0;
  const completionPercent = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Get pending rewards count
  const { count: pendingRewardsCount } = await supabase
    .from('reward_redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('kid_id', kidId)
    .eq('status', 'pending');

  const displayName = kid.nickname || kid.name;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <AvatarPreview 
          avatarState={kid.avatar_state}
          size="xl"
          fallbackName={displayName}
          fallbackColor={kid.favorite_color}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h1>
          {kid.nickname && kid.name !== kid.nickname && (
            <p className="text-gray-500 dark:text-gray-400">{kid.name}</p>
          )}
          {kid.bio && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">{kid.bio}</p>
          )}
        </div>
        <Link
          href={`/kids/${kidId}`}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg hover:bg-[var(--ember-600)] transition-colors"
        >
          <ArrowSquareOut size={18} />
          Kid Portal
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Moons */}
        <div className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
          <div className="flex items-center gap-3 mb-2">
            <Moon size={24} weight="fill" className="text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Moons Balance</span>
          </div>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{moons}</p>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 p-6 rounded-xl border border-teal-200 dark:border-teal-800/50">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={24} weight="fill" className="text-teal-500" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">This Week</span>
          </div>
          <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
            {completedActivities}/{totalActivities}
          </p>
          <div className="mt-2 h-2 bg-teal-200 dark:bg-teal-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Pending Rewards */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={24} weight="fill" className="text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Pending Rewards</span>
          </div>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{pendingRewardsCount || 0}</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kid.birthday && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Calendar size={16} />
              Birthday
            </div>
            <p className="text-gray-900 dark:text-white">
              {new Date(kid.birthday + 'T00:00:00').toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        )}

        {kid.favorite_shows && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🎬 Favorite Shows</div>
            <p className="text-gray-900 dark:text-white">{kid.favorite_shows}</p>
          </div>
        )}

        {kid.favorite_music && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🎵 Favorite Music</div>
            <p className="text-gray-900 dark:text-white">{kid.favorite_music}</p>
          </div>
        )}

        {kid.favorite_foods && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🍕 Favorite Foods</div>
            <p className="text-gray-900 dark:text-white">{kid.favorite_foods}</p>
          </div>
        )}

        {kid.favorite_subjects && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">📚 Favorite Subjects</div>
            <p className="text-gray-900 dark:text-white">{kid.favorite_subjects}</p>
          </div>
        )}

        {kid.hobbies && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🎮 Hobbies</div>
            <p className="text-gray-900 dark:text-white">{kid.hobbies}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/parent/kids/${kidId}/profile`}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href={`/parent/kids/${kidId}/shop`}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            View Shop
          </Link>
          <Link
            href={`/parent/kids/${kidId}/journal`}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            View Journal
          </Link>
          <Link
            href="/parent/progress"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            View Progress
          </Link>
        </div>
      </div>
    </div>
  );
}
