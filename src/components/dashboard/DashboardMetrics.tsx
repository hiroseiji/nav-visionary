import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

interface DashboardMetricsProps {
  totalArticles: number;
  monthlyMentions: number;
  totalKeywords: number;
  totalTopics: number;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalArticles,
  monthlyMentions,
  totalKeywords,
  totalTopics
}) => {
  const metrics = [
    {
      title: "Total Mentions",
      value: totalArticles,
      trend: "Increased from last month",
      isPrimary: true
    },
    {
      title: "Monthly Mentions", 
      value: monthlyMentions,
      trend: "Increased from last month",
      isPrimary: false
    },
    {
      title: "Total Keyphrases",
      value: totalKeywords,
      trend: "Increased from last month",
      isPrimary: false
    },
    {
      title: "Media Types",
      value: totalTopics,
      trend: "On Discuss",
      isPrimary: false
    }
  ];

  return (
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
            <div className={`rounded-full p-2 ${
              metric.isPrimary 
                ? 'bg-white/20 text-primary-foreground' 
                : 'border-2 border-foreground/20'
            }`}>
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`text-6xl font-bold ${
              metric.isPrimary ? 'text-primary-foreground' : 'text-foreground'
            }`}>
              {metric.value}
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-md p-1.5 ${
                metric.isPrimary 
                  ? 'bg-white/20' 
                  : 'bg-muted'
              }`}>
                <TrendingUp className={`h-3.5 w-3.5 ${
                  metric.isPrimary ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <span className={`text-sm ${
                metric.isPrimary ? 'text-primary-foreground/90' : 'text-muted-foreground'
              }`}>
                {metric.trend}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};