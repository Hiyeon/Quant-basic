import { Search, TrendingUp, TrendingDown, Star, BarChart3, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStockData, StockQuote } from '@/hooks/useStockData';
import { useDebounce } from '@/hooks/useDebounce';

interface SidebarProps {
  selectedStock: StockQuote | null;
  onSelectStock: (stock: StockQuote) => void;
  watchlist: string[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
}

const Sidebar = ({ 
  selectedStock, 
  onSelectStock, 
  watchlist, 
  onAddToWatchlist, 
  onRemoveFromWatchlist 
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{symbol: string; name: string}>>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<StockQuote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { searchStocks, getQuotes, getQuote } = useStockData();

  // Load watchlist stocks
  useEffect(() => {
    const loadWatchlist = async () => {
      if (watchlist.length === 0) {
        setWatchlistStocks([]);
        return;
      }
      
      setIsLoadingWatchlist(true);
      try {
        const quotes = await getQuotes(watchlist);
        setWatchlistStocks(quotes);
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      } finally {
        setIsLoadingWatchlist(false);
      }
    };
    
    loadWatchlist();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadWatchlist, 30000);
    return () => clearInterval(interval);
  }, [watchlist, getQuotes]);

  // Search stocks
  useEffect(() => {
    const search = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchStocks(debouncedSearch);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    search();
  }, [debouncedSearch, searchStocks]);

  const formatPrice = (stock: StockQuote) => {
    if (stock.currency === 'KRW') {
      return `₩${stock.price.toLocaleString()}`;
    }
    return `$${stock.price.toFixed(2)}`;
  };

  const handleSearchFocus = () => setShowSearchResults(true);
  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchResults(false), 200);
  };

  const handleSelectFromSearch = async (result: {symbol: string; name: string}) => {
    const quote = await getQuote(result.symbol);
    if (quote) {
      onSelectStock(quote);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const isInWatchlist = (symbol: string) => watchlist.some(s => 
    s === symbol || s === symbol.replace('.KS', '') || `${s}.KS` === symbol
  );

  const handleToggleWatchlist = (symbol: string) => {
    // Normalize symbol for comparison
    const normalizedSymbol = symbol.replace('.KS', '');
    if (isInWatchlist(symbol)) {
      onRemoveFromWatchlist(normalizedSymbol);
    } else {
      onAddToWatchlist(normalizedSymbol);
    }
  };

  const StockItem = ({ stock, showWatchlistButton = false }: { stock: StockQuote; showWatchlistButton?: boolean }) => (
    <div
      className={cn(
        "w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-2",
        selectedStock?.symbol === stock.symbol
          ? 'bg-primary/10 border border-primary/30 glow-primary'
          : 'hover:bg-sidebar-accent border border-transparent'
      )}
    >
      <button
        onClick={() => onSelectStock(stock)}
        className="flex-1 text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground text-sm">
              {stock.nameKr || stock.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stock.symbol.replace('.KS', '')}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-foreground">
              {formatPrice(stock)}
            </div>
            <div className={cn(
              "flex items-center justify-end gap-1 text-xs mt-0.5",
              stock.change >= 0 ? 'ticker-positive' : 'ticker-negative'
            )}>
              {stock.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </button>
      {showWatchlistButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromWatchlist(stock.symbol.replace('.KS', ''));
          }}
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">AI Quant</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="종목 검색 (예: 삼성전자, AAPL)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="pl-10 bg-sidebar-accent border-sidebar-border text-foreground placeholder:text-muted-foreground"
          />
          
          {/* Search Results Dropdown */}
          {showSearchResults && (searchResults.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.symbol}
                    className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectFromSearch(result)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-xs text-muted-foreground">{result.symbol}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWatchlist(result.symbol);
                      }}
                    >
                      {isInWatchlist(result.symbol) ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Watchlist */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-3">
          <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Star className="h-3.5 w-3.5" />
            관심 종목 ({watchlistStocks.length})
          </div>
          <div className="space-y-1 mt-2">
            {isLoadingWatchlist ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : watchlistStocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                관심 종목이 없습니다.<br />
                검색하여 추가해보세요.
              </div>
            ) : (
              watchlistStocks.map((stock) => (
                <StockItem key={stock.symbol} stock={stock} showWatchlistButton />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground text-center">
          실시간 데이터 • 30초마다 갱신
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
