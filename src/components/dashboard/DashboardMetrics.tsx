import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, Calendar, Key, BarChart3 } from 'lucide-react';

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
      title: "Total Mentions Overtime",
      value: totalArticles,
      description: "Total number of online, social, broadcast and print articles found over time.",
      icon: BarChart3,
      trend: "+12%"
    },
    {
      title: "Total Mentions this Month", 
      value: monthlyMentions,
      description: "Number of online, social, broadcast and print articles found this month.",
      icon: Calendar,
      trend: "+8%"
    },
    {
      title: "Total Keyphrases",
      value: totalKeywords,
      description: "Total number of keyphrases matched across articles.",
      icon: Key,
      trend: "+3%"
    },
    {
      title: "No. of Media Types",
      value: totalTopics,
      description: "The number of different media types where this organization was mentioned.",
      icon: TrendingUp,
      trend: "±0%"
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{metric.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="rounded-full p-2 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                  <Badge variant="secondary" className="text-xs">
                    {metric.trend}
                  </Badge>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};