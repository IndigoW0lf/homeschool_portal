import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { 
  Hero, 
  Features, 
  HowItWorks, 
  KidShowcase, 
  Testimonials, 
  Pricing, 
  CTA,
  MarketingNav,
  Footer
} from '@/components/marketing';

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users go to family home
  if (user) {
    redirect('/home');
  }

  // Root always shows marketing for guests
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <MarketingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <KidShowcase />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
