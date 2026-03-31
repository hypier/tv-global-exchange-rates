import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forex Heatmap | Live Currency Strength & Volatility Visualization",
  description: "Interactive forex heatmap showing live currency strength, volatility, and market correlations. Visual analysis tool for tracking forex market trends in real-time.",
  keywords: "forex heatmap, currency strength, forex volatility, market heatmap, currency correlation, forex visualization, currency strength meter",
  openGraph: {
    title: "Forex Heatmap | Live Currency Strength Visualization",
    description: "Interactive forex heatmap showing live currency strength and market correlations.",
    type: "website",
    url: "https://forex.tradingviewapi.com/heatmap",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forex Heatmap | Live Currency Strength",
    description: "Interactive forex heatmap showing live currency strength and market correlations.",
  },
  alternates: {
    canonical: "https://forex.tradingviewapi.com/heatmap",
  },
};

export default function HeatmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
