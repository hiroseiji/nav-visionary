import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, Label } from "recharts";

interface SentimentTrendProps {
  data?: {
    sentimentData?: Array<{
      date: string;
      sentiment: number;
      trend: number;
      annotation?: { title: string; description: string; sentiment: 'positive' | 'negative' | 'neutral' };
    }>;
    volumeData?: Array<{
      date: string;
      positive: number;
      negative: number;
      neutral: number;
    }>;
  };
}

export function SentimentTrend({ data }: SentimentTrendProps) {
  const sentimentChartData = data?.sentimentData || [
    { date: "1-Sep", sentiment: -60, trend: 20, annotation: { title: "Economic Development", description: "Debswana encourages SMMEs to make use of its CEEP.", sentiment: 'negative' } },
    { date: "5-Sep", sentiment: 70, trend: 20, annotation: { title: "Economic Development", description: "Andrew Motsomi, managing director of Debswana, reaffirms the company's commitment to promoting private sector growth at Botswana's National Business Conference.", sentiment: 'positive' } },
    { date: "9-Sep", sentiment: 0, trend: 20, annotation: null },
    { date: "13-Sep", sentiment: -70, trend: 20, annotation: { title: "Financial Results", description: "Debswana registers ongoing discussion of a 49.2% decline in diamond sales during H1 2024 compared to H1 2023.", sentiment: 'negative' } },
    { date: "17-Sep", sentiment: 70, trend: 20, annotation: { title: "Community", description: "Debswana collaborates with the Paralympics Association of Botswana to stage a welcome home ceremony for the Botswanan athletes who competed at the 2024 Paris Paralympics.", sentiment: 'positive' } },
    { date: "21-Sep", sentiment: 0, trend: 20, annotation: null },
    { date: "25-Sep", sentiment: 0, trend: 20, annotation: { title: "Community", description: "The Jwaneng mine hosts a charity cycle race to raise funds for the refurbishment of science laboratories at Morama CJSS Secondary School.", sentiment: 'positive' } },
    { date: "29-Sep", sentiment: 65, trend: 20, annotation: { title: "Corporate Partnerships", description: "President Masisi honours the minister of minerals and energy, Lefoko Moagi, for helping to arrange a new 10-year sales agreement with De Beers that guarantees Debswana's rough diamond production.", sentiment: 'positive' } },
  ];

  const volumeChartData = data?.volumeData || [
    { date: "1-Sep", positive: 5, negative: 20, neutral: 10 },
    { date: "5-Sep", positive: 25, negative: 5, neutral: 10 },
    { date: "9-Sep", positive: 10, negative: 5, neutral: 5 },
    { date: "13-Sep", positive: 5, negative: 15, neutral: 5 },
    { date: "17-Sep", positive: 20, negative: 5, neutral: 10 },
    { date: "21-Sep", positive: 5, negative: 5, neutral: 70 },
    { date: "25-Sep", positive: 20, negative: 5, neutral: 10 },
    { date: "29-Sep", positive: 15, negative: 5, neutral: 5 },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const annotation = payload[0].payload.annotation;
      if (annotation) {
        return (
          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
            <p className={`font-bold ${annotation.sentiment === 'positive' ? 'text-green-600' : annotation.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
              {annotation.title}
            </p>
            <p className="text-sm text-gray-700">{annotation.description}</p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Sentiment Line Chart */}
      <Card className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sentimentChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <YAxis 
              domain={[-100, 100]}
              ticks={[-100, -60, -40, -20, 0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 11 }}
            >
              <Label value="Sentiment" angle={-90} position="insideLeft" style={{ fontSize: 12 }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            <Line 
              type="monotone" 
              dataKey="sentiment" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="trend" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Volume Bar Chart */}
      <Card className="p-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={volumeChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              ticks={[0, 20, 40, 60, 80, 100]}
            >
              <Label value="Volume" angle={-90} position="insideLeft" style={{ fontSize: 12 }} />
            </YAxis>
            <Bar dataKey="negative" stackId="a" fill="#ef4444" />
            <Bar dataKey="neutral" stackId="a" fill="#9ca3af" />
            <Bar dataKey="positive" stackId="a" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#ef4444]"></div>
          <span>Sentiment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#f59e0b]"></div>
          <span>Sentiment Trend**</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-black"></div>
          <span>Diamond Industry Trend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#9ca3af]"></div>
          <span>Neutral</span>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground italic text-center">
        *Sentiment is measured on a scale of -100-100, with 0 representing neutral. **Sentiment trend is a simple 30-day average of sentiment score.
      </p>
    </div>
  );
}
