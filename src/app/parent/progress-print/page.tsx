import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { getUnifiedActivities } from '@/lib/supabase/progressData';
import { redirect } from 'next/navigation';
import { format, parseISO, subDays } from 'date-fns';
import { PrintButton, FilterControls } from './PrintButton';
import { unstable_noStore as noStore } from 'next/cache';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Format minutes as Xh Ym
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default async function PrintActivityLogPage({
  searchParams
}: {
  searchParams: Promise<{ kid?: string; days?: string; source?: string }>
}) {
  // Opt-out of all caching
  noStore();
  
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const kids = await getKidsFromDB();
  
  // Debug: log all params
  console.log('[PrintPage] params:', JSON.stringify(params));
  
  const days = parseInt(params.days || '30', 10);
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const sourceFilter = params.source as 'lunara_quest' | 'miacademy' | 'manual' | undefined;
  const kidFilter = params.kid;
  
  console.log('[PrintPage] Parsed filters - days:', days, 'startDate:', startDate, 'source:', sourceFilter, 'kid:', kidFilter);
  
  // Filter to specific kid if requested
  const targetKids = kidFilter 
    ? kids.filter(k => k.id === kidFilter)
    : kids;
    
  console.log('[PrintPage] targetKids count:', targetKids.length, 'of', kids.length);

  // Fetch activities for each kid
  const kidActivities = await Promise.all(
    targetKids.map(async (kid) => {
      let activities = await getUnifiedActivities(kid.id, startDate);
      
      // Filter by source if specified
      if (sourceFilter) {
        activities = activities.filter(a => a.source === sourceFilter);
      }
      
      // Calculate subject totals
      const subjectTotals = activities.reduce((acc, activity) => {
        const subject = activity.subject || 'Other';
        const minutes = activity.actualMinutes || activity.durationMinutes || 0;
        if (!acc[subject]) {
          acc[subject] = { count: 0, minutes: 0 };
        }
        acc[subject].count += 1;
        acc[subject].minutes += minutes;
        return acc;
      }, {} as Record<string, { count: number; minutes: number }>);
      
      const totalMinutes = Object.values(subjectTotals).reduce((sum, s) => sum + s.minutes, 0);
      
      return { kid, activities, subjectTotals, totalMinutes };
    })
  );

  const totalItems = kidActivities.reduce((sum, k) => sum + k.activities.length, 0);
  const grandTotalMinutes = kidActivities.reduce((sum, k) => sum + k.totalMinutes, 0);

  return (
    <html>
      <head>
        <title>Homeschool Activity Log - {format(new Date(), 'MMM d, yyyy')}</title>
        <style>{`
          @media print {
            body { font-size: 10pt; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1 { font-size: 22px; margin-bottom: 5px; }
          h2 { font-size: 16px; margin: 25px 0 8px; color: #6b21a8; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          h3 { font-size: 13px; margin: 15px 0 8px; color: #4f46e5; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .meta { color: #666; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 10px; text-transform: uppercase; color: #6b7280; }
          .summary-table { width: auto; min-width: 300px; }
          .summary-table td { padding: 4px 12px; }
          .summary-table tr:last-child { font-weight: 600; border-top: 2px solid #333; }
          .source { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 500; white-space: nowrap; }
          .source-lunara { background: #f3e8ff; color: #7c3aed; }
          .source-miacademy { background: #dbeafe; color: #2563eb; }
          .source-manual { background: #fef3c7; color: #d97706; }
          .score { font-weight: 600; }
          .score-good { color: #16a34a; }
          .score-ok { color: #d97706; }
          .score-poor { color: #dc2626; }
          .empty { color: #9ca3af; font-style: italic; }
          .time { font-family: monospace; font-size: 10px; }
          .total-box { background: #f3e8ff; padding: 10px 15px; border-radius: 8px; display: inline-block; margin-bottom: 15px; }
          .total-box strong { font-size: 18px; color: #6b21a8; }
        `}</style>
      </head>
      <body>
        <PrintButton />
        
        <FilterControls 
          kids={kids.map(k => ({ id: k.id, name: k.name }))}
          initialKid={params.kid}
          initialDays={days}
          initialSource={sourceFilter}
        />

        <div className="header">
          <h1>
            <svg style={{display: 'inline', verticalAlign: 'middle', marginRight: 8}} width="24" height="24" viewBox="0 0 256 256" fill="#6b21a8"><path d="M232,64H160a40,40,0,0,0-32,16A40,40,0,0,0,96,64H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V72A8,8,0,0,0,232,64ZM96,192H32V80H96a24,24,0,0,1,24,24V200A40,40,0,0,0,96,192Zm128,0H160a40,40,0,0,0-24,8V104a24,24,0,0,1,24-24h64Z"/></svg>
            Homeschool Activity Log
          </h1>
          <div className="meta">
            Generated: {format(new Date(), 'EEEE, MMMM d, yyyy')} • 
            Period: {format(subDays(new Date(), days), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')} ({days} days) • 
            Total Activities: {totalItems} • 
            Total Time: {formatTime(grandTotalMinutes)}
          </div>
        </div>

        {kidActivities.map(({ kid, activities, subjectTotals, totalMinutes }) => {
          const sortedSubjects = Object.entries(subjectTotals)
            .sort((a, b) => b[1].minutes - a[1].minutes);

          return (
            <div key={kid.id}>
              <h2>
                <svg style={{display: 'inline', verticalAlign: 'middle', marginRight: 6}} width="18" height="18" viewBox="0 0 256 256" fill="#6b21a8"><path d="M128,16A112.13,112.13,0,0,0,16,128c0,60.81,49.33,112,112,112a112,112,0,0,0,0-224Zm0,192a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,208Z"/></svg>
                {kid.name}
              </h2>
              
              {activities.length === 0 ? (
                <p className="empty">No activities recorded in this period.</p>
              ) : (
                <>
                  {/* Subject Summary */}
                  <h3>
                    <svg style={{display: 'inline', verticalAlign: 'middle', marginRight: 6}} width="14" height="14" viewBox="0 0 256 256" fill="#4f46e5"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"/></svg>
                    Subject Summary
                  </h3>
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th style={{ textAlign: 'right' }}>Hours</th>
                        <th style={{ textAlign: 'right' }}>Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSubjects.map(([subject, data]) => (
                        <tr key={subject}>
                          <td>{subject}</td>
                          <td style={{ textAlign: 'right' }} className="time">{formatTime(data.minutes)}</td>
                          <td style={{ textAlign: 'right' }}>{data.count}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>TOTAL</td>
                        <td style={{ textAlign: 'right' }} className="time">{formatTime(totalMinutes)}</td>
                        <td style={{ textAlign: 'right' }}>{activities.length}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Activity Detail */}
                  <h3>
                    <svg style={{display: 'inline', verticalAlign: 'middle', marginRight: 6}} width="14" height="14" viewBox="0 0 256 256" fill="#4f46e5"><path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H82.75A47.9,47.9,0,0,0,80,64v8a8,8,0,0,0,8,8h80a8,8,0,0,0,8-8V64a47.9,47.9,0,0,0-2.75-16H200Z"/></svg>
                    Activity Detail
                  </h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Subject</th>
                        <th>Source</th>
                        <th>Time</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map(activity => (
                        <tr key={activity.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{format(parseISO(activity.date), 'MMM d')}</td>
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
                          <td className="time">
                            {activity.actualMinutes || activity.durationMinutes 
                              ? formatTime(activity.actualMinutes || activity.durationMinutes || 0)
                              : '—'}
                          </td>
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
                </>
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
