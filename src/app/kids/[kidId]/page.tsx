import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getKidByIdFromDB, getResourcesFromDB, getScheduleItemsForStudent } from '@/lib/supabase/data';
import { getStudentProgress, getStudentUnlocks } from '@/lib/supabase/progressData';
import { formatDateString } from '@/lib/dateUtils';
import { ProgressCardWrapper, TodayCompletionSummary, ResourceSection } from '@/components';
import { KidPortalWeekCalendar } from './KidPortalWeekCalendar';
import { ScheduleItemsList } from './ScheduleItemsList';
import { JournalCard } from '@/components/kids/JournalCard';
import { StreakDisplay } from '@/components/kids/StreakDisplay';
import { CaretLeft, CaretRight, CalendarBlank, Scroll } from '@phosphor-icons/react/dist/ssr';
import { addWeeks, subWeeks, isSameDay, format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

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

  // Date Logic
  const today = new Date();
  let viewDate = today;
  
  if (date && typeof date === 'string') {
     try {
        viewDate = parseISO(date);
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     } catch (e) {
        // invalid date, fallback to today
     }
  }

  if (isNaN(viewDate.getTime())) {
     viewDate = today;
  }

  const viewDateString = formatDateString(viewDate);
  const isViewToday = isSameDay(viewDate, today);

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
  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === format(currentWeekStart, 'yyyy-MM-dd');
  const weekLabel = isCurrentWeek 
    ? 'This Week' 
    : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <Image 
                src={kid.name.toLowerCase() === 'stella' ? '/assets/titles/hello_stella.svg' : '/assets/titles/hello_atlas.svg'}
                alt={`Hello, ${kid.name}!`}
                width={200}
                height={50}
                className="h-10 w-auto mb-1 dark:brightness-110"
                priority
              />
              <p className="text-gray-500 dark:text-gray-400 opacity-80">{formattedDate}</p>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
               <Link href={`/kids/${kidId}?date=${prevWeek}`} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors">
                  <CaretLeft size={24} weight="duotone" color="#b6e1d8" />
               </Link>
               <div className="px-4 text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 cursor-pointer" title="Jump to Today">
                  <CalendarBlank size={20} weight="duotone" color="#caa2d8" />
                  {!isCurrentWeek ? <Link href={`/kids/${kidId}`} className="hover:text-[var(--ember-500)]">{weekLabel}</Link> : <span>{weekLabel}</span>}
               </div>
               <Link href={`/kids/${kidId}?date=${nextWeek}`} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors">
                  <CaretRight size={24} weight="duotone" color="#b6e1d8" />
               </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        
        {/* Streak Display - only show if enabled for this kid */}
        {isViewToday && kid.streakEnabled !== false && (
          <section>
            <StreakDisplay kidId={kidId} />
          </section>
        )}

        {/* Progress Card */}
        <section>
          {isViewToday && (
            <ProgressCardWrapper 
              kidId={kidId}
              initialStars={progressData?.totalStars || 0}
              initialUnlocks={unlocks}
              date={viewDateString}
              itemIds={todayItems.map(item => item.id)}
            />
          )}
        </section>

        {/* Today's Quests */}
        <section id={`date-${viewDateString}`}>
          <div className="mb-4">
            <Image 
              src="/assets/titles/todays_quest.svg" 
              alt="Today's Quest" 
              width={180} 
              height={40}
              className="h-8 w-auto dark:brightness-110"
            />
            {!isViewToday && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formattedDate}</p>
            )}
          </div>
          
          <TodayCompletionSummary
            kidId={kidId}
            date={viewDateString}
            itemIds={todayItems.map(item => item.id)}
          />

          <div className="space-y-4">
            {todayItems.length > 0 ? (
              <ScheduleItemsList
                items={todayItems}
                kidId={kidId}
                date={viewDateString}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
                No assignments scheduled for today! 🎉
              </div>
            )}
            
            {/* Daily Journal */}
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

        {/* Week Calendar */}
        <section>
          <KidPortalWeekCalendar entries={weekScheduleItems} kidId={kidId} viewDate={viewDate} />
        </section>

        {/* Upcoming Items */}
        {upcomingItems.length > 0 && (
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
          <Image 
            src="/assets/titles/resources.svg" 
            alt="Resources" 
            width={140} 
            height={40}
            className="h-7 w-auto mb-4 dark:brightness-110"
          />
          <ResourceSection resources={resources} />
        </section>
      </div>
    </div>
  );
}
