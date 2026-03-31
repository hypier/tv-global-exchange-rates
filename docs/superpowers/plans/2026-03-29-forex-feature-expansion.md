# Forex Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 global-exchange-rates 新增 4 个外汇专业页面（货币对详情、经济日历、货币强弱热力图、宏观指标），并升级现有排行榜和首页。

**Architecture:** 每个新页面为独立 Next.js App Router 路由，通过现有 `useTradingApi` hook 调用 RapidAPI 端点。`/pair/[symbol]` 使用已安装的 `lightweight-charts` v5 渲染 K 线图。所有组件遵循现有 fintech 暗色主题（Tailwind v4 CSS 变量）。

**Tech Stack:** Next.js 16.2.1, React 19, TanStack Query v5, lightweight-charts v5, framer-motion v12, lucide-react, Tailwind CSS v4

> **⚠️ 注意:** 本项目无测试框架。验证步骤均为手动：运行 `npm run dev`，在浏览器中检查页面。

---

## 文件结构

### 新建文件
- `src/app/pair/[symbol]/page.tsx` — 货币对详情页（K 线图 + TA 信号 + 指标 + 想法 + 新闻）
- `src/app/calendar/page.tsx` — 经济日历页
- `src/app/heatmap/page.tsx` — 货币强弱热力图页
- `src/app/indices/page.tsx` — 货币指数 + 国债收益率页

### 修改文件
- `src/components/layout/Navbar.tsx` — 新增 4 个导航链接
- `src/app/rankings/page.tsx` — 每行新增 TA 信号徽章列
- `src/app/page.tsx` — 首页新增经济日历今日高亮 Widget

---

## Task 1: 更新 Navbar，添加新页面导航链接

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: 在 navLinks 数组中添加 4 个新链接**

打开 `src/components/layout/Navbar.tsx`，将 `navLinks` 数组从：

```tsx
const navLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Market", href: "/rankings", icon: LineChart },
  { name: "Query", href: "/query", icon: Zap },
  { name: "Converter", href: "/converter", icon: ArrowLeftRight },
  { name: "News", href: "/news", icon: Bell },
];
```

改为：

```tsx
const navLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Market", href: "/rankings", icon: LineChart },
  { name: "Query", href: "/query", icon: Zap },
  { name: "Converter", href: "/converter", icon: ArrowLeftRight },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Heatmap", href: "/heatmap", icon: Grid3X3 },
  { name: "Indices", href: "/indices", icon: TrendingUp },
  { name: "News", href: "/news", icon: Bell },
];
```

- [ ] **Step 2: 更新 import 语句，引入新图标**

将文件顶部的 import 从：

```tsx
import { Settings, ShieldCheck, LayoutDashboard, LineChart, ArrowLeftRight, Bell, Zap } from "lucide-react";
```

改为：

```tsx
import { Settings, ShieldCheck, LayoutDashboard, LineChart, ArrowLeftRight, Bell, Zap, CalendarDays, Grid3X3, TrendingUp } from "lucide-react";
```

- [ ] **Step 3: 手动验证**

```bash
cd apps/global-exchange-rates && npm run dev
```

在浏览器打开 `http://localhost:3000`，确认 Navbar 桌面端显示 8 个链接，移动端底部导航栏也显示所有链接（滑动可见）。

- [ ] **Step 4: 提交**

```bash
git add apps/global-exchange-rates/src/components/layout/Navbar.tsx
git commit -m "feat(global-exchange): add Calendar, Heatmap, Indices nav links"
```

---

## Task 2: 创建货币对详情页 — K 线图 + 实时报价

**Files:**
- Create: `src/app/pair/[symbol]/page.tsx`

该页面通过 URL 参数（如 `/pair/FX:EURUSD`）接收货币对符号，展示 K 线图和实时报价。

- [ ] **Step 1: 创建目录和文件**

创建 `src/app/pair/[symbol]/page.tsx`，内容如下：

```tsx
"use client";

import { useTradingApi } from "@/hooks/useTradingApi";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { useParams } from "next/navigation";
import { useMemo, useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { Loader2, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

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
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
}

interface QuoteResponse {
  data?: { data?: QuoteData };
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceResponse {
  data?: { candles?: Candle[] };
}

interface TaSignal {
  signal?: string;
  buy?: number;
  sell?: number;
  neutral?: number;
}

interface TaResponse {
  data?: {
    summary?: TaSignal;
    oscillators?: TaSignal;
    moving_averages?: TaSignal;
  };
}

function CandlestickChart({ symbol }: { symbol: string }) {
  const { apiKey } = useApiKey();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  const { data, isLoading } = useTradingApi<PriceResponse>(
    `/api/price/${symbol}`,
    { interval: "1D", range: "3M" },
    !!apiKey
  );

  const candles = useMemo(() => data?.data?.candles || [], [data]);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

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
      height: 320,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#4edea3",
      downColor: "#fc4563",
      borderUpColor: "#4edea3",
      borderDownColor: "#fc4563",
      wickUpColor: "#4edea3",
      wickDownColor: "#fc4563",
    });

    const sorted = [...candles].sort((a, b) => a.time - b.time);
    series.setData(sorted.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles]);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-surface-container-low rounded-xl border border-white/5">
        <Loader2 className="w-8 h-8 text-fintech-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-4">
      <div className="text-[10px] font-bold text-fintech-muted uppercase tracking-widest mb-3">
        Price Chart — Daily (3M)
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}

export default function PairPage() {
  const { apiKey } = useApiKey();
  const params = useParams();
  const rawSymbol = decodeURIComponent(params.symbol as string);
  const symbol = rawSymbol.includes(":") ? rawSymbol : `FX:${rawSymbol}`;
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

  const quote = useMemo(() => quoteData?.data?.data, [quoteData]);
  const ta = useMemo(() => taData?.data, [taData]);

  const isPositive = (quote?.chp || 0) >= 0;
  const baseCurrency = displaySymbol.slice(0, 3);
  const quoteCurrency = displaySymbol.slice(3, 6);

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
            <img
              src={`https://flagcdn.com/w40/${baseCurrency.slice(0, 2).toLowerCase()}.png`}
              className="w-7 h-7 rounded-full object-cover border border-white/10"
              onError={(e) => (e.currentTarget.style.display = "none")}
              alt={baseCurrency}
            />
            <img
              src={`https://flagcdn.com/w40/${quoteCurrency.slice(0, 2).toLowerCase()}.png`}
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
            </div>
            <div className={cn("text-sm font-bold flex items-center justify-end gap-1", isPositive ? "text-fintech-success" : "text-fintech-danger")}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? "+" : ""}{quote.chp?.toFixed(2)}%
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
            { label: "Bid / Ask", value: quote.bid && quote.ask ? `${quote.bid.toFixed(5)} / ${quote.ask.toFixed(5)}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-low rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-fintech-muted uppercase tracking-widest font-bold mb-1">{label}</div>
              <div className="font-mono font-bold text-fintech-text">{value ?? "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* TA Summary */}
      {!taLoading && ta && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-6">Technical Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Summary", data: ta.summary },
              { label: "Oscillators", data: ta.oscillators },
              { label: "Moving Averages", data: ta.moving_averages },
            ].map(({ label, data }) => (
              <div key={label} className="bg-surface-container rounded-xl p-4 border border-white/5 text-center">
                <div className="text-[10px] text-fintech-muted uppercase tracking-widest font-bold mb-3">{label}</div>
                <div className={cn("text-lg font-black uppercase tracking-widest px-3 py-1 rounded border inline-block", signalColor(data?.signal))}>
                  {data?.signal ?? "N/A"}
                </div>
                <div className="flex justify-around mt-4 text-xs font-bold">
                  <span className="text-fintech-success">{data?.buy ?? 0} Buy</span>
                  <span className="text-fintech-muted">{data?.neutral ?? 0} Neutral</span>
                  <span className="text-fintech-danger">{data?.sell ?? 0} Sell</span>
                </div>
              </div>
            ))}
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
    </div>
  );
}
```

- [ ] **Step 2: 手动验证**

```bash
npm run dev
```

访问 `http://localhost:3000/pair/FX:EURUSD`（需要先在设置中输入 API Key）。确认：
- K 线图正确渲染（绿涨红跌）
- 报价数据显示在图表下方
- TA 信号卡片显示 Summary / Oscillators / Moving Averages

- [ ] **Step 3: 提交**

```bash
git add apps/global-exchange-rates/src/app/pair
git commit -m "feat(global-exchange): add pair detail page with candlestick chart and TA summary"
```

---

## Task 3: 货币对详情页 — 详细 TA 指标 + 交易想法 + 专属新闻

**Files:**
- Modify: `src/app/pair/[symbol]/page.tsx`

在 Task 2 的页面底部追加 TA 指标面板、交易想法、专属新闻三个区块。

- [ ] **Step 1: 在 page.tsx 中添加新的接口类型**

在现有接口定义后追加：

```tsx
interface TaIndicatorsData {
  RSI?: number;
  "MACD.macd"?: number;
  "MACD.signal"?: number;
  "Stoch.K"?: number;
  "Stoch.D"?: number;
  ADX?: number;
  "EMA20"?: number;
  "EMA50"?: number;
  "SMA20"?: number;
  "SMA50"?: number;
  "BB.upper"?: number;
  "BB.lower"?: number;
}

interface TaIndicatorsResponse {
  data?: { indicators?: TaIndicatorsData };
}

interface IdeaItem {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  author?: { username?: string };
  created_at?: number;
  agree_count?: number;
  disagree_count?: number;
}

interface IdeasResponse {
  data?: { ideas?: IdeaItem[]; items?: IdeaItem[] };
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
}

interface PairNewsResponse {
  data?: { items?: PairNewsItem[]; data?: PairNewsItem[] };
}
```

- [ ] **Step 2: 在 PairPage 组件中添加新的 API 调用**

在现有 `taData` 查询后追加：

```tsx
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

const taIndicators = useMemo(() => taIndicatorsData?.data?.indicators, [taIndicatorsData]);
const ideas = useMemo(() => ideasData?.data?.ideas || ideasData?.data?.items || [], [ideasData]);
const pairNews = useMemo(() => pairNewsData?.data?.data || pairNewsData?.data?.items || [], [pairNewsData]);
```

- [ ] **Step 3: 在 "Quick Converter Link" 之前插入 TA 指标面板**

```tsx
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
        { label: "EMA 20", value: taIndicators["EMA20"]?.toFixed(5), warn: false },
        { label: "EMA 50", value: taIndicators["EMA50"]?.toFixed(5), warn: false },
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
          className="bg-surface-container rounded-xl p-4 border border-white/5 hover:border-fintech-primary/20 transition-colors"
        >
          <div className="text-sm font-bold text-fintech-text line-clamp-2 mb-2">
            {idea.name || idea.title || "Untitled Idea"}
          </div>
          {idea.description && (
            <p className="text-xs text-fintech-muted line-clamp-2 mb-3">{idea.description}</p>
          )}
          <div className="flex items-center justify-between text-[10px] text-fintech-muted font-bold uppercase tracking-wider">
            <span>@{idea.author?.username || "analyst"}</span>
            <div className="flex gap-3">
              <span className="text-fintech-success">▲ {idea.agree_count ?? 0}</span>
              <span className="text-fintech-danger">▼ {idea.disagree_count ?? 0}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)}

{/* Pair-specific News */}
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
          ? new Date(Number(published) * (Number(published) < 10000000000 ? 1000 : 1)).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : "";
        return (
          <a
            key={item.id || i}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-surface-container transition-colors group border border-transparent hover:border-white/5"
          >
            <div className="flex-1">
              <div className="text-sm font-bold text-fintech-text group-hover:text-fintech-primary transition-colors line-clamp-2">{title}</div>
              <div className="text-[10px] text-fintech-muted font-bold uppercase tracking-wider mt-1">{source} · {dateStr}</div>
            </div>
          </a>
        );
      })}
    </div>
  </div>
)}
```

- [ ] **Step 4: 手动验证**

访问 `http://localhost:3000/pair/FX:EURUSD`，确认页面底部出现：
- TA 指标网格（RSI、MACD、Stoch 等）
- Trading Ideas 卡片（若有数据）
- Related News 列表

- [ ] **Step 5: 提交**

```bash
git add apps/global-exchange-rates/src/app/pair/
git commit -m "feat(global-exchange): add TA indicators, trading ideas and news to pair detail page"
```

---

## Task 4: 创建经济日历页 `/calendar`

**Files:**
- Create: `src/app/calendar/page.tsx`

展示未来 7 天（最多 40 天）的经济事件，按影响等级和国家过滤，高亮对外汇影响重大的事件。

- [ ] **Step 1: 创建 `src/app/calendar/page.tsx`**

```tsx
"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { useTradingApi } from "@/hooks/useTradingApi";
import { useState, useMemo } from "react";
import { Loader2, AlertCircle, CalendarDays, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EconomicEvent {
  id?: string;
  title?: string;
  country?: string;
  currency?: string;
  date?: number;
  period?: string;
  importance?: number; // 1=low, 2=medium, 3=high
  actual?: string;
  forecast?: string;
  previous?: string;
  comment?: string;
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

// Major forex-relevant countries
const FOREX_COUNTRIES = ["US", "EU", "GB", "JP", "AU", "CA", "CH", "CN", "NZ"];

export default function CalendarPage() {
  const { apiKey } = useApiKey();
  const [importanceFilter, setImportanceFilter] = useState<number | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const now = Math.floor(Date.now() / 1000);
  const sevenDaysLater = now + 7 * 24 * 60 * 60;

  const { data, isLoading, error } = useTradingApi<CalendarResponse>(
    "/api/calendar/economic",
    { from: now, to: sevenDaysLater },
    !!apiKey
  );

  const events = useMemo(() => {
    const raw = data as CalendarResponse;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (raw.data && Array.isArray(raw.data)) return raw.data;
    return raw.data?.result || raw.data?.events || [];
  }, [data]);

  const filtered = useMemo(() => {
    return events
      .filter(e => importanceFilter === null || e.importance === importanceFilter)
      .filter(e => countryFilter === null || e.country === countryFilter || e.currency === countryFilter)
      .sort((a, b) => (a.date || 0) - (b.date || 0));
  }, [events, importanceFilter, countryFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    filtered.forEach(event => {
      const dateKey = event.date
        ? new Date(event.date * 1000).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
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
        {[null, 3, 2, 1].map(level => (
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
        {[null, ...FOREX_COUNTRIES].map(country => (
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
            <div className="text-center py-32 text-fintech-muted text-[10px] font-bold uppercase tracking-widest">
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
                    const importance = event.importance ?? 1;
                    const timeStr = event.date
                      ? new Date(event.date * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                      : "TBA";
                    return (
                      <motion.div
                        key={event.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="grid grid-cols-12 items-center gap-4 bg-surface-container-low rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="col-span-1 text-[10px] font-mono text-fintech-muted font-bold">{timeStr}</div>
                        <div className="col-span-1">
                          <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border", IMPORTANCE_COLOR[importance])}>
                            {IMPORTANCE_LABEL[importance]}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <img
                            src={`https://flagcdn.com/w40/${(event.country || "us").toLowerCase()}.png`}
                            className="w-5 h-5 rounded-full object-cover border border-white/10"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                            alt={event.country}
                          />
                        </div>
                        <div className="col-span-4">
                          <div className="text-sm font-bold text-fintech-text">{event.title}</div>
                          {event.period && <div className="text-[10px] text-fintech-muted">{event.period}</div>}
                        </div>
                        <div className="col-span-5 grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold">
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
```

- [ ] **Step 2: 手动验证**

访问 `http://localhost:3000/calendar`，确认：
- 7 天内事件按日期分组显示
- Impact / Country 过滤按钮工作正常
- 高影响事件（level 3）显示红色徽章
- Previous / Forecast / Actual 三列正确显示

- [ ] **Step 3: 提交**

```bash
git add apps/global-exchange-rates/src/app/calendar/
git commit -m "feat(global-exchange): add economic calendar page with impact and country filters"
```

---

## Task 5: 创建货币强弱热力图页 `/heatmap`

**Files:**
- Create: `src/app/heatmap/page.tsx`

以矩阵形式显示主要货币两两之间的涨跌，行 = 基础货币，列 = 报价货币，格子颜色深浅代表涨跌幅。

- [ ] **Step 1: 创建 `src/app/heatmap/page.tsx`**

```tsx
"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { useTradingApi } from "@/hooks/useTradingApi";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NZD"];

// Build all pairs for the matrix
function buildSymbols(currencies: string[]): string[] {
  const pairs: string[] = [];
  for (const base of currencies) {
    for (const quote of currencies) {
      if (base !== quote) {
        pairs.push(`FX:${base}${quote}`);
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
  // Green spectrum for positive, red for negative
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
  const symbols = useMemo(() => buildSymbols(CURRENCIES), []);

  const { data, isLoading } = useTradingApi<BatchResponse>(
    "/api/quote/batch",
    { method: "POST", body: { symbols } },
    !!apiKey
  );

  // Build lookup: "EURUSD" -> chp
  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    const items = data?.data?.data || [];
    items.forEach(item => {
      if (item.success && item.data?.chp !== undefined) {
        const key = item.symbol.replace("FX:", "");
        map.set(key, item.data.chp);
      }
    });
    return map;
  }, [data]);

  // Currency strength: average chp of all pairs with this as base
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-2">Currency Heatmap</h1>
        <p className="text-fintech-muted font-medium">24h % change matrix — row is base currency, column is quote currency.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-fintech-primary animate-spin" />
          <p className="text-fintech-muted text-[10px] font-bold uppercase tracking-widest">Building heatmap matrix...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Currency Strength Bar */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-4">Currency Strength Ranking</h2>
            <div className="space-y-2">
              {strength.map(({ currency, strength: s }) => (
                <div key={currency} className="flex items-center gap-4">
                  <div className="w-10 text-xs font-black uppercase text-fintech-text font-mono">{currency}</div>
                  <div className="flex-1 h-5 bg-surface-container rounded-full overflow-hidden relative">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", s >= 0 ? "bg-fintech-success" : "bg-fintech-danger")}
                      style={{ width: `${Math.min(100, Math.abs(s) * 40 + 2)}%` }}
                    />
                  </div>
                  <div className={cn("w-14 text-right text-xs font-mono font-bold", s >= 0 ? "text-fintech-success" : "text-fintech-danger")}>
                    {s >= 0 ? "+" : ""}{s.toFixed(3)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Matrix */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-white/5 overflow-x-auto">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted mb-4">Pair Matrix</h2>
            <table className="border-collapse w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-12 p-1"></th>
                  {CURRENCIES.map(c => (
                    <th key={c} className="p-1 text-[10px] font-black uppercase text-fintech-muted tracking-widest text-center w-16">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRENCIES.map(base => (
                  <tr key={base}>
                    <td className="p-1 text-[10px] font-black uppercase text-fintech-muted tracking-widest text-right pr-2">{base}</td>
                    {CURRENCIES.map(quote => {
                      if (base === quote) {
                        return <td key={quote} className="p-0.5"><div className="w-16 h-10 rounded bg-surface-container-highest flex items-center justify-center text-[9px] text-fintech-muted font-bold">—</div></td>;
                      }
                      const chp = lookup.get(`${base}${quote}`);
                      return (
                        <td key={quote} className="p-0.5">
                          <a href={`/pair/FX:${base}${quote}`} title={`${base}/${quote}`}>
                            <div className={cn("w-16 h-10 rounded flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity", chp !== undefined ? heatColor(chp) : "bg-surface-container text-fintech-muted")}>
                              <div className="text-[9px] font-black">{chp !== undefined ? `${chp >= 0 ? "+" : ""}${chp.toFixed(2)}%` : "—"}</div>
                            </div>
                          </a>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-fintech-muted font-bold uppercase tracking-widest">
            <div className="w-6 h-3 rounded bg-rose-400/80"></div>
            <span>Strong Sell</span>
            <div className="w-6 h-3 rounded bg-rose-600/30 ml-2"></div>
            <span>Weak Sell</span>
            <div className="w-6 h-3 rounded bg-surface-container ml-2 border border-white/10"></div>
            <span>Neutral</span>
            <div className="w-6 h-3 rounded bg-emerald-600/30 ml-2"></div>
            <span>Weak Buy</span>
            <div className="w-6 h-3 rounded bg-emerald-400/80 ml-2"></div>
            <span>Strong Buy</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 手动验证**

访问 `http://localhost:3000/heatmap`，确认：
- 货币强弱排名条形图正确渲染
- 矩阵中每个格子显示对应货币对的 24h 涨跌幅
- 颜色深浅随涨跌幅变化
- 点击格子跳转至 `/pair/FX:EURUSD`（对应货币对详情页）

- [ ] **Step 3: 提交**

```bash
git add apps/global-exchange-rates/src/app/heatmap/
git commit -m "feat(global-exchange): add currency strength heatmap with pair matrix"
```

---

## Task 6: 创建宏观指标页 `/indices`

**Files:**
- Create: `src/app/indices/page.tsx`

展示货币指数（DXY 等，使用 indices leaderboard `tab: "currency"`）和各国政府债券收益率（bonds leaderboard，利率是外汇核心驱动因素）。

- [ ] **Step 1: 创建 `src/app/indices/page.tsx`**

```tsx
"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { useTradingApi } from "@/hooks/useTradingApi";
import { useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LeaderboardItem {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  "base-currency-logoid"?: string;
  "currency-logoid"?: string;
  "technical-rating"?: string;
  high?: number;
  low?: number;
  exchange?: string;
}

interface LeaderboardResponse {
  data?: { data?: LeaderboardItem[]; items?: LeaderboardItem[] } | LeaderboardItem[];
}

function parseItems(data: unknown): LeaderboardItem[] {
  const response = data as LeaderboardResponse;
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return response.data?.data || response.data?.items || [];
}

function ItemRow({ item, i }: { item: LeaderboardItem; i: number }) {
  const isPositive = (item.change || 0) >= 0;
  const baseLogo = item["base-currency-logoid"];
  const rating = item["technical-rating"];
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      className="hover:bg-fintech-primary/5 transition-colors border-b border-white/5 last:border-0"
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          {baseLogo && (
            <img
              src={`https://tv-logo.tradingviewapi.com/logo/${baseLogo}.svg`}
              className="w-7 h-7 rounded-full border border-white/10 bg-slate-800"
              onError={(e) => (e.currentTarget.style.display = "none")}
              alt=""
            />
          )}
          <div>
            <div className="font-bold text-fintech-text text-sm">{item.name || item.symbol.split(":").pop()}</div>
            <div className="text-[10px] text-fintech-muted font-bold uppercase tracking-tighter">{item.exchange || item.symbol.split(":")[0]}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-right font-mono font-bold text-fintech-text">{item.price?.toFixed(3) ?? "—"}</td>
      <td className="py-4 px-6 text-right">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold",
          isPositive ? "text-fintech-success bg-fintech-success/10 border-fintech-success/20" : "text-fintech-danger bg-fintech-danger/10 border-fintech-danger/20"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{item.change?.toFixed(2)}%
        </span>
      </td>
      <td className="py-4 px-6 text-right">
        {rating && (
          <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-widest",
            rating.toLowerCase().includes("buy") ? "bg-fintech-success/10 text-fintech-success border-fintech-success/20" :
            rating.toLowerCase().includes("sell") ? "bg-fintech-danger/10 text-fintech-danger border-fintech-danger/20" :
            "bg-surface-container text-fintech-muted border-white/5"
          )}>{rating}</span>
        )}
      </td>
    </motion.tr>
  );
}

function DataTable({ items, isLoading }: { items: LeaderboardItem[]; isLoading: boolean }) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-surface-container text-fintech-muted text-[10px] uppercase tracking-[0.2em] font-black">
              <th className="py-4 px-6">Instrument</th>
              <th className="py-4 px-6 text-right">Price / Yield</th>
              <th className="py-4 px-6 text-right">24h Change</th>
              <th className="py-4 px-6 text-right">Signal</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-8 h-8 text-fintech-primary animate-spin mx-auto" /></td></tr>
            ) : items.length > 0 ? (
              items.map((item, i) => <ItemRow key={item.symbol || i} item={item} i={i} />)
            ) : (
              <tr><td colSpan={4} className="py-20 text-center text-fintech-muted text-[10px] font-bold uppercase tracking-widest">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IndicesPage() {
  const { apiKey } = useApiKey();

  const { data: currencyIndexData, isLoading: currencyLoading } = useTradingApi(
    "/api/leaderboard/indices",
    { tab: "currency", count: 20 },
    !!apiKey
  );

  const { data: bondsData, isLoading: bondsLoading } = useTradingApi(
    "/api/leaderboard/bonds",
    { tab: "all", count: 20 },
    !!apiKey
  );

  const currencyItems = useMemo(() => parseItems(currencyIndexData), [currencyIndexData]);
  const bondItems = useMemo(() => parseItems(bondsData), [bondsData]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-12">
      <div>
        <h1 className="text-4xl font-headline font-extrabold text-fintech-text mb-2">Macro Indicators</h1>
        <p className="text-fintech-muted font-medium">Currency indices and government bond yields — the primary drivers of forex markets.</p>
      </div>

      {/* Currency Indices */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted">Currency Indices</h2>
          <div className="text-[10px] text-fintech-primary font-bold uppercase tracking-widest">DXY · EUR · GBP · JPY</div>
        </div>
        <DataTable items={currencyItems} isLoading={currencyLoading} />
      </section>

      {/* Government Bond Yields */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted">Government Bond Yields</h2>
          <div className="text-[10px] text-fintech-primary font-bold uppercase tracking-widest">Interest Rate Differential</div>
        </div>
        <p className="text-fintech-muted text-xs mb-4 leading-relaxed">Higher yields attract capital flows, strengthening a currency. Monitor divergences between central banks.</p>
        <DataTable items={bondItems} isLoading={bondsLoading} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 手动验证**

访问 `http://localhost:3000/indices`，确认：
- "Currency Indices" 区块显示 DXY 等货币指数
- "Government Bond Yields" 区块显示各国国债收益率
- 价格、涨跌幅、技术评级均正确显示

- [ ] **Step 3: 提交**

```bash
git add apps/global-exchange-rates/src/app/indices/
git commit -m "feat(global-exchange): add macro indices page with currency indices and bond yields"
```

---

## Task 7: 排行榜页升级 — 行内 TA 信号快捷入口

**Files:**
- Modify: `src/app/rankings/page.tsx`

在现有表格的 "Technical Rating" 列旁边增加一个 "Detail" 按钮，点击跳转到 `/pair/[symbol]` 详情页。

- [ ] **Step 1: 在 rankings/page.tsx 的表格最后一列添加详情入口**

在 `<td>` 中 rating 渲染结束后，追加 Link 按钮：

找到 `rankings/page.tsx` 中最后一个 `<td className="py-5 px-8 text-right">` 的 rating 渲染，将其改为：

```tsx
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
```

- [ ] **Step 2: 添加 Link 和 ArrowRight import**

在 `rankings/page.tsx` 顶部 import 中添加：

```tsx
import Link from "next/link";
import { AlertCircle, TrendingDown, TrendingUp, Loader2, ArrowRight } from "lucide-react";
```

- [ ] **Step 3: 手动验证**

访问 `http://localhost:3000/rankings`，hover 某一行，确认右侧出现箭头图标，点击跳转至对应货币对详情页。

- [ ] **Step 4: 提交**

```bash
git add apps/global-exchange-rates/src/app/rankings/page.tsx
git commit -m "feat(global-exchange): add pair detail link to rankings table rows"
```

---

## Task 8: 首页升级 — 经济日历今日高亮 Widget

**Files:**
- Modify: `src/app/page.tsx`

在首页 "Quick Query Section" 下方新增一个经济日历 Widget，展示今日最重要的 3 条高影响事件（impact = 3）。

- [ ] **Step 1: 在 page.tsx 中添加 EconCalendarWidget 组件**

在 `QuickQueryWidget` 函数之后、`export default function Home()` 之前插入：

```tsx
function EconCalendarWidget() {
  const { apiKey } = useApiKey();
  const now = Math.floor(Date.now() / 1000);
  const todayEnd = now + 24 * 60 * 60;

  interface EconEvent {
    id?: string;
    title?: string;
    country?: string;
    date?: number;
    importance?: number;
    forecast?: string;
    previous?: string;
    actual?: string;
  }

  interface EconCalendarResponse {
    data?: { result?: EconEvent[]; events?: EconEvent[] } | EconEvent[];
  }

  const { data, isLoading } = useTradingApi<EconCalendarResponse>(
    "/api/calendar/economic",
    { from: now, to: todayEnd },
    !!apiKey
  );

  const events = useMemo(() => {
    const raw = data as EconCalendarResponse;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (raw.data && Array.isArray(raw.data)) return raw.data;
    const items = raw.data?.result || raw.data?.events || [];
    return items
      .filter((e: EconEvent) => (e.importance ?? 0) >= 2)
      .sort((a: EconEvent, b: EconEvent) => (b.importance ?? 0) - (a.importance ?? 0))
      .slice(0, 3);
  }, [data]);

  if (!apiKey || (!isLoading && events.length === 0)) return null;

  return (
    <section className="bg-surface-container-low rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-fintech-muted">Today's Key Events</h2>
        <Link href="/calendar" className="text-fintech-primary text-[9px] font-bold uppercase tracking-widest hover:opacity-80 flex items-center gap-1">
          Full Calendar <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-fintech-muted text-[10px] font-bold uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading events...
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event: EconEvent, i: number) => {
            const timeStr = event.date
              ? new Date(event.date * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "";
            return (
              <div key={event.id || i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={cn(
                  "text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0",
                  (event.importance ?? 1) === 3 ? "text-fintech-danger border-fintech-danger/20 bg-fintech-danger/10" : "text-yellow-400 border-yellow-400/20 bg-yellow-400/10"
                )}>
                  {(event.importance ?? 1) === 3 ? "HIGH" : "MED"}
                </span>
                <img
                  src={`https://flagcdn.com/w40/${(event.country || "us").toLowerCase()}.png`}
                  className="w-4 h-4 rounded-full object-cover border border-white/10 shrink-0"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  alt={event.country}
                />
                <span className="text-xs font-bold text-fintech-text flex-1 truncate">{event.title}</span>
                <span className="text-[10px] font-mono text-fintech-muted shrink-0">{timeStr}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 在 Home 组件中 Quick Query Section 后面插入 Widget**

在 `page.tsx` 的 `Home` 函数中，Quick Query Section 的 `</motion.div>` 结束之后、Feature Section 之前插入：

```tsx
{/* Economic Calendar Today Widget */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6 }}
>
  <EconCalendarWidget />
</motion.div>
```

- [ ] **Step 3: 手动验证**

访问 `http://localhost:3000`，在首页滚动至下方，确认出现 "Today's Key Events" Widget，显示今日高影响经济事件，点击 "Full Calendar" 跳转到 `/calendar`。

- [ ] **Step 4: 提交**

```bash
git add apps/global-exchange-rates/src/app/page.tsx
git commit -m "feat(global-exchange): add economic calendar today widget to homepage"
```

---

## Self-Review

### Spec Coverage 检查

| 功能 | 对应 Task | 状态 |
|------|----------|------|
| `/pair/[symbol]` K 线图 + 报价 | Task 2 | ✅ |
| `/pair/[symbol]` TA 信号 (summary/oscillators/MA) | Task 2 | ✅ |
| `/pair/[symbol]` 详细指标 (RSI/MACD/Stoch 等) | Task 3 | ✅ |
| `/pair/[symbol]` 交易想法 | Task 3 | ✅ |
| `/pair/[symbol]` 专属新闻 | Task 3 | ✅ |
| `/calendar` 经济日历，按影响/国家过滤 | Task 4 | ✅ |
| `/heatmap` 货币强弱热力图 + 矩阵 | Task 5 | ✅ |
| `/indices` 货币指数 + 国债收益率 | Task 6 | ✅ |
| Navbar 新增 4 个链接 | Task 1 | ✅ |
| Rankings 行内跳转详情页 | Task 7 | ✅ |
| 首页经济日历 Widget | Task 8 | ✅ |

### Placeholder 扫描

- 无 TBD / TODO
- 所有代码块均为完整可执行代码
- 类型定义在使用前均已声明

### 类型一致性

- `LeaderboardItem` 在 Task 6 中本地定义，与 Task 7 的 rankings/page.tsx 现有定义不冲突（各文件独立）
- `EconCalendarWidget` 在 Task 8 中内嵌接口定义，不依赖外部 import
- `useTradingApi` 调用签名在所有 Task 中一致：`(endpoint, options, enabled)`
- `lightweight-charts` v5 使用 `addSeries(CandlestickSeries, ...)` 而非 v4 的 `addCandlestickSeries()`（已按 v5 API 编写）
