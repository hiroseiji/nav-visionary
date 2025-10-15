import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TopSourcesProps {
  data?: Array<{
    source: string;
    mentions: number;
  }>;
}

export function TopSources({ data }: TopSourcesProps) {
  const chartData = data || [
    { source: "Twitter/X", mentions: 1250 },
    { source: "Facebook", mentions: 980 },
    { source: "Instagram", mentions: 750 },
    { source: "News Sites", mentions: 650 },
    { source: "LinkedIn", mentions: 420 },
  ];

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
