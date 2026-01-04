import { MarketingNav, Footer } from '@/components/marketing';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <MarketingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
