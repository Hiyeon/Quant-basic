import { Newspaper, ThumbsUp, ThumbsDown, Minus, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  link?: string;
}

interface NewsCardProps {
  news?: NewsItem[];
}

const NewsCard = ({ news = [] }: NewsCardProps) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-3.5 w-3.5 text-success" />;
      case 'negative':
        return <ThumbsDown className="h-3.5 w-3.5 text-danger" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const handleClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  if (news.length === 0) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          최신 뉴스
        </h3>
        <div className="text-center py-8 text-muted-foreground text-sm">
          뉴스를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
        <Newspaper className="h-4 w-4" />
        최신 뉴스
      </h3>
      
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
        {news.map((item) => (
          <div
            key={item.id}
            onClick={() => handleClick(item.link)}
            className="p-3 bg-secondary/30 rounded-lg border border-border/30 hover:border-border/60 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getSentimentIcon(item.sentiment)}
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h4>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsCard;
