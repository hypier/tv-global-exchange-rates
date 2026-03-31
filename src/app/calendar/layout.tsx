import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Economic Calendar | Forex Events & Market News Schedule",
  description: "Live economic calendar with upcoming forex events, central bank announcements, and market-moving news. Track economic indicators affecting currency markets.",
  keywords: "economic calendar, forex calendar, forex events, economic indicators, market news schedule, central bank calendar, forex news calendar",
  openGraph: {
    title: "Economic Calendar | Forex Events Schedule",
    description: "Track upcoming forex events, central bank announcements, and market-moving news.",
    type: "website",
    url: "https://forex.tradingviewapi.com/calendar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Economic Calendar | Forex Events",
    description: "Track upcoming forex events and central bank announcements.",
  },
  alternates: {
    canonical: "https://forex.tradingviewapi.com/calendar",
  },
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
