import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TopSourcesProps {
  data?: Array<{
    source?: string;
    name?: string;
    mentions?: number;
    volume?: number;
    count?: number;
  }>;
}

export function TopSources({ data }: TopSourcesProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: Array<any> = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const candidates = [
      (data as any).items,
      (data as any).data,
      (data as any).sources,
      (data as any).list,
    ];
    dataArray = candidates.find((c) => Array.isArray(c)) || [];
  }

  const chartData = dataArray
    .map((item) => ({
      source: item.source || item.name || "Unknown",
      mentions: item.mentions ?? item.volume ?? item.count ?? 0,
    }))
    .slice(0, 10); // Top 10 sources

  if (chartData.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No source data available
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Top Sources by Mentions</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" />
          <YAxis dataKey="source" type="category" width={100} className="text-xs" />
          <Tooltip />
          <Bar dataKey="mentions" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
