import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKidByIdFromDB, getResourcesFromDB, getScheduleItemsForStudent } from '@/lib/supabase/data';
import { getStudentProgress, getStudentUnlocks } from '@/lib/supabase/progressData';
import { formatDateString, getTodayInTimezone, getNowInTimezone } from '@/lib/dateUtils';
import { ProgressCardWrapper, ResourceSection } from '@/components';
import { KidPortalWeekCalendar } from './KidPortalWeekCalendar';
import { ScheduleItemsList } from './ScheduleItemsList';
import { JournalCard } from '@/components/kids/JournalCard';
import { StreakDisplay } from '@/components/kids/StreakDisplay';
import { LunaraTitle } from '@/components/ui/LunaraTitle';
import { CaretLeft, CaretRight, CalendarBlank, Scroll, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { addWeeks, subWeeks, format, startOfWeek, endOfWeek } from 'date-fns';
import { KidStateHydrator } from '@/components/KidStateHydrator';
import { AvatarSetupRedirect } from '@/components/kids/AvatarSetupRedirect';
import { AvatarReminderBanner } from '@/components/kids/AvatarReminderBanner';

interface KidPortalPageProps {
  params: Promise<{
    kidId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KidPortalPage({ params, searchParams }: KidPortalPageProps) {
  const { kidId } = await params;
  const { date } = await searchParams;
  
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  // Use timezone-aware "today" to prevent UTC showing wrong date
  // TODO: Fetch parent's timezone from family settings, for now default to CST
  const timezone = 'America/Chicago';
  const todayString = getTodayInTimezone(timezone);
  const today = getNowInTimezone(timezone);
  let viewDate = today;
  
  if (date && typeof date === 'string') {
     try {
        // Parse at noon to avoid timezone issues (midnight UTC = previous day in CST)
        viewDate = new Date(date + 'T12:00:00');
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     } catch (e) {
        // invalid date, fallback to today
     }
  }

  if (isNaN(viewDate.getTime())) {
     viewDate = today;
  }

  const viewDateString = formatDateString(viewDate);
  const isViewToday = viewDateString === todayString;

  const resources = await getResourcesFromDB();
  
  const progressData = await getStudentProgress(kidId);
  const unlocks = await getStudentUnlocks(kidId);
  
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  const weekScheduleItems = await getScheduleItemsForStudent(kidId, weekStartStr, weekEndStr);
  const todayItems = weekScheduleItems.filter(item => item.date === viewDateString);
  const upcomingItems = weekScheduleItems.filter(item => item.date > viewDateString);

  const formattedDate = viewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const prevWeek = format(subWeeks(viewDate, 1), 'yyyy-MM-dd');
  const nextWeek = format(addWeeks(viewDate, 1), 'yyyy-MM-dd');
  
  // Check if viewing current week
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  // Determine if viewing a past date (before today)
  const isPast = viewDate < new Date(today.setHours(0,0,0,0));

  return (
    <div className="min-h-screen">
      {/* Hydrate localStorage from database on page load */}
      <KidStateHydrator 
        kidId={kidId} 
        date={viewDateString}
        scheduleItems={weekScheduleItems.map(item => ({
          date: item.date,
          itemId: item.itemId,
          status: item.status
        }))}
      />
      
      {/* Redirect to avatar setup on first login if not configured */}
      <AvatarSetupRedirect 
        kidId={kidId}
        hasAvatarState={!!kid.avatarState}
        lastLoginAt={kid.lastLoginAt}
      />
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <LunaraTitle 
                gradient="teal-pink" 
                size="lg" 
                as="h1"
              >
                Hello, {kid.name}!
              </LunaraTitle>
              <p className="text-muted opacity-80">{formattedDate}</p>
            </div>
            
            {/* Header Navigation Removed - Integrated into Calendar */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        
        {/* Avatar Reminder - Monthly if not set up */}
        {isViewToday && (
          <AvatarReminderBanner 
            kidId={kidId}
            hasAvatarState={!!kid.avatarState}
            kidName={kid.nickname || kid.name}
          />
        )}
        
        {/* Week Calendar - Moved to TOP */}
        <section>
          <KidPortalWeekCalendar 
             entries={weekScheduleItems} 
             kidId={kidId} 
             viewDate={viewDate}
             prevWeekUrl={`/kids/${kidId}?date=${prevWeek}`}
             nextWeekUrl={`/kids/${kidId}?date=${nextWeek}`}
             currentWeekUrl={`/kids/${kidId}`}
          />
        </section>

        {/* Streak Display - only show if enabled for this kid AND today */}
        {isViewToday && kid.streakEnabled !== false && (
          <section>
            <StreakDisplay kidId={kidId} />
          </section>
        )}

        {/* Progress Card - Stats (Show even if past, to see what was done) */}
        <section>
          <ProgressCardWrapper 
            kidId={kidId}
            initialStars={progressData?.totalStars || 0}
            featuredBadges={kid.featuredBadges}
            streakEnabled={kid.streakEnabled}
            date={viewDateString}
            itemIds={todayItems.map(item => item.id)}
          />
        </section>

        {/* Quest Section */}
        <section id={`date-${viewDateString}`}>
          <div className="mb-4">
            {isPast ? (
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <CheckCircle size={32} weight="duotone" className="text-green-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Completed on {viewDate.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                        <p className="text-sm opacity-80">{formattedDate}</p>
                    </div>
                </div>
            ) : (
                <>
                    <LunaraTitle 
                      gradient="sunset" 
                      size="lg"
                    >
                      Today&apos;s Quest
                    </LunaraTitle>
                    {!isViewToday && (
                    <p className="text-sm text-muted mt-1">{formattedDate}</p>
                    )}
                </>
            )}
          </div>

          <div className="space-y-4">
            {todayItems.length > 0 ? (
              <ScheduleItemsList
                items={todayItems}
                kidId={kidId}
                date={viewDateString}
                readOnly={isPast}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
                {isPast ? "No assignments recorded on this day." : "No assignments scheduled for today! 🎉"}
              </div>
            )}
            
            {/* Daily Journal - Only Today */}
            {isViewToday && (
              <JournalCard
                kidId={kidId}
                date={viewDateString}
                journalEnabled={kid.journalEnabled !== false}
                journalAllowSkip={kid.journalAllowSkip !== false}
              />
            )}
          </div>
        </section>

        {/* Upcoming Items - HIDE if Past */}
        {!isPast && upcomingItems.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Scroll size={24} weight="duotone" className="text-[var(--ember-400)]" />
              Coming Up This Week
            </h2>
            <ScheduleItemsList
              items={upcomingItems}
              kidId={kidId}
              date={viewDateString}
              showDates={true}
            />
          </section>
        )}

        {/* Resources */}
        <section>
          <LunaraTitle 
            gradient="herbal-bloom" 
            size="md"
            className="mb-4"
          >
            Resources
          </LunaraTitle>
          <ResourceSection resources={resources} />
        </section>
      </div>
    </div>
  );
}
