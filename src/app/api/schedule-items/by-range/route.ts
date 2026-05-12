import { NextRequest, NextResponse } from 'next/server';
import { removeScheduleItemsForDateRange } from '@/lib/supabase/mutations';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    const removedCount = await removeScheduleItemsForDateRange(start_date, end_date);

    return NextResponse.json({ removedCount });
  } catch (error) {
    console.error('Failed to remove schedule items:', error);
    return NextResponse.json({ error: 'Failed to remove schedule items' }, { status: 500 });
  }
}
