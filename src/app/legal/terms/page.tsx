import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Terms of Service | Lunara Quest',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href="/signup"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Signup
        </Link>

        <div className="card p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of Service
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Last updated: January 2026
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using Lunara Quest ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Description of Service
              </h2>
              <p>
                Lunara Quest is a homeschool planning and organization tool designed to help parents and educators manage their children's learning. The Service includes lesson planning, assignment tracking, and gamified learning experiences for children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. User Accounts
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to create an account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. User Content
              </h2>
              <p>
                You retain ownership of any content you create within the Service. By using the Service, you grant us a limited license to store and display your content as necessary to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Acceptable Use
              </h2>
              <p>
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service in any way that could damage, disable, or impair the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of significant changes by email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Contact
              </h2>
              <p>
                If you have questions about these Terms, please contact us at support@lunara.quest.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
