import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Loader2, Sparkles, TrendingUp, TrendingDown, Minus, Send, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface SentimentResult {
  label: string;
  score: number;
}

interface AnalysisResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  timestamp: Date;
}

const sampleTexts = [
  "삼성전자가 HBM3E 양산을 본격화하며 AI 반도체 시장 점유율 확대를 가속화하고 있다.",
  "중국 시장 불확실성 지속으로 수출 기업들의 실적 악화가 우려된다.",
  "SK하이닉스의 분기 실적이 시장 예상치에 부합했다.",
  "Apple Vision Pro sales exceed expectations with 15% growth.",
  "EU regulators fine tech company for antitrust violations.",
];

const FinBERTAnalyzer = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const classifierRef = useRef<any>(null);
  const [deviceType, setDeviceType] = useState<string>('wasm');

  // Load the model
  const loadModel = useCallback(async () => {
    if (classifierRef.current || isModelLoading) return;
    
    setIsModelLoading(true);
    setModelProgress(0);
    
    try {
      const { pipeline, env } = await import('@huggingface/transformers');
      
      // Configure for browser usage
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      
      // Try WebGPU first, fallback to WASM
      let device: 'webgpu' | 'wasm' = 'wasm';
      try {
        if ('gpu' in navigator) {
          const gpu = await (navigator as any).gpu?.requestAdapter();
          if (gpu) {
            device = 'webgpu';
            setDeviceType('webgpu');
          }
        }
      } catch {
        device = 'wasm';
        setDeviceType('wasm');
      }
      
      // Use a financial sentiment model (FinBERT-based)
      // Using a smaller quantized model for browser performance
      const classifier = await pipeline(
        'text-classification',
        'Xenova/finbert',
        { 
          device,
          progress_callback: (progress: any) => {
            if (progress.status === 'progress' && progress.progress) {
              setModelProgress(Math.round(progress.progress));
            }
          }
        }
      );
      
      classifierRef.current = classifier;
      setModelReady(true);
      toast.success('FinBERT 모델 로드 완료!');
    } catch (error) {
      console.error('Model loading error:', error);
      toast.error('모델 로드 실패. 새로고침 후 다시 시도해주세요.');
    } finally {
      setIsModelLoading(false);
    }
  }, [isModelLoading]);

  // Analyze text
  const analyzeText = async () => {
    if (!inputText.trim()) {
      toast.error('분석할 텍스트를 입력해주세요.');
      return;
    }

    if (!classifierRef.current) {
      toast.error('모델이 아직 로드되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    
    try {
      const output = await classifierRef.current(inputText, { topk: 3 });
      
      // Parse results
      const scores = {
        positive: 0,
        negative: 0,
        neutral: 0,
      };
      
      output.forEach((result: SentimentResult) => {
        const label = result.label.toLowerCase();
        if (label.includes('positive')) {
          scores.positive = result.score;
        } else if (label.includes('negative')) {
          scores.negative = result.score;
        } else {
          scores.neutral = result.score;
        }
      });
      
      const maxScore = Math.max(scores.positive, scores.negative, scores.neutral);
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (maxScore === scores.positive) sentiment = 'positive';
      else if (maxScore === scores.negative) sentiment = 'negative';
      
      const newResult: AnalysisResult = {
        text: inputText,
        sentiment,
        scores,
        timestamp: new Date(),
      };
      
      setResults(prev => [newResult, ...prev].slice(0, 10));
      setInputText('');
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-danger" />;
      default:
        return <Minus className="h-5 w-5 text-warning" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-success bg-success/10 border-success/30';
      case 'negative':
        return 'text-danger bg-danger/10 border-danger/30';
      default:
        return 'text-warning bg-warning/10 border-warning/30';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '긍정';
      case 'negative':
        return '부정';
      default:
        return '중립';
    }
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Brain className="h-4 w-4" />
          FinBERT 실시간 감성 분석
        </h3>
        <div className="flex items-center gap-2">
          {modelReady && (
            <span className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded text-xs text-success">
              <Zap className="h-3 w-3" />
              {deviceType === 'webgpu' ? 'WebGPU' : 'WASM'}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Model: ProsusAI/finbert
          </span>
        </div>
      </div>

      {/* Model Loading Section */}
      {!modelReady && (
        <div className="mb-5 p-4 bg-secondary/30 rounded-lg border border-border/30">
          {isModelLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-foreground">FinBERT 모델 로딩 중...</span>
              </div>
              <Progress value={modelProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                처음 로드 시 약 100MB의 모델을 다운로드합니다. 이후에는 캐시되어 빠르게 로드됩니다.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground mb-1">
                  브라우저에서 FinBERT 모델 실행
                </div>
                <p className="text-xs text-muted-foreground">
                  금융 뉴스 감성 분석을 위한 사전 훈련된 BERT 모델
                </p>
              </div>
              <Button onClick={loadModel} className="gap-2">
                <Sparkles className="h-4 w-4" />
                모델 로드
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Input Section */}
      {modelReady && (
        <div className="mb-5">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="분석할 금융 뉴스 또는 텍스트를 입력하세요..."
            className="min-h-24 bg-secondary/30 border-border/50 resize-none mb-3"
          />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {sampleTexts.slice(0, 3).map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(text)}
                  className="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors truncate max-w-48"
                >
                  {text.slice(0, 30)}...
                </button>
              ))}
            </div>
            <Button onClick={analyzeText} disabled={isLoading || !inputText.trim()} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              분석
            </Button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">분석 결과</div>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getSentimentColor(result.sentiment)}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(result.sentiment)}
                    <span className="font-medium">{getSentimentLabel(result.sentiment)}</span>
                    <span className="text-xs opacity-70">
                      ({(Math.max(result.scores.positive, result.scores.negative, result.scores.neutral) * 100).toFixed(1)}% 신뢰도)
                    </span>
                  </div>
                  <span className="text-xs opacity-60">
                    {result.timestamp.toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                
                <p className="text-sm mb-3 opacity-90">{result.text}</p>
                
                {/* Score Bars */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>긍정</span>
                      <span className="font-mono">{(result.scores.positive * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all"
                        style={{ width: `${result.scores.positive * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>중립</span>
                      <span className="font-mono">{(result.scores.neutral * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning transition-all"
                        style={{ width: `${result.scores.neutral * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>부정</span>
                      <span className="font-mono">{(result.scores.negative * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-danger transition-all"
                        style={{ width: `${result.scores.negative * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {modelReady && results.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-chart-line/10 rounded-lg border border-chart-line/20">
          <AlertCircle className="h-4 w-4 text-chart-line mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">FinBERT</span>는 금융 뉴스 및 리포트에 특화된 
            BERT 모델입니다. 영어와 한국어 텍스트 모두 분석 가능하며, 
            모든 처리는 브라우저에서 로컬로 수행됩니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default FinBERTAnalyzer;
