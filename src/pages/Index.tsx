import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import StockHeader from '@/components/StockHeader';
import QuantMetricsCard from '@/components/QuantMetricsCard';
import PriceChart from '@/components/PriceChart';
import NewsCard from '@/components/NewsCard';
import AgentDecisionCard from '@/components/AgentDecisionCard';
import ReasoningStepCard from '@/components/ReasoningStepCard';
import BacktestChart from '@/components/BacktestChart';

import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStockData, StockQuote, HistoricalData, NewsItem } from '@/hooks/useStockData';

// Default watchlist symbols
const DEFAULT_WATCHLIST = ['005930', '000660', 'AAPL', 'NVDA'];

const Index = () => {
  const { toast } = useToast();
  const { getAll, loading } = useStockData();
  
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSymbol, setCurrentSymbol] = useState<string>(DEFAULT_WATCHLIST[0]);

  // Load all data in one call when symbol changes
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const { quote, history, news } = await getAll(currentSymbol);
        if (quote) {
          setSelectedStock(quote);
          setHistoricalData(history);
          setNewsItems(news);
        }
      } catch (error) {
        console.error('Failed to load stock data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, [currentSymbol, getAll, refreshKey]);

  const handleSelectStock = useCallback((stock: StockQuote) => {
    setCurrentSymbol(stock.symbol);
  }, []);

  const handleAddToWatchlist = useCallback((symbol: string) => {
    const normalizedSymbol = symbol.replace('.KS', '');
    if (!watchlist.includes(normalizedSymbol)) {
      setWatchlist(prev => [...prev, normalizedSymbol]);
      toast({
        title: "관심 종목 추가",
        description: `${normalizedSymbol}이(가) 추가되었습니다.`,
      });
    }
  }, [watchlist, toast]);

  const handleRemoveFromWatchlist = useCallback((symbol: string) => {
    const normalizedSymbol = symbol.replace('.KS', '');
    setWatchlist(prev => prev.filter(s => s !== normalizedSymbol));
    toast({
      title: "관심 종목 제거",
      description: `${normalizedSymbol}이(가) 제거되었습니다.`,
    });
  }, [toast]);

  const handleToggleWatchlist = useCallback((symbol: string) => {
    const normalizedSymbol = symbol.replace('.KS', '');
    if (watchlist.includes(normalizedSymbol)) {
      handleRemoveFromWatchlist(normalizedSymbol);
    } else {
      handleAddToWatchlist(normalizedSymbol);
    }
  }, [watchlist, handleAddToWatchlist, handleRemoveFromWatchlist]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Create metrics from real Yahoo Finance data
  const metrics = useMemo(() => {
    if (!selectedStock) return null;
    
    // Calculate momentum from historical data
    let momentum = 50;
    if (historicalData.length >= 2) {
      const firstPrice = historicalData[0]?.close || 1;
      const lastPrice = historicalData[historicalData.length - 1]?.close || 1;
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      momentum = Math.min(100, Math.max(0, 50 + priceChange * 2));
    }
    
    return {
      per: selectedStock.pe || 0,
      pbr: selectedStock.pbr || 0,
      roe: selectedStock.roe || 0,
      momentum: Math.round(momentum),
      eps: selectedStock.eps || 0,
      dividendYield: selectedStock.dividendYield || 0,
    };
  }, [selectedStock, historicalData]);

  // Calculate agent decision based on real metrics
  const agentDecision = useMemo(() => {
    if (!metrics || !selectedStock) return null;
    
    let quantScore = 50;
    
    // PER analysis
    if (metrics.per > 0 && metrics.per < 15) quantScore += 15;
    else if (metrics.per > 30) quantScore -= 10;
    
    // PBR analysis
    if (metrics.pbr > 0 && metrics.pbr < 1.5) quantScore += 10;
    else if (metrics.pbr > 3) quantScore -= 5;
    
    // ROE analysis
    if (metrics.roe > 15) quantScore += 15;
    else if (metrics.roe > 8) quantScore += 5;
    
    // Momentum analysis
    if (metrics.momentum > 70) quantScore += 10;
    else if (metrics.momentum < 40) quantScore -= 10;
    
    // Dividend analysis
    if (metrics.dividendYield > 2) quantScore += 5;
    
    quantScore = Math.min(100, Math.max(0, quantScore));
    
    // Since we don't have real sentiment, use price momentum as proxy
    const sentimentScore = Math.round(metrics.momentum);
    const finalScore = Math.round(quantScore * 0.7 + sentimentScore * 0.3);
    
    let signal: 'BUY' | 'HOLD' | 'SELL';
    let confidence: number;
    let reasoning: string[];
    
    if (finalScore >= 65) {
      signal = 'BUY';
      confidence = Math.min(90, finalScore + 10);
      reasoning = [];
      if (metrics.per > 0 && metrics.per < 15) reasoning.push(`PER ${metrics.per.toFixed(1)}배로 저평가 상태입니다.`);
      if (metrics.roe > 15) reasoning.push(`ROE ${metrics.roe.toFixed(1)}%로 높은 자본효율성을 보입니다.`);
      if (metrics.momentum > 60) reasoning.push(`최근 가격 모멘텀이 긍정적입니다.`);
      if (reasoning.length === 0) reasoning.push('종합 지표가 매수 신호를 보이고 있습니다.');
    } else if (finalScore >= 40) {
      signal = 'HOLD';
      confidence = 50 + Math.random() * 20;
      reasoning = [
        '현재 가격 수준에서 관망이 적절합니다.',
        metrics.per > 0 ? `PER ${metrics.per.toFixed(1)}배, PBR ${metrics.pbr.toFixed(2)}배로 적정 수준입니다.` : '밸류에이션 데이터를 확인 중입니다.',
        '추가 모니터링이 필요합니다.',
      ];
    } else {
      signal = 'SELL';
      confidence = Math.min(85, 100 - finalScore);
      reasoning = [];
      if (metrics.per > 30) reasoning.push(`PER ${metrics.per.toFixed(1)}배로 고평가 상태입니다.`);
      if (metrics.momentum < 40) reasoning.push('가격 모멘텀이 약화되고 있습니다.');
      if (reasoning.length === 0) reasoning.push('종합 지표가 매도 신호를 보이고 있습니다.');
    }
    
    return {
      signal,
      quantScore: Math.round(quantScore),
      sentimentScore: Math.round(sentimentScore),
      finalScore,
      confidence: Math.round(confidence),
      reasoning,
    };
  }, [metrics, selectedStock]);

  // Convert historical data format for PriceChart
  const priceChartData = useMemo(() => {
    return historicalData.map(d => ({
      date: d.date,
      price: d.close,
      volume: d.volume,
      per: selectedStock?.pe || 0,
      pbr: selectedStock?.pbr || 0,
    }));
  }, [historicalData, selectedStock]);

  // Convert news format for NewsCard
  const formattedNews = useMemo(() => {
    return newsItems.map((item, index) => ({
      id: String(index),
      title: item.title,
      source: item.publisher,
      timestamp: formatTimeAgo(item.publishedAt),
      sentiment: 'neutral' as const,
      score: 0,
      summary: '',
      link: item.link,
    }));
  }, [newsItems]);

  if (isLoading || !selectedStock) {
    return (
      <div className="flex min-h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  const isInWatchlist = watchlist.includes(selectedStock.symbol.replace('.KS', ''));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar 
        selectedStock={selectedStock} 
        onSelectStock={handleSelectStock}
        watchlist={watchlist}
        onAddToWatchlist={handleAddToWatchlist}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
      />
      
      <main className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto">
          <StockHeader 
            key={`header-${refreshKey}`}
            stock={selectedStock} 
            onRefresh={handleRefresh}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={() => handleToggleWatchlist(selectedStock.symbol)}
          />

          {/* 통합 퀀트 분석 대시보드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Charts & Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <PriceChart 
                key={`price-${selectedStock.symbol}-${refreshKey}`}
                data={priceChartData} 
                stock={selectedStock} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metrics && (
                  <QuantMetricsCard 
                    key={`quant-${selectedStock.symbol}-${refreshKey}`}
                    metrics={metrics} 
                  />
                )}
                
                {/* Stock Info Card */}
                <div className="glass-card p-5 animate-fade-in">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">종목 정보</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">시가총액</span>
                      <span className="font-mono text-foreground">
                        {selectedStock.marketCap 
                          ? selectedStock.currency === 'KRW'
                            ? `${(selectedStock.marketCap / 1e12).toFixed(1)}조원`
                            : `$${(selectedStock.marketCap / 1e9).toFixed(1)}B`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">52주 최고</span>
                      <span className="font-mono text-foreground">
                        {selectedStock.fiftyTwoWeekHigh?.toLocaleString() || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">52주 최저</span>
                      <span className="font-mono text-foreground">
                        {selectedStock.fiftyTwoWeekLow?.toLocaleString() || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">거래량</span>
                      <span className="font-mono text-foreground">
                        {selectedStock.volume?.toLocaleString() || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">베타</span>
                      <span className="font-mono text-foreground">
                        {selectedStock.beta?.toFixed(2) || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backtest & Reasoning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BacktestChart 
                  historicalData={historicalData}
                  stockName={selectedStock.nameKr || selectedStock.name}
                />
                
                {metrics && agentDecision && (
                  <ReasoningStepCard 
                    metrics={metrics}
                    sentimentScore={agentDecision.sentimentScore}
                    signal={agentDecision.signal}
                  />
                )}
              </div>

              <NewsCard 
                key={`news-${selectedStock.symbol}-${refreshKey}`}
                news={formattedNews.length > 0 ? formattedNews : undefined} 
              />
            </div>

            {/* Right Column - AI Decision & Status */}
            <div className="space-y-6">
              {agentDecision && (
                <AgentDecisionCard 
                  key={`agent-${selectedStock.symbol}-${refreshKey}`}
                  decision={agentDecision} 
                />
              )}
              
              {/* System Status */}
              <div className="glass-card p-5 animate-fade-in">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  시스템 상태
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">데이터 소스</span>
                    <span className="text-success flex items-center gap-1">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Yahoo Finance
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">시세 데이터</span>
                    <span className="text-success flex items-center gap-1">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      실시간
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">재무 지표</span>
                    <span className="text-success flex items-center gap-1">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      활성
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">마지막 동기화</span>
                    <span className="font-mono text-foreground text-xs">
                      {new Date().toLocaleTimeString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else {
    return `${diffDays}일 전`;
  }
}

export default Index;