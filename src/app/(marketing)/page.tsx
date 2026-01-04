import { 
  Hero, 
  Features, 
  HowItWorks, 
  KidShowcase, 
  Testimonials, 
  Pricing, 
  CTA 
} from '@/components/marketing';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <KidShowcase />
      <Testimonials />
      <Pricing />
      <CTA />
    </>
  );
}
