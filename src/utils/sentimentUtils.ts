// utils/sentimentUtils.ts

export const mapSentimentToLabel = (score: number): string => {
  if (score >= 0.75) return "positive";
  if (score <= -0.5) return "negative";
  if (score > 0 && score < 0.5) return "mixed";
  if (score === 0) return "neutral";
  return "neutral";
};

export const mapLabelToSentiment = (label: string): number => {
  switch (label) {
    case "positive": return 1;
    case "negative": return -1;
    case "mixed": return 0.25;
    case "neutral": return 0;
    default: return 0;
  }
};
