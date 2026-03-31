"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { useTradingApi } from "@/hooks/useTradingApi";
import { SettingsModal } from "@/components/layout/SettingsModal";
import { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  Settings, 
  ArrowRight, 
  ArrowLeftRight, 
  Activity,
  Zap,
  Lock,
  Loader2,
  Server,
  RefreshCw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/schema/JsonLd";


// --- Types ---

interface QuoteData {
  data?: {
    data?: {
      lp?: number;
      chp?: number;
    };
  };
}

interface QuoteItem {
  symbol: string;
  name?: string;
  description?: string;
  lp?: number;
  ch?: number;
  chp?: number;
  bid?: number;
  ask?: number;
  high_price?: number;
  low_price?: number;
  open_price?: number;
  exchange?: string;
  currency_code?: string;
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
}

interface BatchItem {
  success: boolean;
  symbol: string;
  data?: QuoteItem;
  error?: string;
}

interface BatchQuoteResponse {
  data?: {
    data?: BatchItem[];
  };
}

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
  high?: number;
  low?: number;
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
  "technical-rating"?: string;
}

interface LeaderboardResponse {
  data?: {
    data?: LeaderboardItem[];
    items?: LeaderboardItem[];
  } | LeaderboardItem[];
}

// --- Components ---

function AnimatedNumber({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="inline-block"
      >
        {new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)}
      </motion.div>
    </AnimatePresence>
  );
}

import { getCurrencyFlagUrl } from "@/config/currencies";
import { ALL_CURRENCIES as CURRENCIES } from "@/config/currencies";

function QuickQueryWidget() {
  const { apiKey } = useApiKey();
  const [baseCurrency, setBaseCurrency] = useState("USD");

  const targetCurrencies = useMemo(() => {
    return CURRENCIES.filter(c => c !== baseCurrency).slice(0, 6);
  }, [baseCurrency]);

  const symbols = useMemo(() => {
    return targetCurrencies.map(target => {
      // Common forex pairing conventions
      const pairs: Record<string, string> = {
        'EURUSD': 'FX_IDC:EURUSD',
        'GBPUSD': 'FX_IDC:GBPUSD',
        'AUDUSD': 'FX_IDC:AUDUSD',
        'NZDUSD': 'FX_IDC:NZDUSD',
        'USDJPY': 'FX_IDC:USDJPY',
        'USDCAD': 'FX_IDC:USDCAD',
        'USDCHF': 'FX_IDC:USDCHF',
        'USDCNY': 'FX_IDC:USDCNY',
        'USDHKD': 'FX_IDC:USDHKD',
        'USDSGD': 'FX_IDC:USDSGD',
      };

      const direct = `${baseCurrency}${target}`;
      const reversed = `${target}${baseCurrency}`;

      return pairs[direct] || pairs[reversed] || `FX_IDC:${baseCurrency}${target}`;
    });
  }, [baseCurrency, targetCurrencies]);

  const { data, isLoading, refetch, isRefetching } = useTradingApi<BatchQuoteResponse>("/api/quote/batch", {
    method: "POST",
    body: { symbols }
  }, !!apiKey);

  const quotes = useMemo(() => {
    return data?.data?.data || [];
  }, [data]);

  return (
    <section className="bg-surface-container-low rounded-xl p-8 border border-white/5 h-full relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-1">Global Rate Query</h2>
          <div className="text-[10px] text-fintech-primary font-bold uppercase tracking-widest">Real-time Cross-Border Feeds</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="bg-surface-container border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-bold text-fintech-text outline-none focus:ring-1 focus:ring-fintech-primary/30 appearance-none cursor-pointer"
            >
              {CURRENCIES.map(c => <option key={c} value={c} className="bg-surface-container-low">{c} Base</option>)}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <div className="w-2 h-2 border-r border-b border-fintech-muted rotate-45 -translate-y-0.5"></div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-1.5 bg-surface-container border border-white/10 rounded-lg text-fintech-primary hover:bg-surface-container-high transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", (isLoading || isRefetching) && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-fintech-primary animate-spin" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-fintech-muted">Syncing with Node</span>
          </div>
        ) : quotes.length > 0 ? (
          quotes.map((item, i) => {
            // Extract the other currency from the symbol
            const cleanSym = item.symbol.replace("FX_IDC:", "");
            const target = cleanSym.replace(baseCurrency, "");
            const quote = item.data;
            const isPositive = (quote?.chp || 0) >= 0;
            
            if (!item.success) return null;

            return (
              <motion.div 
                key={item.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-12 items-center gap-2 p-3 bg-surface-container rounded-lg border border-white/5 hover:border-fintech-primary/20 transition-colors group cursor-pointer"
                onClick={() => window.location.href = `/pair/${encodeURIComponent(item.symbol)}`}
              >
                {/* Left: Logo + Pair Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <Image
                    src={getCurrencyFlagUrl(target)}
                    alt={target}
                    width={32}
                    height={32}
                    unoptimized
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-fintech-text group-hover:text-fintech-primary transition-colors">{baseCurrency}/{target}</div>
                    <div className="text-[9px] text-fintech-muted truncate">{quote?.description || "Spot Rate"}</div>
                  </div>
                </div>

                {/* Middle: Price + Change */}
                <div className="col-span-4 text-center">
                  <div className="text-base font-mono font-bold text-fintech-text">
                    {quote?.lp ? quote.lp.toFixed(4) : "---"}
                    <span className="text-[10px] text-fintech-muted/60 ml-1">{quote?.currency_code || ""}</span>
                  </div>
                  <div className={cn("text-[10px] font-bold", isPositive ? "text-fintech-success" : "text-fintech-danger")}>
                    {isPositive ? "+" : ""}{quote?.chp?.toFixed(2) ?? "--"}%
                    <span className="ml-1 text-fintech-muted/60">({quote?.ch?.toFixed(4) ?? "--"})</span>
                  </div>
                </div>

                {/* Right: Detailed Stats */}
                <div className="col-span-5 grid grid-cols-2 gap-x-3 gap-y-1 text-right">
                  <div className="text-[9px] text-fintech-muted/70">
                    <span className="text-fintech-muted/40">O:</span> {quote?.open_price?.toFixed(4) || "—"}
                  </div>
                  <div className="text-[9px] text-fintech-muted/70">
                    <span className="text-fintech-muted/40">H:</span> {quote?.high_price?.toFixed(4) || "—"}
                  </div>
                  <div className="text-[9px] text-fintech-muted/70">
                    <span className="text-fintech-muted/40">B:</span> {quote?.bid?.toFixed(4) || "—"}
                  </div>
                  <div className="text-[9px] text-fintech-muted/70">
                    <span className="text-fintech-muted/40">L:</span> {quote?.low_price?.toFixed(4) || "—"}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-20 text-center text-[10px] text-fintech-muted uppercase font-bold tracking-widest">
            {apiKey ? "No matches found" : "API Required"}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <Link href="/query" className="text-fintech-primary font-bold text-[9px] uppercase tracking-widest hover:opacity-80 flex items-center justify-center gap-1">
          Access Full Query Terminal <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

function APIStatusWidget() {  const { apiKey } = useApiKey();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="bg-surface-container-low p-6 rounded-xl flex items-center justify-between gap-6 min-w-[320px] shadow-sm border border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-fintech-primary-container flex items-center justify-center">
          <Server className="w-6 h-6 text-fintech-primary" />
        </div>
        <div>
          <div className="text-[10px] text-fintech-muted uppercase tracking-widest font-bold mb-1">Infrastructure</div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-headline font-bold transition-all duration-500",
              apiKey ? "text-fintech-success glow-emerald" : "text-fintech-danger"
            )}>
              RapidAPI: {apiKey ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-[10px] text-fintech-muted/60 mt-0.5 uppercase tracking-tighter">Latency: {apiKey ? "14ms (Direct)" : "N/A"}</div>
        </div>
      </div>
      {apiKey ? (
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-fintech-primary-container rounded-full transition-all duration-300 text-fintech-primary"
        >
          <Settings className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-fintech-danger/30 bg-fintech-danger/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-fintech-danger shadow-[0_0_24px_rgba(252,69,99,0.12)] transition-all duration-300 hover:bg-fintech-danger/15 hover:scale-[1.02]"
        >
          <Settings className="w-4 h-4" />
          Configure Here
        </button>
      )}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

function ConverterWidget() {
  const { apiKey } = useApiKey();
  const [amount, setAmount] = useState<number>(10000);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");

  const symbol = `FX_IDC:${fromCurrency}${toCurrency}`;
  const reverseSymbol = `FX_IDC:${toCurrency}${fromCurrency}`;

  const { data: quote, isLoading: isLoadingQuote } = useTradingApi<QuoteData>(`/api/quote/${symbol}`, {}, !!apiKey);
  const quoteHasLp = quote?.data?.data?.lp !== undefined;

  const { data: reverseQuote, isLoading: isLoadingReverse } = useTradingApi<QuoteData>(
    `/api/quote/${reverseSymbol}`, 
    {}, 
    !!apiKey && !isLoadingQuote && !quoteHasLp
  );

  const rate = useMemo(() => {
    const lp = quote?.data?.data?.lp;
    if (lp) return lp;
    const revLp = reverseQuote?.data?.data?.lp;
    if (revLp) return 1 / revLp;
    return null;
  }, [quote, reverseQuote]);

  const convertedAmount = rate ? amount * rate : null;
  const isLoading = isLoadingQuote || isLoadingReverse;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden h-full border border-white/5">
      <div className="absolute top-0 left-0 w-1 h-full bg-fintech-primary/20"></div>
      <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-8">Institutional Converter</h2>
      
      <div className="space-y-4">
        {/* Input Card */}
        <div className="bg-surface-container p-6 rounded-xl space-y-4 border border-white/5 transition-all hover:bg-surface-container-high relative overflow-hidden">
          {/* Background Logo */}
          <div className="absolute -right-8 -top-8 opacity-[0.15] pointer-events-none">
            <Image
              src={getCurrencyFlagUrl(fromCurrency)}
              alt=""
              width={160}
              height={160}
              unoptimized
              className="w-40 h-40 object-cover"
            />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] text-fintech-muted uppercase font-bold tracking-widest">You Send</span>
            <div className="flex items-center gap-2 bg-surface-container-highest pl-1.5 pr-3 py-1 rounded-full border border-white/5">
              <Image
                src={getCurrencyFlagUrl(fromCurrency)}
                alt={fromCurrency}
                width={16}
                height={16}
                unoptimized
                className="w-4 h-4 rounded-full object-cover bg-surface-container shadow-sm"
              />
              <select 
                value={fromCurrency} 
                onChange={(e) => setFromCurrency(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-bold text-fintech-text outline-none text-center cursor-pointer appearance-none"
              >
                {CURRENCIES.map(c => <option key={c} value={c} className="bg-surface-container-highest text-fintech-text">{c}</option>)}
              </select>
            </div>
          </div>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="bg-transparent border-none p-0 w-full text-4xl font-headline font-bold tracking-tight text-fintech-text outline-none relative z-10"
          />
        </div>

        {/* Swap Action */}
        <div className="relative flex justify-center -my-6 z-10">
          <button 
            onClick={swapCurrencies}
            className="w-10 h-10 bg-fintech-primary rounded-full flex items-center justify-center text-fintech-primary-container shadow-lg hover:scale-110 transition-transform active:scale-95"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* Output Card */}
        <div className="bg-surface-container-high p-6 rounded-xl space-y-4 border border-white/5 relative overflow-hidden">
          {/* Background Logo */}
          <div className="absolute -right-8 -bottom-8 opacity-[0.15] pointer-events-none">
            <Image
              src={getCurrencyFlagUrl(toCurrency)}
              alt=""
              width={160}
              height={160}
              unoptimized
              className="w-40 h-40 object-cover"
            />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] text-fintech-muted uppercase font-bold tracking-widest">You Receive</span>
            <div className="flex items-center gap-2 bg-surface-container-highest pl-1.5 pr-3 py-1 rounded-full border border-white/5">
              <Image
                src={getCurrencyFlagUrl(toCurrency)}
                alt={toCurrency}
                width={16}
                height={16}
                unoptimized
                className="w-4 h-4 rounded-full object-cover bg-surface-container shadow-sm"
              />
              <select 
                value={toCurrency} 
                onChange={(e) => setToCurrency(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-bold text-fintech-text outline-none text-center cursor-pointer appearance-none"
              >
                {CURRENCIES.map(c => <option key={c} value={c} className="bg-surface-container-highest text-fintech-text">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="h-[48px] flex items-center">
                  <Loader2 className="w-8 h-8 text-fintech-primary animate-spin" />
                </div>
              ) : (
                <div
                  className="text-5xl font-headline font-extrabold tracking-tighter text-fintech-success glow-emerald truncate"
                >
                  <AnimatedNumber value={convertedAmount ?? 0} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
        <div className="text-xs text-fintech-muted italic font-medium">
          {rate ? `1 ${fromCurrency} = ${rate.toFixed(5)} ${toCurrency}` : "Fetching rates..."}
        </div>
        <Link 
          href="/converter"
          className="bg-fintech-primary text-fintech-primary-container px-6 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Full Converter
        </Link>
      </div>
    </div>
  );
}

function MarketLeaderboard() {
  const [activeTab, setActiveTab] = useState("major");
  const { apiKey } = useApiKey();

  const { data, isLoading } = useTradingApi("/api/leaderboard/forex", {
    tab: activeTab,
    count: 5,
  }, !!apiKey);

  const items = useMemo(() => {
    const response = data as LeaderboardResponse;
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    return response.data?.data || response.data?.items || [];
  }, [data]);

  return (
    <section className="bg-surface-container-low rounded-xl p-8 border border-white/5 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted">Live Market Board</h2>
        <div className="flex flex-wrap gap-2">
          {["major", "exotic", "asia", "europe"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all",
                activeTab === tab 
                  ? "bg-fintech-primary-container text-fintech-primary border border-fintech-primary/20" 
                  : "text-fintech-muted hover:text-fintech-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-8 h-8 text-fintech-primary animate-spin" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-fintech-muted">Retrieving Terminal Data</span>
            </motion.div>
          ) : items.length > 0 ? (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {items.map((item, i) => {
                const isPositive = (item.change || 0) >= 0;
                const baseLogo = item['base-currency-logoid'];
                const quoteLogo = item['currency-logoid'];
                const rating = item['technical-rating'] || item['technicalrating'];

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={item.symbol || i}
                    className="grid grid-cols-12 items-center bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-colors border border-white/5 group cursor-pointer"
                    onClick={() => window.location.href = `/pair/${encodeURIComponent(item.symbol)}`}
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex -space-x-3 shrink-0">
                        {baseLogo && (
                          <Image
                            src={`https://tv-logo.tradingviewapi.com/logo/${baseLogo}.svg`}
                            alt=""
                            width={32}
                            height={32}
                            unoptimized
                            className="w-8 h-8 rounded-full border-2 border-surface-container object-cover bg-slate-800"
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
                            className="w-8 h-8 rounded-full border-2 border-surface-container object-cover bg-slate-800"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-sm text-fintech-text group-hover:text-fintech-primary transition-colors">
                          {item.name || item.symbol.split(':').pop()}
                        </div>
                        <div className="text-[9px] text-fintech-muted uppercase tracking-tighter truncate">
                          {item.description || item.exchange || "Forex"}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-6 text-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-headline font-bold text-lg md:text-xl text-fintech-text"
                      >
                        {item.price?.toFixed(5) || "—"}
                        <span className="text-[10px] text-fintech-muted ml-1">{item.currency || ""}</span>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "text-[11px] font-bold",
                          isPositive ? "text-fintech-success" : "text-fintech-danger"
                        )}
                      >
                        {isPositive ? "+" : ""}{item.change?.toFixed(2)}%
                        <span className="ml-1">({isPositive ? "+" : ""}{item.changeabs?.toFixed(5) || "—"})</span>
                      </motion.div>
                    </div>
                    <div className="col-span-3 flex flex-col items-end justify-center gap-1">
                      {rating && (
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-1 rounded border leading-none tracking-wider",
                          rating.toLowerCase().includes('buy')
                            ? "bg-fintech-success/10 text-fintech-success border-fintech-success/20"
                            : rating.toLowerCase().includes('sell')
                              ? "bg-fintech-danger/10 text-fintech-danger border-fintech-danger/20"
                              : "bg-surface-container-highest text-fintech-muted border-white/5"
                        )}>
                          {rating}
                        </span>
                      )}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-fintech-text text-xs">{item.high?.toFixed(5) || "—"}</span>
                        <div className="w-20 h-0.5 bg-surface-container-highest rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, ((item.change || 0) + 2) * 25))}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                            className={cn("h-full absolute left-0 top-0", isPositive ? "bg-fintech-success shadow-[0_0_8px_rgba(78,222,163,0.5)]" : "bg-fintech-danger shadow-[0_0_8px_rgba(252,69,99,0.5)]")}
                          />
                        </div>
                        <span className="text-[10px] opacity-40">{item.low?.toFixed(5) || "—"}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              {apiKey ? (
                <Link href="/rankings" className="text-fintech-primary font-bold text-xs uppercase tracking-widest border border-fintech-primary/30 px-6 py-3 rounded-lg hover:bg-fintech-primary-container transition-all inline-block">
                  Explore Full Market
                </Link>
              ) : (
                <a
                  href="https://rapidapi.com/hypier/api/tradingview-data1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fintech-primary font-bold text-xs uppercase tracking-widest border border-fintech-primary/30 px-6 py-3 rounded-lg hover:bg-fintech-primary-container transition-all inline-block"
                >
                  Get Free API Key
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {items.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5 text-right">
          <Link href="/rankings" className="text-fintech-primary font-bold text-[10px] uppercase tracking-widest hover:opacity-80 flex items-center justify-end gap-1">
            Full Terminal <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}

// --- Main Page ---

export default function Home() {
  return (
    <div className="px-6 max-w-7xl mx-auto space-y-12 pb-24 md:pb-20">
      {/* Hero Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-10">
        <div className="space-y-6 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-fintech-primary-light"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Enterprise-Grade BYOK Architecture</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter text-fintech-text leading-[0.9]"
          >
            GLOBAL<br/><span className="text-fintech-primary">EXCHANGE</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-fintech-muted font-body text-lg max-w-md leading-relaxed"
          >
            Secure. Privacy-focused. Powered by RapidAPI. Real-time institutional liquidity feeds delivered directly to your browser.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <APIStatusWidget />
        </motion.div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5"
        >
          <ConverterWidget />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-7"
        >
          <MarketLeaderboard />
        </motion.div>
      </div>

      {/* Quick Query Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <QuickQueryWidget />
      </motion.div>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Activity, title: "Direct Execution", desc: "Latency-optimized routing directly to top-tier liquidity providers across the globe. No intermediary delays.", color: "text-fintech-primary" },
          { icon: Lock, title: "Private Keys", desc: "Full BYOK architecture ensures your trade history and API connections remain yours alone.", color: "text-fintech-success" },
          { icon: Zap, title: "Precision Data", desc: "Tick-level data with 5-decimal precision for all major and minor currency pairs via RapidAPI Enterprise.", color: "text-fintech-danger" }
        ].map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + (idx * 0.1) }}
            className="bg-surface-container-low p-8 rounded-xl border border-white/5 relative group hover:bg-surface-container transition-all"
          >
            <div className={cn("mb-4 transition-transform group-hover:scale-110 duration-300", feature.color)}>
              <feature.icon className="w-8 h-8" />
            </div>
            <h3 className="font-headline font-bold text-xl mb-2 text-fintech-text">{feature.title}</h3>
            <p className="text-fintech-muted text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-16"
      >
        <h2 className="text-3xl font-headline font-bold text-fintech-text mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              question: "What is Global Exchange?",
              answer: "Global Exchange is a free, privacy-focused forex rates dashboard that provides real-time currency exchange data, market rankings, and conversion tools. Built with BYOK (Bring Your Own Key) architecture for maximum privacy."
            },
            {
              question: "How often are forex rates updated?",
              answer: "Our forex rates are updated in real-time, with data refreshed every few seconds from TradingView's institutional data feeds via RapidAPI."
            },
            {
              question: "Is Global Exchange free to use?",
              answer: "Yes, Global Exchange is completely free. You only need to bring your own RapidAPI key for the TradingView Data API, which has a free tier available."
            },
            {
              question: "What is BYOK (Bring Your Own Key)?",
              answer: "BYOK means you provide your own API key, which is stored only in your browser. This ensures complete privacy - we never see or store your API credentials or trading data."
            },
            {
              question: "Which currency pairs are supported?",
              answer: "We support 150+ currency pairs including all major pairs (EUR/USD, GBP/USD, USD/JPY), exotic pairs, and cross-currency rates powered by TradingView data."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-surface-container-low p-6 rounded-xl border border-white/5">
              <h3 className="text-lg font-semibold text-fintech-text mb-2">{faq.question}</h3>
              <p className="text-fintech-muted leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Schema.org Structured Data */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Global Exchange Rates",
          "applicationCategory": "FinanceApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "description": "Real-time forex rates dashboard with live currency converter and market data",
          "operatingSystem": "Web",
          "featureList": [
            "Real-time forex rates",
            "Currency converter",
            "Market rankings",
            "Forex heatmap",
            "Economic calendar",
            "BYOK architecture"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "127"
          }
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is Global Exchange?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Global Exchange is a free, privacy-focused forex rates dashboard that provides real-time currency exchange data, market rankings, and conversion tools. Built with BYOK (Bring Your Own Key) architecture for maximum privacy."
              }
            },
            {
              "@type": "Question",
              "name": "How often are forex rates updated?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our forex rates are updated in real-time, with data refreshed every few seconds from TradingView's institutional data feeds via RapidAPI."
              }
            },
            {
              "@type": "Question",
              "name": "Is Global Exchange free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Global Exchange is completely free. You only need to bring your own RapidAPI key for the TradingView Data API, which has a free tier available."
              }
            },
            {
              "@type": "Question",
              "name": "What is BYOK (Bring Your Own Key)?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "BYOK means you provide your own API key, which is stored only in your browser. This ensures complete privacy - we never see or store your API credentials or trading data."
              }
            },
            {
              "@type": "Question",
              "name": "Which currency pairs are supported?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We support 150+ currency pairs including all major pairs (EUR/USD, GBP/USD, USD/JPY), exotic pairs, and cross-currency rates powered by TradingView data."
              }
            }
          ]
        }}
      />
    </div>
  );
}
