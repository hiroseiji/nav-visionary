import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface ReputationalRisksProps {
  data?: Array<{
    title: string;
    severity: "high" | "medium" | "low";
    description: string;
    mentions: number;
  }>;
}

export function ReputationalRisks({ data }: ReputationalRisksProps) {
  const risks = data || [
    {
      title: "Negative Service Reviews",
      severity: "high" as const,
      description: "Increased mentions of service delays across social media platforms",
      mentions: 234
    },
    {
      title: "Competitor Comparison",
      severity: "medium" as const,
      description: "Users comparing pricing unfavorably with competitors",
      mentions: 156
    },
    {
      title: "Product Quality Concerns",
      severity: "medium" as const,
      description: "Some discussions about product durability issues",
      mentions: 89
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "outline";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      {risks.map((risk, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">{risk.title}</h4>
                <Badge variant={getSeverityColor(risk.severity)}>
                  {risk.severity.toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground">{risk.description}</p>
              <p className="text-sm text-muted-foreground">
                {risk.mentions} mentions
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
