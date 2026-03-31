"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const STORAGE_KEY = "tradingview_api_key_v2";

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isLoading: boolean;
  isValidating: boolean;
  validateAndSetKey: (key: string) => Promise<boolean>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Load key from localStorage on mount
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      setApiKeyState(savedKey);
    }
    setIsLoading(false);
  }, []);

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setApiKeyState(key);
  };

  const validateAndSetKey = async (key: string): Promise<boolean> => {
    setIsValidating(true);
    try {
      const res = await fetch("https://tradingview-data1.p.rapidapi.com/health", {
        headers: {
          "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
      });
      
      if (res.ok) {
        setApiKey(key);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to validate key", e);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isLoading, isValidating, validateAndSetKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}
