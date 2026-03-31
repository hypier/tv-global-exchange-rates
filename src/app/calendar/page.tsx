"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { useTradingApi } from "@/hooks/useTradingApi";
import { useState, useMemo } from "react";
import Image from "next/image";
import { Loader2, AlertCircle, CalendarDays, Filter, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface EconomicEvent {
  id?: string;
  title?: string;
  country?: string;
  currency?: string;
  date?: number;
  period?: string;
  importance?: number;
  actual?: string;
  forecast?: string;
  previous?: string;
  comment?: string;
  source?: string;
  source_url?: string;
  ticker?: string;
  unit?: string;
  category?: string;
  indicator?: string;
}

interface CalendarResponse {
  data?: { result?: EconomicEvent[]; events?: EconomicEvent[] } | EconomicEvent[];
}

const IMPORTANCE_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };
const IMPORTANCE_COLOR: Record<number, string> = {
  1: "text-fintech-muted border-white/10 bg-surface-container",
  2: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
  3: "text-fintech-danger border-fintech-danger/20 bg-fintech-danger/10",
};

const FOREX_COUNTRIES = ["US", "EU", "GB", "JP", "AU", "CA", "CH", "CN", "NZ"];

export default function CalendarPage() {
  const { apiKey } = useApiKey();
  const [importanceFilter, setImportanceFilter] = useState<number | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const now = useMemo(() => Math.floor(new Date().getTime() / 1000), []);
  const sevenDaysLater = useMemo(() => now + 7 * 24 * 60 * 60, [now]);

  const { data, isLoading, error } = useTradingApi<CalendarResponse>(
    "/api/calendar/economic",
    { from: now, to: sevenDaysLater },
    !!apiKey
  );

  const events = useMemo(() => {
    const raw = data as CalendarResponse;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as EconomicEvent[];
    if (raw.data && Array.isArray(raw.data)) return raw.data as EconomicEvent[];
    return raw.data?.result || raw.data?.events || [];
  }, [data]);

  const filtered = useMemo(() => {
    return events
      .filter(e => importanceFilter === null || e.importance === importanceFilter)
      .filter(e => countryFilter === null || e.country === countryFilter || e.currency === countryFilter)
      .sort((a, b) => (a.date || 0) - (b.date || 0));
  }, [events, importanceFilter, countryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    filtered.forEach(event => {
      const dateKey = event.date
        ? new Date(String(event.date)).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
        : "Unknown Date";
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [filtered]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-2">Economic Calendar</h1>
          <p className="text-fintech-muted font-medium">High-impact events driving global currency movements — next 7 days.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fintech-primary animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-fintech-primary"></div>
          Live
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-1 text-fintech-muted mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Impact:</span>
        </div>
        {([null, 3, 2, 1] as (number | null)[]).map(level => (
          <button
            key={String(level)}
            onClick={() => setImportanceFilter(level)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
              importanceFilter === level
                ? "bg-fintech-primary text-fintech-primary-container border-fintech-primary"
                : "border-white/10 text-fintech-muted hover:border-white/20"
            )}
          >
            {level === null ? "All" : IMPORTANCE_LABEL[level]}
          </button>
        ))}
        <div className="flex items-center gap-1 text-fintech-muted ml-4 mr-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Country:</span>
        </div>
        {([null, ...FOREX_COUNTRIES] as (string | null)[]).map(country => (
          <button
            key={String(country)}
            onClick={() => setCountryFilter(country)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
              countryFilter === country
                ? "bg-fintech-primary text-fintech-primary-container border-fintech-primary"
                : "border-white/10 text-fintech-muted hover:border-white/20"
            )}
          >
            {country ?? "All"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-fintech-primary animate-spin" />
          <p className="text-fintech-muted text-[10px] font-bold uppercase tracking-widest">Loading calendar events...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-10 h-10 text-fintech-danger mb-4" />
          <p className="text-fintech-text font-bold text-lg">Failed to load calendar</p>
          <p className="text-fintech-muted text-sm mt-2">Check your API key configuration.</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-8">
          {grouped.size === 0 ? (
            <div className="text-center py-32 text-fintech-muted text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
              {apiKey ? "No events found for selected filters." : "API Authentication Required"}
            </div>
          ) : (
            Array.from(grouped.entries()).map(([dateLabel, dayEvents]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDays className="w-4 h-4 text-fintech-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-fintech-primary">{dateLabel}</h3>
                  <div className="flex-1 h-px bg-white/5"></div>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event, i) => {
                    const importance = event.importance && event.importance > 0 ? event.importance : 1;
                    const timeStr = event.date
                      ? new Date(String(event.date)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                      : "TBA";
                    const eventId = event.id || `${event.title}-${i}`;
                    const isExpanded = expandedEventId === eventId;
                    const hasDetails = event.comment || event.source || event.ticker;
                    return (
                      <motion.div
                        key={eventId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-surface-container-low rounded-xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden"
                      >
                        <div
                          onClick={() => hasDetails && setExpandedEventId(isExpanded ? null : eventId)}
                          className={cn(
                            "grid grid-cols-12 items-center gap-4 p-4",
                            hasDetails && "cursor-pointer"
                          )}
                        >
                          <div className="col-span-1 text-[10px] font-mono text-fintech-muted font-bold">{timeStr}</div>
                          <div className="col-span-2">
                            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border", IMPORTANCE_COLOR[importance])}>
                              {IMPORTANCE_LABEL[importance]}
                            </span>
                          </div>
                          <div className="col-span-1">
                            <Image
                              src={`https://flagcdn.com/w40/${(event.country || "us").toLowerCase()}.png`}
                              width={20}
                              height={20}
                              unoptimized
                              className="w-5 h-5 rounded-full object-cover border border-white/10"
                              alt={event.country || "us"}
                            />
                          </div>
                          <div className="col-span-4">
                            <div className="text-sm font-bold text-fintech-text flex items-center gap-2">
                              {event.title}
                              {hasDetails && (
                                <ChevronDown className={cn("w-4 h-4 text-fintech-muted transition-transform", isExpanded && "rotate-180")} />
                              )}
                            </div>
                            {event.period && <div className="text-[10px] text-fintech-muted">{event.period}</div>}
                          </div>
                          <div className="col-span-4 grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold">
                            <div>
                              <div className="text-[9px] text-fintech-muted uppercase mb-0.5">Prev</div>
                              <div className="text-fintech-muted">{event.previous ?? "—"}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-fintech-muted uppercase mb-0.5">Forecast</div>
                              <div className="text-fintech-text">{event.forecast ?? "—"}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-fintech-muted uppercase mb-0.5">Actual</div>
                              <div className={cn(
                                event.actual
                                  ? (parseFloat(event.actual) >= parseFloat(event.forecast ?? "0") ? "text-fintech-success" : "text-fintech-danger")
                                  : "text-fintech-muted"
                              )}>{event.actual ?? "—"}</div>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isExpanded && hasDetails && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 bg-surface-container/50"
                            >
                              <div className="p-4 space-y-3">
                                {event.comment && (
                                  <div>
                                    <div className="text-[9px] uppercase tracking-widest text-fintech-muted mb-1">Description</div>
                                    <p className="text-sm text-fintech-text leading-relaxed">{event.comment}</p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-4 text-[10px]">
                                  {event.ticker && (
                                    <div>
                                      <span className="text-fintech-muted uppercase">Ticker: </span>
                                      <code className="text-fintech-primary font-mono bg-fintech-primary/10 px-1.5 py-0.5 rounded">{event.ticker}</code>
                                    </div>
                                  )}
                                  {event.indicator && (
                                    <div>
                                      <span className="text-fintech-muted uppercase">Indicator: </span>
                                      <span className="text-fintech-text">{event.indicator}</span>
                                    </div>
                                  )}
                                  {event.unit && (
                                    <div>
                                      <span className="text-fintech-muted uppercase">Unit: </span>
                                      <span className="text-fintech-text">{event.unit}</span>
                                    </div>
                                  )}
                                  {event.category && (
                                    <div>
                                      <span className="text-fintech-muted uppercase">Category: </span>
                                      <span className="text-fintech-text">{event.category}</span>
                                    </div>
                                  )}
                                </div>
                                {event.source && (
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-fintech-muted uppercase">Source: </span>
                                    {event.source_url ? (
                                      <a
                                        href={event.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-fintech-primary hover:underline flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {event.source}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <span className="text-fintech-text">{event.source}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
