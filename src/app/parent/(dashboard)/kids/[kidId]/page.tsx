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
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {displayName}
          </h1>
          {kid.nickname && kid.name !== kid.nickname && (
            <p className="text-muted">{kid.name}</p>
          )}
          {kid.bio && (
            <p className="mt-2 text-muted dark:text-[var(--foreground-muted)]">{kid.bio}</p>
          )}
        </div>
        <Link
          href={`/kids/${kidId}`}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] text-[var(--foreground)] rounded-lg hover:bg-[var(--ember-600)] transition-colors"
        >
          <ArrowSquareOut size={18} />
          Kid Portal
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Moons */}
        <div className="bg-gradient-to-br from-[var(--solar-100)] to-[var(--ember-100)] dark:from-[var(--solar-900)]/30 dark:to-[var(--ember-900)]/30 p-6 rounded-xl border border-[var(--solar-200)] dark:border-[var(--solar-800)]/50">
          <div className="flex items-center gap-3 mb-2">
            <Moon size={24} weight="fill" className="text-[var(--solar-500)]" />
            <span className="text-sm font-medium text-[var(--solar-700)] dark:text-[var(--solar-400)]">Moons Balance</span>
          </div>
          <p className="text-4xl font-bold text-[var(--solar-600)] dark:text-[var(--solar-400)]">{moons}</p>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-br from-[var(--celestial-100)] to-[var(--cyan-100)] dark:from-[var(--celestial-900)]/30 dark:to-[var(--cyan-900)]/30 p-6 rounded-xl border border-[var(--celestial-200)] dark:border-[var(--celestial-800)]/50">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={24} weight="fill" className="text-[var(--celestial-500)]" />
            <span className="text-sm font-medium text-[var(--celestial-700)] dark:text-[var(--celestial-400)]">This Week</span>
          </div>
          <p className="text-4xl font-bold text-[var(--celestial-600)] dark:text-[var(--celestial-400)]">
            {completedActivities}/{totalActivities}
          </p>
          <div className="mt-2 h-2 bg-[var(--celestial-200)] dark:bg-[var(--celestial-800)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--celestial-500)] transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Pending Rewards */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-xl border border-[var(--nebula-purple)]/30 dark:border-[var(--nebula-purple)]/50">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={24} weight="fill" className="text-[var(--nebula-purple)]" />
            <span className="text-sm font-medium text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)]">Pending Rewards</span>
          </div>
          <p className="text-4xl font-bold text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)]">{pendingRewardsCount || 0}</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kid.birthday && (
          <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-2 text-sm text-muted mb-1">
              <Calendar size={16} />
              Birthday
            </div>
            <p className="text-[var(--foreground)]">
              {new Date(kid.birthday + 'T00:00:00').toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        )}

        {kid.favorite_shows && (
          <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
            <div className="text-sm text-muted mb-1">🎬 Favorite Shows</div>
            <p className="text-[var(--foreground)]">{kid.favorite_shows}</p>
          </div>
        )}

        {kid.favorite_music && (
          <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
            <div className="text-sm text-muted mb-1">🎵 Favorite Music</div>
            <p className="text-[var(--foreground)]">{kid.favorite_music}</p>
          </div>
        )}

        {kid.favorite_foods && (
          <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
            <div className="text-sm text-muted mb-1">🍕 Favorite Foods</div>
            <p className="text-[var(--foreground)]">{kid.favorite_foods}</p>
          </div>
        )}

        {kid.favorite_subjects && (
          <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
            <div className="text-sm text-muted mb-1">📚 Favorite Subjects</div>
            <p className="text-[var(--foreground)]">{kid.favorite_subjects}</p>
          </div>
        )}

        {kid.hobbies && (
          <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
            <div className="text-sm text-muted mb-1">🎮 Hobbies</div>
            <p className="text-[var(--foreground)]">{kid.hobbies}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/parent/kids/${kidId}/profile`}
            className="px-4 py-2 bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] text-[var(--foreground)] rounded-lg hover:bg-[var(--moon-200)] dark:hover:bg-[var(--background-secondary)] transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href={`/parent/kids/${kidId}/shop`}
            className="px-4 py-2 bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] text-[var(--foreground)] rounded-lg hover:bg-[var(--moon-200)] dark:hover:bg-[var(--background-secondary)] transition-colors"
          >
            View Shop
          </Link>
          <Link
            href={`/parent/kids/${kidId}/journal`}
            className="px-4 py-2 bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] text-[var(--foreground)] rounded-lg hover:bg-[var(--moon-200)] dark:hover:bg-[var(--background-secondary)] transition-colors"
          >
            View Journal
          </Link>
          <Link
            href="/parent/progress"
            className="px-4 py-2 bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] text-[var(--foreground)] rounded-lg hover:bg-[var(--moon-200)] dark:hover:bg-[var(--background-secondary)] transition-colors"
          >
            View Progress
          </Link>
        </div>
      </div>
    </div>
  );
}
