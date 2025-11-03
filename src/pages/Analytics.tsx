import { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GeoCoverageMap from "@/components/GeoCoverageMap";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { ThemeContext } from "@/components/ThemeContext";
import WordCloud from "react-wordcloud";
import {
  generateOverYearsBarData,
  generateCountOverTimeChartData,
  generateTopJournalistChartData,
} from "@/utils/analyticsUtils";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState("posts");
  const [granularity, setGranularity] = useState("month");
  const [totalArticles, setTotalArticles] = useState(0);
  const [monthlyMentions, setMonthlyMentions] = useState(0);
  const [totalTopics, setTotalTopics] = useState(4);
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [facebookPosts, setFacebookPosts] = useState<any[]>([]);
  const [broadcastArticles, setBroadcastArticles] = useState<any[]>([]);
  const [printArticles, setPrintArticles] = useState<any[]>([]);
  const [countOverTimeData, setCountOverTimeData] = useState<any[]>([]);
  const [broadcastOverTimeData, setBroadcastOverTimeData] = useState<any[]>([]);
  const [printOverTimeData, setPrintOverTimeData] = useState<any[]>([]);
  const [keywordDistribution, setKeywordDistribution] = useState<any>({});
  const [wordCloudData, setWordCloudData] = useState<any>(null);
  const [geoCountryCounts, setGeoCountryCounts] = useState<any>({});
  const [journalistChart, setJournalistChart] = useState<any>(null);
  const [broadcastInsightsData, setBroadcastInsightsData] = useState<any>(null);
  const [otherStations, setOtherStations] = useState<any[]>([]);
  const [otherStationNames, setOtherStationNames] = useState<string[]>([]);
  const [otherPrintSources, setOtherPrintSources] = useState<string[]>([]);
  const [otherOnlineSources, setOtherOnlineSources] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg = localStorage.getItem("selectedOrg");
  const orgId = user?.role === "super_admin" ? selectedOrg : user?.organizationId;

  const normalizedContentType = useMemo(() => {
    return contentType === "printMedia" ? "print" : contentType;
  }, [contentType]);

  const pastelColors = useMemo(
    () => [
      "#FFD700",
      "#87CEEB",
      "#FF69B4",
      "#90EE90",
      "#FFA07A",
      "#9370DB",
      "#00CED1",
      "#FFB6C1",
      "#CD5C5C",
      "#20B2AA",
    ],
    []
  );

  const [pieData, setPieData] = useState<any>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 2,
      },
    ],
  });

  // Fetch organization data and media content
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!selectedOrg) {
          navigate("/login");
          return;
        }

        const orgUrl = `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}`;
        const orgResponse = await axios.get(orgUrl);
        setOrganizationData(orgResponse.data);

        const [articlesRes, postsRes, broadcastRes, printRes] = await Promise.allSettled([
          axios.get(`${orgUrl}/articles`),
          axios.get(`${orgUrl}/posts`),
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${selectedOrg}/broadcastMedia`),
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${selectedOrg}/printMedia`),
        ]);

        if (articlesRes.status === "fulfilled") {
          setArticles(articlesRes.value.data.articles || []);
        }
        if (postsRes.status === "fulfilled") {
          setFacebookPosts(postsRes.value.data.posts || []);
        }
        if (broadcastRes.status === "fulfilled") {
          setBroadcastArticles(broadcastRes.value.data || []);
        }
        if (printRes.status === "fulfilled") {
          setPrintArticles(printRes.value.data || []);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        toast.error("Failed to load analytics data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedOrg, navigate]);

  // Fetch count over time
  useEffect(() => {
    const fetchCountOverTime = async () => {
      try {
        if (!selectedOrg) return;

        const response = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/count-over-time?organizationId=${selectedOrg}&contentType=${contentType}&granularity=${granularity}`
        );
        setCountOverTimeData(response.data);
      } catch (error) {
        console.error("Error fetching count over time:", error);
      }
    };

    fetchCountOverTime();
  }, [selectedOrg, contentType, granularity]);

  // Fetch word cloud data
  useEffect(() => {
    if (!selectedOrg || !contentType) return;

    const fetchWordCloud = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const res = await axios.post(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/wordcloud`,
          {
            organizationId: selectedOrg,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            contentType: contentType,
            scope: "local",
          }
        );

        const keywords = res.data?.keywords || [];
        setWordCloudData({ keywords });
      } catch (error) {
        console.error("Error fetching word cloud:", error);
        setWordCloudData(null);
      }
    };

    fetchWordCloud();
  }, [selectedOrg, contentType]);

  // Fetch broadcast insights
  useEffect(() => {
    const fetchBroadcastInsights = async () => {
      if (!selectedOrg || contentType !== "broadcast") return;

      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const formatDate = (date: Date) => date.toISOString().split("T")[0];
        const startDate = formatDate(firstDay);
        const endDate = formatDate(lastDay);

        const res = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/analytics/${selectedOrg}/broadcast-insights`,
          {
            params: {
              start_date: startDate,
              end_date: endDate,
            },
          }
        );

        const insights = res.data;
        const sentimentTypes = ["Positive", "Neutral", "Negative", "Mixed"];
        const colors = {
          Positive: "rgb(12, 217, 94)",
          Neutral: "rgb(255, 182, 55)",
          Negative: "rgb(255, 88, 76)",
          Mixed: "rgb(47, 162, 250)",
        };

        const stationTotals = insights.map((item: any) => ({
          station: item.station,
          total: sentimentTypes.reduce(
            (sum, type) => sum + (item.sentimentCounts?.[type] || 0),
            0
          ),
          sentimentCounts: item.sentimentCounts,
        }));

        const topN = 15;
        const sorted = stationTotals.sort((a: any, b: any) => b.total - a.total);
        const topStations = sorted.slice(0, topN);
        const otherStations = sorted.slice(topN);

        const labels = [...topStations.map((s: any) => s.station), "Others"];

        const datasets = sentimentTypes.map((type) => {
          const topData = topStations.map(
            (s: any) => s.sentimentCounts?.[type] || 0
          );

          const othersTotal = otherStations.reduce(
            (sum: number, s: any) => sum + (s.sentimentCounts?.[type] || 0),
            0
          );

          return {
            label: type,
            data: [...topData, othersTotal],
            backgroundColor: colors[type as keyof typeof colors],
            borderRadius: 2,
          };
        });

        setBroadcastInsightsData({ labels, datasets });
        setOtherStations(otherStations);
        setOtherStationNames(otherStations.map((s: any) => s.station));
      } catch (err) {
        console.error("Error fetching broadcast insights:", err);
      }
    };

    fetchBroadcastInsights();
  }, [selectedOrg, contentType]);

  // Fetch top journalists for print media
  useEffect(() => {
    const fetchTopPrintJournalists = async () => {
      if (contentType !== "printMedia") return;

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 6, 30);

      const format = (d: Date) => d.toISOString().split("T")[0];

      try {
        const response = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/analytics/${selectedOrg}/print-journalist-insights`,
          {
            params: {
              startDate: format(startDate),
              endDate: format(endDate),
            },
          }
        );

        const chartData = generateTopJournalistChartData(response.data);
        setJournalistChart(chartData);
      } catch (err) {
        console.error("Failed to fetch top print journalists:", err);
      }
    };

    fetchTopPrintJournalists();
  }, [selectedOrg, contentType]);

  // Calculate metrics
  useEffect(() => {
    const now = new Date();

    const total = countOverTimeData
      .filter((item) => item.contentType === contentType)
      .reduce((sum, item) => sum + (item.count || 0), 0);
    setTotalArticles(total);

    const thisMonth = countOverTimeData.find((item) => {
      if (item.contentType !== contentType) return false;
      const date = new Date(item.date || item._id);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
    setMonthlyMentions(thisMonth?.count || 0);

    let value = 0;
    if (contentType === "articles") {
      value = articles
        .filter((article) => {
          const date = new Date(article.publication_date);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, article) => sum + (article.reach || 0), 0);
    } else if (contentType === "posts") {
      value = facebookPosts
        .filter((post) => {
          const date = new Date(post.date || post.createdAt);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, post) => sum + (post.reach || 0), 0);
    }

    setTotalKeywords(value);

    const types =
      (facebookPosts.length > 0 ? 1 : 0) +
      (articles.length > 0 ? 1 : 0) +
      (broadcastArticles.length > 0 ? 1 : 0) +
      (printArticles.length > 0 ? 1 : 0);
    setTotalTopics(types);
  }, [
    contentType,
    articles,
    facebookPosts,
    broadcastArticles,
    printArticles,
    countOverTimeData,
  ]);

  // Process keyword distribution
  useEffect(() => {
    if (articles.length > 0) {
      const keywordMap: any = {};

      articles.forEach((article) => {
        article.matched_keywords?.forEach((keyword: string) => {
          if (!keywordMap[keyword]) {
            keywordMap[keyword] = { count: 0, sources: new Set() };
          }
          keywordMap[keyword].count += 1;
          keywordMap[keyword].sources.add(article.source);
        });
      });

      Object.keys(keywordMap).forEach((key) => {
        keywordMap[key].sources = Array.from(keywordMap[key].sources);
      });

      setKeywordDistribution(keywordMap);
    }
  }, [articles]);

  // Generate pie chart data based on content type
  useEffect(() => {
    // Social Media Posts
    if (contentType === "posts") {
      const sourceMap: any = {};

      facebookPosts.forEach((post) => {
        const source = post.source || "Unknown Source";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      });

      const labels = Object.keys(sourceMap);
      const data = labels.map((label) => sourceMap[label]);

      setPieData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map(
              (_, i) => pastelColors[i % pastelColors.length]
            ),
            borderColor: "transparent",
            borderWidth: 0,
            borderRadius: 3,
            spacing: 0,
          },
        ],
      });
      return;
    }

    // Online Articles (Keyword Trends)
    if (
      contentType === "articles" &&
      Object.keys(keywordDistribution).length > 0
    ) {
      const sorted = Object.entries(keywordDistribution).sort(
        (a: any, b: any) => b[1].count - a[1].count
      );

      const topN = 7;
      const topKeywords = sorted.slice(0, topN);
      const otherKeywords = sorted.slice(topN);

      const labels = [
        ...topKeywords.map(([k]) => k),
        ...(otherKeywords.length > 0 ? ["Others"] : []),
      ];
      const data = [
        ...topKeywords.map(([_, obj]: any) => obj.count),
        ...(otherKeywords.length > 0
          ? [otherKeywords.reduce((sum, [_, obj]: any) => sum + obj.count, 0)]
          : []),
      ];

      setOtherOnlineSources(otherKeywords.map(([key]) => key));

      setPieData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map(
              (_, i) => pastelColors[i % pastelColors.length]
            ),
            borderColor: "transparent",
            borderWidth: 2,
            borderRadius: 5,
            spacing: 5,
          },
        ],
      });
      return;
    }

    // Print Media (By Publication)
    if (contentType === "printMedia" && printArticles.length > 0) {
      const sourceMap: any = {};

      printArticles.forEach((article) => {
        const source = article.publication || "Unknown Publication";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      });

      const sorted = Object.entries(sourceMap).sort((a: any, b: any) => b[1] - a[1]);
      const topN = 7;
      const top = sorted.slice(0, topN);
      const other = sorted.slice(topN);

      const labels = [
        ...top.map(([label]) => label),
        ...(other.length > 0 ? ["Others"] : []),
      ];
      const data = [
        ...top.map(([_, count]) => count),
        ...(other.length > 0
          ? [other.reduce((sum, [_, c]: any) => sum + c, 0)]
          : []),
      ];

      setOtherPrintSources(other.map(([label]) => label));

      setPieData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map(
              (_, i) => pastelColors[i % pastelColors.length]
            ),
            borderColor: "transparent",
            borderWidth: 2,
            borderRadius: 5,
            spacing: 5,
          },
        ],
      });
      return;
    }

    setPieData({ labels: [], datasets: [] });
  }, [
    contentType,
    keywordDistribution,
    facebookPosts,
    pastelColors,
    printArticles,
  ]);

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle" as const,
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          boxWidth: 10,
          boxHeight: 10,
          font: {
            size: 14,
            family: "Raleway",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const label = tooltipItem.label;
            const value = tooltipItem.raw;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          font: { family: "Raleway" },
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(200, 200, 200, 0.2)" },
        ticks: {
          font: { family: "Raleway" },
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          font: { family: "Raleway", size: 12 },
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          usePointStyle: true,
          pointStyle: "roundedRect" as const,
          boxWidth: 10,
          boxHeight: 10,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) =>
            `${tooltipItem.raw} items in ${
              tooltipItem.dataset.label.split(" ")[2]
            }`,
        },
      },
    },
    animation: { duration: 10 },
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          usePointStyle: true,
          pointStyle: "roundedRect" as const,
          boxWidth: 10,
          boxHeight: 10,
          padding: 10,
          font: {
            size: 12,
            family: "Raleway",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            return `${tooltipItem.label}: ${tooltipItem.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: "rgba(200, 200, 200, 0.2)",
        },
        ticks: {
          font: { family: "Raleway" },
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
        },
      },
      y1: {
        beginAtZero: true,
        title: { display: true, text: "Volume", color: theme === "light" ? "#7a7a7a" : "#ffffffd2" },
        grid: { color: "rgba(200, 200, 200, 0.2)" },
        ticks: {
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
        },
      },
      y2: {
        beginAtZero: true,
        position: "right" as const,
        title: { display: true, text: "Reach / AVE", color: theme === "light" ? "#7a7a7a" : "#ffffffd2" },
        grid: { drawOnChartArea: false, color: "rgba(200, 200, 200, 0.2)" },
        ticks: {
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
        },
      },
    },
    animation: { duration: 10 },
  };

  const currentYear = new Date().getFullYear();
  const dynamicBarData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: generateOverYearsBarData(
      normalizedContentType,
      facebookPosts,
      articles,
      broadcastArticles,
      broadcastOverTimeData,
      printArticles,
      printOverTimeData
    ),
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive analytics and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowCreateReport(true)}
              className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-6 py-2.5 h-auto rounded-xl font-medium shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Report
            </Button>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-[180px] bg-background border-input rounded-xl h-auto py-2.5 px-4 font-medium">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="posts">Social Posts</SelectItem>
                <SelectItem value="articles">Online Media</SelectItem>
                <SelectItem value="broadcast">Broadcast</SelectItem>
                <SelectItem value="printMedia">Print</SelectItem>
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-[140px] bg-background border-input rounded-xl h-auto py-2.5 px-4 font-medium">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div
              className="rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Total Mentions</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-primary-foreground/30 hover:border-primary-foreground/50 cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of brand mentions across all channels</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">
                  {totalArticles.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-primary-foreground/10">
                    <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-primary-foreground/80">
                    Increased from last month
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">This Month</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of mentions this month</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">
                  {monthlyMentions.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-muted">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Increased from last month
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Active Topics</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Active media channels being monitored</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Online", "Broadcast", "Social", "Print"].slice(0, totalTopics).map((type, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Monthly Reach</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimated audience reach this month</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">{totalKeywords.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-muted">
                    <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Reach metric
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Charts Section with Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Bar Chart - Over Years */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {contentType === "posts" && "Social Posts Over the Years"}
                  {contentType === "articles" && "Online Articles Over the Years"}
                  {contentType === "broadcast" && "Broadcast Mentions Over the Years"}
                  {contentType === "printMedia" && "Print Media Articles Over the Years"}
                </CardTitle>
                <CardDescription>
                  Historical trend of mentions over the past years
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <Bar data={dynamicBarData} options={barOptions} />
              </CardContent>
            </Card>

            {/* Content Volume Chart or Journalist Chart */}
            {contentType === "printMedia" ? (
              journalistChart && journalistChart.labels?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top 15 Journalists by Volume and Tonality</CardTitle>
                    <CardDescription>
                      Print media journalists ranked by article count
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-96">
                    <Bar
                      data={{
                        ...journalistChart,
                        labels: journalistChart.labels.map((l: string) =>
                          l === "0" || l.trim() === "" ? "Unknown" : l
                        ),
                      }}
                      options={{
                        indexAxis: "x",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                            labels: {
                              font: { family: "Raleway" },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                              usePointStyle: true,
                              pointStyle: "circle",
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: (tooltipItem: any) =>
                                `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()}`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            stacked: false,
                            title: {
                              display: true,
                              text: "Journalist",
                              font: {
                                family: "Raleway",
                                size: 14,
                                weight: "bold",
                              },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            ticks: {
                              font: {
                                family: "Raleway",
                                size: 13,
                                weight: "normal",
                              },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            grid: {
                              color: "rgba(200, 200, 200, 0.2)",
                              display: true,
                            },
                          },
                          y: {
                            stacked: false,
                            title: {
                              display: true,
                              text: "Number of Articles",
                              font: {
                                family: "Raleway",
                                size: 14,
                                weight: "bold",
                              },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            ticks: {
                              stepSize: 1,
                              font: { family: "Raleway" },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            grid: {
                              color: "rgba(200, 200, 200, 0.2)",
                              display: true,
                            },
                          },
                        },
                        animation: { duration: 1000 },
                      }}
                    />
                  </CardContent>
                </Card>
              )
            ) : (
              countOverTimeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Content Volume per Reach & AVE</CardTitle>
                    <CardDescription>
                      Tracking media content volume over time with reach and AVE metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-96">
                    <Bar
                      data={generateCountOverTimeChartData(
                        countOverTimeData,
                        normalizedContentType,
                        granularity
                      )}
                      options={chartOptions}
                    />
                  </CardContent>
                </Card>
              )
            )}
          </TabsContent>

          <TabsContent value="keywords" className="space-y-6">
            {/* Word Cloud */}
            {wordCloudData?.keywords && wordCloudData.keywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Word Cloud</CardTitle>
                  <CardDescription>
                    Most frequently mentioned keywords
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <div className="h-full w-full">
                    <WordCloud
                      words={wordCloudData.keywords.map((k: any) => ({
                        text: k.text,
                        value: k.value,
                      }))}
                      options={{
                        rotations: 2,
                        enableTooltip: false,
                        rotationAngles: [-90, 0],
                        fontSizes: [15, 50],
                        fontWeight: "bold",
                        scale: "sqrt",
                        spiral: "archimedean",
                        transitionDuration: 1000,
                        fontFamily: "Raleway",
                        padding: 5,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            {/* Pie/Doughnut Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {contentType === "posts" && "Mentions Composition by Source"}
                  {contentType === "articles" && "Top Keyword Trends Online"}
                  {contentType === "printMedia" && "Print Media Mentions by News Source"}
                  {contentType === "broadcast" && "Sentiment Breakdown by Station"}
                </CardTitle>
                <CardDescription>
                  Distribution of mentions across different sources
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {contentType === "broadcast" ? (
                  broadcastInsightsData?.datasets?.length &&
                  broadcastInsightsData?.datasets[0]?.data?.some((v: number) => v > 0) ? (
                    <Bar
                      data={broadcastInsightsData}
                      options={{
                        indexAxis: "x",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                            labels: {
                              font: { family: "Raleway" },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                              usePointStyle: true,
                              pointStyle: "circle",
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function (tooltipItem: any) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()}`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            stacked: false,
                            title: {
                              display: true,
                              text: "Mentions by Sentiment",
                              font: {
                                family: "Raleway",
                                size: 14,
                                weight: "bold",
                              },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            ticks: {
                              font: { family: "Raleway" },
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            grid: {
                              display: true,
                              color: "rgba(200, 200, 200, 0.21)",
                            },
                          },
                          y: {
                            stacked: false,
                            ticks: {
                              font: {
                                family: "Raleway",
                                size: 13,
                                weight: "normal",
                              },
                              padding: 5,
                              color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            grid: {
                              display: true,
                              color: "rgba(200, 200, 200, 0.2)",
                            },
                          },
                        },
                        animation: {
                          duration: 1500,
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No broadcast insights data available yet.
                    </div>
                  )
                ) : pieData?.datasets?.[0]?.data?.some((v: number) => v > 0) ? (
                  <Doughnut data={pieData} options={pieOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No composition data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Coverage</CardTitle>
                <CardDescription>
                  Distribution of mentions across different countries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeoCoverageMap 
                  countryCounts={geoCountryCounts} 
                  showTitle={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {user && orgId && (
          <CreateReportDialog
            open={showCreateReport}
            onOpenChange={setShowCreateReport}
            organizationId={orgId}
            organizationName={organizationData?.organization?.organizationName || "Organization"}
            user={{
              firstName: user.firstName || "",
              lastName: user.lastName || "",
            }}
          />
        )}
      </div>
    </SidebarLayout>
  );
}
