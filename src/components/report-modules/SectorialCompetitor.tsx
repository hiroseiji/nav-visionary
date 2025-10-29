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
  if (isUserOrg) return 'hsl(38 92% 50%)'; // orange for user's org only
  if (score >= 20) return 'hsl(160 84% 39%)'; // green - positive
  if (score >= 0) return 'hsl(220 9% 46%)'; // gray - neutral
  return 'hsl(340 82% 67%)'; // pink/red - negative
};

const getYPosition = (score: number) => {
  // Map score from 80 to -40 range to 0% to 100% position
  // 80 -> 0%, -40 -> 100%
  const position = ((80 - score) / 120) * 100;
  return Math.max(0, Math.min(100, position));
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
      summary: "Receives a $300m credit facility from Standard Chartered Bank to help the company's facilitate the awaited recovery of the retail diamond market."
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

  return (
    <div className="space-y-6">
      <div className="relative flex gap-4">
        {/* Left sentiment scale */}
        <div className="relative w-24 flex-shrink-0">
          {/* Gradient bar */}
          <div className="absolute left-8 top-0 bottom-0 w-4 rounded-full overflow-hidden bg-gradient-to-b from-[hsl(160_84%_39%)] via-[hsl(38_92%_50%)] via-[hsl(220_9%_46%)] to-[hsl(340_82%_67%)]" />
          
          {/* Scale labels */}
          <div className="relative h-full flex flex-col justify-between py-2">
            {[80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20, -30, -40].map((val) => (
              <div key={val} className="text-xs font-medium text-muted-foreground text-right pr-6">
                {val}
              </div>
            ))}
          </div>

          {/* Sentiment labels */}
          <div className="absolute left-0 top-[5%] w-20 text-[10px] text-center text-muted-foreground rotate-[-90deg] origin-center whitespace-nowrap">
            Securely Positive
          </div>
          <div className="absolute left-0 top-[28%] w-20 text-[10px] text-center text-muted-foreground rotate-[-90deg] origin-center whitespace-nowrap">
            Moderately Positive
          </div>
          <div className="absolute left-0 top-[65%] w-20 text-[10px] text-center text-destructive rotate-[-90deg] origin-center whitespace-nowrap">
            Moderately at risk
          </div>
          <div className="absolute left-0 top-[88%] w-20 text-[10px] text-center text-destructive rotate-[-90deg] origin-center whitespace-nowrap">
            At risk
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 relative" style={{ minHeight: '800px' }}>
          {sortedItems.map((item, idx) => {
            const rank = idx + 1;
            const ordinalRank = getOrdinal(rank);
            const isUserOrg = item.competitor === "Morupule Coal Mine"; // Only this one is orange
            const sentimentColor = getSentimentColor(item.score, isUserOrg);
            const yPosition = getYPosition(item.score);

            return (
              <div 
                key={idx}
                className="absolute w-full flex items-center gap-3 transition-all"
                style={{ 
                  top: `${yPosition}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                {/* Left colored pill with rank and name */}
                <div 
                  className="rounded-full px-6 py-3 flex items-center gap-3 min-w-[280px] max-w-[280px]"
                  style={{ backgroundColor: sentimentColor }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/30 text-white font-bold text-xs">
                    {ordinalRank.replace(/\d+/, '').replace('TH', rank.toString() + 'TH').replace('ST', rank.toString() + 'ST').replace('ND', rank.toString() + 'ND').replace('RD', rank.toString() + 'RD')}
                  </div>
                  <span className="font-semibold text-white text-sm">{item.competitor}</span>
                </div>

                {/* Right section with description and score */}
                <div className="flex-1 flex items-center gap-4 bg-background border-2 rounded-full px-6 py-3" style={{ borderColor: sentimentColor }}>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-foreground/80 text-[10px] flex-shrink-0">▲</span>
                    <span className="text-foreground text-xs leading-tight">{item.summary}</span>
                  </div>
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: sentimentColor }}
                  >
                    {item.score}
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
