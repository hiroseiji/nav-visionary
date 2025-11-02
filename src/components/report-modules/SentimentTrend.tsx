import React, { useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { SentimentPoint, SentimentAnnotation } from "../../types/sentiment";
import { getSpikeColor } from "../../utils/sentimentTrendUtils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  annotationPlugin,
  ChartDataLabels
);

interface SentimentTrendProps {
  data: SentimentPoint[];
  annotations?: SentimentAnnotation[];
}

// Color mapping for categories
const CAT_COLORS = {
  positive: "#34d139",
  negative: "#ff1b0b",
  neutral: "#bbbbbb",
  mixed: "#5d98ff",
};

// Helper: determine dominant category for a day
const getDayCategory = (d: SentimentPoint): string => {
  const pos = d.positive ?? 0;
  const neg = d.negative ?? 0;
  const neu = d.neutral ?? 0;
  const mix = d.mixed ?? 0;
  const max = Math.max(pos, neg, neu, mix);
  if (max === 0) return "neutral";
  if (pos === max) return "positive";
  if (neg === max) return "negative";
  if (mix === max) return "mixed";
  return "neutral";
};

// Utility functions
const clamp1 = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const smoothstep = (x: number) => x * x * (3 - 2 * x);

function dynamicPointRadius(
  chart: ChartJS,
  { min = 1.5, max = 1.6, pxPerUnit = 10 } = {}
) {
  const x = chart.scales.x;
  const n = chart.data?.labels?.length ?? 0;
  if (!x || n <= 1) return (min + max) / 2;

  const span = x.getPixelForTick(n - 1) - x.getPixelForTick(0);
  const avgPx = span / (n - 1);
  const r = (avgPx / pxPerUnit) * max;
  return clamp1(r, min, max);
}

const TICK_EVERY_DAYS = 4;
const month3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const daysBetween = (a: Date, b: Date) =>
  Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86400000
  );

const fourDayTickCallback = (labels: string[]) => (val: string | number, idx: number) => {
  const first = new Date(labels[0]);
  const cur = new Date(labels[idx]);
  if (isNaN(first.getTime()) || isNaN(cur.getTime())) {
    if (idx % TICK_EVERY_DAYS !== 0 && idx !== labels.length - 1) return "";
    return labels[idx];
  }
  const d = daysBetween(first, cur);
  if (d % TICK_EVERY_DAYS !== 0 && idx !== labels.length - 1) return "";
  return `${cur.getDate()}-${month3[cur.getMonth()]}`;
};

function makeGradientRing(size = 22, thickness = 7) {
  const dpr = window.devicePixelRatio || 1;
  const c = document.createElement("canvas");
  c.width = c.height = size * dpr;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.scale(dpr, dpr);

  const r = size / 2;
  const cx = r,
    cy = r;

  let g: CanvasGradient;
  if (typeof ctx.createConicGradient === "function") {
    g = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  } else {
    g = ctx.createLinearGradient(0, 0, size, 0);
  }
  g.addColorStop(0.0, CAT_COLORS.positive);
  g.addColorStop(0.2, CAT_COLORS.positive);
  g.addColorStop(0.3, CAT_COLORS.neutral);
  g.addColorStop(0.4, CAT_COLORS.neutral);
  g.addColorStop(0.6, CAT_COLORS.negative);
  g.addColorStop(0.9, CAT_COLORS.mixed);
  g.addColorStop(1.0, CAT_COLORS.mixed);

  ctx.lineWidth = thickness;
  ctx.strokeStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r - thickness / 2, 0, Math.PI * 2);
  ctx.stroke();

  return c;
}

const HaloPointsPlugin = {
  id: "haloPoints",
  afterDatasetsDraw(chart: ChartJS) {
    const { ctx } = chart;

    chart.data.datasets.forEach((ds, i: number) => {
      // @ts-expect-error - Custom property
      if (!ds._drawHalo) return;

      const meta = chart.getDatasetMeta(i);
      if (!meta?.data?.length) return;

      meta.data.forEach((pt, idx: number) => {
        const pointEl = pt as { x?: number; y?: number; options?: { backgroundColor?: string } };
        if (!pointEl?.x || !pointEl?.y) return;

        const dsAny = ds as { pointRadius?: number | ((ctx: unknown) => number) };
        const pr =
          typeof dsAny.pointRadius === "function"
            ? dsAny.pointRadius({ chart, dataset: ds, dataIndex: idx })
            : (dsAny.pointRadius || 3);

        const prev = meta.data[idx - 1] as typeof pointEl;
        const next = meta.data[idx + 1] as typeof pointEl;
        const dxPrev = prev?.x !== undefined ? Math.abs(pointEl.x - prev.x) : Infinity;
        const dxNext = next?.x !== undefined ? Math.abs(pointEl.x - next.x) : Infinity;
        const nearestDx = Math.min(dxPrev, dxNext);

        const spacing = nearestDx / (pr * 3);
        const ease = smoothstep(clamp1(spacing, 0, 1));

        const minScale = 1.6;
        const maxScale = 4.2;
        const scale = minScale + (maxScale - minScale) * ease;

        const haloR = Math.max(3, pr * scale);

        const baseAlpha = 0.25;
        const alpha = 0.25 * baseAlpha + 0.75 * baseAlpha * ease;

        const fillCol = pointEl.options?.backgroundColor || "#0bb37b";

        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pointEl.x, pointEl.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = fillCol;
        ctx.fill();
        ctx.restore();
      });
    });
  },
};

ChartJS.register(HaloPointsPlugin);

export function SentimentTrend({
  data,
  annotations = [],
}: SentimentTrendProps) {
  const sentimentChartRef = useRef<ChartJS | null>(null);
  const volumeChartRef = useRef<ChartJS | null>(null);
  const sentimentCanvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Detect theme mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#e5e5e5' : '#404040';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipBg = isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = isDarkMode ? '#ffffff' : '#000000';
    const subtitleColor = isDarkMode ? '#aaaaaa' : '#666666';

    const labels = data.map((d) => d.date);
    const numOrNull = (v: number) => (Number.isFinite(v) ? v : null);
    const safe = (v: number) => (v === 0.25 ? null : numOrNull(v));

    const dailySent = data.map((d) => safe(d.sentiment));
    const smoothSent = data.map((d) => safe(d.rolling));
    const industry = data.map((d) => safe(d.industryTrend ?? 0));

    const dayCats = data.map((d) => getDayCategory(d));
    const colorAt = (i: number) => CAT_COLORS[dayCats[i] as keyof typeof CAT_COLORS] || CAT_COLORS.positive;

    const industryColor = isDarkMode ? "rgba(254, 254, 254, 0.9)" : "rgba(100, 100, 100, 0.8)";

    // Sentiment chart
    if (sentimentCanvasRef.current) {
      if (sentimentChartRef.current) {
        sentimentChartRef.current.destroy();
      }

      const ctx = sentimentCanvasRef.current.getContext("2d");
      if (ctx) {
        sentimentChartRef.current = new ChartJS(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              ...(hasIndustryTrend
                ? [
                    {
                      type: "line" as const,
                      label: "Industry Trend",
                      data: industry as (number | null)[],
                      borderColor: industryColor,
                      borderWidth: 2,
                      pointRadius: 0,
                      yAxisID: "y1",
                      tension: 0.25,
                      spanGaps: true,
                      cubicInterpolationMode: "monotone" as const,
                      datalabels: { display: false },
                      order: 0,
                    },
                  ]
                : []),
              {
                type: "line" as const,
                label: "Sentiment Trend",
                data: smoothSent as (number | null)[],
                borderWidth: (ctx: { chart: ChartJS }) => Math.max(2, dynamicPointRadius(ctx.chart) * 0.6),
                borderColor: "#e0c80c",
                backgroundColor: "rgba(214,191,21,0.05)",
                pointRadius: 0,
                yAxisID: "y1",
                tension: 0.35,
                spanGaps: true,
                cubicInterpolationMode: "monotone" as const,
                datalabels: { display: false },
                order: 1,
              },
              {
                type: "line" as const,
                label: "Sentiment",
                data: dailySent as (number | null)[],
                yAxisID: "y1",
                tension: 0.35,
                spanGaps: true,
                cubicInterpolationMode: "monotone" as const,
                borderWidth: (ctx: { chart: ChartJS }) => Math.max(1, dynamicPointRadius(ctx.chart) * 0.75),
                segment: {
                  borderColor: (ctx: { p0DataIndex: number }) => {
                    const i = ctx.p0DataIndex ?? 0;
                    return colorAt(i);
                  },
                },
                pointRadius: (ctx: { chart: ChartJS }) => dynamicPointRadius(ctx.chart),
                pointHoverRadius: (ctx: { chart: ChartJS }) => Math.max(4, dynamicPointRadius(ctx.chart) * 1.6),
                pointBackgroundColor: (ctx: { dataIndex: number }) => colorAt(ctx.dataIndex),
                pointBorderColor: (ctx: { dataIndex: number }) => colorAt(ctx.dataIndex),
                fill: {
                  target: "origin",
                  above: "rgba(11,179,123,0.08)",
                  below: "rgba(239,68,68,0.10)",
                },
                datalabels: { display: false },
                order: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            layout: { padding: { right: 8 } },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  autoSkip: false,
                  maxRotation: 0,
                  font: { family: "Raleway", size: 12 },
                  color: textColor,
                  callback: fourDayTickCallback(labels),
                },
              },
              y1: {
                position: "left",
                min: -100,
                max: 100,
                grid: { color: gridColor },
                ticks: {
                  stepSize: 20,
                  font: { family: "Raleway", size: 12 },
                  color: textColor,
                },
                title: {
                  display: true,
                  text: "Sentiment*",
                  font: { family: "Raleway", size: 12, weight: "bold" },
                  color: textColor,
                },
              },
            },
            plugins: {
              decimation: { enabled: true, algorithm: "lttb", samples: 500 },
              legend: {
                position: "top",
                labels: {
                  usePointStyle: true,
                  boxWidth: 22,
                  boxHeight: 22,
                  padding: 16,
                  color: textColor,
                  font: { family: "Raleway", size: 13 },
                  generateLabels(chart) {
                    const labels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
                    labels.forEach((l) => {
                      if (l.text === "Sentiment") {
                        l.pointStyle = makeGradientRing(11, 3);
                        l.fillStyle = "transparent";
                        l.strokeStyle = "transparent";
                      }
                    });
                    return labels;
                  },
                },
              },
              tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: tooltipText,
                titleFont: { family: "Raleway", size: 12, weight: "bold" },
                bodyFont: { family: "Raleway", size: 12 },
                callbacks: {
                  label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)}`,
                },
              },
              subtitle: {
                display: true,
                text: "*Scale -100 to 100 (0 = neutral).",
                align: "start",
                padding: { top: 6 },
                font: { family: "Raleway", size: 11 },
                color: subtitleColor,
              },
              annotation: annotations.length
                ? {
                    annotations: Object.fromEntries(
                      annotations
                        .filter((a) => a.date && labels.includes(a.date))
                        .map((a, i) => [
                          `v_${i}`,
                          {
                            type: "line" as const,
                            xScaleID: "x",
                            xMin: a.date,
                            xMax: a.date,
                            borderColor: getSpikeColor(a.type) || "rgba(11, 179, 123, 0.17)",
                            borderDash: [4, 4],
                            borderWidth: 1,
                            drawTime: "afterDatasetsDraw",
                          },
                        ])
                    ),
                   }
                 : undefined,
            },
          },
        });
      }
    }

    // Volume chart
    if (volumeCanvasRef.current) {
      if (volumeChartRef.current) {
        volumeChartRef.current.destroy();
      }

      const ctx = volumeCanvasRef.current.getContext("2d");
      if (ctx) {
        volumeChartRef.current = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                type: "bar" as const,
                label: "Positive",
                data: data.map((d) => d.positive ?? 0),
                backgroundColor: "rgb(52, 209, 57)",
                borderWidth: 1,
                stack: "volume",
                borderRadius: 3,
              },
              {
                type: "bar" as const,
                label: "Neutral",
                data: data.map((d) => d.neutral ?? 0),
                backgroundColor: "rgb(187, 187, 187)",
                borderWidth: 1,
                stack: "volume",
                borderRadius: 3,
              },
              {
                type: "bar" as const,
                label: "Negative",
                data: data.map((d) => d.negative ?? 0),
                backgroundColor: "rgb(255, 27, 11)",
                borderWidth: 1,
                stack: "volume",
                borderRadius: 3,
              },
              ...(hasMixed
                ? [
                    {
                      type: "bar" as const,
                      label: "Mixed",
                      data: data.map((d) => d.mixed ?? 0),
                      backgroundColor: "rgb(93, 152, 255)",
                      borderWidth: 1,
                      stack: "volume",
                      borderRadius: 3,
                    },
                  ]
                : []),
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  autoSkip: false,
                  maxRotation: 0,
                  font: { family: "Raleway", size: 12 },
                  color: textColor,
                  callback: fourDayTickCallback(labels),
                },
              },
              y: {
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: {
                  font: { family: "Raleway", size: 12 },
                  color: textColor,
                  callback: (v: number | string) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
                },
                title: {
                  display: true,
                  text: "Volume",
                  font: { family: "Raleway", size: 12, weight: "bold" },
                  color: textColor,
                },
                stacked: true,
              },
            },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  usePointStyle: true,
                  pointStyle: "circle",
                  font: { family: "Raleway", size: 12 },
                  color: textColor,
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} mentions`,
                },
              },
              datalabels: { display: false },
            },
          },
        });
      }
    }

    return () => {
      if (sentimentChartRef.current) {
        sentimentChartRef.current.destroy();
      }
      if (volumeChartRef.current) {
        volumeChartRef.current.destroy();
      }
    };
  }, [data, annotations, hasIndustryTrend, hasMixed]);

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div style={{ width: "100%", height: 320 }}>
          <canvas ref={sentimentCanvasRef} />
        </div>
      </Card>

      <Card className="p-6">
        <div style={{ width: "100%", height: 240 }}>
          <canvas ref={volumeCanvasRef} />
        </div>
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
