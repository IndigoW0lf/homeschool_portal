import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Terms of Service | Lunara Quest',
  description: 'Terms of Service for Lunara Quest.',
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Terms of Service</h1>
          <p className="text-sm text-muted mb-8">
            Last updated: May 19, 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-muted">

            <section>
              <p>
                These Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;) are a legal agreement between
                you and Lunara Quest (&ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;,
                or &ldquo;<strong>our</strong>&rdquo;) governing your use of the Lunara Quest homeschool
                planning platform and all related services (collectively, the &ldquo;<strong>Service</strong>&rdquo;).
              </p>
              <p className="mt-3">
                By creating an account or using the Service you agree to these Terms. If you do not agree,
                do not use the Service.
              </p>
              <p className="mt-3 text-sm p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
                <strong>Internal note:</strong> These terms are a working draft and should be reviewed by
                a licensed attorney before public launch.
              </p>
            </section>

            {/* 1 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">1. Eligibility</h2>
              <p>
                You must be at least 18 years old to create an account. By agreeing to these Terms you
                represent that you are 18 or older and, where you are adding children to the Service,
                that you are the parent or legal guardian of those children. The Service is not intended
                for direct use by children under 13; all child access is mediated through a
                parent-controlled account.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">2. Description of Service</h2>
              <p>
                Lunara Quest is a homeschool planning and organization tool. Features include lesson
                planning, assignment tracking, progress reporting, a gamified kid portal, an AI planning
                assistant (Luna), and curriculum import tools. The Service is designed to be used by
                parents and guardians to support their children&apos;s education.
              </p>
              <p className="mt-3">
                <strong>Lunara Quest is not a licensed school, accredited curriculum, or certified
                educational service.</strong> Nothing in the Service constitutes professional educational,
                legal, or medical advice. Curriculum decisions remain the responsibility of the
                parent or guardian.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">3. Your Account</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  You are responsible for keeping your login credentials confidential and for all activity
                  that occurs under your account.
                </li>
                <li>
                  You agree to provide accurate information when creating your account and to keep it
                  current.
                </li>
                <li>
                  You may not share your account with others or allow anyone else to access the Service
                  through your credentials.
                </li>
                <li>
                  Notify us immediately at{' '}
                  <a href="mailto:hello@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                    hello@lunara.quest
                  </a>{' '}
                  if you suspect unauthorized access to your account.
                </li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                4. Children&apos;s Accounts &amp; Parental Responsibility
              </h2>
              <p>
                Child profiles are created and managed entirely by the parent or guardian account holder.
                By adding a child to the Service you confirm you have the authority to do so and you
                accept responsibility for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>All content entered or uploaded for that child</li>
                <li>Supervising your child&apos;s use of the kid portal</li>
                <li>
                  Ensuring your child&apos;s PIN is kept secure and not shared with unauthorized persons
                </li>
              </ul>
              <p className="mt-3">
                See our{' '}
                <Link href="/legal/privacy" className="text-[var(--ember-500)] hover:underline">
                  Privacy Policy
                </Link>{' '}
                for details on how children&apos;s data is handled and your COPPA rights.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">5. Your Content</h2>
              <p>
                You retain ownership of all lesson plans, journal entries, assignments, notes, and other
                content you create within the Service (&ldquo;<strong>User Content</strong>&rdquo;).
              </p>
              <p className="mt-3">
                By using the Service you grant us a limited, non-exclusive, royalty-free license to
                store, process, and display your User Content solely as necessary to provide the Service
                to you. We do not use your User Content to train AI models or share it with third parties
                for their own purposes.
              </p>
              <p className="mt-3">
                You are responsible for ensuring that any content you upload (including photos and
                curriculum materials) does not infringe the intellectual property rights of others and
                complies with applicable law.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">6. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload content that is abusive, harassing, obscene, or harmful to minors</li>
                <li>Attempt to gain unauthorized access to other accounts or our systems</li>
                <li>Reverse-engineer, scrape, or systematically extract data from the Service</li>
                <li>Use the Service to impersonate any person or entity</li>
                <li>Introduce malware, viruses, or other harmful code</li>
                <li>
                  Resell or sublicense access to the Service without our written permission
                </li>
              </ul>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">7. AI Features</h2>
              <p>
                The Service includes an AI planning assistant (Luna) powered by OpenAI. AI-generated
                suggestions are provided for planning convenience only and may contain errors or
                omissions. You should review all AI-generated content before using it with your children.
              </p>
              <p className="mt-3">
                AI features are available to parent accounts only. We do not send your children&apos;s
                personal information (names, journal entries, personal profile details) to AI providers.
                See our{' '}
                <Link href="/legal/privacy" className="text-[var(--ember-500)] hover:underline">
                  Privacy Policy
                </Link>{' '}
                for details.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">8. Fees &amp; Payment</h2>
              <p>
                The Service is currently available free of charge during our Early Access period.
                We intend to introduce paid subscription plans in the future. Before any paid plans
                go live we will:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>Give you advance notice of pricing and what is included</li>
                <li>Obtain your explicit agreement before charging your payment method</li>
                <li>Clearly communicate any changes to existing subscription terms</li>
              </ul>
              <p className="mt-3">
                Free features available today will remain accessible during the Early Access period.
                We will update these Terms before any billing begins.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                9. Intellectual Property
              </h2>
              <p>
                The Lunara Quest name, logo, visual design, and software (excluding User Content) are
                owned by or licensed to us and protected by intellectual property laws. You may not copy,
                modify, distribute, or create derivative works from our intellectual property without
                our written permission.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                10. Third-Party Services
              </h2>
              <p>
                The Service integrates with third-party providers including Supabase (infrastructure),
                OpenAI (AI features), YouTube (educational video suggestions), and Cloudflare (security).
                Your use of those features is also subject to those providers&apos; terms. We are not
                responsible for the content, policies, or practices of third-party services.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                11. Disclaimers
              </h2>
              <p>
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
                WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT
                WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL
                COMPONENTS.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                12. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUNARA QUEST AND ITS OPERATORS SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                OR ANY LOSS OF DATA, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE,
                EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="mt-3">
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF
                THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE
                MONTHS PRECEDING THE CLAIM OR (B) $50 USD.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">13. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless Lunara Quest and its operators from
                any claims, damages, or expenses (including reasonable attorneys&apos; fees) arising from
                your use of the Service, your User Content, or your violation of these Terms.
              </p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">14. Termination</h2>
              <p>
                You may delete your account at any time from your account settings. We may suspend or
                terminate your account if you violate these Terms or if we discontinue the Service,
                with reasonable notice where practicable.
              </p>
              <p className="mt-3">
                Upon termination, your right to use the Service ends immediately. Sections 5, 9,
                11, 12, 13, and 15 survive termination.
              </p>
            </section>

            {/* 15 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                15. Governing Law &amp; Disputes
              </h2>
              <p>
                These Terms are governed by the laws of{' '}
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  [YOUR STATE / JURISDICTION — update before launch]
                </span>
                , without regard to conflict-of-law principles. Any disputes shall be resolved in the
                courts of that jurisdiction, and you consent to personal jurisdiction there.
              </p>
            </section>

            {/* 16 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                16. Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time. We will notify you of material changes
                by posting the updated Terms here with a new &ldquo;Last updated&rdquo; date and, for
                significant changes, by email. Your continued use of the Service after the effective
                date of updated Terms constitutes acceptance.
              </p>
            </section>

            {/* 17 */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">17. Contact</h2>
              <p>
                Questions about these Terms?{' '}
                <a href="mailto:hello@lunara.quest" className="text-[var(--ember-500)] hover:underline">
                  hello@lunara.quest
                </a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
