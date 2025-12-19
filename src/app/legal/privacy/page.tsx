import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Privacy Policy | Lunara Quest',
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Last updated: December 2024
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, including your email address, name, and information about your children that you choose to enter for educational planning purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we collect to provide, maintain, and improve our Service, to communicate with you, and to personalize your experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Children's Privacy
              </h2>
              <p>
                Lunara Quest is designed for parents and educators to use with their children. We do not knowingly collect personal information directly from children under 13. All child profiles are created and managed by their parent or guardian.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Data Security
              </h2>
              <p>
                We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access. Your data is stored securely using industry-standard encryption.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Data Retention
              </h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete your personal information. You can manage most of your data directly in your account settings or contact us for assistance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Contact
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at privacy@lunara.quest.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
