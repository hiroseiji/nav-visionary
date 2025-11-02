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
  Socials: "#dde1edff", // gray
};

export const IssueVisibility = ({ data }: IssueVisibilityProps) => {
  // Get theme-aware grid color - lighter in dark mode, subtle in light mode
  const isDarkMode = document.documentElement.classList.contains('dark');
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No issue visibility data available
        </CardContent>
      </Card>
    );
  }

  const displayData = data;

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
    layout: {
      padding: {
        left: 0,
        right: 0,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
          color: gridColor,
        },
        ticks: {
          font: {
            size: 11,
            family: "Raleway, sans-serif",
          },
        },
        title: {
          display: true,
          text: "Visibility*",
          font: {
            size: 12,
            weight: "normal",
            family: "Raleway, sans-serif",
          },
        },
      },
      y: {
        stacked: true,
        grid: {
          display: true,
          color: gridColor,
        },
        ticks: {
          font: {
            size: 12,
            family: "Raleway, sans-serif",
          },
          autoSkip: false,
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
            family: "Raleway, sans-serif",
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

  // Split data: top item separate, rest together
  const topItem = sortedData[0];
  const restItems = sortedData.slice(1);

  // Chart data for top item
  const topChartData = {
    labels: [topItem.issue],
    datasets: channelKeys.map((channel) => ({
      label: channelDisplayNames[channel] || channel,
      data: [topItem.channels[channel as keyof ChannelData] || 0],
      backgroundColor: channelColors[channel] || "#9ca3af",
      borderWidth: 0,
      barThickness: 20,
      maxBarThickness: 20,
    })),
  };

  // Chart data for rest of items
  const restChartData = {
    labels: restItems.map((item) => item.issue),
    datasets: channelKeys.map((channel) => ({
      label: channelDisplayNames[channel] || channel,
      data: restItems.map((item) => item.channels[channel as keyof ChannelData] || 0),
      backgroundColor: channelColors[channel] || "#9ca3af",
      borderWidth: 0,
      barThickness: 20,
      maxBarThickness: 20,
    })),
  };

  const topOptions: ChartOptions<"bar"> = {
    ...options,
    scales: {
      ...options.scales,
      x: {
        ...options.scales?.x,
        title: {
          display: false,
        },
      },
      y: {
        ...options.scales?.y,
        ticks: {
          ...options.scales?.y?.ticks,
          // Match the width to ensure alignment
          autoSkip: false,
        },
      },
    },
    plugins: {
      ...options.plugins,
      legend: {
        display: false,
      },
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
      },
    },
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Top issue - separated */}
        <div style={{ height: "80px" }} className="mb-8">
          <Bar data={topChartData} options={topOptions} />
        </div>
        
        {/* Rest of issues */}
        <div style={{ height: "500px" }}>
          <Bar data={restChartData} options={options} />
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          *Visibility is a measure of volume weighted by the influence of the source as well as the prominence and relevance of the mention.
        </p>
      </CardContent>
    </Card>
  );
};
