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

interface ESGAnalysisProps {
  data?: ESGIssueData[];
}

interface CircularSentimentProps {
  value: number;
}

const CircularSentiment: React.FC<CircularSentimentProps> = ({ value }) => {
  // value is between -100 and 100
  // Convert to 0-100 percentage for display
  const normalizedValue = Math.abs(value);
  const percentage = Math.min(100, Math.max(0, normalizedValue));
  
  // Determine color based on value
  const getColor = () => {
    if (value === 0) return "#E5E7EB"; // gray-200
    if (value > 0) return "#10B981"; // green (positive)
    return "#EF4444"; // red (negative)
  };

  const color = getColor();
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
          stroke="#F3F4F6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={color}
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
      <span className="text-xs font-medium mt-1" style={{ color: value === 0 ? "#9CA3AF" : color }}>
        {value}
      </span>
    </div>
  );
};

export function ESGAnalysis({ data }: ESGAnalysisProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No ESG analysis data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_3fr] gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <div className="font-semibold text-sm text-gray-700">SASB ESG Issues</div>
          <div className="font-semibold text-xs text-gray-700 text-center">Government/<br/>Politicians</div>
          <div className="font-semibold text-xs text-gray-700 text-center">Regulators</div>
          <div className="font-semibold text-xs text-gray-700 text-center">Customers</div>
          <div className="font-semibold text-xs text-gray-700 text-center">Communities</div>
          <div className="font-semibold text-sm text-gray-700">Analysis</div>
        </div>

        {/* Rows */}
        {data.map((item, index) => {
          // Highlight row if any stakeholder has non-zero value
          const isHighlighted = 
            item.Government !== 0 || 
            item.Regulators !== 0 || 
            item.Customers !== 0 || 
            item.Communities !== 0;

          return (
            <div
              key={index}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_3fr] gap-4 p-4 border-b border-gray-200 last:border-b-0 ${
                isHighlighted ? "bg-green-50/30" : ""
              }`}
            >
              {/* Issue name */}
              <div className={`text-sm font-medium ${isHighlighted ? "text-teal-600" : "text-gray-600"}`}>
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
              <div className="text-sm text-gray-700 leading-relaxed">
                {item.analysis}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-xs text-gray-500 text-center mt-4">
        Sentiment is scored on a scale between -100 and 100.
      </div>
    </div>
  );
}
