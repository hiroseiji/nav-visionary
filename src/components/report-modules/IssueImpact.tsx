import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell, Customized } from "recharts";

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
      rawValue: signed,
      sign: Math.sign(signed),
    };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxAbs = Math.max(...chartData.map(d => Math.abs(d.value)), 1);
  const MAX_CALLOUTS = 5;
  const highlightIdx = new Set([...Array(Math.min(MAX_CALLOUTS, chartData.length)).keys()]);

  // Helper to wrap text
  const wrapText = (text: string, maxChars = 35) => {
    const words = (text || "").split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";

    words.forEach((w) => {
      if ((line + " " + w).trim().length > maxChars) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = line ? line + " " + w : w;
      }
    });

    if (line) lines.push(line);
    return lines;
  };

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload, value } = props;
    const signedVal = payload?.rawValue ?? value;
    const tooNarrow = width < 36;
    const isPos = signedVal > 0;
    
    // Impact value positioning
    let tx = isPos ? x + width - 8 : x + 8;
    let anchor = isPos ? "end" : "start";
    let textFill = "#fff";

    if (tooNarrow) {
      tx = isPos ? x + width + 6 : x - 6;
      anchor = isPos ? "start" : "end";
      textFill = isPos ? "#10b981" : "#ef4444";
    }

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />
        <text
          x={tx}
          y={y + height / 2}
          dominantBaseline="middle"
          textAnchor={anchor}
          fontSize="12"
          fontWeight="700"
          fill={textFill}
        >
          {Math.abs(signedVal).toFixed(0)}
        </text>
      </g>
    );
  };

  const ZeroAxisLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    if (value == null || value === 0 || !payload?.name) return null;

    const isPos = value > 0;
    const gap = 10;
    const tx = isPos ? x - gap : x + gap;
    const anchor = isPos ? "end" : "start";

    return (
      <text
        x={tx}
        y={y + height / 2}
        textAnchor={anchor}
        dominantBaseline="middle"
        fontSize="13"
        fill="#374151"
        fontWeight="700"
      >
        {payload.name}
      </text>
    );
  };

  const LeaderDotRight = ({ x, y, width, height }: any) => {
    const cy = y + height / 2;
    const endX = x + width;
    const color = "#10b981";
    const r = 5;
    const LINE_LEN = 30;

    return (
      <g>
        <circle cx={endX} cy={cy} r={r} fill="#fff" stroke={color} strokeWidth={2} />
        <line
          x1={endX + r + 1}
          y1={cy}
          x2={endX + r + 1 + LINE_LEN}
          y2={cy}
          stroke={color}
          strokeDasharray="3 3"
          strokeWidth={1.5}
        />
        <circle cx={endX + r + 1 + LINE_LEN} cy={cy} r={r - 1} fill={color} />
      </g>
    );
  };

  const LeaderDotLeft = ({ x, y, width, height }: any) => {
    const cy = y + height / 2;
    const endX = x + width;
    const color = "#ef4444";
    const r = 5;
    const LINE_LEN = 30;

    return (
      <g>
        <circle cx={endX} cy={cy} r={r} fill="#fff" stroke={color} strokeWidth={2} />
        <line
          x1={endX - r - 1}
          y1={cy}
          x2={endX - r - 1 - LINE_LEN}
          y2={cy}
          stroke={color}
          strokeDasharray="3 3"
          strokeWidth={1.5}
        />
        <circle cx={endX - r - 1 - LINE_LEN} cy={cy} r={r - 1} fill={color} />
      </g>
    );
  };

  const CalloutsOverlay = (props: any) => {
    const { offset, xAxisMap, yAxisMap } = props;
    const xAxis = xAxisMap?.[Object.keys(xAxisMap || {})[0]];
    const yAxis = yAxisMap?.[Object.keys(yAxisMap || {})[0]];
    if (!xAxis || !yAxis) return null;

    const xScale = xAxis.scale;
    const yScale = yAxis.scale;
    const band = yScale.bandwidth ? yScale.bandwidth() : 0;

    return (
      <g transform={`translate(${offset.left}, ${offset.top})`}>
        {chartData.map((d, i) => {
          if (!highlightIdx.has(i) || !d.description) return null;

          const cy = (yScale(d.name) ?? 0) + band / 2;
          const barEndX = xScale(d.value);
          const isPositive = d.value > 0;
          const textX = isPositive ? barEndX + 40 : barEndX - 40;

          const lines = wrapText(d.description, 35);

          return (
            <g key={i}>
              <text
                x={textX}
                y={cy - 8}
                textAnchor={isPositive ? "start" : "end"}
                fontWeight="700"
                fontSize={13}
                fill={isPositive ? "#059669" : "#ef4444"}
              >
                {d.name}
              </text>
              <text 
                x={textX} 
                y={cy + 8} 
                textAnchor={isPositive ? "start" : "end"}
                fontSize={12} 
                fill="#374151"
              >
                {lines.map((line, idx) => (
                  <tspan key={idx} x={textX} dy={idx === 0 ? 0 : 14}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div style={{ width: "100%", height: 460 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 200, bottom: 24, left: 200 }}
          >
            <CartesianGrid stroke="#9ca3af0f" />
            <XAxis
              type="number"
              domain={[-maxAbs * 1.1, maxAbs * 1.1]}
              tickCount={9}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tick={false}
              width={0}
            />
            <ReferenceLine x={0} stroke="#9CA3AF" />

            {/* Labels at zero line */}
            <Customized
              component={(props: any) => {
                const xAxis = props.xAxisMap[Object.keys(props.xAxisMap)[0]];
                const yAxis = props.yAxisMap[Object.keys(props.yAxisMap)[0]];
                const xScale = xAxis.scale;
                const yScale = yAxis.scale;

                return (
                  <g>
                    {chartData.map((d, i) => {
                      const yPos = yScale(d.name);
                      const bandwidth = yScale.bandwidth ? yScale.bandwidth() : 0;

                      return (
                        <ZeroAxisLabel
                          key={i}
                          x={xScale(0)}
                          y={yPos}
                          width={0}
                          height={bandwidth}
                          value={d.rawValue}
                          payload={d}
                        />
                      );
                    })}
                  </g>
                );
              }}
            />

            {/* Bars with custom rendering */}
            <Bar
              dataKey="value"
              shape={(props) => (
                <CustomBar
                  {...props}
                  fill={props.payload.sign === -1 ? "#ef4444" : "#10b981"}
                  highlightIdx={highlightIdx}
                  index={props.index}
                />
              )}
            >
              {chartData.map((entry, index) => {
                const showLeader = highlightIdx.has(index) && entry.description;
                return (
                  <Cell key={`cell-${index}`}>
                    {showLeader && (entry.value > 0 ? (
                      <LeaderDotRight {...entry} />
                    ) : (
                      <LeaderDotLeft {...entry} />
                    ))}
                  </Cell>
                );
              })}
            </Bar>

            {/* Callouts overlay */}
            <Customized component={<CalloutsOverlay data={chartData} highlightIdx={highlightIdx} />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground italic text-center">
        *Impact refers to the total effect that a particular issue has on total sentiment.
      </p>
    </div>
  );
}
