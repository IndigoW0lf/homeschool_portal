'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { addDays, startOfWeek, format } from 'date-fns';

export async function seedDemoData() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Seed Demo Data: No authenticated user found');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    console.log(`Starting seed for user: ${user.id}`);

    // 0. Ensure Family Exists
    let familyId: string | null = null;

    // Check if user is in any family
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (familyMember) {
      familyId = familyMember.family_id;
      console.log(`User already in family: ${familyId}`);
    } else {
      console.log('User not in family, creating one...');
      // Create new family
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: 'My Family' })
        .select()
        .single();
      
      if (familyError) throw new Error(`Failed to create family: ${familyError.message}`);
      
      familyId = newFamily.id;

      // Add user as admin
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: user.id,
          role: 'admin'
        });
        
      if (memberError) throw new Error(`Failed to link user to family: ${memberError.message}`);
      console.log(`Created family ${familyId} and linked user.`);
    }

    // 1. Ensure Kids Exist
    let { data: kids } = await supabase
      .from('kids')
      .select('id, name')
      .eq('user_id', user.id);

    if (!kids || kids.length === 0) {
      console.log('No kids found, creating demo kids...');
      // Create demo kids linked to this familyId if you have a family_id column on kids (check schema?)
      // Start with just user_id as per previous schema knowledge
      const { data: newKids, error: kidError } = await supabase
        .from('kids')
        .insert([
          {
            user_id: user.id,
            family_id: familyId, // Assuming column exists now? If not, ignored or error. Let's check schema/migration if possible. 
            // Safest to just omit family_id if unsure, but for "Family Members" view it matters? 
            // "Family Members" view uses 'family_members' table (users), NOT kids table. Kids are fetched via user_id usually.
            // But wait, the previous code showed kids by auth user.
            name: 'Atlas',
            grade_band: '3-5',
            favorite_color: '#5E7FB8',
            avatar_state: { type: 'adventurer', accessory: 'hat' },
            pin: '1234'
          },
          {
            user_id: user.id,
            family_id: familyId,
            name: 'Stella',
            grade_band: '6-8',
            favorite_color: '#D48A8A',
            avatar_state: { type: 'scholar', accessory: 'glasses' },
            pin: '1234'
          }
        ])
        .select();

      if (kidError) {
        // Fallback if family_id column doesn't exist yet on kids table
        console.warn('Error creating kids with family_id, trying without...', kidError);
        const { data: newKidsRetry, error: retryError } = await supabase
          .from('kids')
          .insert([
             { user_id: user.id, name: 'Atlas', grade_band: '3-5', pin: '1234' },
             { user_id: user.id, name: 'Stella', grade_band: '6-8', pin: '1234' }
          ])
          .select();
          
        if (retryError) throw retryError;
        kids = newKidsRetry;
      } else {
        kids = newKids;
      }
    }

    if (!kids) throw new Error('Failed to get/create kids');

    // 2. Create Lessons
    console.log('Creating demo lessons...');
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
      console.log('Creating schedule items...');
      const today = new Date();
      const monday = startOfWeek(today, { weekStartsOn: 1 });
      const scheduleItems = [];

      for (let i = 0; i < 5; i++) {
        const date = addDays(monday, i);
        const dateStr = format(date, 'yyyy-MM-dd');

        for (const kid of kids) {
          const dayLessons = lessons.sort(() => 0.5 - Math.random()).slice(0, 3);
          
          for (const lesson of dayLessons) {
            scheduleItems.push({
              kid_id: kid.id,
              subject: lesson.subject,
              title: lesson.title,
              date: dateStr,
              completed: i < today.getDay() - 1,
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
    console.log('Creating journal entries...');
    const journalPrompts = [
      "What was the best part of today?",
      "If you could have any superpower, what would it be?",
      "What's something new you learned?"
    ];

    const journalEntries = [];
    for (const kid of kids) {
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
    revalidatePath('/parent/settings');
    console.log('Seed completed successfully!');

    return { success: true };
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (error as any).message || 'Unknown error';
    console.error('Seed error:', error);
    return { success: false, error: errorMessage };
  }
}
