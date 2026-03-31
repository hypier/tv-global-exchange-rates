"use client";

import { useTradingApi } from "@/hooks/useTradingApi";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, TrendingDown, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiKey } from "@/contexts/ApiKeyContext";

interface LeaderboardItem {
  symbol: string;
  name?: string;
  description?: string;
  price?: number;
  change?: number;
  changeabs?: number;
  currency?: string;
  exchange?: string;
  bid?: number;
  ask?: number;
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
  "technical-rating"?: string;
  high?: number;
  low?: number;
}

interface LeaderboardResponse {
  data?: {
    data?: LeaderboardItem[];
    items?: LeaderboardItem[];
  } | LeaderboardItem[];
}

const CURRENCY_TABS = [
  { id: "all", name: "All Pairs", path: "all" },
  { id: "major", name: "Major", path: "major" },
  { id: "minor", name: "Minor", path: "minor" },
  { id: "exotic", name: "Exotic", path: "exotic" },
  { id: "americas", name: "Americas", path: "americas" },
  { id: "europe", name: "Europe", path: "europe" },
  { id: "asia", name: "Asia", path: "asia" },
  { id: "pacific", name: "Pacific", path: "pacific" },
  { id: "middle_east", name: "Middle East", path: "middle_east" },
  { id: "africa", name: "Africa", path: "africa" },
];

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState("major");
  const { apiKey } = useApiKey();

  const { data, isLoading, error } = useTradingApi("/api/leaderboard/forex", {
    tab: activeTab,
    count: 20,
  }, !!apiKey);

  const items = useMemo(() => {
    const response = data as LeaderboardResponse;
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    return response.data?.data || response.data?.items || [];
  }, [data]);

  const hasRatings = useMemo(() => items.some(item => item['technical-rating']), [items]);

  return (
    <div className="max-w-6xl mx-auto pb-12 px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-2">Forex Leaderboard</h1>
        <p className="text-fintech-muted font-medium">Official currency rankings based on real-time metadata mapping.</p>
      </div>

      {/* Categories / Tabs */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex flex-wrap gap-2 min-w-max">
          {CURRENCY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.path)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                activeTab === tab.path
                  ? "bg-fintech-primary text-fintech-primary-container border-fintech-primary shadow-lg transform scale-105"
                  : "bg-surface-container-low text-fintech-muted border-white/5 hover:border-white/10 hover:bg-surface-container shadow-sm"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="institutional-card overflow-hidden border border-white/5 bg-surface-container-low shadow-2xl">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 bg-surface-container-low">
            <Loader2 className="w-10 h-10 text-fintech-primary animate-spin mb-4" />
            <p className="text-fintech-muted text-[10px] font-bold uppercase tracking-[0.2em]">Retrieving market data...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 bg-fintech-danger/10 rounded-full flex items-center justify-center mb-6 border border-fintech-danger/20">
              <AlertCircle className="w-8 h-8 text-fintech-danger" />
            </div>
            <p className="text-fintech-text font-headline font-extrabold text-2xl mb-3">Terminal Connection Interrupted</p>
            <p className="text-fintech-muted text-sm max-w-md leading-relaxed">
              We encountered an issue connecting to the institutional data source. Please verify your RapidAPI key configuration.
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-surface-container text-fintech-muted text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="py-6 px-8">Currency Pair</th>
                  <th className="py-6 px-8 text-right">Live Price</th>
                  <th className="py-6 px-8 text-right">24h Change %</th>
                  <th className="py-6 px-8 text-right">Range (H/L)</th>
                  {hasRatings && <th className="py-6 px-8 text-right">Technical Rating</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.length > 0 ? items.map((item, i) => {
                  const isPositive = (item.change || 0) >= 0;
                  const baseLogo = item['base-currency-logoid'];
                  const quoteLogo = item['currency-logoid'];
                  const rating = item['technical-rating'];

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      key={item.symbol || i} 
                      className="hover:bg-fintech-primary/5 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/pair/${encodeURIComponent(item.symbol)}`}
                    >
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-3 shrink-0">
                            {baseLogo && (
                              <Image
                                src={`https://tv-logo.tradingviewapi.com/logo/${baseLogo}.svg`}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-slate-800 z-10 shadow-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            {quoteLogo && (
                              <Image
                                src={`https://tv-logo.tradingviewapi.com/logo/${quoteLogo}.svg`}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-slate-800 z-0 shadow-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-fintech-text group-hover:text-fintech-primary transition-colors text-base leading-tight">
                              {item.name || item.symbol.split(':').pop()}
                            </span>
                            <span className="text-[10px] text-fintech-muted font-bold uppercase tracking-tighter">
                              {item.description || item.exchange || "Forex"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right font-mono font-bold">
                        <div className="text-fintech-text text-base">
                          {item.price !== undefined ? item.price.toFixed(5) : "—"}
                          {item.currency && <span className="text-[10px] text-fintech-muted ml-1">{item.currency}</span>}
                        </div>
                        {item.changeabs !== undefined && (
                          <div className="text-[10px] text-fintech-muted/60 mt-0.5">
                            ({isPositive ? "+" : ""}{item.changeabs.toFixed(5)})
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-8 text-right font-mono text-sm font-bold">
                        <div className={cn(
                          "inline-flex items-center justify-end px-3 py-1 rounded border leading-none",
                          isPositive
                            ? "text-fintech-success bg-fintech-success/10 border-fintech-success/20 glow-emerald"
                            : "text-fintech-danger bg-fintech-danger/10 border-fintech-danger/20 glow-rose"
                        )}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                          {Math.abs(item.change || 0).toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right text-fintech-muted text-sm font-mono font-medium">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-fintech-text text-xs">{item.high?.toFixed(5) || "—"}</span>
                          <div className="w-20 h-0.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full", isPositive ? "bg-fintech-success" : "bg-fintech-danger")}
                              style={{ width: `${Math.min(100, Math.max(0, ((item.change || 0) + 2) * 25))}%` }}
                            />
                          </div>
                          <span className="text-[10px] opacity-40">{item.low?.toFixed(5) || "—"}</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {rating && (
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2.5 py-1 rounded border tracking-widest leading-none",
                              rating.toLowerCase().includes('buy')
                                ? "bg-fintech-success text-fintech-bg border-fintech-success shadow-[0_0_15px_rgba(78,222,163,0.3)]"
                                : rating.toLowerCase().includes('sell')
                                  ? "bg-fintech-danger text-fintech-bg border-fintech-danger shadow-[0_0_15px_rgba(252,69,99,0.3)]"
                                  : "bg-surface-container-highest text-fintech-muted border-white/5"
                            )}>
                              {rating}
                            </span>
                          )}
                          <Link
                            href={`/pair/${encodeURIComponent(item.symbol)}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-fintech-primary-container text-fintech-primary"
                            title="View pair details"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center text-fintech-muted font-bold text-[10px] uppercase tracking-widest">
                      {apiKey ? "No rankings found for this sector." : "API Authentication Required"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
