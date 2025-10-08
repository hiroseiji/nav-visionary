import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface DashboardMetricsProps {
  totalArticles: number;
  monthlyMentions: number;
  totalKeywords: number;
  totalTopics: number;
  mediaTypes?: string[];
}

type TrendType = 'increase' | 'decrease' | 'same';

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalArticles,
  monthlyMentions,
  totalKeywords,
  totalTopics,
  mediaTypes = ['Online', 'Broadcast', 'Social', 'Print']
}) => {
  const metrics = [
    {
      title: "Total Mentions",
      value: totalArticles,
      trend: "Increased from last month",
      trendType: 'increase' as TrendType,
      description: "Total number of brand mentions across all channels",
      isPrimary: true
    },
    {
      title: "Monthly Mentions", 
      value: monthlyMentions,
      trend: "Increased from last month",
      trendType: 'increase' as TrendType,
      description: "Number of mentions this month",
      isPrimary: false
    },
    {
      title: "Total Keyphrases",
      value: totalKeywords,
      trend: "Same as last month",
      trendType: 'same' as TrendType,
      description: "Tracked keyphrases and keywords",
      isPrimary: false
    },
    {
      title: "Media Types",
      value: totalTopics,
      trend: "Decreased from last month",
      trendType: 'decrease' as TrendType,
      description: "Active media channels being monitored",
      isPrimary: false
    }
  ];

  const getTrendIcon = (trendType: TrendType) => {
    switch (trendType) {
      case 'increase':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'decrease':
        return <TrendingDown className="h-3.5 w-3.5" />;
      case 'same':
        return <Minus className="h-3.5 w-3.5" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <Card 
            key={index} 
            className={`relative overflow-hidden transition-all duration-300 ${
              metric.isPrimary 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-base font-medium ${
                metric.isPrimary ? 'text-primary-foreground' : 'text-foreground'
              }`}>
                {metric.title}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`rounded-full p-2 border-2 cursor-help transition-colors ${
                    metric.isPrimary 
                      ? 'border-primary-foreground/30 hover:border-primary-foreground/50' 
                      : 'border-[#1e40af] hover:border-[#1e3a8a]'
                  }`}>
                    <ArrowUpRight className={`h-5 w-5 ${
                      metric.isPrimary ? 'text-primary-foreground' : 'text-[#1e40af]'
                    }`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metric.description}</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="space-y-3">
              {metric.title === "Media Types" ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {mediaTypes.map((type, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="px-3 py-1.5 text-sm font-medium"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <>
                  <div className={`text-6xl font-bold ${
                    metric.isPrimary ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {metric.value}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`rounded-md p-1.5 ${
                      metric.isPrimary 
                        ? 'bg-primary-foreground/10' 
                        : 'bg-muted'
                    }`}>
                      <span className={metric.isPrimary ? 'text-primary-foreground' : 'text-muted-foreground'}>
                        {getTrendIcon(metric.trendType)}
                      </span>
                    </div>
                    <span className={`text-sm ${
                      metric.isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {metric.trend}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};