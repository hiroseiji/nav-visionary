import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Cell, Tooltip } from 'recharts';

interface PieDataItem {
  name: string;
  value: number;
  fill: string;
}

interface LineDataItem {
  month: string;
  online: number;
  social: number;
  broadcast: number;
  print: number;
}

interface DashboardChartsProps {
  pieData: PieDataItem[];
  lineData: LineDataItem[];
  currentYear: number;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  pieData,
  lineData,
  currentYear
}) => {
  const pieChartConfig = {
    keywords: {
      label: "Keywords",
    },
  } satisfies ChartConfig;

  const lineChartConfig = {
    online: {
      label: "Online Articles",
      color: "#3b82f6",
    },
    social: {
      label: "Social Media",
      color: "#10b981",
    },
    broadcast: {
      label: "Broadcast",
      color: "#f59e0b",
    },
    print: {
      label: "Print Media",
      color: "#ef4444",
    },
  } satisfies ChartConfig;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>This Month's Top Keyword Trends</span>
          </CardTitle>
          <CardDescription>
            Distribution of most mentioned keywords this month
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Aggregated Media Mentions Across Platforms ({currentYear})</span>
          </CardTitle>
          <CardDescription>
            Monthly trends across all media types
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="online" stroke="#3b82f6" strokeWidth={2} name="Online Articles" />
              <Line type="monotone" dataKey="social" stroke="#10b981" strokeWidth={2} name="Social Media" />
              <Line type="monotone" dataKey="broadcast" stroke="#f59e0b" strokeWidth={2} name="Broadcast" />
              <Line type="monotone" dataKey="print" stroke="#ef4444" strokeWidth={2} name="Print Media" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};