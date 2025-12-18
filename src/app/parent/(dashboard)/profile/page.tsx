import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile/ProfileForm';
import type { Profile } from '@/types';

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  // Fetch profile using server client
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null };

  // If no profile exists, create a minimal one
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (!newProfile) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-red-500">Error loading profile. Please try again.</p>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your account settings
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <ProfileForm profile={newProfile} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
