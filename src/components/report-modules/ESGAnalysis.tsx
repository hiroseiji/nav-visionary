import React from "react";

type ESGIssueData = {
  issue: string;
  Government: number;
  Regulators: number;
  Customers: number;
  Communities: number;
  averageSentiment?: number;
  analysis: string;
};

interface DataContainer {
  items?: unknown[];
  data?: unknown[];
  issues?: unknown[];
  esgAnalysis?: unknown[];
  list?: unknown[];
}

interface ESGAnalysisProps {
  data?: ESGIssueData[] | DataContainer;
}

interface CircularSentimentProps {
  value: number;
}

const CircularSentiment: React.FC<CircularSentimentProps> = ({ value }) => {
  // value is between -100 and 100
  // Convert to 0-100 percentage for display
  const normalizedValue = Math.abs(value);
  const percentage = Math.min(100, Math.max(0, normalizedValue));
  
  // Determine color based on value - use design system tokens
  const getColorClass = () => {
    if (value === 0) return "stroke-muted";
    if (value > 0) return "stroke-sentiment-positive";
    return "stroke-sentiment-negative";
  };

  const getTextColorClass = () => {
    if (value === 0) return "text-muted-foreground";
    if (value > 0) return "text-sentiment-positive";
    return "text-sentiment-negative";
  };

  const radius = 20;
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          className="stroke-muted"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          className={getColorClass()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-xs font-medium mt-1 ${getTextColorClass()}`}>
        {value}
      </span>
    </div>
  );
};

export function ESGAnalysis({ data }: ESGAnalysisProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: ESGIssueData[] = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const container = data as unknown as DataContainer;
    const candidates = [
      container.items,
      container.data,
      container.issues,
      container.esgAnalysis,
      container.list,
    ];
    const foundArray = candidates.find((c) => Array.isArray(c));
    dataArray = (foundArray || []) as ESGIssueData[];
  }

  // If no data, use mock data to show the structure
  if (dataArray.length === 0) {
    dataArray = [
      {
        issue: "Greenhouse Gas Emissions",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Greenhouse Gas Emissions in September 2024."
      },
      {
        issue: "Air Quality",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Air Quality in September 2024."
      },
      {
        issue: "Energy Management",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Energy Management in September 2024."
      },
      {
        issue: "Hazardous Waste Management",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Hazardous Waste Management in September 2024."
      },
      {
        issue: "Biodiversity Impacts",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Biodiversity Impacts in September 2024."
      },
      {
        issue: "Community Relations",
        Government: 18,
        Regulators: 0,
        Customers: 0,
        Communities: 44,
        analysis: "Former Botswanan MP, Tumisang Healy, commends Debswana for its significant contributions to the national economy, stating that the company's CEEP initiative has played a crucial role in helping businesses in local communities by increasing production capacity and facilitating skills transfer from international contractors to local subcontractors."
      },
      {
        issue: "Workforce Health & Safety",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Workforce Health & Safety in September 2024."
      },
      {
        issue: "Management of the Legal & Regulatory Environment",
        Government: 0,
        Regulators: 0,
        Customers: 0,
        Communities: 0,
        analysis: "No significant discussion of Management of the Legal & Regulatory Environment in September 2024."
      }
    ];
  }

  return (
    <div className="w-full">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_3fr] gap-4 p-4 bg-muted border-b border-border">
          <div className="font-semibold text-sm text-foreground">SASB ESG Issues</div>
          <div className="font-semibold text-xs text-foreground text-center">Government/<br/>Politicians</div>
          <div className="font-semibold text-xs text-foreground text-center">Regulators</div>
          <div className="font-semibold text-xs text-foreground text-center">Customers</div>
          <div className="font-semibold text-xs text-foreground text-center">Communities</div>
          <div className="font-semibold text-sm text-foreground">Analysis</div>
        </div>

        {/* Rows */}
        {dataArray.map((item, index) => {
          // Highlight row if any stakeholder has non-zero value
          const isHighlighted = 
            item.Government !== 0 || 
            item.Regulators !== 0 || 
            item.Customers !== 0 || 
            item.Communities !== 0;

          return (
            <div
              key={index}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_3fr] gap-4 p-4 border-b border-border last:border-b-0 ${
                isHighlighted ? "bg-sentiment-positive-light" : ""
              }`}
            >
              {/* Issue name */}
              <div className={`text-sm font-medium ${isHighlighted ? "text-sentiment-positive" : "text-muted-foreground"}`}>
                {item.issue}
              </div>

              {/* Stakeholder circles */}
              <div className="flex items-center justify-center">
                <CircularSentiment value={item.Government} />
              </div>
              <div className="flex items-center justify-center">
                <CircularSentiment value={item.Regulators} />
              </div>
              <div className="flex items-center justify-center">
                <CircularSentiment value={item.Customers} />
              </div>
              <div className="flex items-center justify-center">
                <CircularSentiment value={item.Communities} />
              </div>

              {/* Analysis text */}
              <div className="text-sm text-foreground leading-relaxed">
                {item.analysis}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-xs text-muted-foreground text-center mt-4">
        Sentiment is scored on a scale between -100 and 100.
      </div>
    </div>
  );
}
