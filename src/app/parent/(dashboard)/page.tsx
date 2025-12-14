import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { getLessonsFromDB, getAssignmentItemsFromDB, getResourcesFromDB, getKidsFromDB, getScheduleItemsFromDB } from '@/lib/supabase/data';

export const dynamic = 'force-dynamic';

export default async function ParentDashboard() {
  const [lessons, assignments,, kids, scheduleItems] = await Promise.all([
    getLessonsFromDB(),
    getAssignmentItemsFromDB(),
    getResourcesFromDB(),
    getKidsFromDB(),
    getScheduleItemsFromDB()
  ]);

  
  // Correction: Let's import createServerClient and fetch raw here or add a getResourceRowsFromDB.
  // For speed, let's use what we have but maybe mapped poorly, OR better: use MOCK for resources for now if data.ts is hard to use,
  // BUT the user wants DB.
  
  // Let's fetch raw resources in a new inline way or add to data.ts?
  // I will add a method to data.ts in next step if needed, but for now let's try to mock the resource prop or fix data.ts.
  
  // Actually, looking at data.ts, getResourcesFromDB does a SELECT * order by sort_order.
  // But it returns the `Resources` object.
  // I'll add `getAllResourcesFromDB` to data.ts quickly.
  
  // For now in this step, I'll pass empty resources to unblock lessons/assignments which are the main issue.
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Parent Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Overview of your homeschool progress.
          </p>
        </div>
      </div>

      <DashboardOverview 
        lessons={lessons}
        assignments={assignments}
        resources={[]} 
        students={kids}
        schedule={scheduleItems}
      />
    </div>
  );
}
