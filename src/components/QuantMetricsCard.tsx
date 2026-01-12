import { TrendingUp, Percent, DollarSign, Activity } from 'lucide-react';

interface QuantMetrics {
  per: number;
  pbr: number;
  roe: number;
  momentum: number;
  eps: number;
  dividendYield: number;
}

interface QuantMetricsCardProps {
  metrics: QuantMetrics;
}

const QuantMetricsCard = ({ metrics }: QuantMetricsCardProps) => {
  const metricsData = [
    {
      label: 'PER',
      value: metrics.per > 0 ? metrics.per.toFixed(1) : '-',
      icon: DollarSign,
      description: '주가수익비율',
      status: metrics.per <= 0 ? 'neutral' : metrics.per < 15 ? 'good' : metrics.per > 25 ? 'bad' : 'neutral',
    },
    {
      label: 'PBR',
      value: metrics.pbr > 0 ? metrics.pbr.toFixed(2) : '-',
      icon: Activity,
      description: '주가순자산비율',
      status: metrics.pbr <= 0 ? 'neutral' : metrics.pbr < 1.5 ? 'good' : metrics.pbr > 3 ? 'bad' : 'neutral',
    },
    {
      label: 'ROE',
      value: metrics.roe > 0 ? `${metrics.roe.toFixed(1)}%` : '-',
      icon: Percent,
      description: '자기자본이익률',
      status: metrics.roe <= 0 ? 'neutral' : metrics.roe > 15 ? 'good' : metrics.roe < 8 ? 'bad' : 'neutral',
    },
    {
      label: 'MTM',
      value: metrics.momentum,
      icon: TrendingUp,
      description: '모멘텀',
      status: metrics.momentum > 70 ? 'good' : metrics.momentum < 40 ? 'bad' : 'neutral',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-success';
      case 'bad':
        return 'text-danger';
      default:
        return 'text-warning';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-success/10';
      case 'bad':
        return 'bg-danger/10';
      default:
        return 'bg-warning/10';
    }
  };

  return (
    <div className="glass-card p-5 animate-fade-in overflow-hidden">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">퀀트 지표 분석</span>
        <span className="ml-auto text-xs bg-success/20 text-success px-2 py-0.5 rounded">실시간</span>
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {metricsData.map((metric) => (
          <div
            key={metric.label}
            className={`p-3 rounded-lg ${getStatusBg(metric.status)} border border-border/50 overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground truncate">{metric.description}</span>
              <metric.icon className={`h-3.5 w-3.5 flex-shrink-0 ${getStatusColor(metric.status)}`} />
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-semibold text-foreground">{metric.label}</span>
              <span className={`text-sm font-mono ${getStatusColor(metric.status)}`}>
                {metric.value}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional metrics */}
      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">EPS</div>
          <div className="font-mono text-sm text-foreground">
            {metrics.eps > 0 ? metrics.eps.toLocaleString() : '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">배당률</div>
          <div className="font-mono text-sm text-foreground">
            {metrics.dividendYield > 0 ? `${metrics.dividendYield.toFixed(2)}%` : '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantMetricsCard;