'use client';

import { useEffect, useState } from 'react';
import { MiAcademyCard } from './MiAcademyCard';
import { supabase } from '@/lib/supabase/browser';

interface MiAcademyCardWrapperProps {
  kidId: string;
  date: string;
}

export function MiAcademyCardWrapper({ kidId, date }: MiAcademyCardWrapperProps) {
  const [miacademy, setMiacademy] = useState<{ label: string; url: string } | null>(null);

  useEffect(() => {
    async function fetchMiAcademy() {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .or('pinned_today.eq.true,label.ilike.%MiAcademy%')
        .order('pinned_today', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setMiacademy({ label: data.label, url: data.url });
      }
    }
    fetchMiAcademy();
  }, []);

  if (!miacademy) return null;

  return <MiAcademyCard kidId={kidId} date={date} url={miacademy.url} />;
}

