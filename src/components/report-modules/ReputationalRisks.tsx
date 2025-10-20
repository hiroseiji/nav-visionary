interface ReputationalRisksProps {
  data?: Array<{
    issue?: string;
    description?: string;
    impact?: number;
    volume?: number;
    sources?: string[] | string;
    source?: string;
    reach?: number;
    ave?: number;
  }>;
}

export function ReputationalRisks({ data }: ReputationalRisksProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No reputational risks identified during this period.
      </div>
    );
  }

  const risks = data;

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
      {risks.map((risk, idx) => {
        const issue = risk.issue || "Unnamed Risk";
        const description = risk.description || "";
        const impact = risk.impact != null ? risk.impact : "N/A";
        const volume = risk.volume || 0;
        
        // Handle sources - can be array or string
        const sourcesArray = Array.isArray(risk.sources)
          ? risk.sources
          : risk.sources
          ? [risk.sources]
          : risk.source
          ? [risk.source]
          : ["Unknown"];

        return (
          <div 
            key={idx} 
            className="border-2 border-red-500 rounded-lg p-6"
          >
            <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 items-center">
              {/* Issue */}
              <div className="text-red-600 font-bold text-lg">
                {issue}
              </div>

              {/* Description */}
              <div className="flex items-start gap-2 text-sm">
                <span className="text-red-600 mt-0.5">▼</span>
                <span dangerouslySetInnerHTML={{ __html: description }} />
              </div>

              {/* Impact - dotted circle */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center">
                  <span className="text-red-600 font-bold">{impact}</span>
                </div>
              </div>

              {/* Volume - solid circle */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center">
                  <span className="font-semibold">{volume.toLocaleString()}</span>
                </div>
              </div>

              {/* Antagonists/Sources */}
              <div className="text-sm space-y-1">
                {sourcesArray.map((source, i) => (
                  <div key={i}>– {source}</div>
                ))}
                {risk.reach != null && (
                  <div className="text-xs text-muted-foreground">
                    Reach: {risk.reach.toLocaleString()}
                  </div>
                )}
                {risk.ave != null && (
                  <div className="text-xs text-muted-foreground">
                    AVE: P{risk.ave.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground italic text-center mt-4">
        *Impact refers to the total effect that a particular issue has on total sentiment.
      </p>
    </div>
  );
}
