import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { ApiKeyProvider } from "@/contexts/ApiKeyContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { Navbar } from "@/components/layout/Navbar";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["200", "400", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Global Exchange | Institutional Dashboard",
  description: "Secure, privacy-focused forex terminal powered by RapidAPI and TradingView data. Enterprise-grade BYOK architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body bg-fintech-bg text-fintech-text min-h-screen flex flex-col">
        <QueryProvider>
          <ApiKeyProvider>
            <Navbar />
            <main className="flex-grow w-full pt-16">
              {children}
            </main>
            <footer className="border-t border-white/5 bg-surface-container-lowest py-12 px-6 md:px-12 mt-auto">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-fintech-primary flex items-center justify-center text-slate-900 font-bold font-serif shadow-sm">
                    GX
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline font-black tracking-widest text-sm uppercase text-fintech-primary">GLOBAL EXCHANGE</span>
                    <span className="text-[10px] text-fintech-muted font-bold uppercase tracking-tighter">Enterprise FX Edition</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest text-fintech-muted">
                  <a href="#" className="hover:text-fintech-primary transition-colors">Term of Service</a>
                  <a href="#" className="hover:text-fintech-primary transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-fintech-primary transition-colors">Documentation</a>
                </div>

                <p className="text-xs text-fintech-muted font-medium">
                  &copy; {new Date().getFullYear()} Global Exchange. BYOK Powered.
                </p>
              </div>
            </footer>
          </ApiKeyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
