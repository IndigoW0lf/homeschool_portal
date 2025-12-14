import { NextRequest, NextResponse } from 'next/server';
import { createHoliday } from '@/lib/supabase/mutations';
import { getHolidaysFromDB } from '@/lib/supabase/data';

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
    
    const holiday = await createHoliday({ name, emoji, start_date, end_date });
    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Failed to create holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}
