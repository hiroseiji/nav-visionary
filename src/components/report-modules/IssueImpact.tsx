import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IssueImpactProps {
  data?: Array<{
    issue: string;
    sentiment: "positive" | "negative" | "neutral";
    mentions: number;
    reach: number;
  }>;
}

export function IssueImpact({ data }: IssueImpactProps) {
  const issues = data || [
    { issue: "Customer Service", sentiment: "negative" as const, mentions: 345, reach: 125000 },
    { issue: "Product Innovation", sentiment: "positive" as const, mentions: 512, reach: 250000 },
    { issue: "Pricing Strategy", sentiment: "neutral" as const, mentions: 234, reach: 89000 },
    { issue: "Sustainability", sentiment: "positive" as const, mentions: 428, reach: 180000 },
  ];

  const getSentimentVariant = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "positive";
      case "negative": return "negative";
      case "neutral": return "neutral";
      default: return "neutral";
    }
  };

  return (
    <div className="space-y-4">
      {issues.map((issue, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-lg font-semibold">{issue.issue}</h4>
            <Badge variant={getSentimentVariant(issue.sentiment)}>
              {issue.sentiment}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Mentions</p>
              <p className="text-2xl font-bold">{issue.mentions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Reach</p>
              <p className="text-2xl font-bold">{(issue.reach / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
