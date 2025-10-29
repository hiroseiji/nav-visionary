import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    volume: item.volume !== undefined ? item.volume : Math.floor(Math.random() * 5000),
  }));

  // If no data, use mock data to show the structure
  const displayRankings = rankings.length === 0 ? [
    { rank: 1, company: "Lucara Diamonds", score: 62, change: -9, volume: 379 },
    { rank: 2, company: "Morupule Coal Mine", score: 49, change: 47, volume: 5 },
    { rank: 3, company: "Debswana", score: 40, change: 37, volume: 234 },
    { rank: 4, company: "Okavango Diamond Company", score: 34, change: -26, volume: 33 },
    { rank: 5, company: "Rio Tinto Diamonds", score: 27, change: 29, volume: 218 },
    { rank: 6, company: "DTC Botswana", score: 0, change: -37, volume: 11 },
    { rank: 7, company: "De Beers", score: -1, change: -19, volume: 2289 },
    { rank: 8, company: "Anglo American", score: -1, change: 10, volume: 3613 },
    { rank: 9, company: "Airosa", score: -22, change: 16, volume: 269 },
  ] : rankings;

  if (displayRankings.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No sector ranking data available
      </div>
    );
  }

  // Get sentiment-based color
  const getSentimentColor = (score: number, isUserOrg: boolean = false) => {
    if (isUserOrg) return 'hsl(38 92% 50%)'; // orange for user's org
    if (score >= 50) return 'hsl(160 84% 39%)'; // green - positive
    if (score >= 0) return 'hsl(220 9% 46%)'; // gray - neutral
    return 'hsl(0 84% 60%)'; // red - negative
  };

  // Calculate summary stats
  const userOrg = displayRankings.find(r => r.rank === 2);
  const avgScore = Math.round(displayRankings.reduce((sum, r) => sum + r.score, 0) / displayRankings.length);
  const userScore = userOrg?.score || 0;
  const scoreDiff = userScore - avgScore;
  const userChange = userOrg?.change || 0;

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {displayRankings.map((item, idx) => {
          const isUserOrg = item.rank === 2;
          const sentimentColor = getSentimentColor(item.score, isUserOrg);
          
          return (
            <div 
              key={idx} 
              className="rounded-full border-2 bg-background overflow-hidden flex items-center"
              style={{ borderColor: sentimentColor }}
            >
              <div 
                className="rounded-full px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[280px]"
                style={{ backgroundColor: sentimentColor }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/30 text-white font-bold text-sm flex-shrink-0">
                  {item.rank}
                </div>
                <span className="font-semibold text-white text-sm truncate">{item.company}</span>
              </div>
              <div className="flex-1 px-6 py-3 flex items-center justify-end gap-8">
                <span className="text-sm text-foreground whitespace-nowrap">
                  Sentiment Score: <span className="font-semibold">{item.score}</span> ({item.change > 0 ? '+' : ''}{item.change})
                </span>
                <span className="text-sm text-foreground whitespace-nowrap">
                  Volume: <span className="font-semibold">{item.volume}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-16 pt-8">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">
            Out of {displayRankings.length} companies<br />
            within the mining<br />
            sector index,<br />
            {userOrg?.company} placed:
          </div>
          <div className="text-7xl font-bold text-foreground">
            {getOrdinal(userOrg?.rank || 2)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">
            {userOrg?.company} is {scoreDiff > 0 ? '+' : ''}{scoreDiff}<br />
            above the sector<br />
            average, with a score of:
          </div>
          <div className="text-7xl font-bold text-[hsl(160_84%_39%)]">
            {userScore}
          </div>
          <div className="text-3xl font-bold text-[hsl(160_84%_39%)] mt-2">
            ({userChange > 0 ? '+' : ''}{userChange})
          </div>
        </div>
      </div>
    </div>
  );
}
