import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Plugin,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useTheme } from "@/components/ThemeContext";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Custom plugin for point halos
const pointHaloPlugin = {
  id: "pointHalo",
  afterDatasetsDraw(
    chart: ChartJS,
    _args: unknown,
    options: { label?: string; radius?: number; alpha?: number }
  ) {
    const { ctx } = chart;
    const targetLabel = options.label || "Sentiment";
    const radius = options.radius || 14;
    const alpha = options.alpha || 0.24;

    chart.data.datasets.forEach((dataset, datasetIndex: number) => {
      if (dataset.label !== targetLabel) return;
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((point, index: number) => {
        const datasetWithColor = dataset as typeof dataset & {
          pointBackgroundColor?: string | string[];
        };
        const color = Array.isArray(datasetWithColor.pointBackgroundColor)
          ? datasetWithColor.pointBackgroundColor[index]
          : datasetWithColor.pointBackgroundColor;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color as string;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
  },
};

ChartJS.register(pointHaloPlugin);

interface StakeholderItem {
  stakeholder: string;
  volume?: number;
  score?: number;
  scoreUnit?: number;
  scorePct?: number;
  averageSentiment?: number;
  ytdScore?: number;
  delta?: number | null;
  bullets?: string[];
  mentions?: string[];
}

interface AxisValueLabelsOptions {
  datasetLabel?: string;
  offset?: number;
  fontSize?: number;
}

export type SectorialStakeholderData =
  | StakeholderItem[]
  | {
      items?: StakeholderItem[];
      radar?: {
        labels: string[];
        periodScores: number[];
        ytdScores: number[];
      };
    };

export type SectorialStakeholderProps = {
  data?: SectorialStakeholderData;
};

const ORDER = [
  "Local Communities",
  "Customers",
  "Government/Politicians",
  "Industry/Peers",
  "Regulators",
];

const ALIAS: Record<string, string> = {
  Communities: "Local Communities",
  Community: "Local Communities",
  "Govt/Politicians": "Government/Politicians",
  Industry: "Industry/Peers",
};

const canon = (s: string) => ALIAS[s] || s;

const toScore100 = (v: number) => {
  if (Math.abs(v) <= 1) return Math.round(v * 100);
  return Math.round(v || 0);
};

const colorForScore = (score: number): string => {
  const THRESH = 5;
  if (score > THRESH) return "#22c55e";
  if (score < -THRESH) return "#dc2626";
  return "#9CA3AF";
};

const lightBg = (color: string): string => {
  const colorMap: Record<string, string> = {
    "#22c55e": "#22c55e15",
    "#dc2626": "#dc262615",
    "#9CA3AF": "#9CA3AF15",
  };
  return colorMap[color] || "#9CA3AF15";
};

// Create gradient ring for legend
const makeGradientRing = (size = 22, thickness = 7) => {
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
  g.addColorStop(0.0, "#22c55e");
  g.addColorStop(0.33, "#9CA3AF");
  g.addColorStop(0.66, "#dc2626");
  g.addColorStop(1.0, "#22c55e");

  ctx.lineWidth = thickness;
  ctx.strokeStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r - thickness / 2, 0, Math.PI * 2);
  ctx.stroke();

  return c;
};

export const SectorialStakeholder = ({ data }: SectorialStakeholderProps) => {
  const { theme } = useTheme();

  // Adapt data - handle both array format and object format
  const items = Array.isArray(data) ? data : data?.items || [];
  const radarPayload = Array.isArray(data) ? undefined : data?.radar;

  if (!items.length && !radarPayload) {
    return (
      <p className="text-muted-foreground">No stakeholder data available.</p>
    );
  }

  // Helper: normalize payload to ORDER, zero-fill missing
  const alignPayloadToOrder = (payload?: {
    labels: string[];
    periodScores: number[];
    ytdScores: number[];
  }) => {
    if (!payload?.labels?.length) return null;

    const pos = new Map(ORDER.map((n, i) => [n, i]));
    const to100 = (v: number) =>
      Math.abs(v) <= 1 ? Math.round(v * 100) : Math.round(v || 0);

    const period = Array(ORDER.length).fill(0);
    const ytd = Array(ORDER.length).fill(0);

    (payload.labels || []).forEach((lbl, j) => {
      const key = canon(lbl);
      const i = pos.get(key);
      if (i != null) {
        period[i] = to100(payload.periodScores?.[j]);
        ytd[i] = to100(payload.ytdScores?.[j]);
      }
    });

    return { labels: ORDER, period, ytd };
  };

  // Build from items (fallback)
  const by = Object.fromEntries(items.map((i) => [canon(i.stakeholder), i]));
  const computedPeriod = ORDER.map((n) =>
    toScore100(by[n]?.score ?? by[n]?.scoreUnit ?? by[n]?.averageSentiment ?? 0)
  );
  const computedYtd = ORDER.map((n) => toScore100(by[n]?.ytdScore ?? 0));

  const normalized = alignPayloadToOrder(radarPayload);
  const labels = ORDER;
  const periodScores = normalized?.period ?? computedPeriod;
  const ytdScores = normalized?.ytd ?? computedYtd;

  const zeroes = labels.map(() => 0);
  const THRESH = 5;
  const edgeColor = (v: number) =>
    v > THRESH ? "#22c55e" : v < -THRESH ? "#dc2626" : "#9CA3AF";

  const radarData = {
    labels,
    datasets: [
      {
        label: "Sentiment",
        data: periodScores,
        fill: false,
        borderWidth: 2,
        borderDash: [8, 6],
        pointRadius: 6,
        pointBackgroundColor: periodScores.map(colorForScore),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "YTD",
        data: ytdScores,
        fill: true,
        backgroundColor: "rgba(17, 17, 17, 0.05)",
        borderColor: "#111",
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
      },
      {
        label: "Neutral",
        data: zeroes,
        fill: false,
        borderColor: "#9CA3AF",
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  interface RadialLike {
    xCenter: number;
    yCenter: number;
    drawingArea: number;
    getIndexAngle: (i: number) => number;
    options: { pointLabels?: { padding?: number } };
  }

  const axisValueLabelsPlugin: Plugin<"radar", AxisValueLabelsOptions> = {
    id: "axisValueLabels",
    afterDraw(chart: ChartJS<"radar">, _args: unknown, opts: AxisValueLabelsOptions) {
      const scale = chart.scales?.r as RadialLinearScale | undefined;
      if (!scale) return;

      const s = scale as unknown as RadialLike;

      const target = opts?.datasetLabel ?? "Sentiment";
      const dsIndex = chart.data.datasets.findIndex((d) => d.label === target);
      if (dsIndex === -1) return;

      const data = chart.data.datasets[dsIndex].data as number[];
      const labels = (chart.data.labels as string[]) ?? [];
      const fontSize = opts?.fontSize ?? 13;

      const ctx = chart.ctx;
      ctx.save();
      ctx.font = `600 ${fontSize}px Raleway, sans-serif`;

      // Position numbers just below the point labels
      const labelDistance = s.drawingArea + (s.options.pointLabels?.padding ?? 10);
      const numberOffset = 18; // Distance below the label

      for (let i = 0; i < labels.length; i++) {
        const angle = s.getIndexAngle(i);
        const labelX = s.xCenter + Math.cos(angle) * labelDistance;
        const labelY = s.yCenter + Math.sin(angle) * labelDistance;
        
        // Position number below the label
        const x = labelX;
        const y = labelY + numberOffset;

        const v = Math.round((data[i] ?? 0) as number);
        const col = edgeColor(v);

        ctx.fillStyle = col as string;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(String(v), x, y);
      }

      ctx.restore();
    },
  };

  ChartJS.register(axisValueLabelsPlugin);

  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 22,
          boxHeight: 22,
          padding: 16,
          color: theme === "light" ? "#333" : "#eee",
          font: { family: "Raleway, sans-serif", size: 13 },
          generateLabels(chart: ChartJS) {
            const labels =
              ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
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

      // 1) Disable dataset datalabels inside the chart
      datalabels: { display: false },

      // 2) Draw numbers under axis labels (outside the chart)
      axisValueLabels: {
        datasetLabel: "Sentiment",
        fontSize: 13,
      },

      pointHalo: { label: "Sentiment", radius: 14, alpha: 0.24, blur: 0 },
    },

    scales: {
      r: {
        min: -100,
        max: 100,
        ticks: {
          stepSize: 20,
          showLabelBackdrop: false,
          color: theme === "light" ? "#333" : "#999",
          font: { family: "Raleway, sans-serif" },
        },
        grid: {
          color: theme === "light" ? "#7a7a7a30" : "#7a7a7a80",
          circular: false,
        },
        angleLines: { color: theme === "light" ? "#7a7a7a30" : "#7a7a7a80" },
        pointLabels: {
          padding: 10, // give a little breathing room for the second line
          color: theme === "light" ? "#7a7a7a" : "#fff",
          font: { size: 14, weight: 500, family: "Raleway, sans-serif" },
        },
      },
    },
    elements: {
      line: {
        tension: 0,
        borderCapStyle: "butt" as const,
        borderJoinStyle: "miter" as const,
      },
    },
  } as Record<string, unknown>;

  // Build 5 canonical cards to match the radar
  const byCanon = Object.fromEntries(
    items.map((i) => [canon(i.stakeholder), i])
  );

  const cards = ORDER.map((name) => {
    const src: StakeholderItem = byCanon[name] || ({} as StakeholderItem);
    const avg = src.score ?? src.scoreUnit ?? src.averageSentiment ?? 0;
    const score100 = toScore100(avg);
    const scoreLabel =
      (src.scorePct ?? score100) >= 0
        ? `+${src.scorePct ?? score100}`
        : `${src.scorePct ?? score100}`;

    return {
      name,
      volume: src.volume ?? 0,
      score100,
      scoreLabel,
      delta: src.delta ?? null,
      bullets: (src.bullets?.length ? src.bullets : src.mentions) || [],
    };
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="sectorial-stakeholder-section">
      <h4 className="text-xl font-semibold mb-6">
        Stakeholder Sentiment Analysis
      </h4>
      <div className="stakeholder-layout">
        {/* Left: Radar */}
        <div className="stakeholder-radar card">
          <div className="radar-wrap">
            <Radar data={radarData} options={radarOpts} />
          </div>
        </div>

        {/* Right: Cards */}
        <div className="stakeholder-cards">
          {cards.map((c, idx) => {
            const color =
              c.volume === 0 ? "#9ca3af" : colorForScore(c.score100);
            return (
              <div
                key={idx}
                className="bubble-card"
                style={
                  {
                    "--accent": color,
                    "--accent-bg": lightBg(color),
                  } as React.CSSProperties
                }
              >
                <div className="bubble-head">
                  <span className="group-pill">{c.name}</span>
                  <span className="meta-pill">
                    Volume: <strong>{c.volume}</strong>
                    &nbsp;&nbsp;Score:{" "}
                    <strong className="score-val">{c.scoreLabel}</strong>
                    {c.delta != null && (
                      <span>
                        &nbsp;(<strong className="score-val">{c.delta}</strong>)
                      </span>
                    )}
                  </span>
                </div>

                <div className="bubble-body">
                  {c.bullets.length === 0 ? (
                    <p className="no-mentions">
                      <span className="caret">▶</span>
                      No sentimental discussion for {c.name}.
                    </p>
                  ) : (
                    <ul className="bullet-list">
                      {c.bullets.slice(0, 3).map((t, i) => (
                        <li key={i}>
                          <span className="tri">
                            {c.score100 >= 0 ? "▲" : "▼"}
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="metrics-note"
        style={{ textAlign: "center", marginTop: "20px" }}
      >
        *Sentiment is scored on a scale between -100 and 100. <b>YTD</b> (Year
        To Date) begins January {currentYear}.
      </div>
    </div>
  );
};
