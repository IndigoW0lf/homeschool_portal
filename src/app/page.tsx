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

export default function HomePage() {
  // Root always shows marketing - logged in users can find family at /home
  return (
    <div className="min-h-screen bg-gray-900">
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
