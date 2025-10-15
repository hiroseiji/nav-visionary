import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";

interface ReputationalOpportunitiesProps {
  data?: Array<{
    title: string;
    impact: "high" | "medium" | "low";
    description: string;
    mentions: number;
  }>;
}

export function ReputationalOpportunities({ data }: ReputationalOpportunitiesProps) {
  const opportunities = data || [
    {
      title: "Sustainability Leadership",
      impact: "high" as const,
      description: "Growing positive sentiment around environmental initiatives",
      mentions: 312
    },
    {
      title: "Innovation Recognition",
      impact: "high" as const,
      description: "Industry acknowledgment of new product launches",
      mentions: 278
    },
    {
      title: "Community Engagement",
      impact: "medium" as const,
      description: "Increased positive mentions of community programs",
      mentions: 187
    },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {opportunities.map((opp, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-start gap-4">
            <Lightbulb className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">{opp.title}</h4>
                <Badge variant={getImpactColor(opp.impact)}>
                  {opp.impact.toUpperCase()} IMPACT
                </Badge>
              </div>
              <p className="text-muted-foreground">{opp.description}</p>
              <p className="text-sm text-muted-foreground">
                {opp.mentions} positive mentions
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
