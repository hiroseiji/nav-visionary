import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SentimentPoint, SentimentAnnotation } from "../../types/sentiment";

interface SentimentTrendProps {
  data: SentimentPoint[];
  annotations?: SentimentAnnotation[];
}

const CAT_COLORS = { positive: "#34d139", negative: "#ff1b0b", neutral: "#bbbbbb", mixed: "#5d98ff" };

const getSpikeColor = (type = "") => {
  const t = String(type).toLowerCase();
  if (t.includes("negative")) return CAT_COLORS.negative;
  if (t.includes("mixed")) return CAT_COLORS.mixed;
  if (t.includes("neutral")) return CAT_COLORS.neutral;
  return CAT_COLORS.positive;
};

export function SentimentTrend({ data, annotations = [] }: SentimentTrendProps) {
  if (!data || data.length === 0) {
    return <div className="p-6"><p>No sentiment data available for the selected period.</p></div>;
  }

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} label={{ value: "Sentiment", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          {data[0]?.industryTrend !== undefined && (
            <Line type="monotone" dataKey="industryTrend" stroke="rgba(254, 254, 254, 0.9)" strokeWidth={2} dot={false} name="Industry Trend" />
          )}
          <Line type="monotone" dataKey="rolling" stroke="#e0c80c" strokeWidth={2} dot={false} name="Sentiment Trend" />
          <Line type="monotone" dataKey="sentiment" stroke="#34d139" strokeWidth={1.5} dot={{ r: 3 }} name="Sentiment" />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: "Volume", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="positive" stackId="a" fill={CAT_COLORS.positive} radius={[3, 3, 0, 0]} />
          <Bar dataKey="neutral" stackId="a" fill={CAT_COLORS.neutral} radius={[3, 3, 0, 0]} />
          <Bar dataKey="negative" stackId="a" fill={CAT_COLORS.negative} radius={[3, 3, 0, 0]} />
          {data.some(d => (d.mixed ?? 0) > 0) && (
            <Bar dataKey="mixed" stackId="a" fill={CAT_COLORS.mixed} radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="text-sm text-muted-foreground">
        *Sentiment is measured on a scale of -100-100, with 0 representing neutral. **Sentiment trend is a simple 30-day average of sentiment score.
      </div>

      {!!annotations?.length && (
        <section className="space-y-4">
          <h4 className="text-lg font-semibold">Key Events & Spikes</h4>
          <div className="grid gap-4">
            {annotations.map((spike, idx) => {
              const color = getSpikeColor(spike?.type);
              return (
                <article key={idx} className="border-l-4 p-4 bg-card rounded" style={{ borderLeftColor: color }}>
                  <div className="font-semibold" style={{ color }}>{spike?.category || spike?.type || "Event"}</div>
                  {spike?.date && <div className="text-sm text-muted-foreground">{spike.date}</div>}
                  <div className="mt-2"><li>{spike?.summary}</li></div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
