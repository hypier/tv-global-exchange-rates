"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, ShieldCheck, LayoutDashboard, LineChart, ArrowLeftRight, Bell, Zap, CalendarDays, Grid3X3 } from "lucide-react";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { SettingsModal } from "@/components/layout/SettingsModal";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { apiKey } = useApiKey();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Market", href: "/rankings", icon: LineChart },
    { name: "Query", href: "/query", icon: Zap },
    { name: "Converter", href: "/converter", icon: ArrowLeftRight },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Heatmap", href: "/heatmap", icon: Grid3X3 },
    { name: "News", href: "/news", icon: Bell },
  ];

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 bg-fintech-bg/60 backdrop-blur-md z-50 shadow-[0_40px_60px_-10px_rgba(49,72,101,0.06)] border-b border-white/5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-fintech-primary" />
          <Link href="/" className="text-fintech-primary font-headline font-black tracking-widest text-sm uppercase">
            GLOBAL EXCHANGE
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "font-headline text-sm tracking-tight transition-all duration-300",
                pathname === link.href 
                  ? "text-fintech-success font-bold" 
                  : "text-fintech-primary/70 hover:text-fintech-primary"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-fintech-primary-container rounded-full">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              apiKey ? "bg-fintech-success" : "bg-fintech-danger"
            )}></div>
            <span className={cn(
              "text-[10px] font-bold tracking-widest uppercase",
              apiKey ? "text-fintech-success" : "text-fintech-danger"
            )}>
              {apiKey ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-fintech-primary-container rounded-full transition-all duration-300 text-fintech-primary"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-fintech-bg/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-xl border-t border-white/5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-300",
                isActive 
                  ? "text-fintech-success bg-fintech-primary-container rounded-xl shadow-[0_0_15px_rgba(78,222,163,0.1)]" 
                  : "text-fintech-primary/50 hover:text-fintech-primary"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="font-body text-[10px] font-medium uppercase tracking-tighter">{link.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center justify-center text-fintech-primary/50 px-3 py-1.5 hover:text-fintech-primary transition-all duration-300"
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="font-body text-[10px] font-medium uppercase tracking-tighter">Settings</span>
        </button>
      </nav>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
