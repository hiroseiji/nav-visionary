import React from "react";

type SourceLike = string[] | string | undefined;

export interface ReputationalOpportunity {
  issue?: string;
  description?: string;
  impact?: number; // if it can arrive as string, change to: number | string
  volume?: number; // same note as above
  sources?: SourceLike;
  source?: string;
  reach?: number;
  ave?: number;
}

type OpportunityContainer =
  | {
      items?: ReputationalOpportunity[];
      data?: ReputationalOpportunity[];
      opportunities?: ReputationalOpportunity[];
      list?: ReputationalOpportunity[];
    }
  | undefined;

interface ReputationalOpportunitiesProps {
  data?: ReputationalOpportunity[] | OpportunityContainer;
}

function isOppArray(x: unknown): x is ReputationalOpportunity[] {
  return Array.isArray(x);
}

function pickOppArray(obj: Record<string, unknown>): ReputationalOpportunity[] {
  const candidates = [obj.items, obj.data, obj.opportunities, obj.list];
  for (const maybe of candidates) {
    if (Array.isArray(maybe)) return maybe as ReputationalOpportunity[];
  }
  return [];
}

function toStringArray(sources?: SourceLike, fallback?: string): string[] {
  if (Array.isArray(sources)) return sources;
  if (typeof sources === "string") return [sources];
  return fallback ? [fallback] : ["Unknown"];
}

function formatNum(n?: number): string {
  return typeof n === "number" ? n.toLocaleString() : "0";
}

export function ReputationalOpportunities({
  data,
}: ReputationalOpportunitiesProps) {
  // Normalize input to ReputationalOpportunity[]
  const dataArray: ReputationalOpportunity[] = isOppArray(data)
    ? data
    : data && typeof data === "object"
    ? pickOppArray(data as Record<string, unknown>)
    : [];

  if (dataArray.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No reputational opportunities identified during this period.
      </div>
    );
  }

  const opportunities: ReputationalOpportunity[] = dataArray;

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
      {opportunities.map((opp: ReputationalOpportunity, idx: number) => {
        const issue = opp.issue ?? "Unnamed Opportunity";
        const description = opp.description ?? "";
        const impact = opp.impact ?? "N/A";
        const volume = opp.volume ?? 0;

        // sources can be array or string; also fallback to single `source`
        const sourcesArray = toStringArray(opp.sources, opp.source);

        return (
          <div key={idx} className="border-2 border-green-500 rounded-lg p-6">
            <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 items-center">
              {/* Issue */}
              <div className="text-green-600 font-bold text-lg">{issue}</div>

              {/* Description */}
              <div className="text-sm whitespace-pre-line">
                <span dangerouslySetInnerHTML={{ __html: description }} />
              </div>

              {/* Impact - dotted circle */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center">
                  <span className="text-green-600 font-bold">
                    {typeof impact === "number" ? `+${impact}` : impact}
                  </span>
                </div>
              </div>

              {/* Volume - solid circle */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center">
                  <span className="font-semibold">{formatNum(volume)}</span>
                </div>
              </div>

              {/* Advocates/Sources */}
              <div className="text-sm space-y-1">
                {sourcesArray.map((source: string, i: number) => (
                  <div key={i}>– {source}</div>
                ))}
                {typeof opp.reach === "number" && (
                  <div className="text-xs text-muted-foreground">
                    Reach: {opp.reach.toLocaleString()}
                  </div>
                )}
                {typeof opp.ave === "number" && (
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
        *Impact refers to the total effect that a particular issue has on total
        sentiment.
      </p>
    </div>
  );
}
