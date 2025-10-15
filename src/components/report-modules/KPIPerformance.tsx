import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPIPerformanceProps {
  data?: Array<{
    metric: string;
    value: number;
    target: number;
    trend: "up" | "down";
    unit: string;
  }>;
}

export function KPIPerformance({ data }: KPIPerformanceProps) {
  const kpis = data || [
    { metric: "Share of Voice", value: 42, target: 40, trend: "up" as const, unit: "%" },
    { metric: "Sentiment Score", value: 73, target: 70, trend: "up" as const, unit: "/100" },
    { metric: "Response Rate", value: 85, target: 90, trend: "down" as const, unit: "%" },
    { metric: "Engagement Rate", value: 6.2, target: 5.5, trend: "up" as const, unit: "%" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{kpi.metric}</h4>
              {kpi.trend === "up" ? (
                <ArrowUp className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{kpi.value}</span>
                <span className="text-muted-foreground">{kpi.unit}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{kpi.target}{kpi.unit}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    kpi.value >= kpi.target ? "bg-green-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
