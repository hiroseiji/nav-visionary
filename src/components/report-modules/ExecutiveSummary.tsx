interface ExecutiveSummaryProps {
  data?: {
    summary?: string;
    positives?: Array<{ issue?: string; title?: string; description?: string; impact?: number }>;
    negatives?: Array<{ issue?: string; title?: string; description?: string; impact?: number }>;
    positiveIssues?: Array<{ issue?: string; title?: string; description?: string; impact?: number }>;
    negativeIssues?: Array<{ issue?: string; title?: string; description?: string; impact?: number }>;
  };
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  if (!data || !data.summary) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No executive summary data available
      </div>
    );
  }

  // Support both 'positives' and 'positiveIssues' field names
  const positiveIssues = data.positives || data.positiveIssues || [];
  const negativeIssues = data.negatives || data.negativeIssues || [];

  return (
    <div className="space-y-6 bg-background p-8 rounded-lg">
      {/* Summary Text */}
      <p className="text-base leading-relaxed text-foreground">
        {data.summary}
      </p>

      {/* Positive Issues */}
      {positiveIssues.length > 0 && (
        <div className="border-2 border-green-500 rounded-lg p-6 bg-background">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Positive Issues</h3>
            <span className="text-sm text-muted-foreground">Sentiment impact*</span>
          </div>
          <div className="space-y-4">
            {positiveIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="mb-1 text-foreground">
                    <span className="font-bold">{idx + 1} {issue.issue || issue.title}</span>
                    <span className="font-normal"> : {issue.description}</span>
                  </p>
                </div>
                <span className="text-green-500 font-bold whitespace-nowrap">
                  +{Math.abs(issue.impact || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negative Issues */}
      {negativeIssues.length > 0 && (
        <div className="border-2 border-red-500 rounded-lg p-6 bg-background">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Negative Issues</h3>
            <span className="text-sm text-muted-foreground">Sentiment impact*</span>
          </div>
          <div className="space-y-4">
            {negativeIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="mb-1 text-foreground">
                    <span className="font-bold">{idx + 1} {issue.issue || issue.title}</span>
                    <span className="font-normal"> : {issue.description}</span>
                  </p>
                </div>
                <span className={`font-bold whitespace-nowrap ${(issue.impact || 0) < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {issue.impact || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground italic text-center">
        *Sentiment is measured on a scale of -100 to 100, with 0 representing neutral. **Impact refers to the total effect that a particular issue has on sentiment.
      </p>
    </div>
  );
}
