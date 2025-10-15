import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, Label } from "recharts";

interface SentimentTrendProps {
  data?: Array<{
    date: string;
    sentiment: number;
    rolling: number;
    industryTrend?: number;
    positive: number;
    negative: number;
    neutral: number;
    mixed?: number;
  }>;
  annotations?: Array<{
    date: string;
    type: string;
    category: string;
    summary: string;
  }>;
}

export function SentimentTrend({ data, annotations }: SentimentTrendProps) {
  const chartData = data || [
    { date: "1-Sep", sentiment: -60, rolling: 20, positive: 5, negative: 20, neutral: 10, mixed: 0 },
    { date: "5-Sep", sentiment: 70, rolling: 20, positive: 25, negative: 5, neutral: 10, mixed: 0 },
    { date: "9-Sep", sentiment: 0, rolling: 20, positive: 10, negative: 5, neutral: 5, mixed: 0 },
    { date: "13-Sep", sentiment: -70, rolling: 20, positive: 5, negative: 15, neutral: 5, mixed: 0 },
    { date: "17-Sep", sentiment: 70, rolling: 20, positive: 20, negative: 5, neutral: 10, mixed: 0 },
    { date: "21-Sep", sentiment: 0, rolling: 20, positive: 5, negative: 5, neutral: 70, mixed: 0 },
    { date: "25-Sep", sentiment: 0, rolling: 20, positive: 20, negative: 5, neutral: 10, mixed: 0 },
    { date: "29-Sep", sentiment: 65, rolling: 20, positive: 15, negative: 5, neutral: 5, mixed: 0 },
  ];

  const annotationEvents = annotations || [
    { date: "1-Sep", type: "negative", category: "Economic Development", summary: "Debswana encourages SMMEs to make use of its CEEP." },
    { date: "5-Sep", type: "positive", category: "Economic Development", summary: "Andrew Motsomi, managing director of Debswana, reaffirms the company's commitment to promoting private sector growth at Botswana's National Business Conference." },
    { date: "13-Sep", type: "negative", category: "Financial Results", summary: "Debswana registers ongoing discussion of a 49.2% decline in diamond sales during H1 2024 compared to H1 2023." },
    { date: "17-Sep", type: "positive", category: "Community", summary: "Debswana collaborates with the Paralympics Association of Botswana to stage a welcome home ceremony for the Botswanan athletes who competed at the 2024 Paris Paralympics." },
    { date: "29-Sep", type: "positive", category: "Corporate Partnerships", summary: "President Masisi honours the minister of minerals and energy, Lefoko Moagi, for helping to arrange a new 10-year sales agreement with De Beers that guarantees Debswana's rough diamond production." },
  ];

  const getSpikeColor = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('negative')) return '#ef4444';
    if (t.includes('mixed')) return '#5d98ff';
    if (t.includes('neutral')) return '#9ca3af';
    return '#10b981';
  };

  const getLineColor = (sentiment: number) => {
    if (sentiment > 0) return '#10b981';
    if (sentiment < 0) return '#ef4444';
    return '#9ca3af';
  };

  return (
    <div className="space-y-6">
      {/* Sentiment Line Chart */}
      <Card className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis 
              domain={[-100, 100]}
              ticks={[-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 12 }}
            >
              <Label value="Sentiment*" angle={-90} position="insideLeft" style={{ fontSize: 12 }} />
            </YAxis>
            <Tooltip />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            
            {/* Sentiment Trend (yellow dashed line) */}
            <Line 
              type="monotone" 
              dataKey="rolling" 
              stroke="#e0c80c" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Sentiment Trend"
            />
            
            {/* Sentiment (colored by value) */}
            <Line 
              type="monotone" 
              dataKey="sentiment" 
              stroke="#10b981"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const color = getLineColor(payload.sentiment);
                return <circle cx={cx} cy={cy} r={5} fill={color} stroke={color} />;
              }}
              name="Sentiment"
            />

            {/* Industry Trend if available */}
            {chartData.some(d => d.industryTrend != null) && (
              <Line 
                type="monotone" 
                dataKey="industryTrend" 
                stroke="#000" 
                strokeWidth={2}
                dot={false}
                name="Industry Trend"
              />
            )}

            {/* Vertical spike markers for annotations */}
            {annotationEvents.map((ann, idx) => (
              <ReferenceLine
                key={idx}
                x={ann.date}
                stroke={getSpikeColor(ann.type)}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Volume Bar Chart */}
      <Card className="p-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            >
              <Label value="Volume" angle={-90} position="insideLeft" style={{ fontSize: 12 }} />
            </YAxis>
            <Bar dataKey="negative" stackId="a" fill="#ef4444" />
            <Bar dataKey="neutral" stackId="a" fill="#9ca3af" />
            <Bar dataKey="positive" stackId="a" fill="#10b981" />
            {chartData.some(d => (d.mixed || 0) > 0) && (
              <Bar dataKey="mixed" stackId="a" fill="#5d98ff" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground italic text-center">
        *Sentiment is measured on a scale of -100-100, with 0 representing neutral. **Sentiment trend is a simple 30-day average of sentiment score.
      </p>

      {/* Key Events & Spikes */}
      {annotationEvents.length > 0 && (
        <section className="space-y-4">
          <h4 className="text-base font-semibold">Key Events & Spikes</h4>
          <div className="space-y-3">
            {annotationEvents.map((spike, idx) => {
              const color = getSpikeColor(spike.type);
              return (
                <div
                  key={idx}
                  className="border rounded-lg p-4"
                  style={{ borderLeft: `6px solid ${color}` }}
                >
                  <div className="font-bold" style={{ color }}>
                    {spike.category}
                  </div>
                  {spike.date && <div className="text-sm text-muted-foreground">{spike.date}</div>}
                  <div className="text-sm mt-1">
                    <li>{spike.summary}</li>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
