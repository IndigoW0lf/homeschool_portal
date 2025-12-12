import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
