"use client";

import { useTradingApi } from "@/hooks/useTradingApi";
import { useState, useMemo, Suspense } from "react";
import Image from "next/image";
import { ArrowLeftRight, Loader2, ArrowRight, LineChart } from "lucide-react";
import Link from "next/link";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

interface QuoteData {
  data?: {
    data?: {
      lp?: number;
    };
  };
}

import { getCurrencyFlagUrl } from "@/config/currencies";
import { ALL_CURRENCIES as CURRENCIES } from "@/config/currencies";

function ConverterPageContent() {
  const { apiKey } = useApiKey();
  const searchParams = useSearchParams();
  
  // 使用 lazy initialization 避免不必要的 re-render
  const [amount, setAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState(() => {
    const from = searchParams.get("from");
    return from && CURRENCIES.includes(from as string) ? from : "USD";
  });
  const [toCurrency, setToCurrency] = useState(() => {
    const to = searchParams.get("to");
    return to && CURRENCIES.includes(to as string) ? to : "EUR";
  });

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
    const lp = (quote as QuoteData)?.data?.data?.lp;
    if (lp) return lp;
    const revLp = (reverseQuote as QuoteData)?.data?.data?.lp;
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
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-3">Currency Converter</h1>
        <p className="text-fintech-muted font-medium">Live exchange rates updated in real-time from institutional feeds.</p>
      </div>

      <div className="institutional-card p-6 md:p-10 relative overflow-hidden bg-surface-container-low border border-white/5">
        <div className="absolute top-0 left-0 w-1 h-full bg-fintech-primary/20"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          
          <div className="w-full flex-1 space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-fintech-muted font-bold">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-4 text-2xl text-fintech-text outline-none focus:ring-2 focus:ring-fintech-primary/30 focus:border-fintech-primary/50 transition-all font-mono font-medium shadow-sm"
                min="0"
                step="any"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fintech-primary font-bold font-mono">
                {fromCurrency}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center gap-2 pt-6">
            <button
              onClick={swapCurrencies}
              className="p-3 bg-fintech-primary-container hover:bg-fintech-surface-hover rounded-full border border-white/10 text-fintech-primary transition-all transform hover:scale-110 active:scale-95 shadow-lg"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex-1 space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-fintech-muted font-bold">Currencies</label>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Image
                    src={getCurrencyFlagUrl(fromCurrency)}
                    alt={fromCurrency}
                    width={24}
                    height={24}
                    unoptimized
                    className="w-6 h-6 rounded-full object-cover bg-surface-container shadow-sm border border-white/10"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl pl-14 pr-4 py-4 text-lg text-fintech-text outline-none focus:ring-2 focus:ring-fintech-primary/30 focus:border-fintech-primary/50 text-left font-mono font-semibold shadow-sm cursor-pointer appearance-none"
                >
                  {CURRENCIES.map(c => <option key={c} value={c} className="bg-surface-container-low text-fintech-text">{c}</option>)}
                </select>
              </div>
              <ArrowRight className="w-4 h-4 text-fintech-muted shrink-0" />
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Image
                    src={getCurrencyFlagUrl(toCurrency)}
                    alt={toCurrency}
                    width={24}
                    height={24}
                    unoptimized
                    className="w-6 h-6 rounded-full object-cover bg-surface-container shadow-sm border border-white/10"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl pl-14 pr-4 py-4 text-lg text-fintech-text outline-none focus:ring-2 focus:ring-fintech-primary/30 focus:border-fintech-primary/50 text-left font-mono font-semibold shadow-sm cursor-pointer appearance-none"
                >
                  {CURRENCIES.map(c => <option key={c} value={c} className="bg-surface-container-low text-fintech-text">{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href={`/pair/${encodeURIComponent(`FX_IDC:${fromCurrency}${toCurrency}`)}`}
            className="flex items-center gap-2 px-4 py-2 bg-fintech-primary/10 hover:bg-fintech-primary/20 rounded-lg text-fintech-primary text-sm font-medium transition-all"
          >
            <LineChart className="w-4 h-4" />
            View Technical Analysis
          </Link>
        </div>

        <div className="mt-10 p-8 rounded-xl bg-surface-container border border-white/5 flex flex-col items-center justify-center min-h-[160px] shadow-inner relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-fintech-muted"
              >
                <Loader2 className="w-8 h-8 text-fintech-primary animate-spin mb-3" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Fetching live quote...</span>
              </motion.div>
            ) : rate ? (
              <motion.div
                key={`${amount}-${rate}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-full"
              >
                <div className="text-[10px] text-fintech-muted mb-4 font-mono font-bold tracking-widest uppercase">
                  1 {fromCurrency} = <span className="text-fintech-primary">{rate.toFixed(6)}</span> {toCurrency}
                </div>
                <div className="text-5xl md:text-6xl font-headline font-extrabold text-fintech-success glow-emerald tracking-tighter break-all leading-none">
                  {convertedAmount !== null ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(convertedAmount) : "0.00"} 
                  <span className="text-xl text-fintech-muted ml-2 font-body font-normal tracking-normal">{toCurrency}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-fintech-muted text-center max-w-sm font-bold text-[10px] uppercase tracking-widest leading-relaxed"
              >
                {!apiKey 
                  ? "API connection required to access institutional liquidity feeds."
                  : "Enter valid 3-letter currency codes to initialize terminal."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ConverterPageFallback() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-3">Currency Converter</h1>
        <p className="text-fintech-muted font-medium">Live exchange rates updated in real-time from institutional feeds.</p>
      </div>

      <div className="institutional-card p-6 md:p-10 relative overflow-hidden bg-surface-container-low border border-white/5 min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center text-fintech-muted">
          <Loader2 className="w-8 h-8 text-fintech-primary animate-spin mb-3" />
          <span className="text-[10px] font-bold tracking-widest uppercase">Initializing converter...</span>
        </div>
      </div>
    </div>
  );
}

export default function ConverterPage() {
  return (
    <Suspense fallback={<ConverterPageFallback />}>
      <ConverterPageContent />
    </Suspense>
  );
}
