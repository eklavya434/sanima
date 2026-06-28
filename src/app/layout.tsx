import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Sanima — Universal Review Platform",
  description: "Letterboxd-style review platform for movies, TV, ads, YouTube, podcasts, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0d0e12] text-gray-100 flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-800/40 py-6 text-center text-sm text-gray-500 bg-[#0b0c10]">
            <p>&copy; {new Date().getFullYear()} SANIMA. Review everything. Developed by Antigravity.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
