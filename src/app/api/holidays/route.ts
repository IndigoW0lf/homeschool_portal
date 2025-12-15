import { NextRequest, NextResponse } from 'next/server';
import { createHoliday, removeScheduleItemsForDateRange } from '@/lib/supabase/mutations';
import { getHolidaysFromDB, getScheduleItemsForDateRange } from '@/lib/supabase/data';

export async function GET() {
  try {
    const holidays = await getHolidaysFromDB();
    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, emoji, start_date, end_date } = body;
    
    if (!name || !start_date) {
      return NextResponse.json({ error: 'Name and start_date are required' }, { status: 400 });
    }
    
    // Check for existing schedule items in the date range
    const effectiveEndDate = end_date || start_date;
    const existingItems = await getScheduleItemsForDateRange(start_date, effectiveEndDate);
    
    // Create the holiday
    const holiday = await createHoliday({ name, emoji, start_date, end_date });
    
    // Remove conflicting schedule items
    let removedCount = 0;
    if (existingItems.length > 0) {
      removedCount = await removeScheduleItemsForDateRange(start_date, effectiveEndDate);
    }
    
    return NextResponse.json({ 
      ...holiday, 
      removedItemsCount: removedCount,
      affectedItems: existingItems.map(item => ({
        id: item.id,
        title: item.title || item.title_override,
        date: item.date,
        studentId: item.student_id
      }))
    });
  } catch (error) {
    console.error('Failed to create holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}
