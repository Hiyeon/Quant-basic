import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, Award, Calendar } from 'lucide-react';
import { useMemo } from 'react';

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestChartProps {
  historicalData: HistoricalData[];
  stockName: string;
}

const BacktestChart = ({ historicalData, stockName }: BacktestChartProps) => {
  // Calculate backtest data from real historical data
  const { backtestData, metrics } = useMemo(() => {
    if (historicalData.length < 2) {
      return { 
        backtestData: [], 
        metrics: { totalReturn: 0, maxDrawdown: 0, sharpeRatio: 0, volatility: 0 } 
      };
    }

    const startPrice = historicalData[0].close;
    let maxValue = 100;
    let maxDrawdown = 0;
    const returns: number[] = [];

    const data = historicalData.map((d, i) => {
      const normalizedValue = (d.close / startPrice) * 100;
      maxValue = Math.max(maxValue, normalizedValue);
      const drawdown = ((normalizedValue - maxValue) / maxValue) * 100;
      maxDrawdown = Math.min(maxDrawdown, drawdown);

      if (i > 0) {
        const dailyReturn = (d.close - historicalData[i - 1].close) / historicalData[i - 1].close;
        returns.push(dailyReturn);
      }

      return {
        date: d.date,
        value: Math.round(normalizedValue * 100) / 100,
        drawdown: Math.round(drawdown * 100) / 100,
      };
    });

    const totalReturn = ((historicalData[historicalData.length - 1].close - startPrice) / startPrice) * 100;
    
    // Calculate Sharpe Ratio (annualized)
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) 
      : 1;
    const annualizedReturn = avgReturn * 252;
    const annualizedStdDev = stdDev * Math.sqrt(252);
    const sharpeRatio = annualizedStdDev > 0 ? (annualizedReturn - 0.02) / annualizedStdDev : 0;
    const volatility = annualizedStdDev * 100;

    return {
      backtestData: data,
      metrics: {
        totalReturn: Math.round(totalReturn * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
      }
    };
  }, [historicalData]);

  if (backtestData.length === 0) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          수익률 분석
        </h3>
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {stockName} 수익률 분석
          <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded">실제 데이터</span>
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          최근 {backtestData.length}일
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3 bg-secondary/30 rounded-lg text-center overflow-hidden">
          <div className={`text-lg sm:text-xl font-bold font-mono truncate ${metrics.totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
            {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">누적 수익률</div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg text-center overflow-hidden">
          <div className="text-lg sm:text-xl font-bold font-mono text-danger truncate">
            {metrics.maxDrawdown.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">MDD</span>
          </div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg text-center overflow-hidden">
          <div className={`text-lg sm:text-xl font-bold font-mono truncate ${metrics.sharpeRatio >= 1 ? 'text-success' : metrics.sharpeRatio >= 0.5 ? 'text-warning' : 'text-danger'}`}>
            {metrics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Award className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">샤프</span>
          </div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg text-center overflow-hidden">
          <div className="text-lg sm:text-xl font-bold font-mono text-chart-line truncate">
            {metrics.volatility.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">변동성</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={backtestData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={Math.floor(backtestData.length / 5)}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value.toFixed(1)}`, '수익률 (%)']}
            />
            <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#valueGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Chart */}
      <div className="border-t border-border/50 pt-4">
        <div className="text-xs text-muted-foreground mb-2">Drawdown</div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={backtestData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 2', 0]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Drawdown']}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="hsl(var(--danger))"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Note */}
      <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
        * 실제 Yahoo Finance 히스토리컬 데이터 기반 분석. 과거 수익률은 미래 수익을 보장하지 않습니다.
      </div>
    </div>
  );
};

export default BacktestChart;