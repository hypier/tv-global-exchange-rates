import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forex Market Rankings | Top Currency Pairs & Leaderboard Today",
  description: "Live forex market rankings and leaderboard. Track top gainers, losers, and most active currency pairs. Real-time market data for major, exotic, Asian, and European forex pairs.",
  keywords: "forex rankings, forex leaderboard, top currency pairs, forex gainers, forex losers, market rankings, currency pair performance",
  openGraph: {
    title: "Forex Market Rankings | Live Leaderboard",
    description: "Track top gainers, losers, and most active currency pairs in real-time.",
    type: "website",
    url: "https://forex.tradingviewapi.com/rankings",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forex Market Rankings | Live Leaderboard",
    description: "Track top gainers, losers, and most active currency pairs in real-time.",
  },
  alternates: {
    canonical: "https://forex.tradingviewapi.com/rankings",
  },
};

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
