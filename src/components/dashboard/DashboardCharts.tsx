import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardChartsProps {
  pieData: any;
  pieOptions: any;
  lineData: any;
  lineOptions: any;
  currentYear: number;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  pieData,
  pieOptions,
  lineData,
  lineOptions,
  currentYear
}) => {
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
          <div className="h-[300px] flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
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
          <div className="h-[300px]">
            <Line data={lineData} options={lineOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};