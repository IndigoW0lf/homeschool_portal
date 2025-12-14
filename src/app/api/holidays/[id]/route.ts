import { NextRequest, NextResponse } from 'next/server';
import { updateHoliday, deleteHoliday } from '@/lib/supabase/mutations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, emoji, start_date, end_date } = body;
    
    const holiday = await updateHoliday(id, { 
      name, 
      emoji, 
      start_date, 
      end_date 
    });
    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Failed to update holiday:', error);
    return NextResponse.json({ error: 'Failed to update holiday' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteHoliday(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
