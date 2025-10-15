import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface SectorRankingProps {
  data?: Array<{
    rank: number;
    company: string;
    score: number;
    change: number;
  }>;
}

export function SectorRanking({ data }: SectorRankingProps) {
  const rankings = data || [
    { rank: 1, company: "Market Leader Inc.", score: 92, change: 2 },
    { rank: 2, company: "Your Organization", score: 85, change: 1 },
    { rank: 3, company: "Competitor A", score: 78, change: -1 },
    { rank: 4, company: "Competitor B", score: 72, change: 0 },
    { rank: 5, company: "Competitor C", score: 68, change: -2 },
  ];

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
