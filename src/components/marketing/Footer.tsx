import Link from 'next/link';
import { Sparkle, EnvelopeSimple, TwitterLogo, InstagramLogo } from '@phosphor-icons/react/dist/ssr';

export function Footer() {
  return (
    <footer className="bg-[var(--night-900)] border-t border-[var(--night-700)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-ember">
                <Sparkle size={24} weight="fill" className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Lunara Quest</span>
            </Link>
            <p className="text-[var(--slate-400)] max-w-sm">
              Your magical homeschool companion. Making learning organized, 
              joyful, and engaging for the whole family.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-[var(--slate-400)] hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-[var(--slate-400)] hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/signup" className="text-[var(--slate-400)] hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/privacy" className="text-[var(--slate-400)] hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-[var(--slate-400)] hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--night-700)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--slate-500)] text-sm">
            © {new Date().getFullYear()} Lunara Quest. Made with ✨ for homeschool families.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="mailto:hello@lunara.quest" 
              className="text-[var(--slate-400)] hover:text-white transition-colors"
              aria-label="Email"
            >
              <EnvelopeSimple size={20} />
            </a>
            <a 
              href="#" 
              className="text-[var(--slate-400)] hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <TwitterLogo size={20} />
            </a>
            <a 
              href="#" 
              className="text-[var(--slate-400)] hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <InstagramLogo size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
