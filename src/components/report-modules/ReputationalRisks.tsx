import React from "react";

type SourceLike = string[] | string | undefined;

export interface ReputationalRisk {
  issue?: string;
  description?: string;
  impact?: number; // if this can come as string sometimes, change to: number | string
  volume?: number; // same note as above
  sources?: SourceLike;
  source?: string;
  reach?: number;
  ave?: number;
}

type RiskContainer =
  | {
      items?: ReputationalRisk[];
      data?: ReputationalRisk[];
      risks?: ReputationalRisk[];
      list?: ReputationalRisk[];
    }
  | undefined;

interface ReputationalRisksProps {
  data?: ReputationalRisk[] | RiskContainer;
}

function isRiskArray(x: unknown): x is ReputationalRisk[] {
  return Array.isArray(x);
}

function pickRiskArray(obj: Record<string, unknown>): ReputationalRisk[] {
  const candidates = [obj.items, obj.data, obj.risks, obj.list];
  for (const maybe of candidates) {
    if (Array.isArray(maybe)) return maybe as ReputationalRisk[];
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

export function ReputationalRisks({ data }: ReputationalRisksProps) {
  // Normalize input to ReputationalRisk[]
  const dataArray: ReputationalRisk[] = isRiskArray(data)
    ? data
    : data && typeof data === "object"
    ? pickRiskArray(data as Record<string, unknown>)
    : [];

  if (dataArray.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No reputational risks identified during this period.
      </div>
    );
  }

  const risks: ReputationalRisk[] = dataArray;

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
      {risks.map((risk: ReputationalRisk, idx: number) => {
        const issue = risk.issue ?? "Unnamed Risk";
        const description = risk.description ?? "";
        const impact = risk.impact ?? "N/A";
        const volume = risk.volume ?? 0;

        // sources can be array or string; also fallback to single `source`
        const sourcesArray = toStringArray(risk.sources, risk.source);

        return (
          <div key={idx} className="border-2 border-red-500 rounded-lg p-6">
            <div className="grid grid-cols-[200px_1fr_100px_100px_200px] gap-4 items-center">
              {/* Issue */}
              <div className="text-red-600 font-bold text-lg">{issue}</div>

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
                  <span className="font-semibold">{formatNum(volume)}</span>
                </div>
              </div>

              {/* Antagonists/Sources */}
              <div className="text-sm space-y-1">
                {sourcesArray.map((source: string, i: number) => (
                  <div key={i}>– {source}</div>
                ))}
                {typeof risk.reach === "number" && (
                  <div className="text-xs text-muted-foreground">
                    Reach: {risk.reach.toLocaleString()}
                  </div>
                )}
                {typeof risk.ave === "number" && (
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
        *Impact refers to the total effect that a particular issue has on total
        sentiment.
      </p>
    </div>
  );
}
