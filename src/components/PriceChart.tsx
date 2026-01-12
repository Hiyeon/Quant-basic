import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface HistoricalData {
  date: string;
  price: number;
  volume: number;
  per?: number;
  pbr?: number;
}

interface StockData {
  symbol: string;
  name: string;
  nameKr?: string;
  currency: string;
}

interface PriceChartProps {
  data: HistoricalData[];
  stock: StockData;
}

const PriceChart = ({ data, stock }: PriceChartProps) => {
  const formatPrice = (value: number) => {
    if (stock.currency === 'KRW') {
      return `₩${value.toLocaleString()}`;
    }
    return `$${value.toFixed(2)}`;
  };

  const avgPrice = data.reduce((sum, d) => sum + d.price, 0) / data.length;

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          가격 추이 (30일)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">평균:</span>
          <span className="font-mono text-sm text-foreground">{formatPrice(avgPrice)}</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-line))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--chart-line))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => stock.currency === 'KRW' ? `${(value/1000).toFixed(0)}K` : `$${value}`}
              domain={['dataMin - 5%', 'dataMax + 5%']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatPrice(value), '가격']}
            />
            <ReferenceLine 
              y={avgPrice} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5" 
              opacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--chart-line))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-line))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
