import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockQuote {
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

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  thumbnail?: string;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Korean stock name mapping
const koreanNames: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '373220': 'LG에너지솔루션',
  '035420': '네이버',
  '035720': '카카오',
  '006400': '삼성SDI',
  '207940': '삼성바이오로직스',
  '068270': '셀트리온',
  '105560': 'KB금융',
  '055550': '신한지주',
  '066570': 'LG전자',
  '051910': 'LG화학',
  '017670': 'SK텔레콤',
  '030200': 'KT',
  '003550': 'LG',
  '012330': '현대모비스',
  '005380': '현대차',
  '000270': '기아',
  '028260': '삼성물산',
  '096770': 'SK이노베이션',
};

// Check if symbol is Korean stock (6 digits)
function isKoreanStock(symbol: string): boolean {
  const cleanSymbol = symbol.replace('.KS', '').replace('.KQ', '');
  return /^\d{6}$/.test(cleanSymbol);
}

// Fetch Korean stock metrics from Naver Finance
async function fetchNaverMetrics(symbol: string): Promise<{
  pe?: number;
  pbr?: number;
  eps?: number;
  roe?: number;
  dividendYield?: number;
  marketCap?: number;
  name?: string;
} | null> {
  const cleanSymbol = symbol.replace('.KS', '').replace('.KQ', '');
  const cacheKey = `naver:${cleanSymbol}`;
  
  const cached = getCached<any>(cacheKey);
  if (cached) {
    console.log(`Naver cache hit for ${cleanSymbol}`);
    return cached;
  }
  
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    'Accept': 'application/json',
    'Referer': 'https://m.stock.naver.com/',
  };
  
  try {
    // Fetch multiple Naver endpoints in parallel
    const [basicRes, integrationRes, indicatorRes] = await Promise.all([
      fetch(`https://m.stock.naver.com/api/stock/${cleanSymbol}/basic`, { headers: commonHeaders }).catch(() => null),
      fetch(`https://m.stock.naver.com/api/stock/${cleanSymbol}/integration`, { headers: commonHeaders }).catch(() => null),
      fetch(`https://m.stock.naver.com/api/stock/${cleanSymbol}/indicator`, { headers: commonHeaders }).catch(() => null),
    ]);
    
    const result: any = {};
    
    // Parse basic response
    if (basicRes && basicRes.ok) {
      try {
        const data = await basicRes.json();
        if (data.stockName) result.name = data.stockName;
        if (data.stockEndPrice) result.price = data.stockEndPrice;
        
        // Some basic fields might have metrics
        if (typeof data.per === 'number') result.pe = data.per;
        if (typeof data.pbr === 'number') result.pbr = data.pbr;
        if (typeof data.eps === 'number') result.eps = data.eps;
        if (typeof data.dividendYield === 'number') result.dividendYield = data.dividendYield;
      } catch (e) {
        console.log(`Error parsing Naver basic for ${cleanSymbol}:`, e);
      }
    }
    
    // Parse integration response (contains more detailed metrics)
    if (integrationRes && integrationRes.ok) {
      try {
        const data = await integrationRes.json();
        
        // totalInfos contains key financial metrics
        if (data.totalInfos && Array.isArray(data.totalInfos)) {
          for (const info of data.totalInfos) {
            const code = info.code?.toLowerCase();
            const value = info.value;
            
            if (!value || value === '-' || value === 'N/A') continue;
            
            const numValue = parseFloat(String(value).replace(/,/g, ''));
            if (isNaN(numValue)) continue;
            
            if (code === 'per' && result.pe == null) result.pe = numValue;
            if (code === 'pbr' && result.pbr == null) result.pbr = numValue;
            if (code === 'eps' && result.eps == null) result.eps = numValue;
            if (code === 'roe' && result.roe == null) result.roe = numValue;
            if ((code === 'dividendyield' || code === 'dividend_yield') && result.dividendYield == null) {
              result.dividendYield = numValue;
            }
          }
        }
        
        // Also check investmentIndicator
        if (data.investmentIndicator) {
          const ind = data.investmentIndicator;
          if (result.pe == null && ind.per) result.pe = parseFloat(ind.per);
          if (result.pbr == null && ind.pbr) result.pbr = parseFloat(ind.pbr);
          if (result.eps == null && ind.eps) result.eps = parseFloat(String(ind.eps).replace(/,/g, ''));
          if (result.roe == null && ind.roe) result.roe = parseFloat(ind.roe);
        }
      } catch (e) {
        console.log(`Error parsing Naver integration for ${cleanSymbol}:`, e);
      }
    }
    
    // Parse indicator response
    if (indicatorRes && indicatorRes.ok) {
      try {
        const data = await indicatorRes.json();
        
        // Check for annual/quarterly data
        const annualData = data.annual || data.yearly;
        if (Array.isArray(annualData) && annualData.length > 0) {
          const latest = annualData[annualData.length - 1];
          if (result.pe == null && latest.per) result.pe = parseFloat(latest.per);
          if (result.pbr == null && latest.pbr) result.pbr = parseFloat(latest.pbr);
          if (result.eps == null && latest.eps) result.eps = parseFloat(String(latest.eps).replace(/,/g, ''));
          if (result.roe == null && latest.roe) result.roe = parseFloat(latest.roe);
          if (result.dividendYield == null && latest.dividendYield) {
            result.dividendYield = parseFloat(latest.dividendYield);
          }
        }
      } catch (e) {
        console.log(`Error parsing Naver indicator for ${cleanSymbol}:`, e);
      }
    }
    
    console.log(`Naver metrics for ${cleanSymbol}:`, JSON.stringify(result));
    setCache(cacheKey, result);
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error(`Error fetching Naver metrics for ${cleanSymbol}:`, error);
    return null;
  }
}


// Convert symbol to Yahoo Finance format
function toYahooSymbol(symbol: string): string {
  const cleanSymbol = symbol.replace('.KS', '').replace('.KQ', '');
  if (/^\d{6}$/.test(cleanSymbol)) {
    return `${cleanSymbol}.KS`;
  }
  return symbol;
}

function getBaseSymbol(symbol: string): string {
  return symbol.replace('.KS', '').replace('.KQ', '');
}


// Fetch detailed quote with financial metrics
async function fetchQuoteWithMetrics(symbol: string): Promise<StockQuote | null> {
  const yahooSymbol = toYahooSymbol(symbol);
  const baseSymbol = getBaseSymbol(symbol);
  const cacheKey = `quote:${yahooSymbol}`;
  
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${yahooSymbol}`);
    return cached;
  }
  
  try {
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7',
      'Referer': 'https://finance.yahoo.com/',
    };

    // Fetch chart + metrics (quoteSummary is sometimes unavailable for certain tickers/regions)
    const [chartResponse, statsResponse, quoteResponse] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`, {
        headers: commonHeaders,
      }),
      fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=price,summaryDetail,defaultKeyStatistics,financialData`,
        { headers: commonHeaders }
      ).catch(() => null),
      fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`,
        { headers: commonHeaders }
      ).catch(() => null),
    ]);
    
    if (!chartResponse.ok) {
      console.error(`Failed to fetch chart for ${yahooSymbol}: ${chartResponse.status}`);
      return null;
    }
    
    const chartData = await chartResponse.json();
    const chartResult = chartData.chart?.result?.[0];
    
    if (!chartResult) {
      console.error(`No chart data for ${yahooSymbol}`);
      return null;
    }
    
    const meta = chartResult.meta;
    const quotes = chartResult.indicators?.quote?.[0];
    const closes = quotes?.close?.filter((c: number | null) => c !== null) || [];
    
    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || closes[closes.length - 2] || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;
    
    // Parse additional metrics (quoteSummary + v7 quote fallback)
    let pe: number | undefined;
    let pbr: number | undefined;
    let eps: number | undefined;
    let roe: number | undefined;
    let dividendYield: number | undefined;
    let beta: number | undefined;
    let marketCap: number | undefined;
    let v7Quote: any | null = null;

    if (statsResponse && !statsResponse.ok) {
      console.warn(`quoteSummary unavailable for ${yahooSymbol}: ${statsResponse.status}`);
    }

    if (statsResponse && statsResponse.ok) {
      try {
        const statsData = await statsResponse.json();
        const result = statsData.quoteSummary?.result?.[0];

        if (result) {
          const summaryDetail = result.summaryDetail || {};
          const keyStats = result.defaultKeyStatistics || {};
          const financialData = result.financialData || {};
          const priceData = result.price || {};

          pe = summaryDetail.trailingPE?.raw || keyStats.trailingPE?.raw;
          pbr = summaryDetail.priceToBook?.raw || keyStats.priceToBook?.raw;
          eps = keyStats.trailingEps?.raw;
          roe = financialData.returnOnEquity?.raw ? financialData.returnOnEquity.raw * 100 : undefined;
          dividendYield = summaryDetail.dividendYield?.raw ? summaryDetail.dividendYield.raw * 100 : undefined;
          beta = summaryDetail.beta?.raw || keyStats.beta?.raw;
          marketCap = priceData.marketCap?.raw;
        }
      } catch (e) {
        console.log(`Could not parse quoteSummary for ${yahooSymbol}:`, e);
      }
    }

    if (quoteResponse && !quoteResponse.ok) {
      console.warn(`v7 quote unavailable for ${yahooSymbol}: ${quoteResponse.status}`);
    }

    // Fallback for KR tickers where quoteSummary often omits PER/PBR/EPS/dividend
    if (quoteResponse && quoteResponse.ok) {
      try {
        const quoteData = await quoteResponse.json();
        v7Quote = quoteData.quoteResponse?.result?.[0] ?? null;

        if (v7Quote) {
          if (pe == null && typeof v7Quote.trailingPE === 'number') pe = v7Quote.trailingPE;
          if (pbr == null && typeof v7Quote.priceToBook === 'number') pbr = v7Quote.priceToBook;
          if (eps == null && typeof v7Quote.epsTrailingTwelveMonths === 'number') eps = v7Quote.epsTrailingTwelveMonths;
          if (beta == null && typeof v7Quote.beta === 'number') beta = v7Quote.beta;
          if (marketCap == null && typeof v7Quote.marketCap === 'number') marketCap = v7Quote.marketCap;

          const rawDiv = v7Quote.trailingAnnualDividendYield ?? v7Quote.dividendYield;
          if (dividendYield == null && typeof rawDiv === 'number') {
            dividendYield = rawDiv * 100;
          }
        }
      } catch (e) {
        console.log(`Could not parse v7 quote for ${yahooSymbol}:`, e);
      }
    }

    // For Korean stocks, use Naver Finance as fallback for missing metrics
    if (isKoreanStock(baseSymbol)) {
      const missingMetrics = pe == null || pbr == null || eps == null || roe == null;
      
      if (missingMetrics) {
        console.log(`Fetching Naver metrics for Korean stock ${baseSymbol}`);
        
        const naverData = await fetchNaverMetrics(baseSymbol);
        
        if (naverData) {
          if (pe == null && naverData.pe != null) pe = naverData.pe;
          if (pbr == null && naverData.pbr != null) pbr = naverData.pbr;
          if (eps == null && naverData.eps != null) eps = naverData.eps;
          if (roe == null && naverData.roe != null) roe = naverData.roe;
          if (dividendYield == null && naverData.dividendYield != null) dividendYield = naverData.dividendYield;
          if (marketCap == null && naverData.marketCap != null) marketCap = naverData.marketCap;
        }
      }
    }
    
    const quote: StockQuote = {
      symbol: baseSymbol,
      name: meta.shortName || meta.longName || meta.symbol || baseSymbol,
      nameKr: koreanNames[baseSymbol],
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      currency: meta.currency || v7Quote?.currency || 'USD',
      marketCap: marketCap || meta.marketCap || v7Quote?.marketCap,
      volume: meta.regularMarketVolume ?? v7Quote?.regularMarketVolume,
      dayHigh: meta.regularMarketDayHigh ?? v7Quote?.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow ?? v7Quote?.regularMarketDayLow,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? v7Quote?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? v7Quote?.fiftyTwoWeekLow,
      pe,
      pbr,
      eps,
      roe,
      dividendYield,
      beta,
    };
    
    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error(`Error fetching quote for ${yahooSymbol}:`, error);
    return null;
  }
}

// Batch fetch multiple quotes
async function fetchQuotesBatch(symbols: string[]): Promise<StockQuote[]> {
  const results: StockQuote[] = [];
  const uncached: string[] = [];
  
  // Check cache first
  for (const symbol of symbols) {
    const yahooSymbol = toYahooSymbol(symbol);
    const cached = getCached<StockQuote>(`quote:${yahooSymbol}`);
    if (cached) {
      results.push(cached);
    } else {
      uncached.push(symbol);
    }
  }
  
  if (uncached.length === 0) {
    return results;
  }
  
  // Fetch uncached in parallel (max 5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(s => fetchQuoteWithMetrics(s)));
    results.push(...batchResults.filter((q: StockQuote | null): q is StockQuote => q !== null));
  }
  
  return results;
}

// Fetch historical data
async function fetchHistory(symbol: string, period: string = '1mo'): Promise<HistoricalData[]> {
  const yahooSymbol = toYahooSymbol(symbol);
  const cacheKey = `history:${yahooSymbol}:${period}`;
  
  const cached = getCached<HistoricalData[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for history ${yahooSymbol}`);
    return cached;
  }
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${period}`;
    
    console.log(`Fetching history for ${yahooSymbol}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch history for ${yahooSymbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return [];
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    const history: HistoricalData[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close?.[i] != null) {
        const date = new Date(timestamps[i] * 1000);
        history.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          open: quotes.open?.[i] || 0,
          high: quotes.high?.[i] || 0,
          low: quotes.low?.[i] || 0,
          close: quotes.close?.[i] || 0,
          volume: quotes.volume?.[i] || 0,
        });
      }
    }
    
    setCache(cacheKey, history);
    return history;
  } catch (error) {
    console.error(`Error fetching history for ${yahooSymbol}:`, error);
    return [];
  }
}

// Fetch news using search API
async function fetchNews(symbol: string): Promise<NewsItem[]> {
  const yahooSymbol = toYahooSymbol(symbol);
  const cacheKey = `news:${yahooSymbol}`;
  
  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for news ${yahooSymbol}`);
    return cached;
  }
  
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${yahooSymbol}&newsCount=10&quotesCount=0`;
    
    console.log(`Fetching news for ${yahooSymbol}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch news for ${yahooSymbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const news = data.news || [];
    
    const newsItems = news.slice(0, 5).map((item: any) => ({
      title: item.title,
      link: item.link,
      publisher: item.publisher,
      publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
      thumbnail: item.thumbnail?.resolutions?.[0]?.url,
    }));
    
    setCache(cacheKey, newsItems);
    return newsItems;
  } catch (error) {
    console.error(`Error fetching news for ${yahooSymbol}:`, error);
    return [];
  }
}

// Search for stocks
async function searchStocks(query: string): Promise<Array<{symbol: string; name: string; type: string}>> {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  const cached = getCached<Array<{symbol: string; name: string; type: string}>>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    
    console.log(`Searching for: ${query}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const quotes = data.quotes || [];
    
    const results = quotes
      .filter((q: any) => q.quoteType === 'EQUITY')
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType,
      }));
    
    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Error searching:`, error);
    return [];
  }
}

// Combined data fetch for initial load
async function fetchAll(symbol: string): Promise<{ quote: StockQuote | null; history: HistoricalData[]; news: NewsItem[] }> {
  const [quote, history, news] = await Promise.all([
    fetchQuoteWithMetrics(symbol),
    fetchHistory(symbol, '1mo'),
    fetchNews(symbol),
  ]);
  
  return { quote, history, news };
}

// Input validation constants
const VALID_PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];
const MAX_SYMBOL_LENGTH = 20;
const MAX_QUERY_LENGTH = 100;
const MAX_SYMBOLS_COUNT = 20;
const SYMBOL_REGEX = /^[A-Z0-9.]+$/i;

// Validation helpers
function isValidSymbol(symbol: string): boolean {
  return symbol.length <= MAX_SYMBOL_LENGTH && SYMBOL_REGEX.test(symbol);
}

function isValidQuery(query: string): boolean {
  return query.length <= MAX_QUERY_LENGTH && query.trim().length > 0;
}

function isValidPeriod(period: string): boolean {
  return VALID_PERIODS.includes(period);
}

function sanitizeSymbols(symbols: string): string[] {
  return symbols
    .split(',')
    .map(s => s.trim())
    .filter(s => isValidSymbol(s))
    .slice(0, MAX_SYMBOLS_COUNT);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'quote';
    const symbol = url.searchParams.get('symbol');
    const symbols = url.searchParams.get('symbols');
    const query = url.searchParams.get('query');
    const periodParam = url.searchParams.get('period') || '1mo';

    // Validate period
    const period = isValidPeriod(periodParam) ? periodParam : '1mo';

    console.log(`Action: ${action}, Symbol: ${symbol}`);

    let result: any;

    switch (action) {
      case 'quote':
        if (!symbol) {
          return new Response(
            JSON.stringify({ error: 'Symbol is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!isValidSymbol(symbol)) {
          return new Response(
            JSON.stringify({ error: 'Invalid symbol format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await fetchQuoteWithMetrics(symbol);
        break;

      case 'quotes':
        if (!symbols) {
          return new Response(
            JSON.stringify({ error: 'Symbols are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const symbolList = sanitizeSymbols(symbols);
        if (symbolList.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No valid symbols provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await fetchQuotesBatch(symbolList);
        break;

      case 'history':
        if (!symbol) {
          return new Response(
            JSON.stringify({ error: 'Symbol is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!isValidSymbol(symbol)) {
          return new Response(
            JSON.stringify({ error: 'Invalid symbol format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await fetchHistory(symbol, period);
        break;

      case 'news':
        if (!symbol) {
          return new Response(
            JSON.stringify({ error: 'Symbol is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!isValidSymbol(symbol)) {
          return new Response(
            JSON.stringify({ error: 'Invalid symbol format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await fetchNews(symbol);
        break;

      case 'search':
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!isValidQuery(query)) {
          return new Response(
            JSON.stringify({ error: 'Invalid query format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await searchStocks(query.trim().slice(0, MAX_QUERY_LENGTH));
        break;

      case 'all':
        if (!symbol) {
          return new Response(
            JSON.stringify({ error: 'Symbol is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!isValidSymbol(symbol)) {
          return new Response(
            JSON.stringify({ error: 'Invalid symbol format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await fetchAll(symbol);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side only
    console.error('Stock data error:', error);
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stock data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});