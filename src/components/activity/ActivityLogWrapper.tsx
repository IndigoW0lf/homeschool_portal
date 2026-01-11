'use client';

import { useState } from 'react';
import { ActivityLogForm } from './ActivityLogForm';
import { logActivity } from '@/app/actions/activityLog';
import { useRouter } from 'next/navigation';

interface ActivityLogWrapperProps {
  kidId: string;
  kidName: string;
}

export function ActivityLogWrapper({ kidId, kidName }: ActivityLogWrapperProps) {
  const router = useRouter();

  const handleSubmit = async (formData: {
    kidId: string;
    date: string;
    subject: string;
    title: string;
    description: string;
    durationMinutes: number;
  }) => {
    const result = await logActivity(formData);
    
    if (result.success) {
      router.refresh();
    }
  };

  // Single kid only - form pre-selects this kid
  const kids = [{ id: kidId, name: kidName }];

  return (
    <ActivityLogForm kids={kids} onSubmit={handleSubmit} />
  );
}
