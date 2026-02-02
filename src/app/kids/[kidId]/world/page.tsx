/**
 * World Page - 2D World Game for Kids
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import WorldPageClient from './WorldPageClient';
import { LocalOpenPeepsAvatar } from '@/components/LocalOpenPeepsAvatar';

interface PageProps {
  params: Promise<{ kidId: string }>;
}

export default async function WorldPage({ params }: PageProps) {
  const { kidId } = await params;
  
  const supabase = await createServiceRoleClient();
  
  // Fetch kid data for name and avatar
  const { data: kid } = await supabase
    .from('kids')
    .select('name, avatar_state')
    .eq('id', kidId)
    .single();
  
  // Parse avatar state for Open Peeps avatar
  let kidAvatar = null;
  if (kid?.avatar_state) {
    try {
      const avatarState = typeof kid.avatar_state === 'string' 
        ? JSON.parse(kid.avatar_state) 
        : kid.avatar_state;
      
      kidAvatar = (
        <LocalOpenPeepsAvatar
          pose={avatarState.pose || 'standing_shirt1'}
          face={avatarState.face || 'smile'}
          head={avatarState.head || 'short1'}
          accessories={avatarState.accessories || 'none'}
          facialHair={avatarState.facialHair || 'none'}
          backgroundColor="transparent"
          size={50}
        />
      );
    } catch (e) {
      // Fallback to emoji
      kidAvatar = <span className="text-3xl">😎</span>;
    }
  } else {
    kidAvatar = <span className="text-3xl">😎</span>;
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <WorldPageClient
        kidId={kidId}
        kidName={kid?.name || 'Kid'}
        kidAvatar={kidAvatar}
      />
    </main>
  );
}
