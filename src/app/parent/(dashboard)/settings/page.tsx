import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AccountSettings } from '@/components/profile/AccountSettings';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Manage your account and security
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <AccountSettings user={user} />
      </div>
    </div>
  );
}
