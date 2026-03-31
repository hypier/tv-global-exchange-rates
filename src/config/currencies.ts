// 货币配置 - 统一管理应用中的所有货币列表

// 主要货币（用于热力图等核心功能）
export const MAJOR_CURRENCIES: readonly string[] = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NZD", "HKD", "SGD"
];

// 全部支持的货币（用于汇率转换等完整功能）
export const ALL_CURRENCIES: readonly string[] = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NZD", "HKD", "SGD",
  "SEK", "NOK", "DKK", "KRW", "INR", "MXN", "BRL", "ZAR", "THB", "MYR", "PHP",
  "IDR", "AED", "SAR", "PLN", "CZK", "HUF", "TRY", "ILS"
];

// 获取货币国旗图标 URL
export function getCurrencyFlagUrl(currency: string): string {
  const specialCases: Record<string, string> = {
    "EUR": "EU",
    "GBP": "GB",
    "USD": "US",
  };
  const countryCode = specialCases[currency] || currency.slice(0, 2);
  return `https://tv-logo.tradingviewapi.com/logo/country/${countryCode}.svg`;
}
