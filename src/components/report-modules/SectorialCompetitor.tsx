import { ComponentProps } from "react";

interface CompetitorItem {
  competitor: string;
  score: number;
  summary: string;
}

export type SectorialCompetitorData = CompetitorItem[];

export type SectorialCompetitorProps = {
  data?: SectorialCompetitorData;
};

const getDotPosition = (score: number): string => {
  // Map score (-100 to 100) to position (0% to 100%)
  // 80 -> 0%, -40 -> 100%
  // Linear mapping: position = (80 - score) / 120 * 100
  const position = ((80 - score) / 120) * 100;
  return `${Math.max(0, Math.min(100, position))}%`;
};

export const SectorialCompetitor = ({ data }: SectorialCompetitorProps) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p className="text-muted-foreground">No competitor analysis data available.</p>;
  }

  const sortedItems = [...data].sort((a, b) => b.score - a.score);

  return (
    <div className="sectorial-competitor-section">
      <h4 className="text-xl font-semibold mb-6">Competitor Landscape</h4>
      <div className="competitor-section">
        <div className="sentiment-meter">
          <div className="meter-scale">
            {[80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20, -30, -40].map((val, idx) => (
              <div key={idx} className="scale-tick">
                {val}
              </div>
            ))}
          </div>
          <div className="meter-bar">
            {data.map((item, i) => (
              <div
                key={i}
                className={`dot ${i === 2 ? "highlight" : ""}`}
                style={{ top: getDotPosition(item.score) }}
              />
            ))}
          </div>

          <div className="meter-labels">
            <span style={{ top: "10%" }}>Securely Positive</span>
            <span style={{ top: "35%" }}>Moderately Positive</span>
            <span style={{ top: "63%" }} className="risk">Moderately at risk</span>
            <span style={{ top: "87%" }} className="risk">At risk</span>
          </div>
        </div>

        <div className="sectorial-rank-graph">
          {sortedItems.map((item, idx) => {
            const rank = idx + 1;
            const sentimentScore = item.score;
            const isPositive = sentimentScore > 30;
            const isNegative = sentimentScore < 0;
            const sentimentLevel = isPositive
              ? "positive"
              : isNegative
                ? "negative"
                : "neutral";

            const rankLabel =
              rank === 1
                ? "1ST"
                : rank === 2
                  ? "2ND"
                  : rank === 3
                    ? "3RD"
                    : rank === 4
                      ? "4TH"
                      : rank === 5
                        ? "5TH"
                        : rank === 6
                          ? "6TH"
                          : rank === 7
                            ? "7TH"
                            : rank === 8
                              ? "8TH"
                              : rank === 9
                                ? "9TH"
                                : `${rank}TH`;

            const sentimentColor = {
              positive: "#10b981",
              neutral: "#9ca3af",
              negative: "#ef4444",
            }[sentimentLevel];

            return (
              <div className={`competitor-row ${sentimentLevel}`} key={idx}>
                <div className="left-rank">
                  <div className="rank-badge" style={{ backgroundColor: sentimentColor }}>
                    {rankLabel}
                  </div>
                  <div className="competitor-name">{item.competitor}</div>
                </div>

                <div className="mention-box">
                  {item.summary.includes("▲") && <span className="icon-up">▲</span>}
                  {item.summary.includes("▼") && <span className="icon-down">▼</span>}
                  <span>{item.summary}</span>
                </div>

                <div className="score-bubble" style={{ backgroundColor: sentimentColor }}>
                  {sentimentScore}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="metrics-note" style={{ textAlign: "center", marginTop: "20px" }}>
        *Sentiment is measured on a scale of -100-100, with 0 representing neutral.
      </div>
    </div>
  );
};
