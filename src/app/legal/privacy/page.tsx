import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Privacy Policy | Lunara Quest',
  description: "Privacy Policy for Lunara Quest, including COPPA disclosures for children's data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background-secondary)] dark:bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-[var(--foreground)] mb-8"
        >
          <ArrowLeft size={16} />
          Back to Signup
        </Link>

        <div className="card p-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted mb-8">
            Last updated: May 19, 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-muted">

            <section>
              <p>
                Lunara Quest (&ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or
                &ldquo;<strong>our</strong>&rdquo;) operates the Lunara Quest homeschool planning platform
                (the &ldquo;<strong>Service</strong>&rdquo;). This Privacy Policy explains how we collect,
                use, and protect information about you and the children in your care.
              </p>
              <p className="mt-3">
                By creating an account you confirm that you are at least 18 years old and the parent or
                legal guardian of any children whose information you add to the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">1. Information We Collect</h2>

              <h3 className="font-semibold text-[var(--foreground)] mt-4 mb-2">About Parents / Educators</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email address and password (for account login)</li>
                <li>Display name (optional)</li>
                <li>Profile photo (optional, uploaded by you)</li>
                <li>Family and household information you choose to provide</li>
              </ul>

              <h3 className="font-semibold text-[var(--foreground)] mt-4 mb-2">
                About Children — Created and Managed Entirely by a Parent or Guardian
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>First name and last initial (used for kid portal login display only)</li>
                <li>Grade level / grade band</li>
                <li>Profile photo or custom avatar (uploaded or designed by the child or parent)</li>
                <li>
                  Optional profile fields the child can fill in: nickname, bio, favorite subjects,
                  hobbies, favorite shows, movies, music, foods, favorite color, and birthday
                </li>
                <li>Journal entries and mood selections (optional, created by the child)</li>
                <li>Academic activity logs, lesson plans, assignments, and completion records</li>
                <li>
                  External curriculum data imported by the parent (e.g., MiAcademy report cards):
                  course names, task names, scores, and completion dates
                </li>
                <li>A numeric PIN (stored as a one-way cryptographic hash) for kid portal login</li>
              </ul>
              <p className="mt-3 text-sm">
                <strong>No child&apos;s email address is collected.</strong> Children do not create their
                own accounts — all child profiles are created and controlled by a parent or guardian.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">2. How We Use Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To create and maintain your account and your children&apos;s profiles</li>
                <li>To provide homeschool planning, progress tracking, and gamification features</li>
                <li>
                  To generate AI-assisted lesson suggestions and educational resources (parent-only;
                  child data is used only as educational context provided by the parent)
                </li>
                <li>To display your child&apos;s journal entries, progress, and achievements in their portal</li>
                <li>To send account-related emails (password reset, email confirmation)</li>
                <li>To improve the Service</li>
              </ul>
              <p className="mt-3">
                We do not use children&apos;s personal information for advertising, behavioral profiling,
                or any purpose beyond operating the Service for the family.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">3. Third-Party Services</h2>
              <p className="mb-3">
                The following third-party services may receive limited data in order to operate the Service:
              </p>
              <div className="space-y-3">
                <div>
                  <strong className="text-[var(--foreground)]">Supabase</strong> — database, authentication,
                  and file storage. All account and child profile data is stored on Supabase infrastructure.
                  Supabase acts as a data processor on our behalf.
                </div>
                <div>
                  <strong className="text-[var(--foreground)]">OpenAI</strong> — AI-generated lesson plans
                  and educational recommendations, invoked only when a parent explicitly uses the Luna AI
                  assistant. We send the parent&apos;s message and limited educational context (grade level,
                  subject area). We do not send children&apos;s names, journal entries, or personal profile
                  details to OpenAI.
                </div>
                <div>
                  <strong className="text-[var(--foreground)]">YouTube Data API</strong> — educational video
                  suggestions. Only subject and grade-level search terms are sent; no child personal
                  information is transmitted to YouTube.
                </div>
                <div>
                  <strong className="text-[var(--foreground)]">Cloudflare Turnstile</strong> — bot-protection
                  on the signup page. No personal information beyond basic browser signals is processed.
                </div>
              </div>
              <p className="mt-3">
                We do not sell, rent, or share children&apos;s personal information with third parties for
                their own marketing or advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                4. Children&apos;s Privacy (COPPA)
              </h2>
              <p className="mb-3">
                Lunara Quest is a tool for <strong>parents and guardians</strong> to manage their
                children&apos;s homeschool education. We comply with the Children&apos;s Online Privacy
                Protection Act (COPPA).
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Children do not sign up directly.</strong> All child profiles are created by a
                  parent or guardian who has agreed to this Privacy Policy.
                </li>
                <li>
                  <strong>Parental consent.</strong> By creating a child profile, you (as parent or guardian)
                  provide verifiable parental consent for the collection and use of your child&apos;s
                  information as described in this Policy.
                </li>
                <li>
                  <strong>Right to review.</strong> You may review your child&apos;s personal information at
                  any time by logging in and navigating to their profile.
                </li>
                <li>
                  <strong>Right to correct.</strong> You may edit or correct your child&apos;s information
                  directly within the Service at any time.
                </li>
                <li>
                  <strong>Right to delete.</strong> You may permanently delete your child&apos;s profile and
                  all associated data from your account settings, or by contacting{' '}
                  <a href="mailto:privacy@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                    privacy@lunara.quest
                  </a>. Deletion is permanent and cannot be undone.
                </li>
                <li>
                  <strong>No marketing to children.</strong> We do not use any child&apos;s personal
                  information to contact or market to that child.
                </li>
              </ul>
              <p className="mt-3">
                To submit a parental rights request (review, correction, or deletion), email{' '}
                <a href="mailto:privacy@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                  privacy@lunara.quest
                </a>{' '}
                with subject &ldquo;COPPA Request&rdquo;. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">5. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. When you delete your account,
                all associated data — including all child profiles, journal entries, lesson records, and
                uploaded photos — is permanently deleted within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">6. Data Security</h2>
              <p>
                We protect your data with encrypted connections (TLS), signed session cookies, server-side
                authentication, and row-level database security policies. Child profile photos are stored
                in private, access-controlled storage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">7. Your Rights</h2>
              <p>
                Depending on your location you may have rights to access, correct, port, or delete your
                personal data. Contact{' '}
                <a href="mailto:privacy@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                  privacy@lunara.quest
                </a>{' '}
                to exercise any of these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this Policy from time to time. We will notify you of material changes by
                posting the updated Policy here and, where required by law, by email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">9. Contact</h2>
              <p>
                Lunara Quest<br />
                <a href="mailto:privacy@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                  privacy@lunara.quest
                </a>
                {' '}· {' '}
                <a href="mailto:hello@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                  hello@lunara.quest
                </a>
              </p>
              <p className="mt-4 text-sm p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
                <strong>Internal note:</strong> This policy is a working draft and should be reviewed by a
                licensed attorney familiar with COPPA and applicable state privacy laws before public launch.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
