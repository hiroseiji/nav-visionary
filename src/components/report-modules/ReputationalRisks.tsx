interface ReputationalRisksProps {
  data?: Array<{
    issue: string;
    description: string;
    impact: number;
    volume: number;
    sources: string[];
  }>;
}

export function ReputationalRisks({ data }: ReputationalRisksProps) {
  const risks = data || [
    {
      issue: "Financial Results",
      description: "Discussion continues around Debswana's \"diamond slump\" in news outlets, including the <i>Sunday Standard</i>, which reports that Debswana's annual revenue is set for a \"significant\" downturn.",
      impact: -2,
      volume: 38,
      sources: ["Sunday Standard"]
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 px-6 py-3 font-semibold text-sm border-b-2 border-border">
        <div>Issue</div>
        <div>Description</div>
        <div className="text-center">Impact*</div>
        <div className="text-center">Volume</div>
        <div>Antagonists</div>
      </div>

      {/* Risk Cards */}
      {risks.map((risk, idx) => (
        <div 
          key={idx} 
          className="border-2 border-red-500 rounded-lg p-6"
        >
          <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 items-center">
            {/* Issue */}
            <div className="text-red-600 font-bold text-lg">
              {risk.issue}
            </div>

            {/* Description */}
            <div className="flex items-start gap-2 text-sm">
              <span className="text-red-600 mt-0.5">▼</span>
              <span dangerouslySetInnerHTML={{ __html: risk.description }} />
            </div>

            {/* Impact - dotted circle */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center">
                <span className="text-red-600 font-bold">{risk.impact}</span>
              </div>
            </div>

            {/* Volume - solid circle */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center">
                <span className="font-semibold">{risk.volume}</span>
              </div>
            </div>

            {/* Antagonists/Sources */}
            <div className="text-sm">
              {risk.sources.map((source, i) => (
                <div key={i}>– {source}</div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground italic text-center mt-4">
        *Impact refers to the total effect that a particular issue has on total sentiment.
      </p>
    </div>
  );
}
