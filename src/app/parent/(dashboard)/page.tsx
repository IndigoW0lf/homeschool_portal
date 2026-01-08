import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { HolidayManager } from '@/components/dashboard/HolidayManager';
import { WeeklyProgressChart } from '@/components/dashboard/WeeklyProgressChart';
import { RedemptionManager } from '@/components/profile/RedemptionManager';
import { getLessonsFromDB, getAssignmentItemsFromDB, getResourcesFromDB, getKidsFromDB, getScheduleItemsFromDB, getHolidaysFromDB } from '@/lib/supabase/data';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <RedemptionManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
        </div>

        {/* Weekly Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            📊 Weekly Progress
          </h3>
          <WeeklyProgressChart 
            schedule={scheduleItems.map(s => ({
              status: s.status || 'pending',
              studentId: s.studentId,
              itemType: s.itemType || 'lesson'
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

