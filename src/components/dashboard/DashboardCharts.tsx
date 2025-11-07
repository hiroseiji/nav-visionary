import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
  Tooltip,
  TooltipProps,
  LegendProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

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
  currentYear,
}) => {
  const pieChartConfig = {
    keywords: {
      label: "Keywords",
    },
  } satisfies ChartConfig;

  const lineChartConfig = {
    online: {
      label: "Online Articles",
      color: "hsl(var(--chart-online))",
    },
    social: {
      label: "Social Media",
      color: "hsl(var(--chart-social))",
    },
    broadcast: {
      label: "Broadcast",
      color: "hsl(var(--chart-broadcast))",
    },
    print: {
      label: "Print Media",
      color: "hsl(var(--chart-print))",
    },
  } satisfies ChartConfig;

  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
    active,
    label,
    payload,
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    // Prefer later items (Lines) over earlier ones (Areas)
    const seen = new Set<string>();
    const items = [...payload] // clone
      .reverse()
      .filter((p) => {
        const key = String(p.dataKey ?? "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .reverse(); 

    const getColorClass = (dataKey: string) => {
      switch (dataKey) {
        case 'online':
          return 'text-chart-online';
        case 'social':
          return 'text-chart-social';
        case 'broadcast':
          return 'text-chart-broadcast';
        case 'print':
          return 'text-chart-print';
        default:
          return 'text-foreground';
      }
    };

    return (
      <div className="bg-card/95 border border-border rounded px-3 py-2 text-sm shadow-lg">
        <div className="font-medium mb-1.5 text-foreground">{label}</div>
        {items.map((it) => (
          <div
            key={`${String(it.dataKey)}-${it.color}`}
            className={`${getColorClass(String(it.dataKey))} font-medium`}
          >
            {(it.name as string) ?? String(it.dataKey)}:{" "}
            {it.value as ValueType}
          </div>
        ))}
      </div>
    );
  };

  type SeriesConfig = Record<string, { label: string; color: string }>;

  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace("#", "");
    const v =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(v, 16);
    const r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const CustomLegend: React.FC<
    LegendProps & { config: SeriesConfig; order?: string[] }
  > = ({ config, order }) => {
    const keys = order ?? Object.keys(config);

    return (
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-foreground">
        {keys.map((key) => {
          const { label, color } = config[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{
                  boxShadow: `inset 0 0 0 2px ${color}`,
                  background: hexToRgba(color, 0.25),
                }}
              />
              <span className="leading-none text-sm font-medium">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

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
            <span>
              Aggregated Media Mentions Across Platforms ({currentYear})
            </span>
          </CardTitle>
          <CardDescription>
            Monthly trends across all media types
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <ComposedChart data={lineData}>
              <defs>
                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-online))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-online))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-social))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-social))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBroadcast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-broadcast))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-broadcast))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-print))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-print))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={<CustomLegend config={lineChartConfig} />}
              />
              <Area
                type="monotone"
                dataKey="online"
                stroke="none"
                fill="url(#colorOnline)"
              />
              <Area
                type="monotone"
                dataKey="social"
                stroke="none"
                fill="url(#colorSocial)"
              />
              <Area
                type="monotone"
                dataKey="broadcast"
                stroke="none"
                fill="url(#colorBroadcast)"
              />
              <Area
                type="monotone"
                dataKey="print"
                stroke="none"
                fill="url(#colorPrint)"
              />
              <Line
                type="monotone"
                dataKey="online"
                stroke="hsl(var(--chart-online))"
                strokeWidth={2}
                name="Online Articles"
                dot={{ fill: "hsl(var(--chart-online))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="social"
                stroke="hsl(var(--chart-social))"
                strokeWidth={2}
                name="Social Media"
                dot={{ fill: "hsl(var(--chart-social))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="broadcast"
                stroke="hsl(var(--chart-broadcast))"
                strokeWidth={2}
                name="Broadcast"
                dot={{ fill: "hsl(var(--chart-broadcast))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="print"
                stroke="hsl(var(--chart-print))"
                strokeWidth={2}
                name="Print Media"
                dot={{ fill: "hsl(var(--chart-print))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
