'use client';

import { LessonForm } from '@/components/lessons/LessonForm';
export default function LessonsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plan Lesson
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Schedule and organize lessons.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <LessonForm />
      </div>
    </div>
  );
}
