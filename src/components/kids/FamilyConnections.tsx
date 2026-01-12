'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Crown, Heart } from '@phosphor-icons/react';
import { AvatarPreview } from './AvatarPreview';
import { supabase } from '@/lib/supabase/browser';

interface Sibling {
  id: string;
  name: string;
  nickname?: string;
  favoriteColor?: string;
  avatarState?: any;
}

interface Parent {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}

interface FamilyConnectionsProps {
  kidId: string;
  familyId: string;
  isKidSession?: boolean;
}

export function FamilyConnections({ kidId, familyId, isKidSession }: FamilyConnectionsProps) {
  const router = useRouter();
  const [siblings, setSiblings] = useState<Sibling[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFamily() {
      setLoading(true);
      
      try {
        // Fetch siblings (other kids in same family)
        const { data: siblingsData } = await supabase
          .from('kids')
          .select('id, name, nickname, favorite_color, avatar_state')
          .eq('family_id', familyId)
          .neq('id', kidId); // Exclude self
        
        if (siblingsData) {
          setSiblings(siblingsData.map(s => ({
            id: s.id,
            name: s.name,
            nickname: s.nickname,
            favoriteColor: s.favorite_color,
            avatarState: s.avatar_state,
          })));
        }
        
        // Fetch parents (family members)
        const { data: membersData } = await supabase
          .from('family_members')
          .select('user_id, role')
          .eq('family_id', familyId);
        
        if (membersData && membersData.length > 0) {
          // Fetch profiles for parents
          const userIds = membersData.map(m => m.user_id).filter(Boolean);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);
          
          const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          setParents(membersData.map(m => ({
            userId: m.user_id,
            displayName: profileMap.get(m.user_id)?.display_name || 'Parent',
            avatarUrl: profileMap.get(m.user_id)?.avatar_url,
            role: m.role,
          })));
        }
      } catch (err) {
        console.error('Error loading family:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadFamily();
  }, [kidId, familyId]);

  const handleSiblingClick = (e: React.MouseEvent, siblingId: string) => {
    if (isKidSession) {
      e.preventDefault();
      // If in kid session, we can't just switch. 
      // Redirect to student login to switch users.
      router.push('/student');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Users size={24} weight="duotone" className="text-purple-500" />
          My Family
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  const hasFamilyData = siblings.length > 0 || parents.length > 0;

  if (!hasFamilyData) {
    return null; // Don't show section if no family data
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <Heart size={24} weight="fill" className="text-pink-500" />
        My Family
      </h3>

      <div className="space-y-6">
        {/* Parents Section */}
        {parents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Crown size={14} weight="fill" className="text-yellow-500" />
              Parents
            </p>
            <div className="flex flex-wrap gap-4">
              {parents.map((parent) => (
                <div
                  key={parent.userId}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/50"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {parent.avatarUrl ? (
                      <img 
                        src={parent.avatarUrl} 
                        alt={parent.displayName} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      parent.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {parent.displayName}
                  </span>
                  {parent.role === 'admin' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      ⭐ Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Siblings Section */}
        {siblings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Users size={14} weight="fill" className="text-blue-500" />
              Siblings
            </p>
            <div className="flex flex-wrap gap-4">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.id}
                  href={`/kids/${sibling.id}/profile`}
                  onClick={(e) => handleSiblingClick(e, sibling.id)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border border-blue-100 dark:border-blue-800/50 hover:shadow-md hover:scale-105 transition-all"
                >
                  <AvatarPreview
                    avatarState={sibling.avatarState}
                    size="md"
                    fallbackName={sibling.nickname || sibling.name}
                    fallbackColor={sibling.favoriteColor}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {sibling.nickname || sibling.name}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {isKidSession ? 'Switch User 🔒' : 'View Profile →'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
