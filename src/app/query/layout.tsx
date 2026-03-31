import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forex Data Query Terminal | Real-Time Market Data Lookup",
  description: "Advanced forex data query terminal. Search and analyze real-time market data for any currency pair. Professional-grade forex data lookup tool with instant results.",
  keywords: "forex query, market data lookup, forex terminal, currency pair search, forex data tool, real-time forex query",
  openGraph: {
    title: "Forex Data Query Terminal | Real-Time Market Data",
    description: "Search and analyze real-time market data for any currency pair.",
    type: "website",
    url: "https://forex.tradingviewapi.com/query",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forex Data Query Terminal",
    description: "Search and analyze real-time market data for any currency pair.",
  },
  alternates: {
    canonical: "https://forex.tradingviewapi.com/query",
  },
};

export default function QueryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
