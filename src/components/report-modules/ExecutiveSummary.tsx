interface ExecutiveSummaryProps {
  data?: {
    summary?: string;
    positiveIssues?: Array<{ title: string; description: string; impact: number }>;
    negativeIssues?: Array<{ title: string; description: string; impact: number }>;
  };
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const defaultSummary = "FNBB received mixed media coverage in Australia, Botswana, Bulgaria, Canada, China, Ethiopia, Finland, France, Germany, India, Ireland, Israel, Kenya, Lithuania, Mauritius, Namibia, Nigeria, Russia, Sierra Leone, Singapore, South Africa, Spain, Sudan, Tanzania, The Netherlands, Togo, Tunisia, Turkey, Uganda, United Kingdom, United States, Zambia, and Zimbabwe during the month of July 2025. The coverage was mostly negative with a sentiment score of -76 out of 100.";
  
  const defaultPositiveIssues = [
    {
      title: "FNBB App and Online Banking",
      description: "The FNBB App and Online Banking were mentioned positively in several posts and articles, highlighting their convenience, safety, and fast transfer and payment options.",
      impact: 15
    }
  ];
  
  const defaultNegativeIssues = [
    {
      title: "FNBB Maintenance",
      description: "A post inquired about the maintenance schedule for an FNBB branch in Botswana.",
      impact: -5
    },
    {
      title: "FNBB Botswana Premier League",
      description: "An article mentioned FNBB's sponsorship of the Botswana Premier League, but did not provide any positive or negative sentiment.",
      impact: 0
    },
    {
      title: "FNBB in Parliament",
      description: "An article mentioned FNBB in a parliamentary debate in Botswana, but did not provide any positive or negative sentiment.",
      impact: 0
    }
  ];

  return (
    <div className="space-y-6 bg-[#2a2a2a] p-8 rounded-lg text-white">
      {/* Summary Text */}
      <p className="text-base leading-relaxed">
        {data?.summary || defaultSummary}
      </p>

      {/* Positive Issues */}
      <div className="border-2 border-green-500 rounded-lg p-6 bg-[#2a2a2a]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold">Positive Issues</h3>
          <span className="text-sm text-gray-400">Sentiment impact*</span>
        </div>
        <div className="space-y-4">
          {(data?.positiveIssues || defaultPositiveIssues).map((issue, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex-1">
                <p className="mb-1">
                  <span className="font-bold">{idx + 1} {issue.title}</span>
                  <span className="font-normal"> : {issue.description}</span>
                </p>
              </div>
              <span className="text-green-500 font-bold whitespace-nowrap">
                +{issue.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Negative Issues */}
      <div className="border-2 border-red-500 rounded-lg p-6 bg-[#2a2a2a]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold">Negative Issues</h3>
          <span className="text-sm text-gray-400">Sentiment impact*</span>
        </div>
        <div className="space-y-4">
          {(data?.negativeIssues || defaultNegativeIssues).map((issue, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex-1">
                <p className="mb-1">
                  <span className="font-bold">{idx + 1} {issue.title}</span>
                  <span className="font-normal"> : {issue.description}</span>
                </p>
              </div>
              <span className={`font-bold whitespace-nowrap ${issue.impact < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {issue.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-gray-400 italic text-center">
        *Sentiment is measured on a scale of -100 to 100, with 0 representing neutral. **Impact refers to the total effect that a particular issue has on FNBB's sentiment.
      </p>
    </div>
  );
}
