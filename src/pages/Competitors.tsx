import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, ThumbsUp, ThumbsDown, Minus, Plus, Pencil, Trash2 } from "lucide-react";
import { mapSentimentToLabel } from "@/utils/sentimentUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Doughnut, Line } from "react-chartjs-2";
import { useTheme } from "@/components/ThemeContext";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  TooltipItem,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels
);

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

interface Article {
  url: string;
  _id: string;
  title?: string;
  headline?: string;
  mention?: string;
  source?: string;
  station?: string;
  publication?: string;
  company?: string;
  keyword?: string;
  company_logo_url?: string;
  sentiment: string;
  publication_date?: string;
  publicationDate?: string;
  mentionDT?: string;
  country?: string;
  ave: number;
  reach?: number;
}

interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: (string | CanvasGradient)[];
    borderColor: (string | CanvasGradient)[];
    borderWidth: number;
    borderRadius: number;
    spacing: number;
    offset?: number[];
    hoverOffset?: number;
  }>;
}

interface ColorMap {
  [key: string]: CanvasGradient;
}

interface ChartTooltipContext {
  label: string;
  formattedValue: string;
  raw: unknown;
  dataset: {
    label: string;
    data: number[];
  };
}

export default function Competitors() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineArticles, setOnlineArticles] = useState<Article[]>([]);
  const [broadcastArticles, setBroadcastArticles] = useState<Article[]>([]);
  const [printArticles, setPrintArticles] = useState<Article[]>([]);
  const [visibleArticles, setVisibleArticles] = useState(20);
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [pieData, setPieData] = useState<PieChartData>({ labels: [], datasets: [] });
  const [colorMap, setColorMap] = useState<ColorMap>({});
  const groupedToOtherRef = useRef<string[]>([]);
  const navigate = useNavigate();
  const { orgId } = useParams();
  const { theme } = useTheme();

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!orgId) {
      navigate("/login");
      return;
    }

    const fetchCompetitorData = async () => {
      try {
        
        const [onlineRes, printRes, broadcastRes] = await Promise.all([
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/competitorArticles`),
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/printMedia`),
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/broadcastMedia`),
        ]);

        console.log("Fetched competitor data:", {
          online: onlineRes.data.length,
          print: printRes.data.length,
          broadcast: broadcastRes.data.length
        });
        setOnlineArticles(onlineRes.data);
        setPrintArticles(printRes.data);
        setBroadcastArticles(broadcastRes.data);
      } catch (err) {
        console.error("Failed to fetch competitor data:", err);
        toast.error("Failed to load competitor data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitorData();
  }, [user, orgId, navigate]);

  // Generate pie chart data for competitor mentions
  useEffect(() => {
    const currentMonth = new Date().toLocaleString("default", { month: "short" });
    const relevantArticles = [...broadcastArticles, ...printArticles, ...onlineArticles];

    const keywordDistribution = relevantArticles.reduce((acc: Record<string, number>, article: Article) => {
      const label = article.company || article.keyword;
      if (!label) return acc;

      const rawLabel = article.company || article.keyword;
      if (!rawLabel || typeof rawLabel !== "string") return acc;

      const normalizedLabel = rawLabel.trim().charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase();

      const articleDate = new Date(article.mentionDT || article.publication_date || article.publicationDate || "");
      const articleMonth = articleDate.toLocaleString("default", { month: "short" });

      if (timeFilter === "monthly") {
        if (articleMonth === currentMonth) {
          acc[normalizedLabel] = (acc[normalizedLabel] || 0) + 1;
        }
      } else {
        acc[normalizedLabel] = (acc[normalizedLabel] || 0) + 1;
      }

      return acc;
    }, {});

    const rawLabels = Object.keys(keywordDistribution);
    const rawValues = Object.values(keywordDistribution) as number[];

    const threshold = 0.02;
    const total = rawValues.reduce((a, b) => a + b, 0);
    const groupedLabels: string[] = [];
    const groupedValues: number[] = [];
    let otherValue = 0;

    groupedToOtherRef.current = [];

    rawLabels.forEach((label, i) => {
      const proportion = rawValues[i] / total;
      if (proportion < threshold) {
        otherValue += rawValues[i];
        groupedToOtherRef.current.push(label);
      } else {
        groupedLabels.push(label);
        groupedValues.push(rawValues[i]);
      }
    });

    if (otherValue > 0) {
      groupedLabels.push("Other");
      groupedValues.push(otherValue);
    }

    if (groupedLabels.length > 0) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const hashCode = (str: string) => str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

      const getGradient = (ctx: CanvasRenderingContext2D | null, hue: number): CanvasGradient => {
        if (!ctx) {
          throw new Error("Canvas context is null");
        }
        const gradient = ctx.createRadialGradient(100, 100, 50, 100, 100, 200);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 45%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 75%, 1)`);
        return gradient;
      };

      const newColorMap: ColorMap = {};
      groupedLabels.forEach((label) => {
        const hash = hashCode(label);
        const hue = hash % 360;
        newColorMap[label] = getGradient(ctx, hue);
      });

      const backgroundColors = groupedLabels.map((label) => newColorMap[label]);

      setPieData({
        labels: groupedLabels,
        datasets: [
          {
            data: groupedValues,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 2,
            borderRadius: 3,
            spacing: 2,
          },
        ],
      });

      setColorMap(newColorMap);
      console.log("Pie chart data generated:", { labels: groupedLabels, values: groupedValues });
    } else {
      console.log("No data available for pie chart");
      setPieData({
        labels: ["No Data Available"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#d3d3d3"],
            borderColor: ["transparent"],
            borderWidth: 2,
            borderRadius: 3,
            spacing: 2,
            offset: [0],
            hoverOffset: 0,
          },
        ],
      });
    }
  }, [broadcastArticles, onlineArticles, printArticles, timeFilter]);

  const cleanMentionHeadline = (mention: string) => {
    const summaryMatch = mention.match(
      /Summary:\s*(.*?)(Entities:|Sentiment:|Insert_or_Interview:|$)/s
    );
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    return mention;
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === "positive") return <ThumbsUp className="h-4 w-4 text-green-500" />;
    if (sentiment === "negative") return <ThumbsDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentBadge = (sentiment: string | number) => {
    const normalizedSentiment = mapSentimentToLabel(sentiment);
    const variant = normalizedSentiment as "positive" | "negative" | "neutral" | "mixed";
    
    return <Badge variant={variant} className="capitalize">{normalizedSentiment}</Badge>;
  };

  // Generate line chart data for monthly articles
  const groupArticlesByMonthForLineChart = () => {
    const currentYear = new Date().getFullYear();
    const onlineMonthCounts = new Array(12).fill(0);
    const broadcastMonthCounts = new Array(12).fill(0);
    const printMonthCounts = new Array(12).fill(0);

    onlineArticles.forEach((article) => {
      const articleDate = new Date(article.publication_date || article.mentionDT || article.publicationDate || "");
      if (articleDate.getFullYear() === currentYear) {
        onlineMonthCounts[articleDate.getMonth()] += 1;
      }
    });

    broadcastArticles.forEach((article) => {
      const articleDate = new Date(article.mentionDT || "");
      if (articleDate.getFullYear() === currentYear) {
        broadcastMonthCounts[articleDate.getMonth()] += 1;
      }
    });

    printArticles.forEach((article) => {
      const articleDate = new Date(article.publicationDate || "");
      if (articleDate.getFullYear() === currentYear) {
        printMonthCounts[articleDate.getMonth()] += 1;
      }
    });

    return { onlineMonthCounts, broadcastMonthCounts, printMonthCounts };
  };

  const { onlineMonthCounts, broadcastMonthCounts, printMonthCounts } = groupArticlesByMonthForLineChart();

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Online Articles",
        data: onlineMonthCounts,
        borderColor: "rgb(190, 75, 192)",
        backgroundColor: "rgba(190, 75, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 7,
        fill: true,
      },
      {
        label: "Broadcast Articles",
        data: broadcastMonthCounts,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 7,
        fill: true,
      },
      {
        label: "Print Media Articles",
        data: printMonthCounts,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(248, 124, 150, 0.41)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 7,
        fill: true,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          color: theme === "light" ? "#7a7a7a" : "#fff",
          font: {
            family: "raleway",
            size: 12,
            weight: "normal" as const,
          },
          padding: 15,
        },
      },
      tooltip: {
        usePointStyle: true,
        pointStyle: "circle" as const,
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            const label = context.label;
            const value = context.formattedValue;

            if (label === "Other" && groupedToOtherRef.current.length > 0) {
              return [
                `${label}: ${value}`,
                "Includes:",
                ...groupedToOtherRef.current.slice(0, 10),
                ...(groupedToOtherRef.current.length > 10 ? [`...and ${groupedToOtherRef.current.length - 10} more`] : []),
              ];
            }

            return `${label}: ${value}`;
          },
        },
      },
      datalabels: {
        display: true,
        color: "#fff",
        font: {
          family: "raleway",
          size: 12,
          weight: 400,
        },
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "raleway" },
          color: theme === "light" ? "#7a7a7a" : "#fff",
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 200,
        grid: { color: "rgba(200, 200, 200, 0.2)" },
        ticks: {
          font: { family: "raleway" },
          color: theme === "light" ? "#7a7a7a" : "#fff",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle" as const,
          font: { family: "raleway", size: 12, weight: 500 },
          color: theme === "light" ? "#7a7a7a" : "#fff",
          boxWidth: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<"line">) =>
            `${tooltipItem.raw} Articles`,
        },
      },
      datalabels: { display: false },
    },
    animation: { duration: 1000 },
  };

  const renderArticleTable = (articles: Article[], type: string) => {
    const filtered = articles
      .filter(a => {
        const headline = type === "broadcast" ? a.mention : type === "print" ? a.headline : a.title;
        return searchQuery ? headline?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      })
      .filter(a => sentimentFilter === "all" ? true : a.sentiment === sentimentFilter)
      .slice(0, visibleArticles);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-medium">Competitor</TableHead>
                <TableHead className="font-medium">Headline</TableHead>
                <TableHead className="font-medium">Source</TableHead>
                <TableHead className="font-medium">Sentiment</TableHead>
                {type === "online" && <TableHead className="font-medium">Reach</TableHead>}
                <TableHead className="font-medium">AVE</TableHead>
                <TableHead className="font-medium">Date</TableHead>
                {/* {type === "online" && ( */}
                  <TableHead className="font-medium">Country</TableHead>
                {/* )} */}
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={type === "online" ? 9 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No articles found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((article) => {
                  const competitor = type === "online" ? article.company : article.keyword;
                  const rawHeadline = type === "broadcast" ? article.mention : type === "print" ? article.headline : article.title;
                  const headline = type === "broadcast" && rawHeadline ? cleanMentionHeadline(rawHeadline) : rawHeadline;
                  const truncatedHeadline = headline && headline.length > 100 ? headline.substring(0, 100) + "..." : headline;
                  
                  return (
                    <TableRow
                      key={article._id}
                      className="hover:bg-muted/30 transition-colors border-b last:border-0"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {article.company_logo_url && (
                            <img
                              src={article.company_logo_url}
                              alt={competitor || "Company logo"}
                              className="h-8 w-8 object-contain rounded-full border-2 border-muted"
                            />
                          )}
                          <span className="text-sm font-medium">
                            {competitor || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium py-4 text-sm max-w-xs">
                        {(() => {
                          const full = headline || "";
                          const short =
                            full.length > 100 ? full.slice(0, 100) + "…" : full;

                          const clickable = article.url ? (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-primary cursor-pointer block"
                            >
                              {short}
                            </a>
                          ) : (
                            <span className="block">{short}</span>
                          );

                          return full.length > 100 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {clickable}
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <p>{full}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            clickable
                          );
                        })()}
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        {type === "broadcast"
                          ? article.station
                          : type === "print"
                          ? article.publication
                          : article.source}
                      </TableCell>
                      <TableCell className="py-4">
                        {getSentimentBadge(article.sentiment)}
                      </TableCell>
                      {type === "online" && (
                        <TableCell className="py-4 text-sm">
                          {article.reach?.toLocaleString() || "N/A"}
                        </TableCell>
                      )}
                      <TableCell className="py-4 text-sm">
                        {article.ave?.toLocaleString() || "N/A"}
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        {new Date(
                          type === "broadcast"
                            ? article.mentionDT || ""
                            : type === "print"
                            ? article.publicationDate || ""
                            : article.publication_date || ""
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        {article.country || "N/A"}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingArticle(article._id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit article"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {user?.role === "super_admin" && (
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this article?"
                                  )
                                ) {
                                  try {
                                    await axios.delete(
                                      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/competitorArticles/${article._id}`
                                    );
                                    toast.success(
                                      "Article deleted successfully"
                                    );
                                    // Refresh data
                                    const [onlineRes, printRes, broadcastRes] =
                                      await Promise.all([
                                        axios.get(
                                          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/competitorArticles`
                                        ),
                                        axios.get(
                                          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/printMedia`
                                        ),
                                        axios.get(
                                          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/broadcastMedia`
                                        ),
                                      ]);
                                    setOnlineArticles(onlineRes.data);
                                    setPrintArticles(printRes.data);
                                    setBroadcastArticles(broadcastRes.data);
                                  } catch (err) {
                                    console.error(
                                      "Failed to delete article:",
                                      err
                                    );
                                    toast.error("Failed to delete article");
                                  }
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {articles.length} articles
            </p>
            <div className="flex gap-2">
              {visibleArticles > 20 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setVisibleArticles((prev) => Math.max(prev - 20, 20))
                  }
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Show Less
                </Button>
              )}
              {visibleArticles < articles.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleArticles((prev) => prev + 20)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Show More
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Competitor Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and analyze competitor media presence
          </p>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Competitor Mentions</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={timeFilter === "monthly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFilter("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={timeFilter === "overall" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFilter("overall")}
                  >
                    Overall
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {pieData.labels && pieData.labels.length > 0 ? (
                  <Doughnut data={pieData} options={pieOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Number of Articles Mentioning Competitors (Yearly)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Line data={lineData} options={lineOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="online" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="online">
              Online ({onlineArticles.length})
            </TabsTrigger>
            <TabsTrigger value="broadcast">
              Broadcast ({broadcastArticles.length})
            </TabsTrigger>
            <TabsTrigger value="print">
              Print ({printArticles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online">
            <Card>
              <CardHeader>
                <CardTitle>Online Media Coverage</CardTitle>
                <CardDescription>
                  Competitor mentions in online news sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderArticleTable(onlineArticles, "online")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Media Coverage</CardTitle>
                <CardDescription>
                  Competitor mentions in TV and radio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderArticleTable(broadcastArticles, "broadcast")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="print">
            <Card>
              <CardHeader>
                <CardTitle>Print Media Coverage</CardTitle>
                <CardDescription>
                  Competitor mentions in newspapers and magazines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderArticleTable(printArticles, "print")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
