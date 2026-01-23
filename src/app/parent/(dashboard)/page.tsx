import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { HolidayManager } from '@/components/dashboard/HolidayManager';
import { WeeklyProgressChart } from '@/components/dashboard/WeeklyProgressChart';
import { RedemptionManager } from '@/components/profile/RedemptionManager';
import { getLessonsFromDB, getAssignmentItemsFromDB, getResourcesFromDB, getKidsFromDB, getScheduleItemsFromDB, getHolidaysFromDB } from '@/lib/supabase/data';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function ParentDashboard() {
  const [lessons, assignments,, kids, scheduleItems, holidays] = await Promise.all([
    getLessonsFromDB(),
    getAssignmentItemsFromDB(),
    getResourcesFromDB(),
    getKidsFromDB(),
    getScheduleItemsFromDB(),
    getHolidaysFromDB()
  ]);

  // Filter schedule items to only THIS week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  const thisWeekSchedule = scheduleItems.filter(s => 
    s.date >= weekStartStr && s.date <= weekEndStr
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

      <DashboardOverview 
        lessons={lessons}
        assignments={assignments}
        resources={[]} 
        students={kids}
        schedule={scheduleItems}
      />

      {/* Pending Rewards + Weekly Progress - 2 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reward Redemptions */}
        <div className="bg-[var(--night-700)] rounded-xl shadow-lg border border-[var(--night-600)] p-6">
          <RedemptionManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
        </div>

        {/* Weekly Progress */}
        <div className="bg-[var(--night-700)] rounded-xl shadow-lg border border-[var(--night-600)] p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            📊 Weekly Progress
          </h3>
          <WeeklyProgressChart 
            schedule={thisWeekSchedule.map(s => ({
              id: s.id,
              status: s.status || 'pending',
              studentId: s.studentId,
              itemType: s.itemType || 'lesson',
              title: s.title || 'Untitled Activity',
              date: s.date,
            }))}  
            students={kids.map(k => ({ id: k.id, name: k.name }))} 
          />
        </div>
      </div>

      {/* Holiday Management */}
      <div className="mt-8">
        <HolidayManager initialHolidays={holidays} />
      </div>
    </div>
  );
}
