import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ExecutiveSummaryProps {
  data?: {
    overallSentiment?: string;
    totalMentions?: number;
    keyInsights?: string[];
    topThemes?: string[];
  };
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const sentimentIcon = data?.overallSentiment === "positive" ? TrendingUp : 
                       data?.overallSentiment === "negative" ? TrendingDown : Minus;
  const SentimentIcon = sentimentIcon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Overall Sentiment</p>
          <div className="flex items-center gap-2">
            <SentimentIcon className="h-6 w-6 text-primary" />
            <p className="text-2xl font-bold capitalize">{data?.overallSentiment || "Neutral"}</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Mentions</p>
          <p className="text-2xl font-bold">{data?.totalMentions?.toLocaleString() || "0"}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Top Themes</p>
          <p className="text-2xl font-bold">{data?.topThemes?.length || "0"}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <ul className="space-y-2">
          {data?.keyInsights?.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{insight}</span>
            </li>
          )) || (
            <li className="text-muted-foreground italic">No insights available</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
