import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface SectorRankingProps {
  data?: Array<{
    rank?: number;
    company?: string;
    name?: string;
    score?: number;
    averageSentiment?: number;
    scorePct?: number;
    change?: number;
    volume?: number;
  }>;
}

export function SectorRanking({ data }: SectorRankingProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: Array<any> = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const candidates = [
      (data as any).items,
      (data as any).data,
      (data as any).rankings,
      (data as any).companies,
      (data as any).list,
    ];
    dataArray = candidates.find((c) => Array.isArray(c)) || [];
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

  if (rankings.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No sector ranking data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rankings.map((item, idx) => (
        <Card key={idx} className={`p-6 ${item.rank === 2 ? 'border-2 border-primary' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              {item.rank === 1 ? (
                <Trophy className="h-6 w-6 text-yellow-500" />
              ) : (
                <span className="text-xl font-bold">{item.rank}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{item.company}</h4>
                {item.rank === 2 && <Badge variant="default">You</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">Reputation Score: {item.score}/100</p>
            </div>
            <div className="flex items-center gap-2">
              {item.change > 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-green-500 font-medium">+{item.change}</span>
                </>
              ) : item.change < 0 ? (
                <>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <span className="text-red-500 font-medium">{item.change}</span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
