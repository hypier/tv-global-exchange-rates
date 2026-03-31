import { useQuery } from "@tanstack/react-query";
import { useApiKey } from "@/contexts/ApiKeyContext";

interface RequestOptions {
  market?: "crypto" | "forex" | "stock";
  symbol?: string;
  method?: "GET" | "POST";
  body?: any;
  [key: string]: any;
}

const BASE_URL = "https://tradingview-data1.p.rapidapi.com";

export function useTradingApi<T>(endpoint: string, options: RequestOptions = {}, enabled = true) {
  const { apiKey } = useApiKey();
  const { method = "GET", body, ...params } = options;

  // Create query params
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) searchParams.append(k, String(v));
  });
  const queryString = searchParams.toString();
  const fullUrl = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;

  return useQuery<T>({
    queryKey: [endpoint, options, !!apiKey],
    queryFn: async () => {
      if (!apiKey) throw new Error("API Key required");
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
          "content-type": "application/json",
        },
      };

      if (method === "POST" && body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const res = await fetch(fullUrl, fetchOptions);

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      return res.json() as Promise<T>;
    },
    enabled: enabled && !!apiKey,
    staleTime: 60 * 1000, // 1 minute
  });
}
