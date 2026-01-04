'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { addDays, startOfWeek, format } from 'date-fns';

export async function seedDemoData() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // 1. Ensure Kids Exist
    let { data: kids } = await supabase
      .from('kids')
      .select('id, name')
      .eq('user_id', user.id);

    if (!kids || kids.length === 0) {
      const { data: newKids, error: kidError } = await supabase
        .from('kids')
        .insert([
          {
            user_id: user.id,
            name: 'Atlas',
            grade_band: '3-5',
            favorite_color: '#5E7FB8',
            avatar_state: { type: 'adventurer', accessory: 'hat' },
            pin: '1234'
          },
          {
            user_id: user.id,
            name: 'Stella',
            grade_band: '6-8',
            favorite_color: '#D48A8A',
            avatar_state: { type: 'scholar', accessory: 'glasses' },
            pin: '1234'
          }
        ])
        .select();

      if (kidError) throw kidError;
      kids = newKids;
    }

    if (!kids) throw new Error('Failed to get/create kids');

    // 2. Create Lessons
    const demoLessons = [
      {
        title: 'Fractions & Decimals',
        subject: 'Math',
        description: 'Understanding how fractions convert to decimals.',
        duration_minutes: 45,
        color: '#5E7FB8'
      },
      {
        title: 'The Solar System',
        subject: 'Science',
        description: 'Tour of the planets and our sun.',
        duration_minutes: 60,
        color: '#6FAFA2'
      },
      {
        title: 'Ancient Egypt',
        subject: 'History',
        description: 'Pyramids, pharaohs, and life on the Nile.',
        duration_minutes: 50,
        color: '#E1B866'
      },
      {
        title: 'Color Theory',
        subject: 'Arts',
        description: 'Primary, secondary, and complementary colors.',
        duration_minutes: 30,
        color: '#D48A8A'
      },
      {
        title: 'Creative Writing',
        subject: 'Language Arts',
        description: 'Writing a short story about a magical forest.',
        duration_minutes: 45,
        color: '#9C8FB8'
      }
    ];

    const { data: lessons, error: lessonError } = await supabase
      .from('lessons')
      .insert(
        demoLessons.map(l => ({
          ...l,
          user_id: user.id,
          status: 'active'
        }))
      )
      .select();

    if (lessonError) throw lessonError;

    // 3. Schedule Items (for this week)
    if (lessons && lessons.length > 0) {
      const today = new Date();
      const monday = startOfWeek(today, { weekStartsOn: 1 });
      const scheduleItems = [];

      // Schedule for Mon-Fri
      for (let i = 0; i < 5; i++) {
        const date = addDays(monday, i);
        const dateStr = format(date, 'yyyy-MM-dd');

        // Assign 2-3 lessons per day per kid
        for (const kid of kids) {
          // Pick random lessons
          const dayLessons = lessons.sort(() => 0.5 - Math.random()).slice(0, 3);
          
          for (const lesson of dayLessons) {
            scheduleItems.push({
              kid_id: kid.id,
              subject: lesson.subject,
              title: lesson.title,
              date: dateStr,
              completed: i < today.getDay() - 1, // Mark past days as completed
              item_type: 'lesson',
              lesson_id: lesson.id
            });
          }
        }
      }

      const { error: scheduleError } = await supabase
        .from('schedule_items')
        .insert(scheduleItems);

      if (scheduleError) throw scheduleError;
    }

    // 4. Journal Entries
    const journalPrompts = [
      "What was the best part of today?",
      "If you could have any superpower, what would it be?",
      "What's something new you learned?"
    ];

    const journalEntries = [];
    for (const kid of kids) {
      // Add 2 entries
      journalEntries.push({
        kid_id: kid.id,
        date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
        prompt: journalPrompts[0],
        response: "I loved learning about planets! Jupiter is huge!",
        mood: "happy",
        tags: ["science", "fun"]
      });
      journalEntries.push({
        kid_id: kid.id,
        date: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
        prompt: journalPrompts[1],
        response: "I would want to fly so I can see the clouds up close.",
        mood: "thoughtful",
        tags: ["imagination"]
      });
    }

    const { error: journalError } = await supabase
      .from('journal_entries')
      .insert(journalEntries);

    if (journalError) throw journalError;

    revalidatePath('/parent');
    revalidatePath('/kids');

    return { success: true };
  } catch (error) {
    console.error('Seed error:', error);
    return { success: false, error: 'Failed to seed data' };
  }
}
