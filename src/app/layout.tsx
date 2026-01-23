import type { Metadata } from "next";
import { Quicksand, Macondo } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["300", "400", "500", "600", "700"],
});

// Mystical hand-drawn calligraphy for magical titles (tarot-card inspired)
const macondo = Macondo({
  subsets: ["latin"],
  variable: "--font-magical",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Lunara Homeschool Quest",
  description: "A magical homeschool journey for curious learners",
};

// Script to prevent flash of wrong theme - runs before React
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${macondo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${quicksand.className} antialiased`} suppressHydrationWarning>
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
              fontFamily: 'var(--font-quicksand), inherit',
            },
            className: 'cute-toast',
          }}
        />
      </body>
    </html>
  );
}
