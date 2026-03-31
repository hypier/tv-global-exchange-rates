"use client";

import { useTradingApi } from "@/hooks/useTradingApi";
import { Loader2, ExternalLink, Calendar, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface RelatedSymbol {
  symbol?: string;
  "currency-logoid"?: string;
  "base-currency-logoid"?: string;
}

interface NewsItem {
  id?: string;
  title?: string;
  headline?: string;
  link?: string;
  url?: string;
  source?: string | { name?: unknown; id?: unknown; logo_id?: unknown };
  provider?: string;
  abstract?: unknown;
  summary?: unknown;
  published?: number | string;
  time?: number | string;
  relatedSymbols?: RelatedSymbol[];
}

interface NewsResponse {
  data?: {
    items?: NewsItem[];
    data?: NewsItem[];
  } | NewsItem[];
}

interface NewsDetailData {
  id?: string;
  title?: unknown;
  content?: string;
  shortDescription?: unknown;
  astDescription?: {
    type?: string;
    children?: Array<{
      type?: string;
      children?: unknown[];
    }>;
  };
  published?: number;
  source?: string | { name?: unknown; id?: unknown; logo_id?: unknown };
  provider?: string | { name?: unknown; id?: unknown; logo_id?: unknown };
  link?: string;
  storyPath?: string;
  relatedSymbols?: RelatedSymbol[];
}

interface NewsDetailResponse {
  data?: NewsDetailData;
}

function normalizeDisplayText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value || fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nestedName = record.name;
    const nestedId = record.id;

    if (typeof nestedName === "string" && nestedName) {
      return nestedName;
    }

    if (typeof nestedId === "string" && nestedId) {
      return nestedId;
    }
  }

  return fallback;
}

function normalizeSourceText(value: unknown, fallback = "Unknown"): string {
  return normalizeDisplayText(value, fallback);
}

function normalizeOptionalText(value: unknown): string {
  return normalizeDisplayText(value, "");
}

function extractAstText(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const children = Array.isArray(record.children) ? record.children : [];

  return children
    .map((child) => {
      if (!child || typeof child !== "object") {
        return "";
      }

      const childRecord = child as Record<string, unknown>;
      const nestedChildren = Array.isArray(childRecord.children) ? childRecord.children : [];

      return nestedChildren
        .map((node) => normalizeDisplayText(node))
        .filter(Boolean)
        .join("");
    })
    .filter(Boolean);
}

function getRelatedSymbolParts(value: string | undefined) {
  const rawSymbol = value || "";
  const [exchange = "", tickerPart = ""] = rawSymbol.includes(":")
    ? rawSymbol.split(":", 2)
    : ["", rawSymbol];
  const normalizedTicker = tickerPart.toUpperCase();
  const corePairMatch = normalizedTicker.match(/^[A-Z]{6}/);
  const corePair = corePairMatch?.[0] || normalizedTicker.replace(/[_\W].*$/, "") || normalizedTicker;

  return {
    rawSymbol,
    exchange,
    ticker: tickerPart,
    corePair,
  };
}

function getRelatedSymbolPriority(exchange: string): number {
  switch (exchange) {
    case "FX":
      return 0;
    case "FX_IDC":
      return 1;
    case "OANDA":
      return 2;
    case "PYTH":
      return 3;
    default:
      return 10;
  }
}

function getUniqueRelatedSymbols(symbols: RelatedSymbol[] | undefined, limit = 3): RelatedSymbol[] {
  const grouped = new Map<string, RelatedSymbol>();

  for (const symbol of symbols || []) {
    const { corePair, exchange } = getRelatedSymbolParts(symbol.symbol);
    if (!corePair) {
      continue;
    }

    const existing = grouped.get(corePair);
    if (!existing) {
      grouped.set(corePair, symbol);
      continue;
    }

    const existingExchange = getRelatedSymbolParts(existing.symbol).exchange;
    if (getRelatedSymbolPriority(exchange) < getRelatedSymbolPriority(existingExchange)) {
      grouped.set(corePair, symbol);
    }
  }

  return Array.from(grouped.values()).slice(0, limit);
}

function RelatedSymbolChips({ symbols, compact = false }: { symbols: RelatedSymbol[]; compact?: boolean }) {
  if (symbols.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-4" : "mt-3"}`}>
      {symbols.map((symbol, index) => {
        const { rawSymbol, ticker, exchange, corePair } = getRelatedSymbolParts(symbol.symbol);
        const pairPath = corePair || ticker.replace(/_.*$/, "");
        const baseLogo = symbol["base-currency-logoid"];
        const quoteLogo = symbol["currency-logoid"];
        const href = exchange && ticker ? `/pair/${encodeURIComponent(`${exchange}:${ticker}`)}` : undefined;

        const content = (
          <>
            <span className="relative flex items-center shrink-0">
              {baseLogo && (
                <Image
                  src={`https://s3-symbol-logo.tradingview.com/${baseLogo}.svg`}
                  width={compact ? 14 : 16}
                  height={compact ? 14 : 16}
                  unoptimized
                  className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} rounded-full border border-white/10 object-cover`}
                  alt=""
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              {quoteLogo && (
                <Image
                  src={`https://s3-symbol-logo.tradingview.com/${quoteLogo}.svg`}
                  width={compact ? 14 : 16}
                  height={compact ? 14 : 16}
                  unoptimized
                  className={`${compact ? "w-3.5 h-3.5 -ml-1" : "w-4 h-4 -ml-1"} rounded-full border border-white/10 object-cover`}
                  alt=""
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </span>
            <span className={`${compact ? "text-[9px]" : "text-[10px]"} font-bold text-fintech-muted`}>{pairPath}</span>
          </>
        );

        if (!href) {
          return (
            <span
              key={`${rawSymbol || "symbol"}-${index}`}
              className="flex items-center gap-1 bg-surface-container hover:bg-white/5 px-2 py-1 rounded-full border border-white/5"
            >
              {content}
            </span>
          );
        }

        return (
          <Link
            key={`${rawSymbol || "symbol"}-${index}`}
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-surface-container hover:bg-white/5 px-2 py-1 rounded-full border border-white/5 hover:border-fintech-primary/30 transition-colors"
            title={rawSymbol}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

function NewsDetailModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const { apiKey } = useApiKey();
  const { data, isLoading } = useTradingApi<NewsDetailResponse>(
    `/api/news/${encodeURIComponent(item.id!)}`,
    {},
    !!apiKey && !!item.id
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

  const title = normalizeDisplayText(detail?.title) || normalizeDisplayText(item.title) || normalizeDisplayText(item.headline) || "Untitled";
  const link = detail?.link || detail?.storyPath || item.link || item.url;
  const source = normalizeSourceText(detail?.provider, "") || normalizeSourceText(detail?.source, "") || normalizeSourceText(item.source, "") || normalizeSourceText(item.provider, "Unknown");
  const published = detail?.published || item.published || item.time;
  const astParagraphs = extractAstText(detail?.astDescription);
  const fallbackParagraph = normalizeOptionalText(detail?.shortDescription);
  const relatedSymbols = getUniqueRelatedSymbols(detail?.relatedSymbols || item.relatedSymbols, 6);
  const dateStr = published
    ? new Date(Number(published) * (Number(published) < 10000000000 ? 1000 : 1))
        .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
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
            {source && (
              <span className="inline-flex items-center rounded-md bg-fintech-primary-container px-2.5 py-1 text-[10px] font-black text-fintech-primary border border-fintech-primary/20 uppercase tracking-widest mb-2">
                {source}
              </span>
            )}
            <h2 className="text-lg font-headline font-bold text-fintech-text leading-tight">{title}</h2>
            {dateStr && (
              <p className="text-[10px] text-fintech-muted font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />{dateStr}
              </p>
            )}
            {relatedSymbols.length > 0 && <RelatedSymbolChips symbols={relatedSymbols} />}
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
          ) : astParagraphs.length > 0 ? (
            <div className="space-y-3 text-fintech-muted text-sm leading-relaxed">
              {astParagraphs.map((paragraph, index) => (
                <p key={`${detail?.id || item.id || "news"}-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : fallbackParagraph ? (
            <p className="text-fintech-muted text-sm leading-relaxed">{fallbackParagraph}</p>
          ) : (
            <p className="text-fintech-muted text-sm text-center py-8">No content available.</p>
          )}
        </div>

        {/* Footer */}
        {link && (
          <div className="p-4 border-t border-white/5">
            <a
              href={link}
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
  );
}

export default function NewsPage() {
  const { apiKey } = useApiKey();
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const { data, isLoading, error } = useTradingApi("/api/news", { market: "forex" }, !!apiKey);

  const items = useMemo(() => {
    const response = data as NewsResponse;
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    return response.data?.data || response.data?.items || [];
  }, [data]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-2">Global Forex News</h1>
          <p className="text-fintech-muted font-medium">Real-time market updates and institutional economic events.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fintech-primary-container border border-fintech-primary/20 text-fintech-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-fintech-primary"></div>
          Live Intelligence Feed
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-10 h-10 text-fintech-primary animate-spin" />
          <p className="text-fintech-muted text-[10px] font-bold uppercase tracking-[0.2em]">Intercepting Data Stream...</p>
        </div>
      )}

      {error && (
        <div className="institutional-card bg-fintech-danger/5 border-fintech-danger/10 p-12 rounded-xl text-center flex flex-col items-center shadow-lg">
          <div className="w-16 h-16 bg-fintech-danger/10 rounded-full flex items-center justify-center mb-6 border border-fintech-danger/20">
            <AlertCircle className="w-8 h-8 text-fintech-danger" />
          </div>
          <p className="text-2xl text-fintech-text mb-3 font-headline font-extrabold">Intelligence Feed Offline</p>
          <p className="text-fintech-muted max-w-md text-sm leading-relaxed">
            There was a problem retrieving news data. Please verify your RapidAPI credentials and connection status.
          </p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item: NewsItem, i: number) => {
            const title = normalizeDisplayText(item.title) || normalizeDisplayText(item.headline) || "Untitled update";
            const source = normalizeSourceText(item.source, "") || normalizeSourceText(item.provider, "TradingView");
            const abstract = normalizeOptionalText(item.abstract) || normalizeOptionalText(item.summary);
            const published = item.published || item.time || 0;
            const relatedSymbols = getUniqueRelatedSymbols(item.relatedSymbols, 3);

            const dateStr = published
              ? typeof published === "number"
                ? new Date(Number(published) * (Number(published) < 10000000000 ? 1000 : 1)).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
                : new Date(published).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : "Recent";

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={item.id || i}
                onClick={() => item.id && setSelectedItem(item)}
                className="group flex flex-col justify-between h-full bg-surface-container-low border border-white/5 rounded-xl p-8 hover:bg-surface-container hover:border-fintech-primary/30 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="inline-flex items-center rounded-md bg-fintech-primary-container px-3 py-1 text-[10px] font-black text-fintech-primary border border-fintech-primary/20 uppercase tracking-widest">
                      {source}
                    </span>
                    <ExternalLink className="w-4 h-4 text-fintech-muted group-hover:text-fintech-primary transition-colors" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-fintech-text mb-4 line-clamp-3 group-hover:text-fintech-primary transition-colors leading-tight">
                    {title}
                  </h3>
                  {abstract && (
                    <p className="text-sm text-fintech-muted line-clamp-4 mb-6 leading-relaxed font-medium">
                      {abstract}
                    </p>
                  )}
                  {relatedSymbols.length > 0 && <RelatedSymbolChips symbols={relatedSymbols} compact />}
                </div>

                <div className="flex items-center justify-between text-[10px] text-fintech-muted pt-6 border-t border-white/5 mt-auto font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateStr}
                  </span>
                  <span className="text-fintech-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">Read &rarr;</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl bg-surface-container-low/50">
          <p className="text-fintech-muted font-black text-[10px] uppercase tracking-[0.3em]">
            {apiKey ? "No recent forex intelligence found in this sector." : "API Authentication Required"}
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem?.id && (
          <NewsDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
