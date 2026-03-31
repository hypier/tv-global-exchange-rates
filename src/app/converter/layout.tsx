import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Currency Converter | Real-Time Exchange Rates Calculator",
  description: "Convert currencies instantly with live exchange rates. Free online currency converter supporting 150+ currencies including USD, EUR, GBP, JPY, CNY. Powered by TradingView data.",
  keywords: "currency converter, exchange rate calculator, convert currency, forex converter, real-time currency conversion, multi-currency converter",
  openGraph: {
    title: "Free Currency Converter | Real-Time Exchange Rates",
    description: "Convert currencies instantly with live exchange rates. Support 150+ currencies.",
    type: "website",
    url: "https://forex.tradingviewapi.com/converter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Currency Converter | Real-Time Exchange Rates",
    description: "Convert currencies instantly with live exchange rates. Support 150+ currencies.",
  },
  alternates: {
    canonical: "https://forex.tradingviewapi.com/converter",
  },
};

export default function ConverterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
