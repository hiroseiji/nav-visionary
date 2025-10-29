import React from "react";

interface CompetitorItem {
  competitor: string;
  score: number;
  summary: string;
}

export type SectorialCompetitorData = CompetitorItem[];

export type SectorialCompetitorProps = {
  data?: SectorialCompetitorData;
  /** Optional: the user's own organisation to highlight in orange */
  userOrg?: string;
};

const getOrdinal = (n: number) => {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  return `${n}${suffix}`;
};

const colorTokens = {
  positive: "hsl(158 64% 52%)",
  neutral: "hsl(0 0% 60%)",
  negative: "hsl(330 81% 60%)",
  user: "hsl(25 95% 53%)",
};

const getSentimentColor = (score: number, isUserOrg = false) => {
  if (isUserOrg) return colorTokens.user; // orange for user's org only
  if (score >= 20) return colorTokens.positive; // green - positive
  if (score >= -5) return colorTokens.neutral; // gray - neutral
  return colorTokens.negative; // pink/red - negative
};

const getYPosition = (score: number) => {
  // Map score from 80..-40 to 0%..100%
  const position = ((80 - score) / 120) * 100;
  return Math.max(0, Math.min(100, position));
};

/**
 * Compute ranks with tie handling. Items with the same score share the same ordinal,
 * and display with an '=' prefix (e.g., "=7TH") to match the reference visual.
 */
function withRanks(items: CompetitorItem[]) {
  const byScoreDesc = [...items].sort((a, b) => b.score - a.score);
  // map score -> rank (1-based)
  const rankByScore = new Map<number, number>();
  let currentRank = 1;
  byScoreDesc.forEach((it, idx) => {
    if (!rankByScore.has(it.score)) {
      rankByScore.set(it.score, idx + 1);
    }
  });
  const occurrences = byScoreDesc.reduce<Record<number, number>>((acc, it) => {
    acc[it.score] = (acc[it.score] || 0) + 1;
    return acc;
  }, {});

  return items.map((it) => {
    const baseRank = rankByScore.get(it.score)!;
    const ordinal = getOrdinal(baseRank);
    const isTie = (occurrences[it.score] || 0) > 1;
    return {
      ...it,
      rank: baseRank,
      ordinal: isTie ? `=${ordinal}` : ordinal,
      tie: isTie,
    } as CompetitorItem & {
      rank: number;
      ordinal: string;
      tie: boolean;
    };
  });
}

export const SectorialCompetitor: React.FC<SectorialCompetitorProps> = ({
  data,
  userOrg = "Debswana",
}) => {
  // Default content mirroring the reference image
  const fallback: CompetitorItem[] = [
    {
      competitor: "Lucara Diamond",
      score: 62,
      summary:
        "Continues to benefit from positive discussion of the 2,492-carat diamond it discovered at its Karowe mine in northeastern Botswana. The Africa Report speculates this discovery could trigger a revival in investment.",
    },
    {
      competitor: "Morupule Coal Mine",
      score: 49,
      summary:
        "Reports the solar panels the company helped install for the Cheshire Foundation in Palapye have reduced electricity costs for the charity by 80%.",
    },
    {
      competitor: "Debswana",
      score: 40,
      summary:
        "Praised for increasing the productivity of SMMEs across Botswana with its CEEP projects. Reaches a milestone of P20bn spent on citizen economic empowerment.",
    },
    {
      competitor: "Okavango Diamond Company",
      score: 34,
      summary:
        "Receives a $300m credit facility from Standard Chartered Bank to help the company capitalize on the awaited recovery of the global diamond market.",
    },
    {
      competitor: "Rio Tinto Diamonds",
      score: 27,
      summary:
        "Installs solar panels at its Diavik diamond mine, which it says will produce nearly 4.2GWh of energy to run industrial operations.",
    },
    {
      competitor: "DTC Botswana",
      score: 0,
      summary:
        "The Okavango Diamond Company (ODC) receives a loan from Standard Chartered Bank to purchase large volumes of rough diamonds from DTC Botswana.",
    },
    {
      competitor: "De Beers",
      score: -1,
      summary:
        "Praised by Cape Business News for providing drinking water to the Rietfontein secondary school in Musina, South Africa. Faces ongoing weak demand for natural diamonds.",
    },
    {
      competitor: "Anglo American",
      score: -1,
      summary:
        "Raises R7.2bn from the sale of its shares in Amplats. Admits a cyber-attack could leave mineworkers stuck underground.",
    },
    {
      competitor: "Alrosa",
      score: -22,
      summary:
        "Declares bankruptcy of its Belgian trading division in Antwerp, citing the expansion of European sanctions.",
    },
  ];

  const items = withRanks(data && data.length ? data : fallback);

  return (
    <div className="space-y-6">
      {/* Main layout: sentiment scale (left) + items (right) */}
      <div className="relative flex gap-6" style={{ height: 900 }}>
        {/* Left sentiment scale */}
        <div className="relative w-24 flex-shrink-0 h-full select-none">
          {/* Gradient bar */}
          <div
            className="absolute left-8 top-0 bottom-0 w-6 rounded-full shadow-inner"
            style={{
              background:
                "linear-gradient(180deg, hsl(158 64% 52%) 0%, hsl(120 45% 50%) 14%, hsl(25 95% 53%) 28%, hsl(0 0% 60%) 66%, hsl(330 81% 60%) 100%)",
            }}
          />

          {/* Tick labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-1 pr-1">
            {[80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20, -30, -40].map(
              (val) => (
                <div
                  key={val}
                  className="text-[10px] font-semibold text-muted-foreground tabular-nums"
                >
                  {val}
                </div>
              )
            )}
          </div>

          {/* Sentiment band labels (vertical) */}
          <div
            className="absolute left-[-10px] top-[8%] text-[9px] text-muted-foreground"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Strongly Positive
          </div>
          <div
            className="absolute left-[-10px] top-[32%] text-[9px] text-muted-foreground"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Moderately Positive
          </div>
          <div
            className="absolute left-[-10px] top-[68%] text-[9px] text-destructive"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Moderately at risk
          </div>
          <div
            className="absolute left-[-10px] top-[90%] text-[9px] text-destructive"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            At risk
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 relative h-full">
          {items.map((item, idx) => {
            const isUser = item.competitor === userOrg;
            const color = getSentimentColor(item.score, isUser);
            const top = getYPosition(item.score);

            return (
              <div
                key={`${item.competitor}-${idx}`}
                className="absolute w-full flex items-center gap-3"
                style={{ top: `${top}%`, transform: "translateY(-50%)" }}
              >
                {/* Left: ordinal disc */}
                <div
                  className="relative z-10 flex items-center justify-center w-11 h-11 rounded-full shadow-md text-white font-extrabold text-[10px] tracking-tight"
                  style={{ backgroundColor: color }}
                >
                  {item.ordinal}
                </div>

                {/* Name pill, visually attached to the disc */}
                <div
                  className="-ml-3 rounded-full px-4 py-2 flex items-center min-w-[260px] max-w-[260px] shadow"
                  style={{ backgroundColor: color }}
                >
                  <span className="font-bold text-white text-xs truncate">
                    {item.competitor}
                  </span>
                </div>

                {/* Description and score */}
                <div
                  className="flex-1 flex items-center gap-3 bg-background rounded-full px-4 py-2 border-2"
                  style={{ borderColor: color }}
                >
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-foreground text-[10px] leading-none">
                      ▲
                    </span>
                    <span className="text-foreground text-[10px] leading-tight">
                      {item.summary}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-full text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {item.score}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[10px] text-muted-foreground pt-4">
        *Sentiment is measured on a scale of -100–100, with 0 representing
        neutral
      </div>
    </div>
  );
};
