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
  International: "#065f46", // dark teal
  Trade: "#047857", // teal
  Consumer: "#10b981", // green
  Local: "#6ee7b7", // light green
  Blog: "#a7f3d0", // very light green
  Socials: "#d1d5db", // gray
};

export const IssueVisibility = ({ data }: IssueVisibilityProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issue Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No issue visibility data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by totalVisibility descending
  const sortedData = [...data].sort((a, b) => b.totalVisibility - a.totalVisibility);

  const labels = sortedData.map((item) => item.issue);

  // Build datasets for each channel
  const channelKeys = ["International", "Trade", "Consumer", "Local", "Blog", "Socials"];
  const datasets = channelKeys.map((channel) => ({
    label: channelDisplayNames[channel] || channel,
    data: sortedData.map((item) => item.channels[channel as keyof ChannelData] || 0),
    backgroundColor: channelColors[channel] || "#9ca3af",
    borderWidth: 0,
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
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "Visibility*",
          font: {
            size: 12,
            weight: "normal",
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
