import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

type RankingItem = {
  rank?: number;
  company?: string;
  name?: string;
  score?: number;
  averageSentiment?: number;
  scorePct?: number;
  change?: number;
  volume?: number;
};

interface DataContainer {
  items?: unknown[];
  data?: unknown[];
  rankings?: unknown[];
  companies?: unknown[];
  list?: unknown[];
}

interface SectorRankingProps {
  data?: RankingItem[];
}

export function SectorRanking({ data }: SectorRankingProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: RankingItem[] = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const container = data as unknown as DataContainer;
    const candidates = [
      container.items,
      container.data,
      container.rankings,
      container.companies,
      container.list,
    ];
    const foundArray = candidates.find((c) => Array.isArray(c));
    dataArray = (foundArray || []) as RankingItem[];
  }

  const rankings = dataArray.map((item, index) => ({
    rank: item.rank !== undefined ? item.rank : index + 1,
    company: item.company || item.name || "Unknown",
    score:
      item.score !== undefined
        ? item.score
        : item.scorePct !== undefined
        ? item.scorePct
        : item.averageSentiment !== undefined
        ? Math.round(item.averageSentiment * 100)
        : 0,
    change: item.change !== undefined ? item.change : 0,
  }));

  // If no data, use mock data to show the structure
  const displayRankings = rankings.length === 0 ? [
    { rank: 1, company: "Anglo American Platinum", score: 87, change: 3 },
    { rank: 2, company: "Your Organization", score: 78, change: -2 },
    { rank: 3, company: "Debswana Diamond Company", score: 75, change: 1 },
    { rank: 4, company: "Lucara Diamond Corp", score: 71, change: 0 },
    { rank: 5, company: "BCL Limited", score: 68, change: -1 },
  ] : rankings;

  if (displayRankings.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No sector ranking data available
      </div>
    );
  }

  // Get sentiment-based color
  const getSentimentColor = (score: number) => {
    if (score >= 50) return 'hsl(160 84% 39%)'; // green - positive
    if (score >= 30) return 'hsl(38 92% 50%)'; // orange - mixed
    if (score >= 0) return 'hsl(220 9% 46%)'; // gray - neutral
    return 'hsl(0 84% 60%)'; // red - negative
  };

  return (
    <div className="space-y-4">
      {displayRankings.map((item, idx) => {
        const sentimentColor = getSentimentColor(item.score);
        
        return (
          <Card key={idx} className={`p-0 overflow-hidden ${item.rank === 2 ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex items-center">
              <div 
                className="flex items-center gap-3 px-4 py-6 min-w-[200px]"
                style={{ backgroundColor: sentimentColor }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white font-bold">
                  {item.rank === 1 ? (
                    <Trophy className="h-5 w-5" />
                  ) : (
                    <span className="text-lg">{item.rank}</span>
                  )}
                </div>
                <span className="font-semibold text-white">{item.company}</span>
              </div>
              <div className="flex-1 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Sentiment Score: <span className="font-semibold text-foreground">{item.score}</span> ({item.change > 0 ? '+' : ''}{item.change})
                  </p>
                  {item.rank === 2 && <Badge variant="default">You</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {item.change > 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5" style={{ color: 'hsl(160 84% 39%)' }} />
                      <span className="font-medium" style={{ color: 'hsl(160 84% 39%)' }}>+{item.change}</span>
                    </>
                  ) : item.change < 0 ? (
                    <>
                      <TrendingDown className="h-5 w-5" style={{ color: 'hsl(0 84% 60%)' }} />
                      <span className="font-medium" style={{ color: 'hsl(0 84% 60%)' }}>{item.change}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
