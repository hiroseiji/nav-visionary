// components/report-modules/SentimentTrend.tsx
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
  Label,
} from "recharts";

import { SentimentPoint, SentimentAnnotation } from "../../types/sentiment";
import { getLineColor, getSpikeColor } from "../../utils/sentimentTrendUtils";

type DotProps = { cx?: number; cy?: number; payload: SentimentPoint };

interface SentimentTrendProps {
  data: SentimentPoint[];
  annotations?: SentimentAnnotation[];
}

export function SentimentTrend({
  data,
  annotations = [],
}: SentimentTrendProps) {
  const hasIndustryTrend = useMemo(
    () =>
      data?.some(
        (d) => d.industryTrend !== undefined && d.industryTrend !== null
      ) ?? false,
    [data]
  );

  const hasMixed = useMemo(
    () => data?.some((d) => (d.mixed ?? 0) > 0) ?? false,
    [data]
  );

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={0} />
            <YAxis
              domain={[-100, 100]}
              ticks={[-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 12 }}
            >
              <Label
                value="Sentiment*"
                angle={-90}
                position="insideLeft"
                style={{ fontSize: 12 }}
              />
            </YAxis>
            <Tooltip />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />

            <Line
              type="monotone"
              dataKey="rolling"
              stroke="#e0c80c"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Sentiment Trend"
            />

            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#10b981"
              strokeWidth={2}
              dot={(p: DotProps) => {
                const { cx, cy, payload } = p;
                const c = getLineColor(payload.sentiment);
                return <circle cx={cx} cy={cy} r={5} fill={c} stroke={c} />;
              }}
              name="Sentiment"
            />

            {hasIndustryTrend && (
              <Line
                type="monotone"
                dataKey="industryTrend"
                stroke="#000"
                strokeWidth={2}
                dot={false}
                name="Industry Trend"
              />
            )}

            {annotations.map((ann, idx) => (
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

      <Card className="p-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={0} />
            <YAxis tick={{ fontSize: 12 }}>
              <Label
                value="Volume"
                angle={-90}
                position="insideLeft"
                style={{ fontSize: 12 }}
              />
            </YAxis>
            <Tooltip />
            <Bar dataKey="negative" stackId="a" fill="#ef4444" />
            <Bar dataKey="neutral" stackId="a" fill="#9ca3af" />
            <Bar dataKey="positive" stackId="a" fill="#10b981" />
            {hasMixed && <Bar dataKey="mixed" stackId="a" fill="#5d98ff" />}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <p className="text-xs text-muted-foreground italic text-center">
        *Sentiment is measured on a scale of -100–100 (0 = neutral). Sentiment
        trend is a rolling average of the sentiment score.
      </p>

      {annotations.length > 0 && (
        <section className="space-y-4">
          <h4 className="text-base font-semibold">Key Events & Spikes</h4>
          <div className="space-y-3">
            {annotations.map((spike, idx) => {
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
                  {spike.date && (
                    <div className="text-sm text-muted-foreground">
                      {spike.date}
                    </div>
                  )}
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
