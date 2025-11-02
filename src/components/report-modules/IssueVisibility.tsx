import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ChannelData {
  International?: number;
  Trade?: number;
  Consumer?: number;
  Local?: number;
  Blog?: number;
  Socials?: number;
}

interface IssueData {
  issue: string;
  totalVisibility: number;
  volume: number;
  channels: ChannelData;
}

interface IssueVisibilityProps {
  data?: IssueData[];
}

// Map backend channel names to display names
const channelDisplayNames: Record<string, string> = {
  International: "National",
  Trade: "Trade",
  Consumer: "Consumer",
  Local: "Local",
  Blog: "Blog",
  Socials: "X",
};

const channelColors: Record<string, string> = {
  International: "#002a73ff", // navy blue
  Trade: "#0c2cb8ff", // dark blue
  Consumer: "#2a74f3ff", // blue
  Local: "#79a1ffff", // light blue
  Blog: "#afc7ffff", // very light blue
  Socials: "#c0c7d9ff", // gray
};

export const IssueVisibility = ({ data }: IssueVisibilityProps) => {
  // Get theme-aware border color with subtle opacity
  const borderColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--border').trim() || '0 0% 89.8%';
  const gridColor = `hsl(${borderColor} / 0.15)`;

  // Dummy data for visualization
  const dummyData: IssueData[] = [
    {
      issue: "Diamond Discovery",
      totalVisibility: 8500,
      volume: 145,
      channels: { International: 3200, Trade: 2100, Consumer: 1800, Local: 900, Blog: 300, Socials: 200 }
    },
    {
      issue: "Environmental Sustainability",
      totalVisibility: 6200,
      volume: 98,
      channels: { International: 2400, Trade: 1500, Consumer: 1200, Local: 600, Blog: 350, Socials: 150 }
    },
    {
      issue: "Labor Relations",
      totalVisibility: 5100,
      volume: 87,
      channels: { International: 1800, Trade: 1400, Consumer: 900, Local: 700, Blog: 200, Socials: 100 }
    },
    {
      issue: "Community Investment",
      totalVisibility: 4300,
      volume: 72,
      channels: { International: 1200, Trade: 1100, Consumer: 1000, Local: 600, Blog: 250, Socials: 150 }
    },
    {
      issue: "Market Performance",
      totalVisibility: 3800,
      volume: 65,
      channels: { International: 1500, Trade: 1200, Consumer: 700, Local: 300, Blog: 80, Socials: 20 }
    },
    {
      issue: "Technology Innovation",
      totalVisibility: 2900,
      volume: 54,
      channels: { International: 900, Trade: 800, Consumer: 600, Local: 400, Blog: 150, Socials: 50 }
    },
    {
      issue: "Safety Protocols",
      totalVisibility: 2400,
      volume: 48,
      channels: { International: 800, Trade: 700, Consumer: 500, Local: 300, Blog: 80, Socials: 20 }
    },
    {
      issue: "Government Relations",
      totalVisibility: 1900,
      volume: 39,
      channels: { International: 700, Trade: 600, Consumer: 300, Local: 200, Blog: 70, Socials: 30 }
    }
  ];

  const displayData = data && data.length > 0 ? data : dummyData;

  // Sort by totalVisibility descending
  const sortedData = [...displayData].sort((a, b) => b.totalVisibility - a.totalVisibility);

  const labels = sortedData.map((item) => item.issue);

  // Build datasets for each channel
  const channelKeys = ["International", "Trade", "Consumer", "Local", "Blog", "Socials"];
  const datasets = channelKeys.map((channel) => ({
    label: channelDisplayNames[channel] || channel,
    data: sortedData.map((item) => item.channels[channel as keyof ChannelData] || 0),
    backgroundColor: channelColors[channel] || "#9ca3af",
    borderWidth: 0,
    barThickness: 20,
    maxBarThickness: 20,
  }));

  const chartData = {
    labels,
    datasets,
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: true,
          color: gridColor,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Raleway, sans-serif',
          },
        },
        title: {
          display: true,
          text: "Visibility*",
          font: {
            size: 12,
            weight: "normal",
            family: 'Raleway, sans-serif',
          },
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: 'Raleway, sans-serif',
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        align: "center" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            size: 12,
            family: 'Raleway, sans-serif',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.x;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div style={{ height: "600px" }}>
          <Bar data={chartData} options={options} />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          *Visibility is a measure of volume weighted by the influence of the source as well as the prominence and relevance of the mention.
        </p>
      </CardContent>
    </Card>
  );
};
