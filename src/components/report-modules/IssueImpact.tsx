import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

interface IssueImpactProps {
  data?: Array<{
    title: string;
    description: string;
    impactScore: number;
    avgSentiment: number;
  }>;
}

export function IssueImpact({ data }: IssueImpactProps) {
  const issues = data || [
    {
      title: "Enterprise Support",
      description: "Debswana's CEEP is said to have proven effective in increasing production capacity.",
      impactScore: 20,
      avgSentiment: 80,
    },
    {
      title: "Economic Development",
      description: "Debswana's CEEP is praised for providing opportunities to SMMEs.",
      impactScore: 12,
      avgSentiment: 70,
    },
    {
      title: "Diversity & Inclusion",
      description: "Debswana acknowledges local fellows of the WomEng Southern Africa Fellowship programme, offering the chance to meet Dudu Thebe, corporate affairs manager at Debswana.",
      impactScore: 8,
      avgSentiment: 60,
    },
    {
      title: "Corporate Partnerships",
      description: "",
      impactScore: 5,
      avgSentiment: 50,
    },
    {
      title: "Community",
      description: "Debswana hosts a cycling event in Jwaneng to raise money to fund the science faculty at the local Morama CJSS Secondary School.",
      impactScore: 3,
      avgSentiment: 40,
    },
    {
      title: "Strategy",
      description: "",
      impactScore: 2,
      avgSentiment: 30,
    },
    {
      title: "Entrepreneurs",
      description: "",
      impactScore: 1,
      avgSentiment: 20,
    },
    {
      title: "Financial Results",
      description: "Continued discussion regarding Debswana's 2024 H1 diamond sales decreasing by 49.2%, compared to the same period in 2023.",
      impactScore: -2,
      avgSentiment: -50,
    },
  ];

  // Calculate signed impact based on sentiment
  const chartData = issues.map(issue => {
    const impactScore = Number(issue.impactScore) || 0;
    const sentiment = Number(issue.avgSentiment) || 0;
    const signed = impactScore === 0 ? 0 : (sentiment >= 0 ? 1 : -1) * impactScore;
    
    return {
      name: issue.title,
      value: signed,
      description: issue.description,
      sentiment,
    };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxAbs = Math.max(...chartData.map(d => Math.abs(d.value)), 1);
  const MAX_CALLOUTS = 5;
  
  return (
    <div className="space-y-4">
      <div style={{ width: "100%", height: Math.max(460, chartData.length * 60) }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 300, bottom: 40, left: 250 }}
          >
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[-maxAbs * 1.1, maxAbs * 1.1]}
              tickCount={9}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={false}
              width={0}
            />
            <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={2} />
            
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value >= 0 ? '#10b981' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Custom overlay for labels, values, and callouts */}
        <svg 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {chartData.map((item, idx) => {
            const yPos = 20 + (idx * (60 / chartData.length));
            const isPositive = item.value >= 0;
            const showCallout = idx < MAX_CALLOUTS && item.description;
            
            return (
              <g key={idx}>
                {/* Issue name at zero line */}
                <text
                  x={isPositive ? "49" : "51"}
                  y={yPos}
                  textAnchor={isPositive ? "end" : "start"}
                  fontSize="1.2"
                  fontWeight="700"
                  fill="#374151"
                  dominantBaseline="middle"
                >
                  {item.name}
                </text>

                {/* Impact value inside/near bar */}
                <text
                  x={isPositive ? "52" : "48"}
                  y={yPos}
                  textAnchor={isPositive ? "start" : "end"}
                  fontSize="1.1"
                  fontWeight="700"
                  fill="#fff"
                  dominantBaseline="middle"
                >
                  {Math.abs(item.value).toFixed(0)}
                </text>

                {/* Callout with leader line for top issues */}
                {showCallout && (
                  <>
                    {/* Dot at bar end */}
                    <circle
                      cx={isPositive ? (50 + (item.value / maxAbs) * 20) : (50 + (item.value / maxAbs) * 20)}
                      cy={yPos}
                      r="0.4"
                      fill="#fff"
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth="0.2"
                    />
                    
                    {/* Leader line */}
                    <line
                      x1={isPositive ? (50 + (item.value / maxAbs) * 20 + 0.5) : (50 + (item.value / maxAbs) * 20 - 0.5)}
                      y1={yPos}
                      x2={isPositive ? "75" : "25"}
                      y2={yPos + (idx - 2) * 3}
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth="0.15"
                      strokeDasharray="0.5 0.5"
                    />
                    
                    {/* Dot at callout end */}
                    <circle
                      cx={isPositive ? "75" : "25"}
                      cy={yPos + (idx - 2) * 3}
                      r="0.35"
                      fill={isPositive ? '#10b981' : '#ef4444'}
                    />

                    {/* Callout text */}
                    <text
                      x={isPositive ? "76" : "24"}
                      y={yPos + (idx - 2) * 3 - 0.8}
                      textAnchor={isPositive ? "start" : "end"}
                      fontSize="1.1"
                      fontWeight="700"
                      fill={isPositive ? '#10b981' : '#ef4444'}
                    >
                      {item.name}
                    </text>
                    <text
                      x={isPositive ? "76" : "24"}
                      y={yPos + (idx - 2) * 3 + 0.8}
                      textAnchor={isPositive ? "start" : "end"}
                      fontSize="0.9"
                      fill="#374151"
                    >
                      {item.description.substring(0, 60)}{item.description.length > 60 ? '...' : ''}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-muted-foreground italic text-center">
        *Impact refers to the total effect that a particular issue has on total sentiment.
      </p>
    </div>
  );
}
