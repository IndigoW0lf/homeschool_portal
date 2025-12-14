import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Homeschool Portal",
  description: "A kid-friendly homeschool portal with centralized dashboard and per-child pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster 
          richColors 
          position="top-center" 
          theme="light"
          closeButton
          toastOptions={{
            style: {
              background: 'white',
              border: '2px solid var(--ember-100)',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
              fontFamily: 'inherit',
            },
            className: 'cute-toast',
          }}
        />
      </body>
    </html>
  );
}
