"use client";

import { useTradingApi } from "@/hooks/useTradingApi";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { useParams } from "next/navigation";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, UTCTimestamp } from "lightweight-charts";
import { Loader2, TrendingUp, TrendingDown, ArrowLeftRight, X, ExternalLink, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface QuoteData {
  lp?: number;
  chp?: number;
  ch?: number;
  high_price?: number;
  low_price?: number;
  open_price?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  name?: string;
  description?: string;
  exchange?: string;
  currency_code?: string;
  prev_close_price?: number;
  price_52_week_high?: number;
  price_52_week_low?: number;
  average_volume?: number;
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
}

interface QuoteResponse {
  data?: { data?: QuoteData };
}

interface ApiCandle {
  time: number;
  open: number;
  close: number;
  max: number;
  min: number;
  volume?: number;
}

interface PriceResponse {
  data?: {
    symbol?: string;
    current?: ApiCandle;
    history?: ApiCandle[];
    info?: Record<string, unknown>;
  };
}

interface TaTimeframeData {
  Other?: number; // oscillators score
  All?: number;   // overall score
  MA?: number;    // moving averages score
}

interface TaResponse {
  data?: Record<string, TaTimeframeData>;
}

interface TaIndicatorsData {
  RSI?: number;
  "MACD.macd"?: number;
  "MACD.signal"?: number;
  "Stoch.K"?: number;
  "Stoch.D"?: number;
  ADX?: number;
  EMA20?: number;
  EMA50?: number;
  SMA20?: number;
  SMA50?: number;
  "BB.upper"?: number;
  "BB.lower"?: number;
  [key: string]: number | undefined;
}

interface TaIndicatorsResponse {
  data?: TaIndicatorsData;
}

interface IdeaItem {
  id?: number;
  name?: string;
  description?: string;
  chart_url?: string;
  user?: { username?: string; picture_url?: string };
  likes_count?: number;
  is_hot?: boolean;
}

interface IdeasResponse {
  data?: IdeaItem[];
}

interface RelatedSymbol {
  symbol?: string;
  "currency-logoid"?: string;
  "base-currency-logoid"?: string;
}

interface PairNewsItem {
  id?: string;
  title?: string;
  headline?: string;
  link?: string;
  url?: string;
  source?: string | { name?: string };
  published?: number;
  time?: number;
  relatedSymbols?: RelatedSymbol[];
}

interface PairNewsResponse {
  data?: { items?: PairNewsItem[]; data?: PairNewsItem[] };
}

interface NewsDetailData {
  id?: string;
  title?: string;
  content?: string;
  published?: number;
  source?: string;
  link?: string;
}

interface NewsDetailResponse {
  data?: NewsDetailData;
}

interface IdeaDetailData {
  id?: number;
  name?: string;
  description?: string;
  chart_url?: string;
  user?: { username?: string; picture_url?: string };
  likes_count?: number;
  comment_count?: number;
  is_hot?: boolean;
  agree_count?: number;
  disagree_count?: number;
  published?: number;
  symbol?: string;
}

interface IdeaDetailResponse {
  data?: IdeaDetailData;
}

function NewsDetailModal({ newsId, onClose }: { newsId: string; onClose: () => void }) {
  const { apiKey } = useApiKey();
  const { data, isLoading } = useTradingApi<NewsDetailResponse>(
    `/api/news/${encodeURIComponent(newsId)}`,
    {},
    !!apiKey && !!newsId
  );
  const detail = data?.data;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const dateStr = detail?.published
    ? new Date(Number(detail.published) * (Number(detail.published) < 10000000000 ? 1000 : 1))
        .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-surface-container-low border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-white/5">
            <div className="flex-1 min-w-0">
              {detail?.source && (
                <span className="inline-flex items-center rounded-md bg-fintech-primary-container px-2.5 py-1 text-[10px] font-black text-fintech-primary border border-fintech-primary/20 uppercase tracking-widest mb-2">
                  {detail.source}
                </span>
              )}
              <h2 className="text-lg font-headline font-bold text-fintech-text leading-tight">
                {detail?.title || "Loading..."}
              </h2>
              {dateStr && (
                <p className="text-[10px] text-fintech-muted font-bold uppercase tracking-widest mt-1">{dateStr}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-fintech-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-fintech-primary animate-spin" />
              </div>
            ) : detail?.content ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-fintech-muted leading-relaxed [&_p]:mb-3 [&_a]:text-fintech-primary [&_a]:no-underline [&_a:hover]:underline"
                dangerouslySetInnerHTML={{ __html: detail.content }}
              />
            ) : (
              <p className="text-fintech-muted text-sm text-center py-8">No content available.</p>
            )}
          </div>

          {/* Footer */}
          {detail?.link && (
            <div className="p-4 border-t border-white/5">
              <a
                href={detail.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-fintech-primary text-fintech-primary-container px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Read Full Article
              </a>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function IdeaDetailModal({ idea, imageUrl, onClose }: { idea: IdeaItem; imageUrl: string; onClose: () => void }) {
  const { apiKey } = useApiKey();
  const { data, isLoading } = useTradingApi<IdeaDetailResponse>(
    `/api/ideas/${encodeURIComponent(imageUrl)}`,
    {},
    !!apiKey && !!imageUrl
  );
  const detail = data?.data;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const chartUrl = detail?.chart_url || idea.chart_url;
  const name = detail?.name || idea.name || "Untitled Idea";
  const description = detail?.description || idea.description;
  const username = detail?.user?.username || idea.user?.username || "analyst";
  const likesCount = detail?.likes_count ?? idea.likes_count ?? 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-surface-container-low border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-white/5">
            <div className="flex-1 min-w-0">
              {idea.is_hot && (
                <span className="inline-flex items-center rounded-md bg-fintech-danger/10 px-2.5 py-1 text-[10px] font-black text-fintech-danger border border-fintech-danger/20 uppercase tracking-widest mb-2">
                  🔥 Hot
                </span>
              )}
              <h2 className="text-lg font-headline font-bold text-fintech-text leading-tight">{name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-fintech-muted font-bold uppercase tracking-widest">
                  <User className="w-3 h-3" />@{username}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-fintech-success font-bold uppercase tracking-widest">
                  <Heart className="w-3 h-3" />
                  {likesCount}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-fintech-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-fintech-primary animate-spin" />
              </div>
            ) : (
              <>
                {chartUrl && (
                  <div className="border-b border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chartUrl}
                      alt={name}
                      className="w-full object-contain max-h-72"
                    />
                  </div>
                )}
                {description && (
                  <div className="p-6">
                    <p className="text-sm text-fintech-muted leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CandlestickChart({ symbol }: { symbol: string }) {
  const { apiKey } = useApiKey();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null);

  const { data, isLoading } = useTradingApi<PriceResponse>(
    `/api/price/${symbol}`,
    { timeframe: "60", range: "100" },
    !!apiKey
  );

  const candles = useMemo(() => {
    const history = data?.data?.history;
    if (!Array.isArray(history)) return [];
    return history.map(c => ({
      time: c.time,
      open: c.open,
      high: c.max,
      low: c.min,
      close: c.close,
    }));
  }, [data]);

  // Initialize chart when data is available (container is in DOM at this point)
  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#131b2e" },
          textColor: "#c4c6ce",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
        timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: true },
        width: chartContainerRef.current.clientWidth,
        height: 288,
      });

      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: "#4edea3",
        downColor: "#fc4563",
        borderUpColor: "#4edea3",
        borderDownColor: "#fc4563",
        wickUpColor: "#4edea3",
        wickDownColor: "#fc4563",
      });

      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);
    }

    const sorted = [...candles].sort((a, b) => a.time - b.time);
    seriesRef.current?.setData(
      sorted.map(c => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-surface-container-low rounded-xl border border-white/5">
        <Loader2 className="w-8 h-8 text-fintech-primary animate-spin" />
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-surface-container-low rounded-xl border border-white/5 gap-3">
        <TrendingUp className="w-8 h-8 text-fintech-muted" />
        <span className="text-[10px] text-fintech-muted uppercase font-bold tracking-widest">No Chart Data</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-4">
      <div className="text-[10px] font-bold text-fintech-muted uppercase tracking-widest mb-3">
        Price Chart — Hourly (60m) • {candles.length} candles
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}

export default function PairPage() {
  const { apiKey } = useApiKey();
  const params = useParams();
  const [selectedNews, setSelectedNews] = useState<PairNewsItem | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(null);
  const rawSymbol = decodeURIComponent(params.symbol as string);
  const symbol = rawSymbol.includes(":") ? rawSymbol : `FX_IDC:${rawSymbol}`;
  const displaySymbol = symbol.split(":").pop() || symbol;

  const { data: quoteData, isLoading: quoteLoading } = useTradingApi<QuoteResponse>(
    `/api/quote/${symbol}`,
    {},
    !!apiKey
  );

  const { data: taData, isLoading: taLoading } = useTradingApi<TaResponse>(
    `/api/ta/${symbol}`,
    {},
    !!apiKey
  );

  const { data: taIndicatorsData } = useTradingApi<TaIndicatorsResponse>(
    `/api/ta/${symbol}/indicators`,
    {},
    !!apiKey
  );

  const { data: ideasData } = useTradingApi<IdeasResponse>(
    `/api/ideas/list/${symbol}`,
    { page: 1 },
    !!apiKey
  );

  const { data: pairNewsData } = useTradingApi<PairNewsResponse>(
    `/api/news`,
    { market: "forex", symbol },
    !!apiKey
  );

  const quote = useMemo(() => quoteData?.data?.data, [quoteData]);
  const ta = useMemo(() => taData?.data, [taData]);
  const taIndicators = useMemo(() => taIndicatorsData?.data, [taIndicatorsData]);
  const ideas = useMemo(() => ideasData?.data || [], [ideasData]);
  const pairNews = useMemo(() => pairNewsData?.data?.data || pairNewsData?.data?.items || [], [pairNewsData]);

  const isPositive = (quote?.chp || 0) >= 0;
  const baseCurrency = displaySymbol.slice(0, 3);
  const quoteCurrency = displaySymbol.slice(3, 6);

  const scoreToSignal = (score?: number): string => {
    if (score === undefined) return "N/A";
    if (score >= 1.5) return "STRONG BUY";
    if (score >= 0.5) return "BUY";
    if (score > -0.5) return "NEUTRAL";
    if (score > -1.5) return "SELL";
    return "STRONG SELL";
  };

  const signalColor = (signal?: string) => {
    if (!signal) return "text-fintech-muted border-white/10";
    const s = signal.toLowerCase();
    if (s.includes("buy")) return "text-fintech-success border-fintech-success/20 bg-fintech-success/10";
    if (s.includes("sell")) return "text-fintech-danger border-fintech-danger/20 bg-fintech-danger/10";
    return "text-fintech-muted border-white/10 bg-surface-container";
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Image
              src={`https://tv-logo.tradingviewapi.com/logo/country/${baseCurrency.slice(0, 2)}.svg`}
              width={28}
              height={28}
              unoptimized
              className="w-7 h-7 rounded-full object-cover border border-white/10"
              onError={(e) => (e.currentTarget.style.display = "none")}
              alt={baseCurrency}
            />
            <Image
              src={`https://tv-logo.tradingviewapi.com/logo/country/${quoteCurrency.slice(0, 2)}.svg`}
              width={28}
              height={28}
              unoptimized
              className="w-7 h-7 rounded-full object-cover border border-white/10 -ml-3"
              onError={(e) => (e.currentTarget.style.display = "none")}
              alt={quoteCurrency}
            />
            <h1 className="text-4xl font-headline font-extrabold text-fintech-text">
              {baseCurrency} / {quoteCurrency}
            </h1>
          </div>
          <p className="text-fintech-muted text-sm">{quote?.name || quote?.description || "Spot Rate"}</p>
        </div>

        {quoteLoading ? (
          <Loader2 className="w-6 h-6 text-fintech-primary animate-spin" />
        ) : quote ? (
          <div className="text-right">
            <div className="text-4xl font-headline font-extrabold text-fintech-text font-mono">
              {quote.lp?.toFixed(5) ?? "—"}
              <span className="text-lg text-fintech-muted/60 ml-2">{quote?.currency_code || ""}</span>
            </div>
            <div className={cn("text-sm font-bold flex items-center justify-end gap-1", isPositive ? "text-fintech-success" : "text-fintech-danger")}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? "+" : ""}{quote.chp != null ? quote.chp.toFixed(2) : "—"}%
            </div>
          </div>
        ) : null}
      </div>

      {/* Chart */}
      <CandlestickChart symbol={symbol} />

      {/* Quote Stats */}
      {quote && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open", value: quote.open_price?.toFixed(5) },
            { label: "High", value: quote.high_price?.toFixed(5) },
            { label: "Low", value: quote.low_price?.toFixed(5) },
            { label: "Prev Close", value: quote.prev_close_price?.toFixed(5) },
            { label: "Bid / Ask", value: quote.bid && quote.ask ? `${quote.bid.toFixed(5)} / ${quote.ask.toFixed(5)}` : "—" },
            { label: "Volume", value: quote.volume?.toFixed(1) },
            { label: "Avg Vol", value: quote.average_volume?.toFixed(1) },
            { label: "52W Range", value: quote.price_52_week_low && quote.price_52_week_high ? `${quote.price_52_week_low.toFixed(2)}-${quote.price_52_week_high.toFixed(2)}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-low rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-fintech-muted uppercase tracking-widest font-bold mb-1">{label}</div>
              <div className="font-mono font-bold text-fintech-text">{value ?? "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* TA Summary */}
      {!taLoading && ta?.["1D"] && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-6">Technical Analysis (Daily)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Summary", score: ta["1D"].All },
              { label: "Oscillators", score: ta["1D"].Other },
              { label: "Moving Averages", score: ta["1D"].MA },
            ].map(({ label, score }) => {
              const signal = scoreToSignal(score);
              return (
                <div key={label} className="bg-surface-container rounded-xl p-4 border border-white/5 text-center">
                  <div className="text-[10px] text-fintech-muted uppercase tracking-widest font-bold mb-3">{label}</div>
                  <div className={cn("text-lg font-black uppercase tracking-widest px-3 py-1 rounded border inline-block", signalColor(signal))}>
                    {signal}
                  </div>
                  <div className="mt-4 text-xs font-bold text-fintech-muted">
                    Score: {score?.toFixed(3) ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TA Indicators */}
      {taIndicators && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-6">Technical Indicators</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "RSI (14)", value: taIndicators.RSI?.toFixed(2), warn: taIndicators.RSI !== undefined && (taIndicators.RSI > 70 || taIndicators.RSI < 30) },
              { label: "MACD", value: taIndicators["MACD.macd"]?.toFixed(5), warn: false },
              { label: "Stoch K/D", value: taIndicators["Stoch.K"] !== undefined ? `${taIndicators["Stoch.K"].toFixed(1)} / ${taIndicators["Stoch.D"]?.toFixed(1) ?? "—"}` : undefined, warn: false },
              { label: "ADX", value: taIndicators.ADX?.toFixed(2), warn: false },
              { label: "EMA 20", value: taIndicators.EMA20?.toFixed(5), warn: false },
              { label: "EMA 50", value: taIndicators.EMA50?.toFixed(5), warn: false },
              { label: "BB Upper", value: taIndicators["BB.upper"]?.toFixed(5), warn: false },
              { label: "BB Lower", value: taIndicators["BB.lower"]?.toFixed(5), warn: false },
            ].filter(i => i.value !== undefined).map(({ label, value, warn }) => (
              <div key={label} className="bg-surface-container rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-fintech-muted uppercase tracking-widest font-bold mb-1">{label}</div>
                <div className={cn("font-mono font-bold text-sm", warn ? "text-fintech-danger" : "text-fintech-text")}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trading Ideas */}
      {ideas.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-6">Trading Ideas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.slice(0, 4).map((idea, i) => (
              <motion.div
                key={idea.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedIdea(idea)}
                className="bg-surface-container rounded-xl p-4 border border-white/5 hover:border-fintech-primary/20 transition-colors cursor-pointer"
              >
                <div className="text-sm font-bold text-fintech-text line-clamp-2 mb-2">
                  {idea.name || "Untitled Idea"}
                </div>
                {idea.description && (
                  <p className="text-xs text-fintech-muted line-clamp-2 mb-3">{idea.description}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-fintech-muted font-bold uppercase tracking-wider">
                  <span>@{idea.user?.username || "analyst"}</span>
                  <span className="text-fintech-success">▲ {idea.likes_count ?? 0}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Related News */}
      {pairNews.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-6">Related News</h2>
          <div className="space-y-3">
            {pairNews.slice(0, 5).map((item, i) => {
              const title = item.title || item.headline || "Untitled";
              const link = item.link || item.url || "#";
              const source = typeof item.source === "object" ? item.source?.name : item.source;
              const published = item.published || item.time;
              const dateStr = published
                ? new Date(Number(published) * (Number(published) < 10000000000 ? 1000 : 1)).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "";
              // Dedupe relatedSymbols by short ticker (part after ":")
              const uniqueSymbols = (item.relatedSymbols || []).filter(
                (s, idx, arr) => {
                  const ticker = s.symbol?.split(":")[1];
                  return ticker && arr.findIndex(x => x.symbol?.split(":")[1] === ticker) === idx;
                }
              ).slice(0, 3);

              return (
                <div
                  key={item.id || i}
                  onClick={() => item.id && setSelectedNews(item)}
                  className={cn(
                    "flex items-start gap-4 p-3 rounded-lg hover:bg-surface-container transition-colors group border border-transparent hover:border-white/5",
                    item.id && "cursor-pointer"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-bold text-fintech-text hover:text-fintech-primary transition-colors line-clamp-2 mb-2 block"
                    >{title}</a>
                    <div className="flex items-center gap-3 flex-wrap">
                      {uniqueSymbols.map((s, si) => {
                        const ticker = s.symbol?.split(":")[1] || s.symbol || "";
                        const exchange = s.symbol?.split(":")[0] || "";
                        const pairPath = ticker.replace(/_.*$/, ""); // strip suffixes like _LMAX
                        const baseLogo = s["base-currency-logoid"];
                        const quoteLogo = s["currency-logoid"];
                        return (
                          <Link
                            key={si}
                            href={`/pair/${encodeURIComponent(`${exchange}:${ticker}`)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-surface-container hover:bg-white/5 px-2 py-1 rounded-full border border-white/5 hover:border-fintech-primary/30 transition-colors"
                            title={`${exchange}:${ticker}`}
                          >
                            <span className="relative flex items-center shrink-0">
                              {baseLogo && (
                                <Image
                                  src={`https://s3-symbol-logo.tradingview.com/${baseLogo}.svg`}
                                  width={14}
                                  height={14}
                                  unoptimized
                                  className="w-3.5 h-3.5 rounded-full border border-white/10 object-cover"
                                  alt=""
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                              {quoteLogo && (
                                <Image
                                  src={`https://s3-symbol-logo.tradingview.com/${quoteLogo}.svg`}
                                  width={14}
                                  height={14}
                                  unoptimized
                                  className="w-3.5 h-3.5 rounded-full border border-white/10 object-cover -ml-1"
                                  alt=""
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                            </span>
                            <span className="text-[9px] font-bold text-fintech-muted">{pairPath}</span>
                          </Link>
                        );
                      })}
                      {(source || dateStr) && (
                        <span className="text-[10px] text-fintech-muted/60 font-medium ml-auto shrink-0">
                          {source && <span>{source}</span>}
                          {source && dateStr && <span className="mx-1">·</span>}
                          {dateStr && <span>{dateStr}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Converter Link */}
      <div className="flex justify-center">
        <Link
          href={`/converter?from=${baseCurrency}&to=${quoteCurrency}`}
          className="flex items-center gap-2 bg-fintech-primary text-fintech-primary-container px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Convert {baseCurrency} → {quoteCurrency}
        </Link>
      </div>

      {/* News Detail Modal */}
      {selectedNews?.id && (
        <NewsDetailModal
          newsId={selectedNews.id}
          onClose={() => setSelectedNews(null)}
        />
      )}

      {/* Idea Detail Modal */}
      {selectedIdea && (() => {
        const chartUrl = selectedIdea.chart_url || "";
        const match = chartUrl.match(/\/([^/]+)\.(png|jpg|svg)$/i);
        const imageUrl = match ? match[1] : chartUrl;
        return imageUrl ? (
          <IdeaDetailModal
            idea={selectedIdea}
            imageUrl={imageUrl}
            onClose={() => setSelectedIdea(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
