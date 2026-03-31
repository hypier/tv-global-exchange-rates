"use client";

import { useTradingApi } from "@/hooks/useTradingApi";
import { useState, useMemo } from "react";
import Image from "next/image";
import { 
  Search, 
  ArrowRight, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Globe,
  RefreshCw,
  LineChart
} from "lucide-react";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NZD", "HKD", "SGD"];

interface MarketResult {
  symbol: string;
  description?: string;
  type?: string;
  exchange?: string;
  currency_code?: string;
  "currency-logoid"?: string;
  "base-currency-logoid"?: string;
  logo?: {
    style?: string;
    logoid?: string;
    logoid2?: string;
  };
  source2?: {
    id?: string;
    name?: string;
    description?: string;
  };
  id?: string;
  full_name?: string;
}

interface SearchResponse {
  success: boolean;
  data?: {
    markets: MarketResult[];
    count: number;
  };
}

interface QuoteData {
  lp?: number;
  ch?: number;
  chp?: number;
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
  currency_code?: string;
  description?: string;
  exchange?: string;
  provider_id?: string;
  high_price?: number;
  low_price?: number;
  bid?: number;
  ask?: number;
  short_name?: string;
}

interface QuoteItem {
  success: boolean;
  symbol: string;
  data?: QuoteData;
}

interface BatchQuoteResponse {
  success?: boolean;
  data?: {
    total?: number;
    successful?: number;
    failed?: number;
    data?: QuoteItem[];
  };
}

export default function QueryPage() {
  const { apiKey } = useApiKey();
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Get search results based on query or default base
  const searchEndpoint = searchQuery 
    ? `/api/search/market/${searchQuery.toLowerCase()}` 
    : `/api/search/market/${baseCurrency.toLowerCase()}`;
  
  const { data: searchData, isLoading: isSearchLoading } = useTradingApi<SearchResponse>(
    searchEndpoint, 
    { filter: "forex" }, 
    !!apiKey && (searchQuery.length >= 2 || !searchQuery)
  );

  const searchSymbols = useMemo(() => {
    const markets = searchData?.data?.markets || [];
    console.log('🔍 Search Response:', searchData);
    console.log('📊 Markets:', markets);
    // If we have a query, use all results. If not, filter by base currency to keep it relevant.
    // Limit to 10 symbols due to batch API constraint
    if (searchQuery) {
      const symbols = markets.map(m => m.full_name || m.id || m.symbol).slice(0, 10);
      console.log('🎯 Symbols to query:', symbols);
      return symbols;
    }
    const symbols = markets
      .filter(m => {
        const sym = m.symbol || "";
        return sym.includes(baseCurrency);
      })
      .map(m => m.full_name || m.id || m.symbol)
      .slice(0, 10);
    console.log('🎯 Symbols to query:', symbols);
    return symbols;
  }, [searchData, baseCurrency, searchQuery]);

  // 2. Get real-time quotes for those symbols
  const { data: quoteData, isLoading: isQuoteLoading, refetch, isRefetching } = useTradingApi<BatchQuoteResponse>(
    "/api/quote/batch", 
    {
      method: "POST",
      body: { symbols: searchSymbols }
    }, 
    !!apiKey && searchSymbols.length > 0
  );

  const quotes = useMemo(() => {
    console.log('💰 Quote Response:', quoteData);
    const rawQuotes = quoteData?.data?.data || [];
    console.log('📈 Raw Quotes Array:', rawQuotes);
    
    // 展平数据结构: 将 symbol 和 data 合并
    const flattenedQuotes = rawQuotes
      .filter(item => item.success && item.data)
      .map(item => ({
        symbol: item.symbol,
        ...item.data,
      }));
    
    console.log('📊 Flattened Quotes:', flattenedQuotes);
    if (flattenedQuotes.length > 0) {
      console.log('📝 First Quote Sample:', flattenedQuotes[0]);
    }
    return flattenedQuotes;
  }, [quoteData]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-2">Institutional Query</h1>
          <p className="text-fintech-muted font-medium">Search across 2,000+ currency pairs with tick-level institutional data.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Globe className="w-4 h-4 text-fintech-primary/50 group-focus-within:text-fintech-primary transition-colors" />
            </div>
            <select
              value={baseCurrency}
              onChange={(e) => {
                setBaseCurrency(e.target.value);
                setSearchQuery(""); // Clear search when base changes
              }}
              className="bg-surface-container border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm font-bold text-fintech-text outline-none focus:ring-2 focus:ring-fintech-primary/30 focus:border-fintech-primary/50 appearance-none cursor-pointer shadow-sm transition-all"
            >
              {MAJOR_CURRENCIES.map(c => (
                <option key={c} value={c} className="bg-surface-container-low">{c} Hub</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <div className="w-4 h-4 border-r-2 border-b-2 border-fintech-muted/30 rotate-45 -translate-y-1"></div>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isQuoteLoading || isRefetching}
            className="p-3 bg-surface-container border border-white/10 rounded-xl text-fintech-primary hover:bg-surface-container-high transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", (isQuoteLoading || isRefetching) && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-fintech-muted" />
        </div>
        <input
          type="text"
          placeholder="Search pairs, regions, or symbols (e.g. 'CNY', 'Emerging', 'USDJPY')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-container-low border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-fintech-text outline-none focus:ring-2 focus:ring-fintech-primary/20 focus:bg-surface-container transition-all shadow-xl font-medium"
        />
        {(isSearchLoading || (isQuoteLoading && !isRefetching)) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-fintech-primary animate-spin" />
          </div>
        )}
      </div>

      <div className="institutional-card overflow-hidden border border-white/5 bg-surface-container-low shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-surface-container text-fintech-muted text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="py-6 px-8">Currency Instrument</th>
                <th className="py-6 px-8 text-left">Provider</th>
                <th className="py-6 px-8 text-right">Execution Rate</th>
                <th className="py-6 px-8 text-right">Daily Delta</th>
                <th className="py-6 px-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isQuoteLoading && !isRefetching ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-10 h-10 text-fintech-primary animate-spin" />
                      <p className="text-fintech-muted text-[10px] font-bold uppercase tracking-widest">Accessing Global Liquidity Pools</p>
                    </div>
                  </td>
                </tr>
              ) : quotes.length > 0 ? (
                quotes.map((quote, i) => {
                  const isPositive = (quote.chp || 0) >= 0;
                  const baseLogo = quote['base-currency-logoid'];
                  const quoteLogo = quote['currency-logoid'];
                  const displaySymbol = quote.short_name || quote.symbol.split(':').pop() || quote.symbol;

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={quote.symbol}
                      className="hover:bg-fintech-primary/5 transition-colors group"
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
                              {displaySymbol}
                            </span>
                            <span className="text-[10px] text-fintech-muted font-bold uppercase tracking-tighter mt-0.5">
                              {quote.description || "Forex"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-2">
                          {quote.provider_id && (
                            <Image
                              src={`https://tv-logo.tradingviewapi.com/logo/provider/${quote.provider_id}.svg`}
                              alt=""
                              width={20}
                              height={20}
                              unoptimized
                              className="w-5 h-5 rounded-sm"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <span className="text-sm font-medium text-fintech-muted">
                            {quote.exchange || quote.provider_id?.toUpperCase() || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right font-mono text-fintech-text font-bold text-lg">
                        {quote.lp?.toFixed(5)}
                        <span className="text-sm font-medium text-fintech-muted ml-1.5">{quote.currency_code || "—"}</span>
                      </td>
                      <td className="py-5 px-8 text-right font-mono text-sm font-bold">
                        <div className={cn(
                          "inline-flex items-center justify-end px-3 py-1 rounded border leading-none",
                          isPositive 
                            ? "text-fintech-success bg-fintech-success/10 border-fintech-success/20" 
                            : "text-fintech-danger bg-fintech-danger/10 border-fintech-danger/20"
                        )}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                          {quote.chp?.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            title="Open Technical Analysis"
                            className="p-2 hover:bg-fintech-primary-container rounded-lg text-fintech-primary transition-all cursor-pointer"
                            onClick={() => window.open(`/pair/${encodeURIComponent(quote.symbol)}`, '_blank')}
                          >
                            <LineChart className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 hover:bg-fintech-primary-container rounded-lg text-fintech-primary transition-all cursor-pointer"
                            onClick={() => {
                              const from = displaySymbol.slice(0, 3);
                              const to = displaySymbol.slice(3, 6);
                              window.location.href = `/converter?from=${from}&to=${to}`;
                            }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-fintech-muted font-bold text-[10px] uppercase tracking-widest">
                    {!apiKey 
                      ? "API terminal connection required." 
                      : searchQuery 
                        ? "No instruments found matching your search."
                        : "Ready for institutional search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
          <div className="text-fintech-primary mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-bold text-lg mb-2 text-fintech-text">Global Search</h3>
          <p className="text-fintech-muted text-xs leading-relaxed">Search through 2,000+ forex pairs across all regions including majors, minors, and exotic crosses.</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
          <div className="text-fintech-success mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-bold text-lg mb-2 text-fintech-text">Institutional Data</h3>
          <p className="text-fintech-muted text-xs leading-relaxed">Quotes are sourced from top-tier bank liquidity providers ensuring high-precision 5-decimal pricing.</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
          <div className="text-fintech-muted mb-3">
            <LineChart className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-bold text-lg mb-2 text-fintech-text">Technical Insights</h3>
          <p className="text-fintech-muted text-xs leading-relaxed">Quick access to professional technical analysis and buy/sell signals for every currency pair.</p>
        </div>
      </div>
    </div>
  );
}
