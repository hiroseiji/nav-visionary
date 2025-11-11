import { useEffect } from "react";

interface ReportGenerationLoaderProps {
  progress: number;
  show: boolean;
}

export function ReportGenerationLoader({
  progress,
  show,
}: ReportGenerationLoaderProps) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!show) return null;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Loader container */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Circular progress */}
        <div className="relative" style={{ width: 140, height: 140 }}>
          {/* Background circle */}
          <svg className="absolute inset-0 -rotate-90" width="140" height="140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#4A90E2"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.3s ease",
              }}
            />
          </svg>
          
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-semibold text-foreground">
              {progress}%
            </span>
          </div>
        </div>
        
        {/* Status text */}
        <p className="text-sm font-medium text-muted-foreground">
          Generating report...
        </p>
      </div>
    </div>
  );
}
