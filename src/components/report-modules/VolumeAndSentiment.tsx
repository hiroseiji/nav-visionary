import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VolumeAndSentimentProps {
  data?: Array<{
    period: string;
    volume: number;
    sentiment: number;
  }>;
}

export function VolumeAndSentiment({ data }: VolumeAndSentimentProps) {
  const chartData = data || [
    { period: "Week 1", volume: 450, sentiment: 72 },
    { period: "Week 2", volume: 520, sentiment: 68 },
    { period: "Week 3", volume: 480, sentiment: 75 },
    { period: "Week 4", volume: 610, sentiment: 70 },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Volume & Sentiment Analysis</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="period" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Legend />
          <Bar dataKey="volume" fill="hsl(var(--chart-1))" name="Volume" />
          <Bar dataKey="sentiment" fill="hsl(var(--chart-2))" name="Avg Sentiment" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
