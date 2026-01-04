import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { House, UserPlus, Warning } from '@phosphor-icons/react/dist/ssr';

interface InvitePageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the invite - simplified query without FK joins
  const { data: invite, error } = await supabase
    .from('family_invites')
    .select('*')
    .eq('invite_code', code)
    .eq('status', 'pending')
    .single();
  
  // Handle invalid/expired invite
  if (error || !invite) {
    console.error('Invite lookup error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Warning size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid or Expired Invite
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            This invite link is no longer valid. It may have expired or already been used.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <House size={20} />
            Go Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Fetch family name and inviter name separately
  const [{ data: family }, { data: inviterProfile }] = await Promise.all([
    supabase.from('families').select('name').eq('id', invite.family_id).single(),
    supabase.from('profiles').select('display_name').eq('id', invite.invited_by).single(),
  ]);
  
  // Check if invite is for a different email than logged in user
  const emailMismatch = user && invite.email !== user.email;
  
  const familyName = family?.name || 'a family';
  const inviterName = inviterProfile?.display_name || 'Someone';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--lavender-100)] to-[var(--ember-100)] dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#9c8fb8] to-[#E27D60] rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus size={32} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You're Invited!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          <span className="font-semibold">{inviterName}</span> has invited you to join{' '}
          <span className="font-semibold text-[var(--ember-500)]">{familyName}</span> on Lunara Quest.
        </p>
        
        {emailMismatch && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This invite was sent to <strong>{invite.email}</strong>, but you're logged in as <strong>{user?.email}</strong>.
            </p>
          </div>
        )}
        
        {user ? (
          <form action={`/api/invites/accept`} method="POST">
            <input type="hidden" name="code" value={code} />
            <button
              type="submit"
              disabled={!!emailMismatch}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept Invite
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in or create an account to accept this invite
            </p>
            <Link
              href={`/parent/login?redirect=/invite/${code}`}
              className="block w-full py-3 px-6 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity text-center"
            >
              Sign In to Accept
            </Link>
            <Link
              href={`/signup?redirect=/invite/${code}&email=${encodeURIComponent(invite.email)}`}
              className="block w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
            >
              Create Account
            </Link>
          </div>
        )}
        
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          By accepting, you'll be able to view and manage the family's homeschool activities.
        </p>
      </div>
    </div>
  );
}
