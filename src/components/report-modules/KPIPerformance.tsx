import { Card } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot, ResponsiveContainer, Tooltip, Label } from "recharts";

interface KPIItem {
  kpi?: string;
  name?: string;
  volume?: number;
  x?: number;
  averageSentiment?: number;
  y?: number;
  summary?: string;
  tooltip?: string;
}

interface KPIPerformanceProps {
  data?: KPIItem[] | { points?: KPIItem[]; [key: string]: any };
}

// Helper: convert to array
const toArray = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") return Object.values(d);
  return [];
};

// Helper: ensure number
const num = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

// Helper: convert sentiment to unit scale (-1 to 1)
const sentUnit = (v: any): number => {
  const n = num(v);
  // If already in -1 to 1 range, return as is
  if (n >= -1 && n <= 1) return n;
  // If in -100 to 100 range, convert
  if (n >= -100 && n <= 100) return n / 100;
  return 0;
};

// Helper: convert sentiment to percentage (-100 to 100)
const sentPct = (v: any): number => {
  const unit = sentUnit(v);
  return Math.round(unit * 100);
};

export function KPIPerformance({ data }: KPIPerformanceProps) {
  // Adapt data according to the kpiPerformance adapter
  const rawData = (data as any)?.points ?? data;
  const items = toArray(rawData).map((m) => ({
    kpi: m.kpi || m.name || "KPI",
    volume: num(m.x ?? m.volume),
    averageSentiment: sentUnit(m.y ?? m.averageSentiment),
    summary: m.summary || m.tooltip || "",
  }));

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No KPI performance data found for this duration.
      </div>
    );
  }

  // Calculate means
  const meanVol = items.reduce((a, b) => a + (b.volume || 0), 0) / items.length;
  const meanSent = items.reduce((a, b) => a + (b.averageSentiment || 0), 0) / items.length;
  const meanSentPct = Math.round(meanSent * 100);

  // Chart data with percentage sentiment
  const chartData = items.map((d) => ({
    ...d,
    sentPct: sentPct(d.averageSentiment),
  }));

  // Calculate bubble sizes
  const maxVol = Math.max(...items.map(i => i.volume || 0), 1);
  const BUBBLE_MIN = 110;
  const BUBBLE_MAX = 520;
  const sizeFor = (v: number) => BUBBLE_MIN + Math.sqrt((v || 0) / maxVol) * (BUBBLE_MAX - BUBBLE_MIN);

  // Y-axis ticks
  const SENT_STEP = 20;
  const sentTicks = Array.from({ length: (200 / SENT_STEP) + 1 }, (_, i) => -100 + i * SENT_STEP);

  // X-axis domain with padding
  const xMinRaw = Math.min(...items.map(i => i.volume || 0));
  const xMaxRaw = Math.max(...items.map(i => i.volume || 0));
  const rawRange = xMaxRaw - xMinRaw;
  const pad = rawRange > 0 ? rawRange * 0.06 : Math.max(1, (xMaxRaw || 1)) * 0.06;
  const xDomainMin = xMinRaw - pad;
  const xDomainMax = xMaxRaw + pad;

  // Corner label positions
  const domainRange = xDomainMax - xDomainMin;
  const inset = domainRange * 0.03;
  const xLeft = xDomainMin + inset;
  const xRight = xDomainMax - inset;

  // Corner label component
  const cornerLabel = ({ top, align, lines }: { top: boolean; align: string; lines: Array<{ text: string; cls: string }> }) => (props: any) => {
    const vb = props.viewBox || {};
    const px = vb.cx ?? vb.x ?? 0;
    const py = vb.cy ?? vb.y ?? 0;

    const anchor = align === "end" ? "end" : "start";
    const x0 = px + (anchor === "start" ? 8 : -8);
    const y0 = py + (top ? 18 : -26);

    const color = (cls: string) =>
      cls === "pos" ? "hsl(var(--chart-2))" :
      cls === "neg" ? "hsl(var(--destructive))" :
      "hsl(var(--muted-foreground))";

    return (
      <g>
        <text
          x={x0}
          y={y0}
          textAnchor={anchor}
          style={{ fill: color(lines[0].cls), fontWeight: 600, fontSize: 12 }}
        >
          {lines[0].text}
        </text>
        <text
          x={x0}
          y={y0 + 16}
          textAnchor={anchor}
          style={{ fill: color(lines[1].cls), fontWeight: 600, fontSize: 12 }}
        >
          {lines[1].text}
        </text>
      </g>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">KPI Visibility vs Sentiment</h3>
      
      <div style={{ paddingRight: "80px", overflow: "visible" }}>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 48, right: 70, bottom: 64, left: 44 }}>
            <defs>
              <filter id="kpiShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.24" />
              </filter>
            </defs>

            <CartesianGrid stroke="hsl(var(--border))" />

            <XAxis
              type="number"
              dataKey="volume"
              name="Visibility"
              domain={[xDomainMin, xDomainMax]}
              tickFormatter={(v) => v.toLocaleString()}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontWeight: 600, fontSize: 12 }}
            >
              <Label value="Visibility* (mentions)" offset={-10} position="insideBottom" style={{ fill: 'hsl(var(--muted-foreground))' }} />
            </XAxis>

            <YAxis
              type="number"
              dataKey="sentPct"
              name="Sentiment"
              domain={[-100, 100]}
              ticks={sentTicks}
              allowDecimals={false}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontWeight: 600, fontSize: 12 }}
            >
              <Label angle={-90} value="Sentiment* (−100 to +100)" position="insideLeft" style={{ fill: 'hsl(var(--muted-foreground))' }} />
            </YAxis>

            {/* Mean lines */}
            <ReferenceLine x={meanVol} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} />
            <ReferenceLine y={meanSentPct} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} />

            {/* Quadrant labels */}
            <ReferenceDot x={xLeft} y={100} r={0} isFront>
              <Label content={cornerLabel({
                top: true, align: "start",
                lines: [
                  { text: "Above-average Sentiment", cls: "pos" },
                  { text: "Below-average Visibility", cls: "neg" },
                ],
              })} />
            </ReferenceDot>

            <ReferenceDot x={xRight} y={100} r={0} isFront>
              <Label content={cornerLabel({
                top: true, align: "end",
                lines: [
                  { text: "Above-average Sentiment", cls: "pos" },
                  { text: "Above-average Visibility", cls: "pos" },
                ],
              })} />
            </ReferenceDot>

            <ReferenceDot x={xLeft} y={-100} r={0} isFront>
              <Label content={cornerLabel({
                top: false, align: "start",
                lines: [
                  { text: "Below-average Sentiment", cls: "neg" },
                  { text: "Below-average Visibility", cls: "neg" },
                ],
              })} />
            </ReferenceDot>

            <ReferenceDot x={xRight} y={-100} r={0} isFront>
              <Label content={cornerLabel({
                top: false, align: "end",
                lines: [
                  { text: "Below-average Sentiment", cls: "neg" },
                  { text: "Above-average Visibility", cls: "pos" },
                ],
              })} />
            </ReferenceDot>

            {/* Average label */}
            <ReferenceDot x={meanVol} y={meanSentPct} r={0} isFront>
              <Label
                position="right"
                value={`KPI Average: ${meanSentPct}`}
                style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}
              />
            </ReferenceDot>

            <Tooltip
              labelFormatter={() => ""}
              formatter={(value: any, name: any) => {
                if (name === "volume") return [`${Number(value).toLocaleString()}`, "Visibility"];
                if (name === "sentPct") return [`${value}`, "Sentiment"];
                return [String(value), name];
              }}
            />

            {/* Scatter with custom bubble shapes */}
            <Scatter
              name="KPIs"
              data={chartData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const r = Math.sqrt(sizeFor(payload.volume) / Math.PI);

                // Color based on sentiment relative to average
                const variant =
                  payload.sentPct > meanSentPct + 5 ? "pos" :
                  payload.sentPct < meanSentPct - 5 ? "neg" : "neu";

                const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
                const ringW = clamp(r * 0.22, 8, 42);
                const CALLOUT_GAP = 24;

                const showCallout = Math.abs(payload.sentPct) >= 35 || (payload.volume || 0) >= maxVol * 0.55;
                const toRight = (payload.volume || 0) >= meanVol;
                const calloutX = toRight ? cx + r + CALLOUT_GAP : cx - r - CALLOUT_GAP;

                // Green for positive, red for negative, grey for neutral
                const fillColor = 
                  variant === "pos" ? "hsl(var(--chart-2))" :
                  variant === "neg" ? "hsl(var(--destructive))" :
                  "hsl(var(--muted-foreground))";

                const strokeColor = 
                  variant === "pos" ? "hsl(var(--chart-2))" :
                  variant === "neg" ? "hsl(var(--destructive))" :
                  "hsl(var(--muted-foreground))";

                return (
                  <g filter="url(#kpiShadow)">
                    <circle cx={cx} cy={cy} r={r} fill={fillColor} opacity={0.15} />
                    <circle cx={cx} cy={cy} r={r - ringW / 2} strokeWidth={ringW} fill="none" stroke={strokeColor} opacity={0.8} />

                    {showCallout && (
                      <>
                        <line
                          x1={toRight ? cx + r : cx - r}
                          y1={cy}
                          x2={calloutX}
                          y2={cy}
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                        />
                        <text
                          x={toRight ? calloutX + 6 : calloutX - 6}
                          y={cy - 2}
                          textAnchor={toRight ? "start" : "end"}
                          style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                        >
                          {payload.kpi}
                        </text>
                      </>
                    )}
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Footnotes */}
      <div className="mt-6 space-y-2 text-sm text-muted-foreground text-center">
        <div><span className="font-semibold">*</span> Sentiment is scored on a scale between -100 and 100.</div>
        <div><span className="font-semibold">*</span> Visibility is a measure of volume weighted by influence of the source as well as the prominence and relevance of the mention.</div>
        <div className="text-xs opacity-70">The dotted sentiment average line represents the average sentiment score for all KPIs. The dotted visibility average line represents average visibility for all KPIs.</div>
      </div>

      {/* Summary section */}
      <div className="mt-8">
        <h4 className="text-base font-semibold mb-4">Summary & Insights</h4>
        <ul className="space-y-3">
          {items.map((item, idx) => {
            const sent = sentPct(item.averageSentiment);
            
            // Color based on sentiment relative to average
            let sentimentClass = "text-muted-foreground";
            let marker = "▼";
            if (sent > meanSentPct + 5) {
              sentimentClass = "text-green-600";
              marker = "▲";
            } else if (sent < meanSentPct - 5) {
              sentimentClass = "text-red-600";
              marker = "▼";
            }

            const sentimentStr = sent > 0 ? `(+${sent})` : `(${sent})`;

            return (
              <li key={idx} className="text-sm">
                <strong className={sentimentClass}>
                  {marker} {item.kpi} {sentimentStr}
                </strong>:{" "}
                {item.summary || <i className="text-muted-foreground">No significant discussion.</i>}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
