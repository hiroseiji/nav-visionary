import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell, Customized } from "recharts";

interface IssueImpactProps {
  data?: Array<{
    title?: string;
    issue?: string;
    description?: string;
    summary?: string;
    impactScore?: number;
    impact?: number;
    avgSentiment?: number;
    sentiment?: number;
    averageSentiment?: number;
  }>;
}

interface ChartDataPoint {
  name: string;
  value: number;
  description: string;
  sentiment: number;
  rawValue: number;
  sign: number;
}

interface CustomBarProps {
  fill: string;
  x: number;
  y: number;
  width: number;
  height: number;
  payload: ChartDataPoint;
  value: number;
  highlightIdx: Set<number>;
  index: number;
}

interface LeaderDotProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ZeroAxisLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  payload: ChartDataPoint;
}

export function IssueImpact({ data }: IssueImpactProps) {
  // Handle different data structures: array, object with items/data property, or undefined
  let dataArray: Array<Record<string, unknown>> = [];
  
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === 'object') {
    // Check for common array property names
    const possibleArrays = [
      (data as any).items,
      (data as any).data,
      (data as any).issues,
      (data as any).list
    ];
    dataArray = possibleArrays.find(arr => Array.isArray(arr)) || [];
  }

  const issues = dataArray.map((item: any) => ({
    title: String(item.title || item.issue || "Unknown Issue"),
    description: String(item.description || item.summary || ""),
    impactScore: item.impactScore !== undefined ? Number(item.impactScore) :
                 item.impact !== undefined ? Number(item.impact) : 0,
    avgSentiment: item.avgSentiment !== undefined ? Number(item.avgSentiment) :
                  item.sentiment !== undefined ? Number(item.sentiment) :
                  item.averageSentiment !== undefined ? Number(item.averageSentiment) * 100 : 0
  }));

  if (issues.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No issue impact data available
      </div>
    );
  }

  // Calculate signed impact based on sentiment (matching original logic)
  const chartData = issues.map(issue => {
    const impactScore = Number(issue.impactScore) || 0;
    const sentiment = Number(issue.avgSentiment) || 0;
    
    // Original logic: Force sign based on sentiment
    // If sentiment >= 0 (positive), bar extends right (positive value)
    // If sentiment < 0 (negative), bar extends left (negative value)
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

  const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height, payload, value, highlightIdx, index } = props;
    const signedVal = payload?.rawValue ?? value;
    const tooNarrow = width < 36;
    const isPos = signedVal > 0;
    
    // Impact value positioning
    let tx = isPos ? x + width - 8 : x + 8;
    let anchor = isPos ? "end" : "start";
    let textFill = "hsl(var(--primary-foreground))";

    if (tooNarrow) {
      tx = isPos ? x + width + 6 : x - 6;
      anchor = isPos ? "start" : "end";
      textFill = isPos ? "hsl(var(--sentiment-positive))" : "hsl(var(--sentiment-negative))";
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
        
        {/* Add leader lines for highlighted items */}
        {highlightIdx.has(index) && (
          signedVal > 0 ? (
            <LeaderDotRight x={x} y={y} width={width} height={height} />
          ) : (
            <LeaderDotLeft x={x} y={y} width={width} height={height} />
          )
        )}
      </g>
    );
  };

  const ZeroAxisLabel = (props: ZeroAxisLabelProps) => {
    const { x, y, width, height, value, payload } = props;
    if (value == null || value === 0 || !payload?.name) return null;

    const isPos = value > 0;
    const gap = 10;
    // For positive bars: label on left of zero line (end anchor)
    // For negative bars: label on left of zero line (end anchor)
    const tx = x - gap;
    const anchor = "end";

    return (
      <text
        x={tx}
        y={y + height / 2}
        textAnchor={anchor}
        dominantBaseline="middle"
        fontSize="13"
        fill="hsl(var(--foreground))"
        fontWeight="700"
      >
        {payload.name}
      </text>
    );
  };

  const LeaderDotRight = ({ x, y, width, height }: LeaderDotProps) => {
    const cy = y + height / 2;
    const endX = x + width;
    const color = "hsl(var(--sentiment-positive))";
    const r = 5;
    const LINE_LEN = 30;

    return (
      <g>
        <circle cx={endX} cy={cy} r={r} fill="hsl(var(--background))" stroke={color} strokeWidth={2} />
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

  const LeaderDotLeft = ({ x, y, width, height }: LeaderDotProps) => {
    const cy = y + height / 2;
    const endX = x + width;
    const color = "hsl(var(--sentiment-negative))";
    const r = 5;
    const LINE_LEN = 30;

    return (
      <g>
        <circle cx={endX} cy={cy} r={r} fill="hsl(var(--background))" stroke={color} strokeWidth={2} />
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

  const CalloutsOverlay = (props: { offset: { left: number; top: number }; xAxisMap: Record<string, any>; yAxisMap: Record<string, any>; data?: ChartDataPoint[]; highlightIdx?: Set<number> }) => {
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
          // Position text further from the leader line end
          const textX = isPositive ? barEndX + 45 : barEndX - 45;

          const lines = wrapText(d.description, 30);

          return (
            <g key={i}>
              <text
                x={textX}
                y={cy - 8}
                textAnchor={isPositive ? "start" : "end"}
                fontWeight="700"
                fontSize={13}
                fill={isPositive ? "hsl(var(--sentiment-positive))" : "hsl(var(--sentiment-negative))"}
              >
                {d.name.length > 30 ? d.name.substring(0, 30) + '...' : d.name}
              </text>
              <text 
                x={textX} 
                y={cy + 8} 
                textAnchor={isPositive ? "start" : "end"}
                fontSize={11} 
                fill="hsl(var(--muted-foreground))"
              >
                {lines.slice(0, 3).map((line, idx) => (
                  <tspan key={idx} x={textX} dy={idx === 0 ? 0 : 13}>
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
    <div className="space-y-4 w-full">
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: "900px", width: "100%", height: 500 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 320, bottom: 30, left: 320 }}
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

            {/* Bars with custom rendering including leader lines */}
            <Bar
              dataKey="value"
              shape={(props) => (
                <CustomBar
                  {...props}
                  fill={props.payload.sign === -1 ? "hsl(var(--sentiment-negative))" : "hsl(var(--sentiment-positive))"}
                  highlightIdx={highlightIdx}
                  index={props.index}
                />
              )}
            />

            {/* Callouts overlay */}
            <Customized component={(rechartsProps: any) => (
              <CalloutsOverlay {...rechartsProps} data={chartData} highlightIdx={highlightIdx} />
            )} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>

      <p className="text-xs text-muted-foreground italic text-center">
        *Impact refers to the total effect that a particular issue has on total sentiment.
      </p>
    </div>
  );
}
