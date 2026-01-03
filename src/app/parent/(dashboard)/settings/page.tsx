import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { KidPinManager } from '@/components/profile/KidPinManager';
import { KidManager } from '@/components/profile/KidManager';
import { MoonManager } from '@/components/profile/MoonManager';
import { RewardManager } from '@/components/profile/RewardManager';
import { PasswordResetToast } from '@/components/profile/PasswordResetToast';
import { getKidsFromDB } from '@/lib/supabase/data';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  // Fetch kids for management
  const kids = await getKidsFromDB();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Password reset toast trigger */}
      <PasswordResetToast />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Manage your account and security
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <AccountSettings user={user} />
      </div>

      {/* Kid Management - Add/Edit/Delete */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <KidManager kids={kids.map(k => ({ id: k.id, name: k.name, gradeBand: k.gradeBand }))} />
      </div>

      {/* Moon Rewards Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <MoonManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
      </div>

      {/* Shop Rewards Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <RewardManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
      </div>

      {/* Kid PIN Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <KidPinManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
      </div>
    </div>
  );
}
