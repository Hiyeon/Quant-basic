import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface StockQuote {
  symbol: string;
  name: string;
  nameKr?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketCap?: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  pe?: number;
  pbr?: number;
  eps?: number;
  roe?: number;
  dividendYield?: number;
  beta?: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  thumbnail?: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export interface AllData {
  quote: StockQuote | null;
  history: HistoricalData[];
  news: NewsItem[];
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-data`;

// Client-side cache
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = clientCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  clientCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  clientCache.set(key, { data, timestamp: Date.now() });
}

export function useStockData() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async <T>(url: string, cacheKey?: string): Promise<T | null> => {
    // Check client cache
    if (cacheKey) {
      const cached = getCached<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (cacheKey && data) {
        setCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  const getQuote = useCallback(async (symbol: string): Promise<StockQuote | null> => {
    setLoading(true);
    try {
      const data = await fetchData<StockQuote>(
        `${FUNCTION_URL}?action=quote&symbol=${encodeURIComponent(symbol)}`,
        `quote:${symbol}`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      toast({
        title: "데이터 로드 실패",
        description: "주가 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchData, toast]);

  const getQuotes = useCallback(async (symbols: string[]): Promise<StockQuote[]> => {
    if (symbols.length === 0) return [];
    
    setLoading(true);
    try {
      const data = await fetchData<StockQuote[]>(
        `${FUNCTION_URL}?action=quotes&symbols=${encodeURIComponent(symbols.join(','))}`,
        `quotes:${symbols.sort().join(',')}`
      );
      return data || [];
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const getHistory = useCallback(async (symbol: string, period: string = '1mo'): Promise<HistoricalData[]> => {
    try {
      const data = await fetchData<HistoricalData[]>(
        `${FUNCTION_URL}?action=history&symbol=${encodeURIComponent(symbol)}&period=${period}`,
        `history:${symbol}:${period}`
      );
      return data || [];
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }
  }, [fetchData]);

  const getNews = useCallback(async (symbol: string): Promise<NewsItem[]> => {
    try {
      const data = await fetchData<NewsItem[]>(
        `${FUNCTION_URL}?action=news&symbol=${encodeURIComponent(symbol)}`,
        `news:${symbol}`
      );
      return data || [];
    } catch (error) {
      console.error('Failed to fetch news:', error);
      return [];
    }
  }, [fetchData]);

  const searchStocks = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const data = await fetchData<SearchResult[]>(
        `${FUNCTION_URL}?action=search&query=${encodeURIComponent(query)}`,
        `search:${query.toLowerCase()}`
      );
      return data || [];
    } catch (error) {
      console.error('Failed to search stocks:', error);
      return [];
    }
  }, [fetchData]);

  // Fetch all data at once - most efficient for initial load
  const getAll = useCallback(async (symbol: string): Promise<AllData> => {
    setLoading(true);
    try {
      const data = await fetchData<AllData>(
        `${FUNCTION_URL}?action=all&symbol=${encodeURIComponent(symbol)}`,
        `all:${symbol}`
      );
      return data || { quote: null, history: [], news: [] };
    } catch (error) {
      console.error('Failed to fetch all data:', error);
      return { quote: null, history: [], news: [] };
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return {
    loading,
    getQuote,
    getQuotes,
    getHistory,
    getNews,
    searchStocks,
    getAll,
  };
}