// utils/sentimentUtils.ts

export const mapSentimentToLabel = (scoreOrLabel: number | string): string => {
  if (typeof scoreOrLabel === 'string') {
    const normalized = scoreOrLabel.trim().toLowerCase();
    if (['positive', 'negative', 'neutral', 'mixed'].includes(normalized)) return normalized;
    const n = Number(normalized);
    if (!Number.isNaN(n)) return mapSentimentToLabel(n);
    return 'neutral';
  }
  const s = scoreOrLabel;
  if (s >= 0.75) return 'positive';
  if (s <= -0.5) return 'negative';
  if (s > 0 && s < 0.5) return 'mixed';
  if (s === 0) return 'neutral';
  return 'neutral';
};

export const mapLabelToSentiment = (label: string): number => {
  const l = (label || '').toLowerCase();
  if (l === 'positive') return 1;
  if (l === 'negative') return -1;
  if (l === 'mixed') return 0.25;
  if (l === 'neutral') return 0;
  return 0;
};
