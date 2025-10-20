// components/report-modules/sentimentTrend.types.ts
export interface SentimentPoint {
  date: string;
  sentiment: number;
  rolling: number;
  industryTrend?: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed?: number;
}

export interface SentimentAnnotation {
  date: string;
  type: string;
  category: string;
  summary: string;
}

/** Loose row inbound from API or mixed sources */
export type SentimentLike = Partial<SentimentPoint> & {
  date?: string;
  volume?: number; // when only a single volume is provided and not class breakdowns
};
