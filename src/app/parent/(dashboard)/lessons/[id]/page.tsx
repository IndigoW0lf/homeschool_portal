import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLessonByIdFromDB } from '@/lib/supabase/data';
import { LessonForm } from '@/components/lessons/LessonForm';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id: lessonId } = await params;
  const lesson = await getLessonByIdFromDB(lessonId);

  if (!lesson) {
    redirect('/parent/lessons');
  }

  // Transform lesson data to match form format
  const formData = {
    id: lesson.id,
    title: lesson.title,
    type: lesson.type || 'Math',
    description: lesson.instructions || lesson.description || '',
    keyQuestions: Array.isArray(lesson.keyQuestions) 
      ? lesson.keyQuestions.map((q: string | { text: string }) => 
          typeof q === 'string' ? { text: q } : q
        )
      : [],
    materials: lesson.materials || '',
    tags: lesson.tags || [],
    links: lesson.links || [],
    estimatedMinutes: lesson.estimatedMinutes || 20,
    parentNotes: lesson.parentNotes || '',
    isTemplate: true,
    assignTo: [] as string[],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        href="/parent"
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        <CaretLeft size={18} weight="bold" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Lesson
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Update lesson details and settings.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <LessonForm initialData={formData} />
      </div>
    </div>
  );
}
