// components/report-modules/sentimentTrend.utils.ts
import { SentimentAnnotation, SentimentLike, SentimentPoint } from "../types/sentimentTrend";

/** Color for spike markers / cards */
export function getSpikeColor(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("negative")) return "#ef4444";
  if (t.includes("mixed")) return "#5d98ff";
  if (t.includes("neutral")) return "#9ca3af";
  return "#10b981";
}

/** Point color by sentiment sign */
export function getLineColor(sentiment: number): string {
  if (sentiment > 0) return "#10b981";
  if (sentiment < 0) return "#ef4444";
  return "#9ca3af";
}

/** Convert loose row → strongly-typed SentimentPoint (with fallbacks) */
export function toSentimentPoint(row: SentimentLike): SentimentPoint {
  const date = String(row.date ?? "");
  const sentiment = Number(row.sentiment ?? 0);
  const rolling = Number(row.rolling ?? 0);
  const industryTrend =
    row.industryTrend === undefined || row.industryTrend === null
      ? undefined
      : Number(row.industryTrend);

  // If backend already provides per-class volumes, use them:
  const hasClassVolumes =
    row.positive !== undefined ||
    row.negative !== undefined ||
    row.neutral !== undefined ||
    row.mixed !== undefined;

  if (hasClassVolumes) {
    return {
      date,
      sentiment,
      rolling,
      industryTrend,
      positive: Number(row.positive ?? 0),
      negative: Number(row.negative ?? 0),
      neutral: Number(row.neutral ?? 0),
      mixed: row.mixed === undefined ? undefined : Number(row.mixed),
    };
  }

  // Otherwise, derive class buckets from a single `volume` using sentiment sign
  const vol = Number(row.volume ?? 0);
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  if (sentiment > 5) positive = vol;
  else if (sentiment < -5) negative = vol;
  else neutral = vol;

  return {
    date,
    sentiment,
    rolling,
    industryTrend,
    positive,
    negative,
    neutral,
    mixed: row.mixed === undefined ? undefined : Number(row.mixed),
  };
}

/** Normalize annotations defensively */
export function normalizeAnnotations(a: Partial<SentimentAnnotation>[]): SentimentAnnotation[] {
  return (a || []).map((x) => ({
    date: String(x.date ?? ""),
    type: String(x.type ?? ""),
    category: String(x.category ?? ""),
    summary: String(x.summary ?? ""),
  }));
}
