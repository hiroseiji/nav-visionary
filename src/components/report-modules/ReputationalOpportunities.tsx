interface ReputationalOpportunitiesProps {
  data?: Array<{
    issue: string;
    description: string;
    impact: number;
    volume: number;
    sources: string[];
  }>;
}

export function ReputationalOpportunities({ data }: ReputationalOpportunitiesProps) {
  const opportunities = data || [
    {
      issue: "Enterprise Support",
      description: "▲ Andrew Motsomi, managing director of Debswana, speaks at the National Business Conference highlighting the company's efforts to drive Botswana's economic transformation by advocating for inclusive growth.\n▲ Former Botswanan MP, Tumisang Healy, commends Debswana for its significant contributions to the economy and suggests that its CEEP model should extend beyond the mining sector as it has proven effective in increasing production capacity.",
      impact: 7,
      volume: 68,
      sources: ["Business Weekly & Review", "Tumisang Healy, former MP"]
    },
    {
      issue: "Economic Development",
      description: "▲ Debswana's Jwaneng Mine is said to have presented opportunities for SMMEs under the company's CEEP.\n▲ Debswana reaches a milestone of P20bn invested in SMMEs as part of CEEP. The <i>Botswana Daily News</i> reports 16,989 jobs have been created with the investment.",
      impact: 4,
      volume: 22,
      sources: ["The Weekend Post", "Botswana Daily News"]
    },
    {
      issue: "Diversity & Inclusion",
      description: "▲ Debswana honours local fellows of the WomEng Southern Africa Fellowship programme. Violet Lebogang, one of the fellows, praises the company for offering her the opportunity to meet Dudu Thebe, corporate affairs manager at Debswana.\n▲ Debswana participates in the 6th Annual Women in Mining Conference.",
      impact: 3,
      volume: 9,
      sources: ["Patriot on Sunday"]
    },
    {
      issue: "Community",
      description: "▲ Debswana sponsors the Botswanan paralympics team and awards the team coaches and support staff P20k each.",
      impact: 1,
      volume: 10,
      sources: ["Botswana Guardian", "Botswana Gazette"]
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
        <div>Advocates</div>
      </div>

      {/* Opportunity Cards */}
      {opportunities.map((opp, idx) => (
        <div 
          key={idx} 
          className="border-2 border-green-500 rounded-lg p-6"
        >
          <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 items-center">
            {/* Issue */}
            <div className="text-green-600 font-bold text-lg">
              {opp.issue}
            </div>

            {/* Description */}
            <div className="text-sm whitespace-pre-line">
              {opp.description}
            </div>

            {/* Impact - dotted circle */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center">
                <span className="text-green-600 font-bold">+{opp.impact}</span>
              </div>
            </div>

            {/* Volume - solid circle */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center">
                <span className="font-semibold">{opp.volume}</span>
              </div>
            </div>

            {/* Advocates/Sources */}
            <div className="text-sm">
              {opp.sources.map((source, i) => (
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
