import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VolumeAndSentimentProps {
  data?: Array<{
    period?: string;
    date?: string;
    volume?: number;
    count?: number;
    sentiment?: number;
    averageSentiment?: number;
  }>;
}

export function VolumeAndSentiment({ data }: VolumeAndSentimentProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: Array<any> = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const candidates = [
      (data as any).items,
      (data as any).data,
      (data as any).series,
      (data as any).points,
      (data as any).list,
    ];
    dataArray = candidates.find((c) => Array.isArray(c)) || [];
  }

  const chartData = dataArray.map((item) => ({
    period: item.period || item.date || "Unknown",
    volume: item.volume ?? item.count ?? 0,
    sentiment:
      item.sentiment !== undefined
        ? item.sentiment
        : item.averageSentiment !== undefined
        ? Math.round(Number(item.averageSentiment) * 100)
        : 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No volume and sentiment data available
      </div>
    );
  }

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
