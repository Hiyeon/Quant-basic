import { TrendingUp, TrendingDown, Clock, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StockData {
  symbol: string;
  name: string;
  nameKr?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface StockHeaderProps {
  stock: StockData;
  onRefresh: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
}

const StockHeader = ({ stock, onRefresh, isInWatchlist, onToggleWatchlist }: StockHeaderProps) => {
  const formatPrice = () => {
    if (stock.currency === 'KRW') {
      return `₩${stock.price.toLocaleString()}`;
    }
    return `$${stock.price.toFixed(2)}`;
  };

  const formatChange = () => {
    if (stock.currency === 'KRW') {
      return `${stock.change >= 0 ? '+' : ''}${stock.change.toLocaleString()}`;
    }
    return `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}`;
  };

  return (
    <div className="glass-card p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">
              {stock.nameKr || stock.name}
            </h1>
            <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {stock.symbol}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleWatchlist}
              className="h-8 w-8"
            >
              {isInWatchlist ? (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <Star className="h-5 w-5 text-muted-foreground hover:text-yellow-500" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold font-mono text-foreground">
              {formatPrice()}
            </span>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              stock.change >= 0 
                ? 'bg-success/20 text-success' 
                : 'bg-danger/20 text-danger'
            }`}>
              {stock.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-mono text-sm">
                {formatChange()} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>실시간</span>
            </div>
            <div className="font-mono text-xs mt-1">
              {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="border-border hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockHeader;
