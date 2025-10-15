import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SentimentTrendProps {
  data?: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
}

export function SentimentTrend({ data }: SentimentTrendProps) {
  const chartData = data || [
    { date: "Jan", positive: 65, neutral: 25, negative: 10 },
    { date: "Feb", positive: 70, neutral: 20, negative: 10 },
    { date: "Mar", positive: 60, neutral: 30, negative: 10 },
    { date: "Apr", positive: 75, neutral: 15, negative: 10 },
    { date: "May", positive: 80, neutral: 15, negative: 5 },
    { date: "Jun", positive: 72, neutral: 20, negative: 8 },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Sentiment Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="positive" stroke="hsl(var(--chart-1))" strokeWidth={2} />
          <Line type="monotone" dataKey="neutral" stroke="hsl(var(--chart-2))" strokeWidth={2} />
          <Line type="monotone" dataKey="negative" stroke="hsl(var(--chart-3))" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
