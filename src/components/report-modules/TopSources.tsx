import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SourceData {
  source?: string;
  name?: string;
  positive?: number;
  neutral?: number;
  negative?: number;
  mixed?: number;
  total?: number;
}

interface TopSourcesProps {
  data?: SourceData[] | { items?: SourceData[]; data?: SourceData[]; sources?: SourceData[]; list?: SourceData[] };
}

interface ChartRow {
  source: string;
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
  total: number;
}

export function TopSources({ data }: TopSourcesProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: SourceData[] = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const candidates = [
      data.items,
      data.data,
      data.sources,
      data.list,
    ];
    dataArray = candidates.find((c) => Array.isArray(c)) || [];
  }

  // Process data: extract sentiment breakdown per source
  const rows: ChartRow[] = dataArray
    .map((item) => {
      const positive = item.positive ?? 0;
      const neutral = item.neutral ?? 0;
      const negative = item.negative ?? 0;
      const mixed = item.mixed ?? 0;
      const total = item.total ?? (positive + neutral + negative + mixed);
      
      return {
        source: item.source || item.name || "Unknown",
        positive,
        neutral,
        negative,
        mixed,
        total,
      };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10 sources

  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No source data available
      </div>
    );
  }

  const height = Math.min(740, Math.max(400, rows.length * 60 + 100));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Volume & Tonality of Top Media Sources</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.2} />
          <XAxis 
            type="number" 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            dataKey="source" 
            type="category" 
            width={150} 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => value.toLocaleString()}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend 
            iconType="circle"
            wrapperStyle={{ paddingTop: "10px" }}
          />
          <Bar 
            dataKey="positive" 
            stackId="sentiment" 
            fill="rgb(16, 185, 129)" 
            name="Positive"
            radius={[0, 2, 2, 0]}
          />
          <Bar 
            dataKey="neutral" 
            stackId="sentiment" 
            fill="rgb(168, 168, 168)" 
            name="Neutral"
          />
          <Bar 
            dataKey="negative" 
            stackId="sentiment" 
            fill="rgb(255, 84, 65)" 
            name="Negative"
          />
          <Bar 
            dataKey="mixed" 
            stackId="sentiment" 
            fill="rgb(54, 124, 244)" 
            name="Mixed"
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
