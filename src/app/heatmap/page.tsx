"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const BASE_URL = "https://tradingview-data1.p.rapidapi.com";
const BATCH_SIZE = 10;

import { MAJOR_CURRENCIES as CURRENCIES } from "@/config/currencies";

function buildSymbols(currencies: readonly string[]): string[] {
  const pairs: string[] = [];
  for (const base of currencies) {
    for (const quote of currencies) {
      if (base !== quote) {
        pairs.push(`FX_IDC:${base}${quote}`);
      }
    }
  }
  return pairs;
}

interface BatchItem {
  success: boolean;
  symbol: string;
  data?: { chp?: number; lp?: number };
}

interface BatchResponse {
  data?: { data?: BatchItem[] };
}

function heatColor(chp: number): string {
  if (chp >= 1.5) return "bg-emerald-400/80 text-emerald-900";
  if (chp >= 0.75) return "bg-emerald-500/50 text-emerald-200";
  if (chp >= 0.25) return "bg-emerald-600/30 text-emerald-300";
  if (chp > 0) return "bg-emerald-900/20 text-emerald-400";
  if (chp === 0) return "bg-surface-container text-fintech-muted";
  if (chp > -0.25) return "bg-rose-900/20 text-rose-400";
  if (chp > -0.75) return "bg-rose-600/30 text-rose-300";
  if (chp > -1.5) return "bg-rose-500/50 text-rose-200";
  return "bg-rose-400/80 text-rose-900";
}

export default function HeatmapPage() {
  const { apiKey } = useApiKey();
  const [hoveredBase, setHoveredBase] = useState<string | null>(null);
  const [hoveredQuote, setHoveredQuote] = useState<string | null>(null);
  
  const symbols = useMemo(() => buildSymbols(CURRENCIES), []);

  const chunks = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      result.push(symbols.slice(i, i + BATCH_SIZE));
    }
    return result;
  }, [symbols]);

  const queries = useQueries({
    queries: chunks.map(chunk => ({
      queryKey: ["heatmap-batch", chunk],
      queryFn: async (): Promise<BatchResponse> => {
        if (!apiKey) throw new Error("API Key required");
        const res = await fetch(`${BASE_URL}/api/quote/batch`, {
          method: "POST",
          headers: {
            "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
            "x-rapidapi-key": apiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({ symbols: chunk }),
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
      },
      enabled: !!apiKey,
      staleTime: 60 * 1000,
    })),
  });

  const isLoading = queries.some(q => q.isLoading || q.isFetching);

  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    queries.forEach(q => {
      const items = q.data?.data?.data || [];
      items.forEach(item => {
        if (item.success && item.data?.chp !== undefined) {
          const key = item.symbol.replace("FX_IDC:", "");
          map.set(key, item.data.chp);
        }
      });
    });
    return map;
  }, [queries]);

  const strength = useMemo(() => {
    return CURRENCIES.map(base => {
      const values: number[] = [];
      CURRENCIES.forEach(quote => {
        if (base !== quote) {
          const chp = lookup.get(`${base}${quote}`);
          if (chp !== undefined) values.push(chp);
        }
      });
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { currency: base, strength: avg };
    }).sort((a, b) => b.strength - a.strength);
  }, [lookup]);

  const maxAbsStrength = useMemo(() => {
    const absValues = strength.map(s => Math.abs(s.strength));
    return Math.max(...absValues, 0.1); // Avoid division by zero, min scale 0.1%
  }, [strength]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-12 pb-24">

      {/* Hero Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-fintech-primary-light"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Institutional Heatmap Matrix</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-7xl font-headline font-extrabold tracking-tighter text-fintech-text leading-[0.9]"
          >
            CURRENCY<br/><span className="text-fintech-primary">HEATMAP</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-fintech-muted font-body text-lg max-w-md leading-relaxed"
          >
            24h percentage change matrix. Real-time institutional liquidity feeds mapping global currency strength.
          </motion.p>
        </div>
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-10 h-10 text-fintech-primary animate-spin" />
          <p className="text-fintech-muted text-[10px] font-bold uppercase tracking-widest animate-pulse">Synchronizing Node Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar: Strength Ranking (4 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 bg-surface-container-low rounded-xl p-8 border border-white/5 shadow-sm relative overflow-hidden h-full"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-fintech-primary/20"></div>
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-fintech-primary" />
              Strength Index
            </h2>
            
            <div className="space-y-4">
              {strength.map(({ currency, strength: s }, i) => (
                <motion.div 
                  key={currency} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="flex items-center gap-3 w-20">
                    <Image
                      src={`https://tv-logo.tradingviewapi.com/logo/country/${currency.slice(0, 2)}.svg`}
                      alt={currency}
                      width={28}
                      height={28}
                      unoptimized
                      className="w-7 h-7 rounded-full object-cover bg-surface-container shadow-sm border border-white/10 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-black uppercase text-fintech-text font-mono tracking-wider">{currency}</div>
                  </div>
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (Math.abs(s) / maxAbsStrength) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                      className={cn(
                        "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", 
                        s >= 0 ? "bg-fintech-success" : "bg-fintech-danger"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "w-16 text-right text-xs font-mono font-bold tracking-tighter", 
                    s >= 0 ? "text-fintech-success glow-emerald" : "text-fintech-danger glow-rose"
                  )}>
                    {s >= 0 ? "+" : ""}{s.toFixed(3)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main: Heatmap Matrix (8 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-8 bg-surface-container-low rounded-xl p-8 border border-white/5 shadow-sm overflow-x-auto relative"
          >
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-8 flex items-center gap-2">
              Live Matrix
              <span className="text-[9px] lowercase font-medium tracking-normal text-fintech-muted/40">(Row: Base / Col: Quote)</span>
            </h2>
            
            <table className="border-collapse w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="w-14 p-1"></th>
                  {CURRENCIES.map(c => (
                    <th 
                      key={c} 
                      className={cn(
                        "p-2 text-[10px] font-black uppercase tracking-widest text-center w-20 transition-colors duration-300",
                        hoveredQuote === c ? "text-fintech-primary" : "text-fintech-muted"
                      )}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRENCIES.map(base => (
                  <tr key={base} onMouseEnter={() => setHoveredBase(base)} onMouseLeave={() => setHoveredBase(null)}>
                    <td className={cn(
                      "p-2 text-[10px] font-black uppercase tracking-widest text-right pr-4 transition-colors duration-300",
                      hoveredBase === base ? "text-fintech-primary" : "text-fintech-muted"
                    )}>
                      {base}
                    </td>
                    {CURRENCIES.map(quote => {
                      if (base === quote) {
                        return (
                          <td key={quote} className="p-0.5">
                            <div className="w-full h-12 rounded bg-surface-container-highest/30 flex items-center justify-center text-[10px] text-fintech-muted/20 font-bold border border-white/[0.02]">
                              <div className="w-full h-full bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,rgba(255,255,255,0.02)_5px,rgba(255,255,255,0.02)_10px)]"></div>
                            </div>
                          </td>
                        );
                      }
                      const chp = lookup.get(`${base}${quote}`);
                      return (
                        <td 
                          key={quote} 
                          className="p-0.5"
                          onMouseEnter={() => setHoveredQuote(quote)}
                          onMouseLeave={() => setHoveredQuote(null)}
                        >
                          <Link href={`/pair/FX_IDC:${base}${quote}`}>
                            <motion.div 
                              whileHover={{ scale: 1.05, zIndex: 10 }}
                              className={cn(
                                "w-full h-12 rounded flex flex-col items-center justify-center transition-all duration-300 cursor-pointer border border-transparent hover:border-white/20",
                                chp !== undefined ? heatColor(chp) : "bg-surface-container text-fintech-muted"
                              )}
                            >
                              <div className="text-[10px] font-black tracking-tight">{chp !== undefined ? `${chp >= 0 ? "+" : ""}${chp.toFixed(2)}%` : "—"}</div>
                            </motion.div>
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend Footer */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[9px] text-fintech-muted font-black uppercase tracking-[0.2em] border-t border-white/5 pt-8">
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-rose-400/80"></div><span>Strong Sell</span></div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-rose-600/30"></div><span>Weak Sell</span></div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-container border border-white/10"></div><span>Neutral</span></div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-600/30"></div><span>Weak Buy</span></div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-400/80"></div><span>Strong Buy</span></div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
