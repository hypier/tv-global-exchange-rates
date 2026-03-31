import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forex News Today | Latest Currency Market Updates & Analysis",
  description: "Latest forex news and currency market updates. Real-time market analysis, central bank news, and economic reports affecting exchange rates.",
  keywords: "forex news, currency news, forex market updates, forex analysis, currency market news, forex today, forex headlines",
  openGraph: {
    title: "Forex News Today | Latest Market Updates",
    description: "Latest forex news and currency market updates with real-time analysis.",
    type: "website",
    url: "https://forex.tradingviewapi.com/news",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forex News Today | Latest Updates",
    description: "Latest forex news and currency market updates.",
  },
  alternates: {
    canonical: "https://forex.tradingviewapi.com/news",
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
