interface CompetitorItem {
  competitor: string;
  score: number;
  summary: string;
}

export type SectorialCompetitorData = CompetitorItem[];

export type SectorialCompetitorProps = {
  data?: SectorialCompetitorData;
};

const getOrdinal = (n: number) => {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const getSentimentColor = (score: number, isUserOrg: boolean = false) => {
  if (isUserOrg) return 'hsla(25, 100%, 65%, 1.00)'; // orange for user's org only
  if (score >= 20) return 'hsl(158 64% 52%)'; // green - positive
  if (score >= -5) return 'hsl(0 0% 60%)'; // gray - neutral
  return 'hsla(0, 100%, 60%, 1.00)'; // pink - negative
};

const getSentimentArrow = (score: number) => {
  if (score >= 20) return '▲'; // positive
  if (score < -5) return '▼'; // negative
  return '►'; // neutral
};

export const SectorialCompetitor = ({ data }: SectorialCompetitorProps) => {
  // Dummy data to match the image
  const dummyData: CompetitorItem[] = [
    { 
      competitor: "Lucara Diamond", 
      score: 62, 
      summary: "Continues to benefit from positive discussion of the 2,492-carat diamond it discovered at its Karowe mine in northeastern Botswana. The Africa Diamond."
    },
    { 
      competitor: "Morupule Coal Mine", 
      score: 49, 
      summary: "Reports the solar panels the company helped install for the Chwesha Foundation in Phalange have reduced electricity costs for the charity by 80%."
    },
    { 
      competitor: "Debswana", 
      score: 40, 
      summary: "Signs a Memorandum of Understanding (MoU) enhancing the productivity of SMMEs across Botswana with the CEEIP projects. Receives a inflections of Orican spent on citizen concerns, announced by..."
    },
    { 
      competitor: "Okavango Diamond Company", 
      score: 34, 
      summary: "Receives a $300m credit facility from Standard Chartered Bank to help the company facilitate the awaited recovery of the retail diamond market."
    },
    { 
      competitor: "Rio Tinto Diamonds", 
      score: 27, 
      summary: "Installs solar panels at its Diavik diamond mine, which it says will produce nearly 4.2GWh of energy to run industrial operations."
    },
    { 
      competitor: "DTC Botswana", 
      score: 0, 
      summary: "The Okavango Diamond Company (ODC) receives a loan from Standard Chartered which would be used to purchase large volumes of rough diamonds from DTC."
    },
    { 
      competitor: "De Beers", 
      score: -1, 
      summary: "Praised by Cape Business News for providing drinking water to the Rietfontein secondary school in Musina, South Africa. Faces ongoing weak demand for natural diamonds."
    },
    { 
      competitor: "Anglo American", 
      score: -1, 
      summary: "Raises R7.2bn from the sale of its shares in Amplats. Admits a cyber-attack could leave mineworkers stuck underground."
    },
    { 
      competitor: "Airosa", 
      score: -22, 
      summary: "Declares bankruptcy of its Belgian trading division in Antwerp, citing the expansion of European sanctions."
    },
  ];

  const displayData = data && data.length > 0 ? data : dummyData;
  const sortedItems = [...displayData].sort((a, b) => b.score - a.score);

  // Calculate position on scale (80 to -40 range, 900px height)
  const getScalePosition = (score: number) => {
    const minScore = -40;
    const maxScore = 80;
    const height = 900;
    const normalizedScore = Math.max(minScore, Math.min(maxScore, score));
    const percentage = (maxScore - normalizedScore) / (maxScore - minScore);
    return percentage * height;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Left sentiment scale */}
        <div className="relative w-20 flex-shrink-0" style={{ height: '900px' }}>
          {/* Gradient bar */}
          <div className="absolute left-6 top-0 bottom-0 w-3 rounded-full bg-gradient-to-b from-[hsl(158_64%_52%)] via-[hsl(25_95%_53%)] via-50% via-[hsl(0_0%_60%)] to-[hsl(330_81%_60%)]" />
          
          {/* Dotted line connecting all dots */}
          <svg className="absolute left-6 top-0 bottom-0 w-3 pointer-events-none" style={{ height: '900px' }}>
            <line 
              x1="6" 
              y1={getScalePosition(sortedItems[0]?.score || 0)}
              x2="6" 
              y2={getScalePosition(sortedItems[sortedItems.length - 1]?.score || 0)}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          </svg>

          {/* Dots for each competitor positioned by score */}
          {sortedItems.map((item, idx) => (
            <div
              key={idx}
              className="absolute left-[21px] w-5 h-5 rounded-full bg-white border-2 border-white shadow-lg"
              style={{ 
                top: `${getScalePosition(item.score)}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          
          {/* Scale labels */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-1">
            {[80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20, -30, -40].map((val) => (
              <div key={val} className="text-[10px] font-semibold text-muted-foreground">
                {val}
              </div>
            ))}
          </div>

          {/* Sentiment labels - vertical text */}
          <div className="absolute left-[-12px] top-[8%] text-[9px] text-muted-foreground" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Securely Positive
          </div>
          <div className="absolute left-[-12px] top-[32%] text-[9px] text-muted-foreground" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Moderately Positive
          </div>
          <div className="absolute left-[-12px] top-[68%] text-[9px] text-destructive" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Moderately at risk
          </div>
          <div className="absolute left-[-12px] top-[90%] text-[9px] text-destructive" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            At risk
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 space-y-3">
          {sortedItems.map((item, idx) => {
            const rank = idx + 1;
            const ordinalRank = getOrdinal(rank);
            const isUserOrg = item.competitor === "Debswana";
            const sentimentColor = getSentimentColor(item.score, isUserOrg);
            const arrow = getSentimentArrow(item.score);
            const leftWidth = 300; // keep in sync with w-[200px]

            return (
              <div key={idx} className="w-full transition-all">
                {/* Unified pill with gradient */}
                <div 
                  className="rounded-full px-4 py-2 flex items-center gap-2 relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(to right, ${sentimentColor} 0%, ${sentimentColor} ${leftWidth}px, hsl(var(--background)) ${leftWidth}px, hsl(var(--background)) 100%)`,
                    border: `2px solid ${sentimentColor}`
                  }}
                >
                  {/* Left section: rank and name */}
                  <div className="flex items-center gap-2 w-[300px] flex-shrink-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/25 text-white font-bold text-[10px]">
                      {ordinalRank}
                    </div>
                    <span className="font-bold text-white text-xs truncate">{item.competitor}</span>
                  </div>

                  {/* Right section: arrow, summary and score */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <span className="text-sm flex-shrink-0 font-bold ml-1" style={{ color: sentimentColor }}>
                      {arrow}
                    </span>
                    <span className="text-foreground text-[10px] leading-tight flex-1 min-w-0 line-clamp-2">{item.summary}</span>
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: sentimentColor }}
                    >
                      {item.score}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4">
        *Sentiment is measured on a scale of -100-100, with 0 representing neutral
      </div>
    </div>
  );
};
