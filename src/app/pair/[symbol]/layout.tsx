import type { Metadata } from "next";

type Props = {
  params: { symbol: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = decodeURIComponent(params.symbol);
  
  // 解析货币对
  const cleanSymbol = symbol.replace("FX_IDC:", "");
  const base = cleanSymbol.substring(0, 3);
  const quote = cleanSymbol.substring(3, 6);
  
  return {
    title: `${base}/${quote} Live Rate | Real-Time ${base} to ${quote} Exchange Rate`,
    description: `Live ${base}/${quote} exchange rate with real-time chart, technical analysis, and market data. Track ${base} to ${quote} conversion rates, bid/ask spreads, and price trends.`,
    keywords: `${base}/${quote}, ${base} to ${quote}, ${base}${quote} rate, ${base}/${quote} converter, ${base}/${quote} chart, ${base}/${quote} forecast, ${base}${quote} live`,
    openGraph: {
      title: `${base}/${quote} Live Rate | Real-Time Exchange Rate`,
      description: `Live ${base}/${quote} exchange rate with real-time chart and market data.`,
      type: "website",
      url: `https://forex.tradingviewapi.com/pair/${symbol}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${base}/${quote} Live Rate`,
      description: `Live ${base}/${quote} exchange rate with real-time chart.`,
    },
    alternates: {
      canonical: `https://forex.tradingviewapi.com/pair/${symbol}`,
    },
  };
}

export default function PairLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
