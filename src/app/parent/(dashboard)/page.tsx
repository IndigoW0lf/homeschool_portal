import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { HolidayManager } from '@/components/dashboard/HolidayManager';
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

      {/* Pending Reward Redemptions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <RedemptionManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
      </div>

      {/* Holiday Management */}
      <div className="mt-8">
        <HolidayManager initialHolidays={holidays} />
      </div>
    </div>
  );
}

