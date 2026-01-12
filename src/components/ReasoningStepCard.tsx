import { Brain, ChevronRight, Lightbulb, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface QuantMetrics {
  per: number;
  pbr: number;
  roe: number;
  momentum: number;
  eps: number;
  dividendYield: number;
}

interface ReasoningStep {
  step: number;
  type: 'analysis' | 'observation' | 'conclusion' | 'warning';
  title: string;
  content: string;
}

interface ReasoningStepCardProps {
  metrics: QuantMetrics;
  sentimentScore: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
}

const ReasoningStepCard = ({ metrics, sentimentScore, signal }: ReasoningStepCardProps) => {
  const hasValuationData = metrics.pbr > 0 || metrics.per > 0;
  const hasProfitabilityData = metrics.roe > 0 || metrics.eps > 0 || metrics.dividendYield > 0;

  const generateReasoningSteps = (): ReasoningStep[] => {
    const steps: ReasoningStep[] = [];
    
    // Step 1: Valuation Analysis
    let valuationContent = '';
    let valuationType: ReasoningStep['type'] = 'analysis';
    
    if (metrics.pbr > 0 && metrics.per > 0) {
      const pbrStatus = metrics.pbr < 1.5 ? '저평가' : metrics.pbr > 3 ? '고평가' : '적정';
      const perStatus = metrics.per < 15 ? '매력적인 수준' : metrics.per > 25 ? '다소 부담스러운 수준' : '적정 수준';
      valuationContent = `PBR ${metrics.pbr.toFixed(2)}배로 ${pbrStatus} 상태입니다. PER ${metrics.per.toFixed(1)}배는 ${perStatus}으로 판단됩니다.`;
    } else if (metrics.per > 0) {
      const perStatus = metrics.per < 15 ? '매력적인 수준' : metrics.per > 25 ? '다소 부담스러운 수준' : '적정 수준';
      valuationContent = `PER ${metrics.per.toFixed(1)}배로 ${perStatus}입니다. PBR 데이터는 제공되지 않습니다.`;
    } else if (metrics.pbr > 0) {
      const pbrStatus = metrics.pbr < 1.5 ? '저평가' : metrics.pbr > 3 ? '고평가' : '적정';
      valuationContent = `PBR ${metrics.pbr.toFixed(2)}배로 ${pbrStatus} 상태입니다. PER 데이터는 제공되지 않습니다.`;
    } else {
      valuationContent = '밸류에이션 데이터(PER, PBR)가 제공되지 않습니다. 모멘텀 지표를 중심으로 분석합니다.';
      valuationType = 'warning';
    }
    
    steps.push({
      step: 1,
      type: valuationType,
      title: '밸류에이션 분석',
      content: valuationContent,
    });
    
    // Step 2: Profitability Analysis
    let profitabilityContent = '';
    let profitabilityType: ReasoningStep['type'] = 'observation';
    
    if (metrics.roe > 0) {
      const roeStatus = metrics.roe > 15 ? '우수한 자본 효율성을 보여줍니다' : metrics.roe > 8 ? '양호한 수준입니다' : '개선이 필요합니다';
      profitabilityContent = `ROE ${metrics.roe.toFixed(1)}%로 ${roeStatus}.`;
      
      if (metrics.dividendYield > 0) {
        const dividendStatus = metrics.dividendYield > 2 ? '매력적인' : '보통 수준의';
        profitabilityContent += ` 배당수익률 ${metrics.dividendYield.toFixed(2)}%로 ${dividendStatus} 주주환원 정책을 보입니다.`;
      }
    } else if (metrics.eps > 0) {
      profitabilityContent = `EPS ${metrics.eps.toLocaleString()}${metrics.eps > 100 ? '원' : ''}으로 수익을 창출 중입니다.`;
      if (metrics.dividendYield > 0) {
        profitabilityContent += ` 배당수익률은 ${metrics.dividendYield.toFixed(2)}%입니다.`;
      }
    } else if (metrics.dividendYield > 0) {
      profitabilityContent = `배당수익률 ${metrics.dividendYield.toFixed(2)}%를 제공합니다. ROE, EPS 데이터는 제공되지 않습니다.`;
    } else {
      profitabilityContent = '수익성 지표(ROE, EPS, 배당률)가 제공되지 않습니다. 가격 모멘텀으로 분석을 보완합니다.';
      profitabilityType = 'warning';
    }
    
    steps.push({
      step: 2,
      type: profitabilityType,
      title: '수익성 지표 검토',
      content: profitabilityContent,
    });
    
    // Step 3: Momentum Analysis (always available from price data)
    const momentumStatus = metrics.momentum > 70 ? '강한 상승 추세를' : metrics.momentum > 50 ? '중립적인 흐름을' : '약한 모멘텀을';
    const momentumAdvice = metrics.momentum > 70 ? '단기 추가 상승 여력이 있습니다.' : metrics.momentum > 50 ? '추세를 주시해야 합니다.' : '추세 전환 신호를 기다려야 합니다.';
    
    steps.push({
      step: 3,
      type: metrics.momentum < 40 ? 'warning' : 'observation',
      title: '모멘텀 평가',
      content: `가격 모멘텀 지표 ${metrics.momentum}점은 ${momentumStatus} 시사합니다. ${momentumAdvice}`,
    });
    
    // Step 4: Conclusion
    let conclusionContent = '';
    const dataQuality = hasValuationData && hasProfitabilityData ? '종합' : hasProfitabilityData || hasValuationData ? '제한적' : '모멘텀 중심';
    
    if (signal === 'BUY') {
      conclusionContent = hasValuationData 
        ? `${dataQuality} 분석 결과, 밸류에이션과 모멘텀이 긍정적입니다. 분할 매수를 검토할 수 있습니다.`
        : `모멘텀이 강세입니다. 다만, 재무 데이터가 부족하여 추가 리서치 후 매수를 권장합니다.`;
    } else if (signal === 'SELL') {
      conclusionContent = hasValuationData
        ? `밸류에이션 부담 또는 약한 모멘텀을 고려할 때, 포지션 축소를 검토해야 합니다.`
        : `모멘텀이 약세입니다. 재무 데이터 확인 후 신중한 결정을 권장합니다.`;
    } else {
      conclusionContent = `현재 가격 수준에서 관망이 적절합니다. ${!hasValuationData ? '재무 데이터가 제한적이므로 ' : ''}추가 모니터링이 필요합니다.`;
    }
    
    steps.push({
      step: 4,
      type: 'conclusion',
      title: '종합 판단',
      content: conclusionContent,
    });
    
    return steps;
  };

  const steps = generateReasoningSteps();

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return Lightbulb;
      case 'observation':
        return Target;
      case 'warning':
        return AlertTriangle;
      case 'conclusion':
        return CheckCircle;
      default:
        return Brain;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'text-chart-line bg-chart-line/10 border-chart-line/30';
      case 'observation':
        return 'text-muted-foreground bg-secondary/30 border-border/30';
      case 'warning':
        return 'text-warning bg-warning/10 border-warning/30';
      case 'conclusion':
        return 'text-primary bg-primary/10 border-primary/30';
      default:
        return 'text-muted-foreground bg-secondary/30 border-border/30';
    }
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Brain className="h-4 w-4" />
          투자 분석 근거
        </h3>
        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">실제 데이터 기반</span>
      </div>

      {/* Reasoning Chain */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border/50" />
        
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = getStepIcon(step.type);
            const colorClass = getStepColor(step.type);
            
            return (
              <div key={step.step} className="relative flex gap-4">
                {/* Step Indicator */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                {/* Step Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">Step {step.step}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{step.title}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {step.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        * Yahoo Finance 실시간 데이터 기반 분석. 투자 결정은 본인 책임 하에 이루어져야 합니다.
      </div>
    </div>
  );
};

export default ReasoningStepCard;