import { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MapboxGeoCoverageMap from "@/components/MapboxGeoCoverageMap";
import { Doughnut, Bar, Chart } from "react-chartjs-2";
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
  TooltipItem,
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

interface Organization {
  _id: string;
  name: string;
  organizationName?: string;
  keywords?: string[];
  competitors?: string[];
  [key: string]: unknown;
}

interface MediaArticle {
  _id: string;
  title?: string;
  headline?: string;
  mention?: string;
  source?: string;
  publication?: string;
  station?: string;
  matched_keywords?: string[];
  publication_date?: string;
  publicationDate?: string;
  mentionDT?: string;
  sentiment?: string;
  reach?: number;
  ave?: number;
  country?: string;
  [key: string]: unknown;
}

interface FacebookPost {
  _id: string;
  source?: string;
  date?: string;
  createdAt?: string;
  country?: string;
  reach?: number;
  [key: string]: unknown;
}

interface CountOverTimeItem {
  _id?: string;
  date?: string;
  contentType: string;
  count: number;
}

interface KeywordDistributionItem {
  count: number;
  sources: string[];
}

interface KeywordDistribution {
  [keyword: string]: KeywordDistributionItem;
}

interface WordCloudData {
  keywords: Array<{ text: string; value: number }>;
}

interface SentimentCounts {
  Positive?: number;
  Neutral?: number;
  Negative?: number;
  Mixed?: number;
}

interface StationData {
  station: string;
  total: number;
  sentimentCounts: SentimentCounts;
}

interface BroadcastInsightData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
  }>;
}

interface JournalistChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
  }>;
}

interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderColor: string | string[];
    borderWidth: number;
    borderRadius?: number;
    spacing?: number;
  }>;
}

interface ChartTooltipItem {
  label: string;
  raw: unknown;
  formattedValue: string;
  dataset: {
    label: string;
  };
}

type ContentType = "posts" | "articles" | "broadcast" | "printMedia";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentType>("posts");
  const [granularity, setGranularity] = useState("month");
  const [totalArticles, setTotalArticles] = useState(0);
  const [monthlyMentions, setMonthlyMentions] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0); // Now represents total AVE
  const [totalKeywords, setTotalKeywords] = useState(0); // Now represents active topics count
  const [yearTrend, setYearTrend] = useState<'increase' | 'decrease' | 'same'>('same');
  const [monthTrend, setMonthTrend] = useState<'increase' | 'decrease' | 'same'>('same');
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [organizationData, setOrganizationData] = useState<Organization | null>(
    null
  );
  const [articles, setArticles] = useState<MediaArticle[]>([]);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [broadcastArticles, setBroadcastArticles] = useState<MediaArticle[]>(
    []
  );
  const [printArticles, setPrintArticles] = useState<MediaArticle[]>([]);
  const [countOverTimeData, setCountOverTimeData] = useState<
    CountOverTimeItem[]
  >([]);
  const [broadcastOverTimeData, setBroadcastOverTimeData] = useState<
    CountOverTimeItem[]
  >([]);
  const [printOverTimeData, setPrintOverTimeData] = useState<
    CountOverTimeItem[]
  >([]);
  const [keywordDistribution, setKeywordDistribution] =
    useState<KeywordDistribution>({});
  const [wordCloudData, setWordCloudData] = useState<WordCloudData | null>(
    null
  );
  const [geoCountryCounts, setGeoCountryCounts] = useState<
    Record<string, number>
  >({});
  const [journalistChart, setJournalistChart] =
    useState<JournalistChartData | null>(null);
  const [broadcastInsightsData, setBroadcastInsightsData] =
    useState<BroadcastInsightData | null>(null);
  const [otherStations, setOtherStations] = useState<StationData[]>([]);
  const [otherStationNames, setOtherStationNames] = useState<string[]>([]);
  const [otherPrintSources, setOtherPrintSources] = useState<string[]>([]);
  const [otherOnlineSources, setOtherOnlineSources] = useState<string[]>([]);

  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg = localStorage.getItem("selectedOrg");
  const orgId =
    user?.role === "super_admin" ? selectedOrg : user?.organizationId;

  const normalizedContentType = contentType;

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

  const [pieData, setPieData] = useState<PieChartData>({
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

        const [articlesRes, postsRes, broadcastRes, printRes] =
          await Promise.allSettled([
            axios.get(`${orgUrl}/articles`),
            axios.get(`${orgUrl}/posts`),
            axios.get(
              `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${selectedOrg}/broadcastMedia`
            ),
            axios.get(
              `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${selectedOrg}/printMedia`
            ),
          ]);

        if (articlesRes.status === "fulfilled") {
          const articlesData = articlesRes.value.data.articles || [];
          console.log("=== ARTICLES API Response ===");
          console.log("Total articles:", articlesData.length);
          if (articlesData.length > 0) {
            console.log("First article sample:", articlesData[0]);
          console.log("Countries in first 10 articles:", 
            articlesData.slice(0, 10).map((a: MediaArticle) => a.country)
            );
          }
          setArticles(articlesData);
        }
        if (postsRes.status === "fulfilled") {
          const postsData = postsRes.value.data.posts || [];
          console.log("=== POSTS API Response ===");
          console.log("Total posts:", postsData.length);
          if (postsData.length > 0) {
            console.log("First post sample:", postsData[0]);
          console.log("Countries in first 10 posts:", 
            postsData.slice(0, 10).map((p: FacebookPost) => p.country)
            );
          }
          setFacebookPosts(postsData);
        }
        if (broadcastRes.status === "fulfilled") {
          const broadcastData = broadcastRes.value.data || [];
          console.log("=== BROADCAST API Response ===");
          console.log("Total broadcast:", broadcastData.length);
          if (broadcastData.length > 0) {
            console.log("First broadcast sample:", broadcastData[0]);
          console.log("Countries in first 10 broadcast:", 
            broadcastData.slice(0, 10).map((b: MediaArticle) => b.country)
            );
          }
          setBroadcastArticles(broadcastData);
        }
        if (printRes.status === "fulfilled") {
          const printData = printRes.value.data || [];
          console.log("=== PRINT API Response ===");
          console.log("Total print:", printData.length);
          if (printData.length > 0) {
            console.log("First print sample:", printData[0]);
          console.log("Countries in first 10 print:", 
            printData.slice(0, 10).map((p: MediaArticle) => p.country)
            );
          }
          setPrintArticles(printData);
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

  useEffect(() => {
    type GeoItem = {
      country?: string;
      location?: string;
      geo?: string;
      [key: string]: unknown;
    };

    // Filter by selected content type
    let sourceData: GeoItem[] = [];

    if (contentType === "posts") {
      sourceData = facebookPosts;
    } else if (contentType === "articles") {
      sourceData = articles;
    } else if (contentType === "broadcast") {
      sourceData = broadcastArticles;
    } else if (contentType === "printMedia") {
      sourceData = printArticles;
    }

    console.log(`=== ${contentType} Geographic Data ===`);
    console.log("Total items:", sourceData.length);
    if (sourceData.length > 0) {
      console.log("First item sample:", sourceData[0]);
      console.log("Country value:", sourceData[0].country);
    }

    // Aggregate country counts from selected content type
    const counts = sourceData.reduce<Record<string, number>>((acc, item) => {
      if (!item.country) return acc;

      // Normalize country names (title case)
      const formattedCountry = String(item.country)
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      acc[formattedCountry] = (acc[formattedCountry] ?? 0) + 1;
      return acc;
    }, {});

    console.log(`${contentType} - Geo Coverage Counts:`, counts);
    console.log(`${contentType} - Items with country data:`, 
      sourceData.filter(item => item.country).length
    );
    console.log("Unique countries:", Object.keys(counts).length);
    
    setGeoCountryCounts(counts);
  }, [contentType, facebookPosts, articles, broadcastArticles, printArticles]);


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

        const stationTotals = insights.map((item: StationData) => ({
          station: item.station,
          total: sentimentTypes.reduce(
            (sum, type) => sum + (item.sentimentCounts?.[type] || 0),
            0
          ),
          sentimentCounts: item.sentimentCounts,
        }));

        const topN = 15;
        const sorted = stationTotals.sort((a, b) => b.total - a.total);
        const topStations = sorted.slice(0, topN);
        const otherStations = sorted.slice(topN);

        const labels = [...topStations.map((s) => s.station), "Others"];

        const datasets = sentimentTypes.map((type) => {
          const topData = topStations.map(
            (s) => s.sentimentCounts?.[type] || 0
          );

          const othersTotal = otherStations.reduce(
            (sum: number, s) => sum + (s.sentimentCounts?.[type] || 0),
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
        setOtherStationNames(otherStations.map((s) => s.station));
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
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Card 1: Total Mentions (all time for current content type)
    const allData = [
      ...articles.map(a => ({ 
        date: a.publication_date || a.publicationDate || a.mentionDT, 
        type: 'articles' as const,
        ave: (a.ave as number) || 0 
      })),
      ...facebookPosts.map(p => ({ 
        date: p.date || p.createdAt, 
        type: 'posts' as const,
        ave: (p.ave as number) || 0
      })),
      ...broadcastArticles.map(b => ({ 
        date: b.publication_date || b.publicationDate || b.mentionDT, 
        type: 'broadcast' as const,
        ave: (b.ave as number) || 0
      })),
      ...printArticles.map(p => ({ 
        date: p.publication_date || p.publicationDate || p.mentionDT, 
        type: 'printMedia' as const,
        ave: (p.ave as number) || 0
      }))
    ];

    // Filter by current content type
    const currentTypeData = allData.filter(d => d.type === contentType);
    const total = currentTypeData.length;
    setTotalArticles(total);

    // Calculate year-over-year trend for Card 1
    const currentYearCount = currentTypeData.filter(d => {
      const date = new Date(d.date);
      return date.getFullYear() === currentYear;
    }).length;

    const previousYearCount = currentTypeData.filter(d => {
      const date = new Date(d.date);
      return date.getFullYear() === currentYear - 1;
    }).length;

    const yearTrend = currentYearCount > previousYearCount ? 'increase' : 
                     currentYearCount < previousYearCount ? 'decrease' : 'same';

    // Card 2: This Month Mentions
    const thisMonthCount = currentTypeData.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    setMonthlyMentions(thisMonthCount);

    // Calculate month-over-month trend for Card 2
    const lastMonthCount = currentTypeData.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    const monthTrend = thisMonthCount > lastMonthCount ? 'increase' : 
                      thisMonthCount < lastMonthCount ? 'decrease' : 'same';

    // Card 3: All Active Topics/Keywords from organization
    const activeTopics = organizationData?.keywords || [];
    setTotalKeywords(activeTopics.length);

    // Card 4: Total AVE for current content type only
    const totalAVE = currentTypeData.reduce((sum, item) => sum + item.ave, 0);
    setTotalTopics(Math.round(totalAVE));

    // Store trends in state
    setYearTrend(yearTrend);
    setMonthTrend(monthTrend);
  }, [
    contentType,
    articles,
    facebookPosts,
    broadcastArticles,
    printArticles,
    organizationData,
  ]);

  // Process keyword distribution
  useEffect(() => {
    if (articles.length > 0) {
      const keywordMap: Record<
        string,
        { count: number; sources: Set<string> }
      > = {};

      articles.forEach((article) => {
        article.matched_keywords?.forEach((keyword: string) => {
          if (!keywordMap[keyword]) {
            keywordMap[keyword] = { count: 0, sources: new Set() };
          }
          keywordMap[keyword].count += 1;
          if (article.source) {
            keywordMap[keyword].sources.add(article.source);
          }
        });
      });

      const finalKeywordMap: KeywordDistribution = {};
      Object.keys(keywordMap).forEach((key) => {
        finalKeywordMap[key] = {
          count: keywordMap[key].count,
          sources: Array.from(keywordMap[key].sources),
        };
      });

      setKeywordDistribution(finalKeywordMap);
    }
  }, [articles]);

  // Generate pie chart data based on content type
  useEffect(() => {
    // Social Media Posts
    if (contentType === "posts") {
      const sourceMap: Record<string, number> = {};

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
        (a, b) => b[1].count - a[1].count
      );

      const topN = 7;
      const topKeywords = sorted.slice(0, topN);
      const otherKeywords = sorted.slice(topN);

      const labels = [
        ...topKeywords.map(([k]) => k),
        ...(otherKeywords.length > 0 ? ["Others"] : []),
      ];
      const data = [
        ...topKeywords.map(([_, obj]) => obj.count),
        ...(otherKeywords.length > 0
          ? [otherKeywords.reduce((sum, [_, obj]) => sum + obj.count, 0)]
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
      const sourceMap: Record<string, number> = {};

      printArticles.forEach((article) => {
        const source = article.publication || "Unknown Publication";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      });

      const sorted = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);
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
          ? [other.reduce((sum, [_, c]) => sum + (c as number), 0)]
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
          label: function (tooltipItem: TooltipItem<"doughnut">) {
            const label = tooltipItem.label;
            const value = tooltipItem.raw;
            return `${label}: ${
              typeof value === "number" ? value.toLocaleString() : value
            }`;
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
          label: (tooltipItem: TooltipItem<"bar">) =>
            `${tooltipItem.raw} items in ${
              tooltipItem.dataset.label?.split(" ")[2] || ""
            }`,
        },
      },
      datalabels: {
        display: false,
      },
    },
    animation: { duration: 10 },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          usePointStyle: true,
          pointStyle: "circle" as const,
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
          font: {
            size: 13,
            family: "Raleway",
            weight: "bold" as const,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<"bar" | "line">) => {
            const label = tooltipItem.dataset.label || "";
            const value = tooltipItem.raw;
            return `${label}: ${
              typeof value === "number" ? value.toLocaleString() : value
            }`;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "Raleway",
            size: 11,
          },
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
        },
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Volume",
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          font: {
            size: 12,
            family: "Raleway",
            weight: "bold" as const,
          },
        },
        grid: {
          color: "rgba(200, 200, 200, 0.2)",
          drawOnChartArea: true,
        },
        ticks: {
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          font: {
            family: "Raleway",
            size: 11,
          },
        },
      },
      y2: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Reach / AVE",
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          font: {
            size: 12,
            family: "Raleway",
            weight: "bold" as const,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: theme === "light" ? "#7a7a7a" : "#ffffffd2",
          font: {
            family: "Raleway",
            size: 11,
          },
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
      contentType,
      facebookPosts,
      articles,
      broadcastArticles,
      broadcastOverTimeData,
      printArticles,
      printOverTimeData,
    ),
  };

  useEffect(() => {
    const fetchBroadcastTimeline = async () => {
      if (!selectedOrg) return;

      try {
        const res = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/analytics/${selectedOrg}/timeline?mediaType=broadcast`
        );

        const processed = res.data.map((item) => ({
          date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        }));

        setBroadcastOverTimeData(processed);
      } catch (error) {
        console.error("Error fetching broadcast timeline data:", error);
      }
    };

    fetchBroadcastTimeline();
  }, [selectedOrg]);

  useEffect(() => {
    const fetchPrintTimeline = async () => {
      if (!selectedOrg) return;

      try {
        const res = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/analytics/${selectedOrg}/timeline?mediaType=print`
        );

        const processed = res.data.map((item) => ({
          date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        }));

        setPrintOverTimeData(processed);
      } catch (error) {
        console.error("Error fetching print timeline data:", error);
      }
    };

    fetchPrintTimeline();
  }, [selectedOrg]);

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
            <Select
              value={contentType}
              onValueChange={(v: ContentType) => setContentType(v)}
            >
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
            {/* <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-[140px] bg-background border-input rounded-xl h-auto py-2.5 px-4 font-medium">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>

        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Mentions (All Time) */}
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
                    <p>Total mentions over all years</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">
                  {totalArticles.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-primary-foreground/10">
                    {yearTrend === 'increase' && <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />}
                    {yearTrend === 'decrease' && <TrendingDown className="h-3.5 w-3.5 text-primary-foreground" />}
                    {yearTrend === 'same' && <Minus className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-primary-foreground/80">
                    {yearTrend === 'increase' && 'Increased from last year'}
                    {yearTrend === 'decrease' && 'Decreased from last year'}
                    {yearTrend === 'same' && 'Same as last year'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: This Month */}
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
                    {monthTrend === 'increase' && <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
                    {monthTrend === 'decrease' && <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    {monthTrend === 'same' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {monthTrend === 'increase' && 'Increased from last month'}
                    {monthTrend === 'decrease' && 'Decreased from last month'}
                    {monthTrend === 'same' && 'Same as last month'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Active Topics/Keywords */}
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
                    <p>Tracked keywords and topics</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Social
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Broadcast
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Print
                  </Badge>
                </div>
              </div>
            </div>

            {/* Card 4: Total AVE */}
            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Total AVE</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Advertising Value Equivalent for selected media type</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-3xl font-bold">
                  {totalTopics.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {contentType === 'posts' && 'Social Media'}
                    {contentType === 'articles' && 'Online Articles'}
                    {contentType === 'broadcast' && 'Broadcast Media'}
                    {contentType === 'printMedia' && 'Print Media'}
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
                  {contentType === "articles" &&
                    "Online Articles Over the Years"}
                  {contentType === "broadcast" &&
                    "Broadcast Mentions Over the Years"}
                  {contentType === "printMedia" &&
                    "Print Media Articles Over the Years"}
                </CardTitle>
                <CardDescription>
                  Historical trend of mentions over the past years
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <Bar data={dynamicBarData} options={barOptions} />
              </CardContent>
            </Card>

            {/* Content Volume Chart */}
            {((contentType === "printMedia" && printOverTimeData.length > 0) ||
              (contentType === "broadcast" && broadcastOverTimeData.length > 0) ||
              (contentType !== "printMedia" && contentType !== "broadcast" && countOverTimeData.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Content Volume per Reach & AVE</CardTitle>
                  <CardDescription>
                    Tracking media content volume over time with reach and
                    AVE metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <Chart
                    type="bar"
                    data={generateCountOverTimeChartData(
                      contentType === "printMedia" 
                        ? printOverTimeData 
                        : contentType === "broadcast"
                        ? broadcastOverTimeData
                        : countOverTimeData,
                      contentType,
                      granularity
                    )}
                    options={chartOptions}
                  />
                </CardContent>
              </Card>
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
                      words={wordCloudData.keywords.map((k) => ({
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
            {contentType !== "printMedia" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {contentType === "posts" && "Mentions Composition by Source"}
                    {contentType === "articles" && "Top Keyword Trends Online"}
                    {contentType === "broadcast" &&
                      "Sentiment Breakdown by Station"}
                  </CardTitle>
                  <CardDescription>
                    Distribution of mentions across different sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {contentType === "broadcast" ? (
                    broadcastInsightsData?.datasets?.length &&
                    broadcastInsightsData?.datasets[0]?.data?.some(
                      (v: number) => v > 0
                    ) ? (
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
                                color:
                                  theme === "light" ? "#7a7a7a" : "#ffffffd2",
                                usePointStyle: true,
                                pointStyle: "circle",
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: function (
                                  tooltipItem: TooltipItem<"bar">
                                ) {
                                  return `${tooltipItem.dataset.label}: ${
                                    typeof tooltipItem.raw === "number"
                                      ? tooltipItem.raw.toLocaleString()
                                      : tooltipItem.raw
                                  }`;
                                },
                              },
                            },
                            datalabels: {
                              display: false,
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
                                color:
                                  theme === "light" ? "#7a7a7a" : "#ffffffd2",
                              },
                              ticks: {
                                font: { family: "Raleway" },
                                color:
                                  theme === "light" ? "#7a7a7a" : "#ffffffd2",
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
                                color:
                                  theme === "light" ? "#7a7a7a" : "#ffffffd2",
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
            )}

            {/* Top Journalists Chart for Print Media */}
            {contentType === "printMedia" &&
              journalistChart &&
              journalistChart.labels?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Top 15 Journalists by Volume and Tonality
                    </CardTitle>
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
                              color:
                                theme === "light" ? "#7a7a7a" : "#ffffffd2",
                              usePointStyle: true,
                              pointStyle: "circle",
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: (tooltipItem: TooltipItem<"bar">) =>
                                `${tooltipItem.dataset.label}: ${
                                  typeof tooltipItem.raw === "number"
                                    ? tooltipItem.raw.toLocaleString()
                                    : tooltipItem.raw
                                }`,
                            },
                          },
                          datalabels: {
                            display: false,
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
                              color:
                                theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            ticks: {
                              font: {
                                family: "Raleway",
                                size: 13,
                                weight: "normal",
                              },
                              color:
                                theme === "light" ? "#7a7a7a" : "#ffffffd2",
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
                              color:
                                theme === "light" ? "#7a7a7a" : "#ffffffd2",
                            },
                            ticks: {
                              stepSize: 1,
                              font: { family: "Raleway" },
                              color:
                                theme === "light" ? "#7a7a7a" : "#ffffffd2",
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
              )}
          </TabsContent>

          <TabsContent value="geography" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Coverage</CardTitle>
                <CardDescription>
                  Distribution of mentions for {contentType === "printMedia" ? "Print Media" : contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <MapboxGeoCoverageMap
                  countryCounts={geoCountryCounts}
                  showTitle={false}
                  containerStyle={{ width: "100%", height: "100%" }}
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
            organizationName={
              (organizationData as Organization | null)?.organizationName ||
              (organizationData as Organization | null)?.name ||
              "Organization"
            }
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
