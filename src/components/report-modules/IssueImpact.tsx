import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Customized,
} from "recharts";

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
  value: number; // signed: >0 right of zero, <0 left of zero
  description: string;
  sentiment: number;
  rawValue: number;
  sign: number;
  absValue: number;
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

interface RechartsAxisMap {
  scale: ((value: string | number) => number) & { bandwidth?: () => number };
}

interface RechartsProps {
  offset: { left: number; top: number; width: number; height: number };
  xAxisMap: Record<string, RechartsAxisMap>;
  yAxisMap: Record<string, RechartsAxisMap>;
}

interface CalloutsOverlayProps extends RechartsProps {
  data?: ChartDataPoint[];
  highlightIdx?: Set<number>;
}

interface DataContainer {
  items?: unknown[];
  data?: unknown[];
  issues?: unknown[];
  list?: unknown[];
}

export function IssueImpact({ data }: IssueImpactProps) {
  // Normalize input
  let dataArray: Array<{
    title?: string;
    issue?: string;
    description?: string;
    summary?: string;
    impactScore?: number;
    impact?: number;
    avgSentiment?: number;
    sentiment?: number;
    averageSentiment?: number;
  }> = [];

  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const container = data as DataContainer;
    const arr =
      container.items || container.data || container.issues || container.list;
    if (Array.isArray(arr)) {
      dataArray = arr as typeof dataArray;
    }
  }

  const issues = dataArray.filter((item) => item && (item.title || item.issue));

  if (issues.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No issue impact data available
      </div>
    );
  }

  // --- Build signed impact values --------------------------------------------
  const chartData: ChartDataPoint[] = issues
    .map((issue) => {
      const title = issue.title || issue.issue || "Unknown Issue";
      const description = issue.description || issue.summary || "";
      const impactScore = Math.abs(
        Number(issue.impactScore ?? issue.impact) || 0
      );

      // Read sentiment from various possible fields
      const rawSent =
        Number(
          issue.avgSentiment ?? issue.sentiment ?? issue.averageSentiment
        ) || 0;

      let sentimentScore = Number.isNaN(rawSent) ? 0 : rawSent;

      if (sentimentScore > 1) sentimentScore = 1;
      if (sentimentScore < -1) sentimentScore = -1;

      const isNegative = sentimentScore < 0;
      const signedValue = isNegative ? -impactScore : impactScore;

      return {
        name: title,
        value: signedValue,
        description: description,
        sentiment: sentimentScore,
        rawValue: signedValue,
        sign: isNegative ? -1 : 1,
        absValue: impactScore,
      };
    })
    .sort((a, b) => b.absValue - a.absValue);

  const maxAbs = Math.max(...chartData.map((d) => Math.abs(d.value)), 1);
  const MAX_CALLOUTS = 5;
  const highlightIdx = new Set([
    ...Array(Math.min(MAX_CALLOUTS, chartData.length)).keys(),
  ]);

  // --- Helpers ----------------------------------------------------------------
  const wrapText = (text: string, maxChars = 35) => {
    const words = (text || "").split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";

    for (const w of words) {
      if ((line + " " + w).trim().length > maxChars) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // --- Custom bar: keeps bars visible left/right of zero ----------------------
  const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height, payload, value, highlightIdx, index } =
      props;

    const absValue = Math.abs(payload?.absValue ?? Math.abs(value));
    const isPos = value > 0;

    let barX = x;
    let barWidth = width;

    if (width < 0) {
      barX = x + width; // move to left edge
      barWidth = Math.abs(width); // make width positive
    }

    const tooNarrow = barWidth < 32;

    // Value label: inside bar if wide enough, otherwise just outside
    let tx = isPos ? barX + barWidth - 8 : barX + 8;
    let anchor: "start" | "end" = isPos ? "end" : "start";
    let textFill = "hsl(var(--primary-foreground))";

    if (tooNarrow) {
      tx = isPos ? barX + barWidth + 6 : barX - 6;
      anchor = isPos ? "start" : "end";
      textFill = isPos
        ? "hsl(var(--sentiment-positive))"
        : "hsl(var(--sentiment-negative))";
    }

    return (
      <g>
        <rect
          x={barX}
          y={y}
          width={barWidth}
          height={height}
          fill={fill}
          rx={3}
        />
        <text
          x={tx}
          y={y + height / 2}
          dominantBaseline="middle"
          textAnchor={anchor}
          fontSize="12"
          fontWeight="700"
          fill={textFill}
        >
          {absValue.toFixed(0)}
        </text>

        {highlightIdx.has(index) &&
          (isPos ? (
            <LeaderDotRight x={barX} y={y} width={barWidth} height={height} />
          ) : (
            <LeaderDotLeft x={barX} y={y} width={barWidth} height={height} />
          ))}
      </g>
    );
  };


  // For positive bars: label on the LEFT of the zero line
  const PositiveZeroAxisLabel = (props: ZeroAxisLabelProps) => {
    const { x, y, height, payload } = props;
    if (!payload?.name) return null;

    // only render for positive bars
    if (payload.value <= 0) return null;

    const gap = 10;

    return (
      <text
        x={x - gap} // left of 0
        y={y + height / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="13"
        fill="hsl(var(--foreground))"
        fontWeight="700"
      >
        {payload.name}
      </text>
    );
  };

  const NegativeZeroAxisLabel = (props: ZeroAxisLabelProps) => {
    const { x, y, height, payload } = props;
    if (!payload?.name) return null;

    // only render for negative bars
    if (payload.value >= 0.1) return null;

    const gap = 10;

    return (
      <text
        x={x + gap} // right of 0
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize="13"
        fill="hsl(var(--foreground))"
        fontWeight="700"
      >
        {payload.name}
      </text>
    );
  };

  // --- Leader dots (unchanged look, just support both sides) -----------------
  const LeaderDotRight = ({ x, y, width, height }: LeaderDotProps) => {
    const cy = y + height / 2;
    const endX = x + width;
    const color = "hsl(var(--sentiment-positive))";
    const r = 5;
    const LINE_LEN = 24;

    return (
      <g>
        <circle
          cx={endX}
          cy={cy}
          r={r}
          fill="hsl(var(--background))"
          stroke={color}
          strokeWidth={2}
        />
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
    const endX = x; // start of bar on the left side
    const color = "hsl(var(--sentiment-negative))";
    const r = 5;
    const LINE_LEN = 24;

    return (
      <g>
        <circle
          cx={endX}
          cy={cy}
          r={r}
          fill="hsl(var(--background))"
          stroke={color}
          strokeWidth={2}
        />
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

  // --- Callouts: hug bars & never overflow -----------------------------------
  const CalloutsOverlay = (props: CalloutsOverlayProps) => {
    const { offset, xAxisMap, yAxisMap } = props;
    const xAxis = xAxisMap?.[Object.keys(xAxisMap || {})[0]];
    const yAxis = yAxisMap?.[Object.keys(yAxisMap || {})[0]];
    if (!xAxis || !yAxis) return null;

    const xScale = xAxis.scale;
    const yScale = yAxis.scale;
    const zeroX = xScale(0);
    const band = yScale.bandwidth ? yScale.bandwidth() : 0;

    // Separate gaps for better positioning on each side
    const GAP_POSITIVE = -220; // gap for positive bars (right side)
    const GAP_NEGATIVE = 300; // gap for negative bars (left side)

    return (
      <g transform={`translate(${offset.left}, ${offset.top})`}>
        {chartData.map((d, i) => {
          if (!highlightIdx.has(i) || !d.description) return null;

          const cy = (yScale(d.name) ?? 0) + band / 2;
          const barEndX = xScale(d.value); // end of THIS bar
          const isPositive = d.value > 0;

          const textX = isPositive
            ? barEndX + GAP_POSITIVE // to the right of positive bar
            : barEndX - GAP_NEGATIVE; // to the left of negative bar

          const lines = wrapText(d.description, 40);
          const titleColor = isPositive
            ? "hsl(var(--sentiment-positive))"
            : "hsl(var(--sentiment-negative))";

          return (
            <g key={i}>
              {/* Issue title */}
              <text
                x={textX}
                y={cy - 15}
                textAnchor={isPositive ? "start" : "end"}
                fontWeight={700}
                fontSize={13}
                fill={titleColor}
              >
                {d.name.length > 35 ? d.name.substring(0, 35) + "..." : d.name}
              </text>

              {/* Description */}
              <text
                x={textX}
                y={cy + 8}
                textAnchor={isPositive ? "start" : "end"}
                fontSize={11}
                fill="hsl(var(--muted-foreground))"
              >
                {lines.slice(0, 2).map((line, idx) => (
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

  // --- Render -----------------------------------------------------------------
  return (
    <div className="space-y-4 w-full">
      <div className="w-full overflow-x-auto">
        <div
          className="mx-auto"
          style={{
            minWidth: "1100px",
            // width: "100%",
            height: 500,
          }}
        >
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 260, bottom: 30, left: 260 }}
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

              {/* Labels anchored at zero-line, close to bars */}
              <Customized
                component={(props: Record<string, unknown>) => {
                  const rp = props as unknown as RechartsProps;
                  const xAxis = rp.xAxisMap[Object.keys(rp.xAxisMap)[0]];
                  const yAxis = rp.yAxisMap[Object.keys(rp.yAxisMap)[0]];
                  const xScale = xAxis.scale;
                  const yScale = yAxis.scale;
                  const zeroX = xScale(0);

                  return (
                    <g>
                      {chartData.map((d, i) => {
                        const yPos = yScale(d.name);
                        const bandwidth = yScale.bandwidth
                          ? yScale.bandwidth()
                          : 0;
                        return (
                          <g key={i}>
                            <PositiveZeroAxisLabel
                              x={zeroX}
                              y={yPos}
                              width={0}
                              height={bandwidth}
                              value={d.value}
                              payload={d}
                            />
                            <NegativeZeroAxisLabel
                              x={zeroX}
                              y={yPos}
                              width={0}
                              height={bandwidth}
                              value={d.value}
                              payload={d}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                }}
              />

              {/* Bars with corrected negative widths */}
              <Bar
                dataKey="value"
                shape={(props: CustomBarProps) => (
                  <CustomBar
                    {...props}
                    fill={
                      props.payload.sign === -1
                        ? "hsl(var(--sentiment-negative))"
                        : "hsl(var(--sentiment-positive))"
                    }
                    highlightIdx={highlightIdx}
                    index={props.index}
                  />
                )}
              />

              {/* Callouts that hug bars & stay in-bounds */}
              <Customized
                component={(rp: Record<string, unknown>) => (
                  <CalloutsOverlay
                    {...(rp as unknown as RechartsProps)}
                    data={chartData}
                    highlightIdx={highlightIdx}
                  />
                )}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic text-center">
        *Impact refers to the total effect that a particular issue has on total
        sentiment.
      </p>
    </div>
  );
}
