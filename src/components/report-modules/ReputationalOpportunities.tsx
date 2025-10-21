interface ReputationalOpportunitiesProps {
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

export function ReputationalOpportunities({ data }: ReputationalOpportunitiesProps) {
  // Handle different data structures: array, object with items/data property, or undefined
  let dataArray: Array<any> = [];
  
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === 'object') {
    // Check for common array property names
    const possibleArrays = [
      (data as any).items,
      (data as any).data,
      (data as any).opportunities,
      (data as any).list
    ];
    dataArray = possibleArrays.find(arr => Array.isArray(arr)) || [];
  }

  if (dataArray.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No reputational opportunities identified during this period.
      </div>
    );
  }

  const opportunities = dataArray;

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
      {opportunities.map((opp, idx) => {
        const issue = opp.issue || "Unnamed Opportunity";
        const description = opp.description || "";
        const impact = opp.impact != null ? opp.impact : "N/A";
        const volume = opp.volume || 0;
        
        // Handle sources - can be array or string
        const sourcesArray = Array.isArray(opp.sources)
          ? opp.sources
          : opp.sources
          ? [opp.sources]
          : opp.source
          ? [opp.source]
          : ["Unknown"];

        return (
          <div 
            key={idx} 
            className="border-2 border-green-500 rounded-lg p-6"
          >
            <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 items-center">
              {/* Issue */}
              <div className="text-green-600 font-bold text-lg">
                {issue}
              </div>

              {/* Description */}
              <div className="text-sm whitespace-pre-line">
                <span dangerouslySetInnerHTML={{ __html: description }} />
              </div>

              {/* Impact - dotted circle */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center">
                  <span className="text-green-600 font-bold">
                    {typeof impact === 'number' ? `+${impact}` : impact}
                  </span>
                </div>
              </div>

              {/* Volume - solid circle */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center">
                  <span className="font-semibold">{volume.toLocaleString()}</span>
                </div>
              </div>

              {/* Advocates/Sources */}
              <div className="text-sm space-y-1">
                {sourcesArray.map((source, i) => (
                  <div key={i}>– {source}</div>
                ))}
                {opp.reach != null && (
                  <div className="text-xs text-muted-foreground">
                    Reach: {opp.reach.toLocaleString()}
                  </div>
                )}
                {opp.ave != null && (
                  <div className="text-xs text-muted-foreground">
                    AVE: P{opp.ave.toLocaleString()}
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
