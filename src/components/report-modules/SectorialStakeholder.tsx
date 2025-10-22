import { useEffect, useRef } from "react";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useTheme } from "@/components/ThemeContext";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ChartDataLabels);

// Custom plugin for point halos
const pointHaloPlugin = {
  id: "pointHalo",
  afterDatasetsDraw(chart: ChartJS, _args: unknown, options: { label?: string; radius?: number; alpha?: number }) {
    const { ctx } = chart;
    const targetLabel = options.label || "Sentiment";
    const radius = options.radius || 14;
    const alpha = options.alpha || 0.24;

    chart.data.datasets.forEach((dataset, datasetIndex: number) => {
      if (dataset.label !== targetLabel) return;
      const meta = chart.getDatasetMeta(datasetIndex);
      
      meta.data.forEach((point, index: number) => {
        const datasetWithColor = dataset as typeof dataset & { pointBackgroundColor?: string | string[] };
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
  "Communities": "Local Communities",
  "Community": "Local Communities",
  "Govt/Politicians": "Government/Politicians",
  "Industry": "Industry/Peers",
};

const canon = (s: string) => ALIAS[s] || s;

const toScore100 = (v: number) => {
  if (Math.abs(v) <= 1) return Math.round(v * 100);
  return Math.round(v || 0);
};

const colorForScore = (score: number): string => {
  const THRESH = 5;
  if (score > THRESH) return "#16a34a";
  if (score < -THRESH) return "#dc2626";
  return "#9CA3AF";
};

const lightBg = (color: string): string => {
  const colorMap: Record<string, string> = {
    "#16a34a": "#16a34a15",
    "#dc2626": "#dc262615",
    "#9CA3AF": "#9CA3AF15",
  };
  return colorMap[color] || "#9CA3AF15";
};

export const SectorialStakeholder = ({ data }: SectorialStakeholderProps) => {
  const { theme } = useTheme();
  
  // Adapt data - handle both array format and object format
  const items = Array.isArray(data) ? data : (data?.items || []);
  const radarPayload = Array.isArray(data) ? undefined : data?.radar;
  
  if (!items.length && !radarPayload) {
    return <p className="text-muted-foreground">No stakeholder data available.</p>;
  }

  // Helper: normalize payload to ORDER, zero-fill missing
  const alignPayloadToOrder = (payload?: { labels: string[]; periodScores: number[]; ytdScores: number[] }) => {
    if (!payload?.labels?.length) return null;

    const pos = new Map(ORDER.map((n, i) => [n, i]));
    const to100 = (v: number) => (Math.abs(v) <= 1 ? Math.round(v * 100) : Math.round(v || 0));

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
  const by = Object.fromEntries(items.map(i => [canon(i.stakeholder), i]));
  const computedPeriod = ORDER.map(n =>
    toScore100(by[n]?.score ?? by[n]?.scoreUnit ?? by[n]?.averageSentiment ?? 0)
  );
  const computedYtd = ORDER.map(n => toScore100(by[n]?.ytdScore ?? 0));

  const normalized = alignPayloadToOrder(radarPayload);
  const labels = ORDER;
  const periodScores = normalized?.period ?? computedPeriod;
  const ytdScores = normalized?.ytd ?? computedYtd;

  const zeroes = labels.map(() => 0);
  const THRESH = 5;
  const edgeColor = (v: number) => (v > THRESH ? "#16a34a" : v < -THRESH ? "#dc2626" : "#9CA3AF");

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
        borderDash: [8, 6],
        pointRadius: 0,
      },
      {
        label: "Neutral",
        data: zeroes,
        fill: false,
        borderColor: "#9CA3AF",
        borderWidth: 1,
        borderDash: [4, 6],
        pointRadius: 0,
      },
    ],
  };

  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: (ctx: { dataset: { label?: string } }) => ctx.dataset.label === "Sentiment",
        formatter: (v: number) => Math.round(v),
        color: (ctx: { raw: number }) => edgeColor(ctx.raw) as string,
        font: { weight: 600, size: 12 },
        anchor: "end" as const,
        align: "end" as const,
        offset: 6,
        clamp: true,
      },
      pointHalo: {
        label: "Sentiment",
        radius: 14,
        alpha: 0.24,
        blur: 0,
      },
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
        grid: { color: theme === "light" ? "#7a7a7a30" : "#7a7a7a80", circular: false },
        angleLines: { color: theme === "light" ? "#7a7a7a30" : "#7a7a7a80" },
        pointLabels: {
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
    items.map(i => [canon(i.stakeholder), i])
  );

  const cards = ORDER.map(name => {
    const src: StakeholderItem = byCanon[name] || {} as StakeholderItem;
    const avg = src.score ?? src.scoreUnit ?? src.averageSentiment ?? 0;
    const score100 = toScore100(avg);
    const scoreLabel = (src.scorePct ?? score100) >= 0
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
      <h4 className="text-xl font-semibold mb-6">Stakeholder Sentiment Analysis</h4>
      <div className="stakeholder-layout">
        {/* Left: Radar */}
        <div className="stakeholder-radar card">
          <div className="radar-wrap">
            <Radar data={radarData} options={radarOpts} />
          </div>
          <div className="legend-row">
            <span className="legend-dot legend-sentiment" /> <span>Sentiment*</span>
            <span className="legend-dot legend-neutral" /> <span>Neutral</span>
            <span className="legend-dot legend-ytd" /> <span>YTD</span>
          </div>
        </div>

        {/* Right: Cards */}
        <div className="stakeholder-cards">
          {cards.map((c, idx) => {
            const color = c.volume === 0 ? "#9ca3af" : colorForScore(c.score100);
            return (
              <div 
                key={idx} 
                className="bubble-card" 
                style={{ 
                  '--accent': color, 
                  '--accent-bg': lightBg(color) 
                } as React.CSSProperties}
              >
                <div className="bubble-head">
                  <span className="group-pill">{c.name}</span>
                  <span className="meta-pill">
                    Volume: <strong>{c.volume}</strong>
                    &nbsp;&nbsp;Score: <strong className="score-val">{c.scoreLabel}</strong>
                    {c.delta != null && <span>&nbsp;(<strong className="score-val">{c.delta}</strong>)</span>}
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
                          <span className="tri">{c.score100 >= 0 ? '▲' : '▼'}</span>
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
      <div className="metrics-note" style={{ textAlign: "center", marginTop: "20px" }}>
        *Sentiment is scored on a scale between -100 and 100. <b>YTD</b> (Year To Date)
        begins January {currentYear}.
      </div>
    </div>
  );
};
