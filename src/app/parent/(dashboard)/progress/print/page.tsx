import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { getUnifiedActivities } from '@/lib/supabase/progressData';
import { redirect } from 'next/navigation';
import { format, parseISO, subDays } from 'date-fns';
import { PrintButton } from './PrintButton';

export default async function PrintActivityLogPage({
  searchParams
}: {
  searchParams: { kid?: string; days?: string }
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const kids = await getKidsFromDB();
  const days = parseInt(searchParams.days || '30', 10);
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  
  // Filter to specific kid if requested
  const targetKids = searchParams.kid 
    ? kids.filter(k => k.id === searchParams.kid)
    : kids;

  // Fetch activities for each kid
  const kidActivities = await Promise.all(
    targetKids.map(async (kid) => {
      const activities = await getUnifiedActivities(kid.id, startDate);
      return { kid, activities };
    })
  );

  const totalItems = kidActivities.reduce((sum, k) => sum + k.activities.length, 0);

  return (
    <html>
      <head>
        <title>Homeschool Activity Log - {format(new Date(), 'MMM d, yyyy')}</title>
        <style>{`
          @media print {
            body { font-size: 11pt; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1 { font-size: 24px; margin-bottom: 5px; }
          h2 { font-size: 18px; margin: 20px 0 10px; color: #6b21a8; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .meta { color: #666; font-size: 12px; }
          .date-group { margin: 15px 0; }
          .date-header { font-weight: 600; color: #4f46e5; font-size: 13px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #6b7280; }
          td { font-size: 12px; }
          .source { 
            font-size: 10px; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-weight: 500;
          }
          .source-lunara { background: #f3e8ff; color: #7c3aed; }
          .source-miacademy { background: #dbeafe; color: #2563eb; }
          .source-manual { background: #fef3c7; color: #d97706; }
          .score { font-weight: 600; }
          .score-good { color: #16a34a; }
          .score-ok { color: #d97706; }
          .score-poor { color: #dc2626; }
          .empty { color: #9ca3af; font-style: italic; }
        `}</style>
      </head>
      <body>
        <PrintButton />

        <div className="header">
          <h1>📚 Homeschool Activity Log</h1>
          <div className="meta">
            Generated: {format(new Date(), 'EEEE, MMMM d, yyyy')} • 
            Period: Last {days} days • 
            Total Activities: {totalItems}
          </div>
        </div>

        {kidActivities.map(({ kid, activities }) => {
          // Group by date
          const groupedByDate = activities.reduce((acc, activity) => {
            const dateKey = activity.date;
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(activity);
            return acc;
          }, {} as Record<string, typeof activities>);
          
          const dateGroups = Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]));

          return (
            <div key={kid.id}>
              <h2>🌙 {kid.name}</h2>
              
              {activities.length === 0 ? (
                <p className="empty">No activities recorded in this period.</p>
              ) : (
                <table>
                  <thead>
                                      </thead>
                  <tbody>
                    {activities.map(activity => (
                      <tr key={activity.id}>
                        <td>{format(parseISO(activity.date), 'MMM d, yyyy')}</td>
                        <td>{activity.title}</td>
                        <td>{activity.subject}</td>
                        <td>
                          <span className={`source ${
                            activity.source === 'lunara_quest' ? 'source-lunara' :
                            activity.source === 'miacademy' ? 'source-miacademy' : 'source-manual'
                          }`}>
                            {activity.sourceLabel}
                          </span>
                        </td>
                        <td>{activity.durationMinutes ? `${activity.durationMinutes}m` : '—'}</td>
                        <td>
                          {activity.score != null ? (
                            <span className={`score ${
                              activity.score >= 80 ? 'score-good' :
                              activity.score >= 60 ? 'score-ok' : 'score-poor'
                            }`}>
                              {activity.score}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        <div className="meta" style={{ marginTop: 40, textAlign: 'center' }}>
          Powered by Lunara Quest • lunara.quest
        </div>
      </body>
    </html>
  );
}
