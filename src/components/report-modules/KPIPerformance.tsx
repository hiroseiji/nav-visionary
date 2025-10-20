import { Card } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Cell, Label } from "recharts";

interface KPIPerformanceProps {
  data?: Array<{
    name?: string;
    kpi?: string;
    visibility?: number;
    volume?: number;
    x?: number;
    sentiment?: number;
    averageSentiment?: number;
    y?: number;
  }>;
}

export function KPIPerformance({ data }: KPIPerformanceProps) {
  const kpis = (data || []).map(item => ({
    name: item.name || item.kpi || "Unknown KPI",
    visibility: item.visibility !== undefined ? item.visibility : 
                item.x !== undefined ? item.x : 
                item.volume !== undefined ? item.volume / 10000 : 0,
    sentiment: item.sentiment !== undefined ? item.sentiment :
               item.y !== undefined ? item.y * 100 :
               item.averageSentiment !== undefined ? item.averageSentiment * 100 : 0
  }));

  if (kpis.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No KPI performance data available
      </div>
    );
  }

  const getQuadrantColor = (visibility: number, sentiment: number) => {
    if (sentiment >= 0 && visibility >= 0) return "#22c55e"; // green - top right
    if (sentiment >= 0 && visibility < 0) return "#eab308"; // yellow - top left
    if (sentiment < 0 && visibility < 0) return "#ef4444"; // red - bottom left
    return "#f97316"; // orange - bottom right
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">KPI Visibility vs Sentiment</h3>
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 40, right: 120, bottom: 40, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="visibility" 
            domain={[-0.06, 0.06]}
            ticks={[-0.06, -0.03, 0, 0.03, 0.06]}
            stroke="#6b7280"
          >
            <Label value="Visibility* (mentions)" offset={-20} position="insideBottom" style={{ fill: '#6b7280' }} />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="sentiment" 
            domain={[-100, 100]}
            ticks={[-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100]}
            stroke="#6b7280"
          >
            <Label value="Sentiment* (-100 to 100)" angle={-90} position="insideLeft" style={{ fill: '#6b7280', textAnchor: 'middle' }} />
          </YAxis>
          
          <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} />
          
          {/* Quadrant Labels */}
          <text x="15%" y="15%" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">
            Above-average Sentiment
          </text>
          <text x="15%" y="18%" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="600">
            Below-average Visibility
          </text>
          
          <text x="85%" y="15%" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">
            Above-average Sentiment
          </text>
          <text x="85%" y="18%" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">
            Above-average Visibility
          </text>
          
          <text x="15%" y="90%" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="600">
            Below-average Sentiment
          </text>
          <text x="15%" y="93%" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="600">
            Below-average Visibility
          </text>
          
          <text x="85%" y="90%" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="600">
            Below-average Sentiment
          </text>
          <text x="85%" y="93%" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">
            Above-average Visibility
          </text>
          
          {/* Center point label */}
          <text x="50%" y="50%" textAnchor="start" dx={10} fill="#6b7280" fontSize="13" fontWeight="500">
            KPI Average: 0
          </text>
          
          <Scatter data={kpis} fill="#8b5cf6">
            {kpis.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.visibility, entry.sentiment)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
}
