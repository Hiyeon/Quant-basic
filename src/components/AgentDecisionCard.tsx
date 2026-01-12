import { Brain, TrendingUp, TrendingDown, Minus, Sparkles, CheckCircle2 } from 'lucide-react';
import { AgentDecision } from '@/data/mockData';
import { Progress } from '@/components/ui/progress';

interface AgentDecisionCardProps {
  decision: AgentDecision;
}

const AgentDecisionCard = ({ decision }: AgentDecisionCardProps) => {
  const getSignalStyle = () => {
    switch (decision.signal) {
      case 'BUY':
        return {
          bg: 'signal-buy glow-success',
          icon: TrendingUp,
          text: '매수',
          color: 'text-success',
        };
      case 'SELL':
        return {
          bg: 'signal-sell glow-danger',
          icon: TrendingDown,
          text: '매도',
          color: 'text-danger',
        };
      default:
        return {
          bg: 'signal-hold',
          icon: Minus,
          text: '관망',
          color: 'text-warning',
        };
    }
  };

  const style = getSignalStyle();
  const Icon = style.icon;

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4" />
        AI 에이전트 투자 결정
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
      </h3>

      {/* Main Signal */}
      <div className={`rounded-xl p-6 ${style.bg} mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-background/20`}>
              <Icon className={`h-8 w-8 ${style.color}`} />
            </div>
            <div>
              <div className={`text-3xl font-bold ${style.color}`}>{style.text}</div>
              <div className="text-sm opacity-80">투자 시그널</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold font-mono ${style.color}`}>
              {decision.finalScore}
            </div>
            <div className="text-sm opacity-80">종합 점수</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4 mb-5">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">퀀트 점수 (가중치 60%)</span>
            <span className="font-mono text-foreground">{decision.quantScore}/100</span>
          </div>
          <Progress value={decision.quantScore} className="h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">감성 점수 (가중치 40%)</span>
            <span className="font-mono text-foreground">{decision.sentimentScore}/100</span>
          </div>
          <Progress value={decision.sentimentScore} className="h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">신뢰도</span>
            <span className={`font-mono ${decision.confidence >= 70 ? 'text-success' : 'text-warning'}`}>
              {decision.confidence}%
            </span>
          </div>
          <Progress value={decision.confidence} className="h-2" />
        </div>
      </div>

      {/* Reasoning */}
      <div className="border-t border-border/50 pt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">AI 분석 근거</div>
        <div className="space-y-2">
          {decision.reasoning.map((reason, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-foreground/90">
              <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.color}`} />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground italic">
          * 본 분석은 AI 알고리즘에 의해 생성된 참고 자료이며, 실제 투자 결정의 근거가 될 수 없습니다.
        </p>
      </div>
    </div>
  );
};

export default AgentDecisionCard;
