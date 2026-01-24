import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { PasswordResetToast } from '@/components/profile/PasswordResetToast';
import { SettingsTabs } from '@/components/profile/SettingsTabs';
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Settings
        </h1>
        <p className="text-muted text-sm">
          Manage your account, family, and rewards
        </p>
      </div>

      <SettingsTabs user={user} kids={kids} />
    </div>
  );
}


