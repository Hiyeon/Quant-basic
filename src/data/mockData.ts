export interface Stock {
  symbol: string;
  name: string;
  nameKr?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface PortfolioHolding extends Stock {
  sector: string;
  weight: number;
  targetWeight: number;
  shares: number;
  avgPrice: number;
}

export interface QuantMetrics {
  per: number;
  pbr: number;
  roe: number;
  momentum: number;
  eps: number;
  dividendYield: number;
}

export interface SentimentData {
  date: string;
  score: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
}

export interface HistoricalData {
  date: string;
  price: number;
  volume: number;
  per: number;
  pbr: number;
}

export interface AgentDecision {
  signal: 'BUY' | 'HOLD' | 'SELL';
  quantScore: number;
  sentimentScore: number;
  finalScore: number;
  confidence: number;
  reasoning: string[];
}

// 전체 종목 데이터베이스
export const allStocks: Stock[] = [
  // 한국 주식
  { symbol: '005930', name: 'Samsung Electronics', nameKr: '삼성전자', price: 78500, change: 1200, changePercent: 1.55, currency: 'KRW' },
  { symbol: '000660', name: 'SK Hynix', nameKr: 'SK하이닉스', price: 178000, change: 4500, changePercent: 2.59, currency: 'KRW' },
  { symbol: '373220', name: 'LG Energy Solution', nameKr: 'LG에너지솔루션', price: 385000, change: -5000, changePercent: -1.28, currency: 'KRW' },
  { symbol: '035420', name: 'Naver Corp.', nameKr: '네이버', price: 215500, change: -3000, changePercent: -1.37, currency: 'KRW' },
  { symbol: '035720', name: 'Kakao Corp.', nameKr: '카카오', price: 48500, change: 850, changePercent: 1.78, currency: 'KRW' },
  { symbol: '006400', name: 'Samsung SDI', nameKr: '삼성SDI', price: 445000, change: -8000, changePercent: -1.77, currency: 'KRW' },
  { symbol: '207940', name: 'Samsung Biologics', nameKr: '삼성바이오로직스', price: 820000, change: 15000, changePercent: 1.86, currency: 'KRW' },
  { symbol: '068270', name: 'Celltrion', nameKr: '셀트리온', price: 192000, change: -3500, changePercent: -1.79, currency: 'KRW' },
  { symbol: '105560', name: 'KB Financial', nameKr: 'KB금융', price: 62000, change: 1100, changePercent: 1.81, currency: 'KRW' },
  { symbol: '055550', name: 'Shinhan Financial', nameKr: '신한지주', price: 45000, change: 500, changePercent: 1.12, currency: 'KRW' },
  { symbol: '066570', name: 'LG Electronics', nameKr: 'LG전자', price: 98500, change: 2100, changePercent: 2.18, currency: 'KRW' },
  { symbol: '051910', name: 'LG Chem', nameKr: 'LG화학', price: 385000, change: -6500, changePercent: -1.66, currency: 'KRW' },
  { symbol: '017670', name: 'SK Telecom', nameKr: 'SK텔레콤', price: 52800, change: 800, changePercent: 1.54, currency: 'KRW' },
  { symbol: '030200', name: 'KT Corp.', nameKr: 'KT', price: 38500, change: -200, changePercent: -0.52, currency: 'KRW' },
  { symbol: '003550', name: 'LG Corp.', nameKr: 'LG', price: 78000, change: 1500, changePercent: 1.96, currency: 'KRW' },
  { symbol: '012330', name: 'Hyundai Mobis', nameKr: '현대모비스', price: 245000, change: 3500, changePercent: 1.45, currency: 'KRW' },
  { symbol: '005380', name: 'Hyundai Motor', nameKr: '현대차', price: 185000, change: 2800, changePercent: 1.54, currency: 'KRW' },
  { symbol: '000270', name: 'Kia Corp.', nameKr: '기아', price: 92500, change: 1200, changePercent: 1.31, currency: 'KRW' },
  { symbol: '028260', name: 'Samsung C&T', nameKr: '삼성물산', price: 125000, change: -1500, changePercent: -1.19, currency: 'KRW' },
  { symbol: '096770', name: 'SK Innovation', nameKr: 'SK이노베이션', price: 112000, change: -2500, changePercent: -2.18, currency: 'KRW' },
  // 미국 주식
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: -2.31, changePercent: -1.28, currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 12.45, changePercent: 1.44, currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 3.22, changePercent: 0.86, currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 191.24, change: 2.87, changePercent: 1.52, currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 5.75, changePercent: 2.37, currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 186.20, change: 1.85, changePercent: 1.00, currency: 'USD' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.75, change: 8.25, changePercent: 1.66, currency: 'USD' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 145.80, change: 3.20, changePercent: 2.24, currency: 'USD' },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 625.40, change: -8.60, changePercent: -1.36, currency: 'USD' },
  { symbol: 'INTC', name: 'Intel Corp.', price: 42.35, change: -0.85, changePercent: -1.97, currency: 'USD' },
  { symbol: 'CRM', name: 'Salesforce Inc.', price: 275.60, change: 4.15, changePercent: 1.53, currency: 'USD' },
  { symbol: 'ORCL', name: 'Oracle Corp.', price: 125.80, change: 1.90, changePercent: 1.53, currency: 'USD' },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 525.40, change: -6.20, changePercent: -1.17, currency: 'USD' },
  { symbol: 'PYPL', name: 'PayPal Holdings', price: 62.45, change: 0.85, changePercent: 1.38, currency: 'USD' },
  { symbol: 'V', name: 'Visa Inc.', price: 275.30, change: 2.40, changePercent: 0.88, currency: 'USD' },
  { symbol: 'MA', name: 'Mastercard Inc.', price: 458.20, change: 5.80, changePercent: 1.28, currency: 'USD' },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 195.60, change: 2.10, changePercent: 1.09, currency: 'USD' },
  { symbol: 'BAC', name: 'Bank of America', price: 35.80, change: 0.45, changePercent: 1.27, currency: 'USD' },
  { symbol: 'DIS', name: 'Walt Disney Co.', price: 98.45, change: -1.25, changePercent: -1.25, currency: 'USD' },
  { symbol: 'UBER', name: 'Uber Technologies', price: 72.35, change: 1.65, changePercent: 2.33, currency: 'USD' },
];

// 기본 관심 종목 심볼
export const defaultWatchlistSymbols: string[] = [
  '005930', '000660', 'AAPL', 'NVDA'
];

export const getQuantMetrics = (symbol: string): QuantMetrics => {
  const metricsMap: Record<string, QuantMetrics> = {
    '005930': { per: 12.5, pbr: 1.2, roe: 9.8, momentum: 72, eps: 6280, dividendYield: 2.1 },
    '000660': { per: 8.2, pbr: 1.5, roe: 18.2, momentum: 78, eps: 21707, dividendYield: 1.2 },
    '373220': { per: 85.3, pbr: 5.2, roe: 6.1, momentum: 35, eps: 4512, dividendYield: 0.0 },
    '006400': { per: 42.1, pbr: 1.8, roe: 4.3, momentum: 28, eps: 10571, dividendYield: 0.3 },
    '207940': { per: 58.2, pbr: 8.5, roe: 14.6, momentum: 62, eps: 14089, dividendYield: 0.0 },
    '068270': { per: 25.4, pbr: 2.1, roe: 8.3, momentum: 55, eps: 7559, dividendYield: 0.5 },
    '105560': { per: 5.8, pbr: 0.5, roe: 8.6, momentum: 68, eps: 10690, dividendYield: 5.2 },
    '055550': { per: 5.2, pbr: 0.4, roe: 7.7, momentum: 65, eps: 8654, dividendYield: 5.8 },
    '035420': { per: 22.1, pbr: 1.8, roe: 8.2, momentum: 45, eps: 9752, dividendYield: 0.4 },
    '035720': { per: 35.8, pbr: 1.5, roe: 4.2, momentum: 32, eps: 1354, dividendYield: 0.0 },
    'AAPL': { per: 28.4, pbr: 45.2, roe: 147.3, momentum: 65, eps: 6.29, dividendYield: 0.5 },
    'NVDA': { per: 65.3, pbr: 32.1, roe: 56.8, momentum: 89, eps: 13.41, dividendYield: 0.03 },
    'MSFT': { per: 35.2, pbr: 12.8, roe: 38.5, momentum: 71, eps: 10.76, dividendYield: 0.8 },
    'GOOGL': { per: 24.8, pbr: 6.5, roe: 28.4, momentum: 68, eps: 7.71, dividendYield: 0.5 },
    'TSLA': { per: 72.5, pbr: 14.2, roe: 19.6, momentum: 82, eps: 3.43, dividendYield: 0.0 },
    'AMZN': { per: 58.2, pbr: 8.1, roe: 13.9, momentum: 58, eps: 3.20, dividendYield: 0.0 },
    '066570': { per: 15.2, pbr: 0.9, roe: 5.9, momentum: 52, eps: 6480, dividendYield: 1.8 },
    '051910': { per: 28.5, pbr: 1.4, roe: 4.9, momentum: 38, eps: 13509, dividendYield: 2.1 },
    '017670': { per: 9.8, pbr: 1.0, roe: 10.2, momentum: 48, eps: 5388, dividendYield: 4.5 },
    '030200': { per: 8.5, pbr: 0.6, roe: 7.1, momentum: 42, eps: 4529, dividendYield: 5.2 },
  };
  return metricsMap[symbol] || { per: 15, pbr: 1.5, roe: 12, momentum: 50, eps: 1000, dividendYield: 1.5 };
};

export const getSentimentHistory = (symbol: string): SentimentData[] => {
  const baseData = [
    { date: '12/01', score: 62, positive: 45, negative: 20, neutral: 35 },
    { date: '12/08', score: 58, positive: 38, negative: 28, neutral: 34 },
    { date: '12/15', score: 71, positive: 52, negative: 15, neutral: 33 },
    { date: '12/22', score: 65, positive: 48, negative: 22, neutral: 30 },
    { date: '12/29', score: 74, positive: 55, negative: 12, neutral: 33 },
    { date: '01/05', score: 68, positive: 50, negative: 18, neutral: 32 },
    { date: '01/12', score: 72, positive: 53, negative: 14, neutral: 33 },
  ];
  return baseData;
};

export const getNewsItems = (symbol: string): NewsItem[] => {
  const newsMap: Record<string, NewsItem[]> = {
    '005930': [
      { id: '1', title: '삼성전자, AI 반도체 생산량 확대 발표', source: '한국경제', timestamp: '2시간 전', sentiment: 'positive', score: 0.82, summary: '삼성전자가 2025년 AI 반도체 생산량을 50% 확대하겠다고 발표했습니다.' },
      { id: '2', title: 'HBM3E 양산 본격화, 수익성 개선 기대', source: '매일경제', timestamp: '4시간 전', sentiment: 'positive', score: 0.75, summary: 'HBM3E 양산이 본격화되면서 삼성전자의 반도체 부문 수익성 개선이 예상됩니다.' },
      { id: '3', title: '중국 시장 불확실성 지속', source: '조선일보', timestamp: '6시간 전', sentiment: 'negative', score: -0.45, summary: '미중 갈등 심화로 중국 시장에서의 불확실성이 지속되고 있습니다.' },
    ],
    '373220': [
      { id: '1', title: 'LG에너지솔루션, 북미 배터리 공장 증설 발표', source: '한국경제', timestamp: '3시간 전', sentiment: 'positive', score: 0.72, summary: '북미 전기차 시장 성장에 대응하여 생산능력 확대를 추진합니다.' },
      { id: '2', title: '배터리 원자재 가격 하락으로 수익성 개선 전망', source: '매일경제', timestamp: '5시간 전', sentiment: 'positive', score: 0.68, summary: '리튬 가격 안정화로 원가 부담이 줄어들 전망입니다.' },
      { id: '3', title: '전기차 수요 둔화 우려', source: '조선비즈', timestamp: '7시간 전', sentiment: 'negative', score: -0.55, summary: '글로벌 전기차 판매 증가율이 예상보다 낮아 우려됩니다.' },
    ],
    '035420': [
      { id: '1', title: '네이버, AI 검색 서비스 성과 긍정적', source: '한국경제', timestamp: '2시간 전', sentiment: 'positive', score: 0.78, summary: 'AI 기반 검색 서비스 출시 후 사용자 만족도가 높습니다.' },
      { id: '2', title: '라인야후 문제 장기화 가능성', source: '매일경제', timestamp: '4시간 전', sentiment: 'negative', score: -0.62, summary: '일본 정부의 규제로 라인야후 지분 문제가 장기화될 수 있습니다.' },
    ],
  };
  return newsMap[symbol] || [
    { id: '1', title: '해당 종목 관련 최신 뉴스', source: '뉴스', timestamp: '1시간 전', sentiment: 'neutral', score: 0.1, summary: '해당 종목에 대한 분석 리포트가 업데이트되었습니다.' },
  ];
};

export const getHistoricalData = (symbol: string): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const priceMap: Record<string, number> = {
    '005930': 70000, '000660': 165000, '373220': 400000, '006400': 460000,
    '207940': 780000, '068270': 180000, '105560': 58000, '055550': 42000,
    '035420': 200000, '035720': 50000, 'AAPL': 170, 'NVDA': 800, 'MSFT': 370,
  };
  const basePrice = priceMap[symbol] || 100000;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variance = (Math.random() - 0.5) * 0.08;
    const price = basePrice * (1 + variance + (30 - i) * 0.003);
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 5000000,
      per: 12 + Math.random() * 5,
      pbr: 1 + Math.random() * 0.5,
    });
  }
  return data;
};

export const calculateAgentDecision = (symbol: string): AgentDecision => {
  const metrics = getQuantMetrics(symbol);
  const sentiment = getSentimentHistory(symbol);
  const latestSentiment = sentiment[sentiment.length - 1].score;
  
  let quantScore = 50;
  if (metrics.per < 15) quantScore += 15;
  else if (metrics.per > 30) quantScore -= 10;
  
  if (metrics.roe > 15) quantScore += 15;
  if (metrics.momentum > 70) quantScore += 10;
  if (metrics.dividendYield > 2) quantScore += 5;
  
  quantScore = Math.min(100, Math.max(0, quantScore));
  
  const sentimentScore = latestSentiment;
  const finalScore = quantScore * 0.6 + sentimentScore * 0.4;
  
  let signal: 'BUY' | 'HOLD' | 'SELL';
  let confidence: number;
  let reasoning: string[];
  
  if (finalScore >= 70) {
    signal = 'BUY';
    confidence = Math.min(95, finalScore + 10);
    reasoning = [
      '퀀트 지표가 강한 매수 신호를 보이고 있습니다.',
      '시장 심리가 긍정적이며 모멘텀이 유지되고 있습니다.',
      '밸류에이션 대비 성장성이 우수합니다.',
    ];
  } else if (finalScore >= 45) {
    signal = 'HOLD';
    confidence = 60 + Math.random() * 20;
    reasoning = [
      '현재 가격 수준에서 관망이 적절합니다.',
      '추가 정보 확인 후 판단이 필요합니다.',
      '단기 변동성에 주의가 필요합니다.',
    ];
  } else {
    signal = 'SELL';
    confidence = Math.min(90, 100 - finalScore);
    reasoning = [
      '밸류에이션이 고평가 상태입니다.',
      '부정적 뉴스 심리가 지속되고 있습니다.',
      '모멘텀 약화가 관찰됩니다.',
    ];
  }
  
  return {
    signal,
    quantScore: Math.round(quantScore),
    sentimentScore: Math.round(sentimentScore),
    finalScore: Math.round(finalScore),
    confidence: Math.round(confidence),
    reasoning,
  };
};
