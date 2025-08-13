/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import "chart.js/auto";
import { Line, Pie } from "react-chartjs-2";
import {
  FaChartBar,
  FaRegCalendarAlt,
  FaKey,
  FaRegListAlt,
  FaEllipsisV,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { LuCalendarDays } from "react-icons/lu";
import { Player } from "@lottiefiles/react-lottie-player";
import { IoInformationCircle } from "react-icons/io5";
import { TfiReload } from "react-icons/tfi";
import "../CSS/Dashboard.css";
import "../App.css";
import { LuThumbsDown, LuThumbsUp } from "react-icons/lu";
import { ImConfused } from "react-icons/im";
import { MdOutlineSentimentNeutral } from "react-icons/md";
import { FaAngleDown } from "react-icons/fa6";
import { toast } from "sonner";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart } from "chart.js";
// import Header from "../Components/Header";
// import loadingAnimation from "../lottie/loading.json";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ThemeContext } from "@/components/ThemeContext";
// import CountryModal from "../Components/CountryModal";
// import "../CSS/CountryModal.css";

// Placeholder implementations for missing utilities
const fetchOrganizationData = () => {};
const fetchBroadcastArticles = () => {};
const fetchPrintMediaArticles = () => {};
const fetchArticles = () => {};
const handleDelete = () => {};
const handleSearchQuery = () => {};
const filterByDateRange = (items: any[], field: string, start: Date | null, end: Date | null) => items;
const confirmSentimentUpdate = () => {};
const mapSentimentToLabel = () => {};
const handleSentimentChange = () => {};
const confirmCountryUpdate = () => {};
const getScreenConfig = () => ({ chartWidth: 400, chartHeight: 300, legendPosition: 'top' });
const fetchCountries = () => Promise.resolve([]);
const handleScrape = () => {};
const handleSentimentEdit = () => {};
const handleMenuClick = () => {};
const handleCountryEdit = () => {};
const handleSentimentCancel = () => {};
const generateLogoUrl = () => {};
const generateLineData = () => ({ datasets: [], labels: [] });
const getGradient = () => {};
const generatePieChartData = () => ({ datasets: [], labels: [] });
const generatePieChartOptions = () => ({});

// Placeholder components
const Header = ({ userName, userRole, onSearch }: any) => (
  <div>Dashboard Header - {userName}</div>
);

const CountryModal = ({ isOpen, onClose, children }: any) => 
  isOpen ? <div>{children}</div> : null;

// Type definitions
interface User {
  firstName: string;
  lastName: string;
  role: "super_admin" | "org_admin" | "user";
  organizationId?: string;
}

interface Organization {
  _id: string;
  alias: string;
  organizationName: string;
  keywords?: string[];
}

interface OrganizationData {
  organization: Organization;
}

interface Article {
  _id: string;
  source: string;
  title: string;
  url: string;
  snippet?: string;
  publication_date: string;
  country?: string;
  sentiment?: "positive" | "negative" | "neutral";
  ave?: number;
  rank?: number;
  reach?: number;
  logo_url?: string;
  matched_keywords?: string[];
}

interface FacebookPost {
  _id: string;
  createdTime: string;
  [key: string]: any;
}

interface BroadcastArticle {
  _id: string;
  mentionDT: string;
  [key: string]: any;
}

interface PrintMediaArticle {
  _id: string;
  publicationDate: string;
  [key: string]: any;
}

interface EditingSource {
  articleId: string;
  value: string;
}

interface EditingSentiment {
  articleId: string;
  value: "positive" | "negative" | "neutral";
}

interface EditingCountry {
  articleId: string;
}

interface MenuPosition {
  x: number;
  y: number;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }>;
}

interface KeywordDistribution {
  [keyword: string]: {
    count: number;
    sources: string[];
  };
}

type SortOrder = "ascending" | "descending" | "";
type TooltipType = "totalArticles" | "monthlyArticles" | "totalKeywords" | "totalTopics" | null;

Chart.register(ChartDataLabels);

function Dashboard(): JSX.Element {
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg: string | null = localStorage.getItem("selectedOrg");
  const orgId: string | null = localStorage.getItem("selectedOrgId");
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [scraping, setScraping] = useState<boolean>(false);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [totalPostsAndArticles, setTotalPostsAndArticles] = useState<number>(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [monthlyMentions, setMonthlyMentions] = useState<number>(0);
  const [totalArticles, setTotalArticles] = useState<number>(0);
  const [editingSource, setEditingSource] = useState<EditingSource | null>(null);
  const [totalKeywords, setTotalKeywords] = useState<number>(0);
  const [editingSentiment, setEditingSentiment] = useState<EditingSentiment | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FacebookPost[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [keywordDistribution, setKeywordDistribution] = useState<KeywordDistribution>({});
  const [printMediaArticles, setPrintMediaArticles] = useState<PrintMediaArticle[]>([]);
  const [filteredPrintMediaArticles, setFilteredPrintMediaArticles] = useState<PrintMediaArticle[]>([]);
  const [broadcastArticles, setBroadcastArticles] = useState<BroadcastArticle[]>([]);
  const [filteredBroadcastArticles, setFilteredBroadcastArticles] = useState<BroadcastArticle[]>([]);
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const [totalTopics, setTotalTopics] = useState<number>(0);
  const [infoTooltip, setInfoTooltip] = useState<TooltipType>(null);
  const token: string | null = localStorage.getItem("token");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [editingCountry, setEditingCountry] = useState<EditingCountry | null>(null);
  const [sourceCountryMap, setSourceCountryMap] = useState<Record<string, string>>({});
  const [isCountryModalOpen, setIsCountryModalOpen] = useState<boolean>(false);
  const currentArticleId: string | undefined = editingCountry?.articleId;

  // Shared sort states
  const [articleSortOrder, setArticleSortOrder] = useState<SortOrder>("descending");
  const [postSortOrder, setPostSortOrder] = useState<SortOrder>("descending");
  const [broadcastSortOrder, setBroadcastSortOrder] = useState<SortOrder>("descending");
  const [printSortOrder, setPrintSortOrder] = useState<SortOrder>("descending");

  // Shared sort ave states
  const [articleAveSortOrder, setArticleAveSortOrder] = useState<SortOrder>("");
  const [postAveSortOrder, setPostAveSortOrder] = useState<SortOrder>("");
  const [broadcastAveSortOrder, setBroadcastAveSortOrder] = useState<SortOrder>("");
  const [printAveSortOrder, setPrintAveSortOrder] = useState<SortOrder>("");

  // Shared sort reach states
  const [articleReachSortOrder, setArticleReachSortOrder] = useState<SortOrder>("");
  const [postReachSortOrder, setPostReachSortOrder] = useState<SortOrder>("");

  // Shared sort rank states
  const [articleRankSortOrder, setArticleRankSortOrder] = useState<SortOrder>("");
  const [postRankSortOrder, setPostRankSortOrder] = useState<SortOrder>("");

  const [menuOnlineArticleId, setMenuOnlineArticleId] = useState<string | null>(null);
  const [menuSocialPostId, setMenuSocialPostId] = useState<string | null>(null);
  const [menuBroadcastId, setMenuBroadcastId] = useState<string | null>(null);
  const [menuPrintArticleId, setMenuPrintArticleId] = useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });

  const { chartWidth, chartHeight, legendPosition } = getScreenConfig();

  const [pieData, setPieData] = useState<ChartData>({
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

  // For articles
  useEffect(() => {
    setFilteredArticles(
      filterByDateRange(articles, "publication_date", startDate, endDate)
    );
  }, [startDate, endDate, articles]);

  // For broadcast
  useEffect(() => {
    setFilteredBroadcastArticles(
      filterByDateRange(broadcastArticles, "mentionDT", startDate, endDate)
    );
  }, [startDate, endDate, broadcastArticles]);

  // For print media
  useEffect(() => {
    setFilteredPrintMediaArticles(
      filterByDateRange(
        printMediaArticles,
        "publicationDate",
        startDate,
        endDate
      )
    );
  }, [startDate, endDate, printMediaArticles]);

  useEffect(() => {
    if (!user) return;
    
    const orgId =
      user.role === "super_admin" ? selectedOrg : user.organizationId;
    if (orgId) {
      fetchOrganizationData(
        orgId,
        setOrganizationData,
        setTotalKeywords,
        setError,
        navigate
      );
    }
  }, []);

  // Process keyword distribution
  useEffect(() => {
    if (articles.length > 0) {
      const selectedMonth = startDate
        ? new Date(startDate).getMonth()
        : new Date().getMonth();
      const selectedYear = startDate
        ? new Date(startDate).getFullYear()
        : new Date().getFullYear();

      const keywordMap: KeywordDistribution = {};

      articles.forEach((article) => {
        const articleDate = new Date(article.publication_date);
        if (
          Array.isArray(article.matched_keywords) &&
          articleDate.getMonth() === selectedMonth &&
          articleDate.getFullYear() === selectedYear
        ) {
          article.matched_keywords.forEach((keyword) => {
            if (!keywordMap[keyword]) {
              keywordMap[keyword] = { count: 0, sources: new Set() as any };
            }
            keywordMap[keyword].count += 1;
            (keywordMap[keyword].sources as any).add(article.source);
          });
        }
      });

      Object.keys(keywordMap).forEach((key) => {
        keywordMap[key].sources = Array.from(keywordMap[key].sources as any);
      });

      setKeywordDistribution(keywordMap);
    }
  }, [articles, startDate]);

  useEffect(() => {
    fetchCountries().then((data: string[]) => {
      console.log("Fetched countries", data);
      setCountries(data);
    });
  }, []);

  // Pie chart data preparation
  useEffect(() => {
    const chartCanvas = document.createElement("canvas");
    const ctx = chartCanvas.getContext("2d");
    const newPieData = generatePieChartData(
      keywordDistribution,
      getGradient,
      ctx
    );
    setPieData(newPieData);
  }, [keywordDistribution]);

  // Pie chart options
  const pieOptions = generatePieChartOptions(
    pieData,
    keywordDistribution,
    theme,
    legendPosition
  );

  // Generate dataset for the current year
  const currentYear = new Date().getFullYear();

  // Initialize arrays to hold counts for each category
  const onlineArticlesByMonth = new Array(12).fill(0);
  const socialMediaPostsByMonth = new Array(12).fill(0);
  const broadcastArticlesByMonth = new Array(12).fill(0);
  const printArticlesByMonth = new Array(12).fill(0);

  // Count the number of articles/posts per month
  articles.forEach((article) => {
    const articleDate = new Date(article.publication_date);
    if (articleDate.getFullYear() === currentYear) {
      onlineArticlesByMonth[articleDate.getMonth()] += 1;
    }
  });

  facebookPosts.forEach((post) => {
    const postDate = new Date(post.createdTime);
    if (postDate.getFullYear() === currentYear) {
      socialMediaPostsByMonth[postDate.getMonth()] += 1;
    }
  });

  broadcastArticles.forEach((article) => {
    const articleDate = new Date(article.mentionDT);
    if (articleDate.getFullYear() === currentYear) {
      broadcastArticlesByMonth[articleDate.getMonth()] += 1;
    }
  });

  printMediaArticles.forEach((article) => {
    const articleDate = new Date(article.publicationDate);
    if (articleDate.getFullYear() === currentYear) {
      printArticlesByMonth[articleDate.getMonth()] += 1;
    }
  });

  // Create the dataset for the line graph
  const lineData = generateLineData(
    articles,
    facebookPosts,
    broadcastArticles,
    printMediaArticles
  );

  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "Raleway" },
          color: theme === "light" ? "#7a7a7a" : "#fff",
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 200,
        stepSize: 200,
        grid: { color: "rgba(200, 200, 200, 0.2)" },
        ticks: {
          font: { family: "Raleway" },
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
          font: {
            family: "Raleway",
            size: 13,
            weight: 500,
          },
          color: theme === "light" ? "#7a7a7a" : "#fff",
          paddingBottom: 25,
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.raw} Articles`,
        },
      },
      datalabels: { display: false },
    },
    animation: { duration: 1000 },
  };

  const hasFetched = useRef<boolean>(false);

  useEffect(() => {
    if (selectedOrg) {
      fetchBroadcastArticles(
        selectedOrg,
        setBroadcastArticles,
        setFilteredBroadcastArticles,
        setLoading
      );
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedOrg) {
      fetchPrintMediaArticles(
        selectedOrg,
        setPrintMediaArticles,
        setFilteredPrintMediaArticles,
        setLoading
      );
    }
  }, [selectedOrg]);

  useEffect(() => {
    const fetchOrgData = async (): Promise<void> => {
      if (hasFetched.current || !user) return;

      try {
        const orgId =
          user.role === "super_admin"
            ? selectedOrg || localStorage.getItem("selectedOrg")
            : user.organizationId;

        if (!orgId) {
          throw new Error("No organization selected.");
        }

        const response = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const orgData = response.data;
        setOrganizationData(orgData);

        const totalKeywordsCount = orgData.organization.keywords?.length || 0;
        setTotalKeywords(totalKeywordsCount);

        hasFetched.current = true;
      } catch (error: any) {
        console.error("Error fetching organization data:", error.message);
        setError("Failed to load organization data.");
        toast.error("Failed to fetch organization data. Please try again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === "super_admin" || user.role === "org_admin")) {
      fetchOrgData();
    }
  }, []);

  // Use fetchArticles inside useEffect
  useEffect(() => {
    if (selectedOrg) {
      fetchArticles(
        selectedOrg,
        sourceCountryMap,
        setArticles,
        setDisplayedArticles,
        setTotalArticles,
        setMonthlyMentions,
        setError,
        setLoading
      );
    }
  }, [selectedOrg, sourceCountryMap]);

  // Fetch Facebook posts
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const orgUrl = `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}`;
        const [orgResponse, articlesResponse, postsResponse] =
          await Promise.all([
            axios.get(orgUrl),
            axios.get(`${orgUrl}/articles`),
            axios.get(`${orgUrl}/posts`),
          ]);

        setOrganizationData(orgResponse.data);
        setArticles(articlesResponse.data.articles || []);
        setFacebookPosts(postsResponse.data.posts || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    if (selectedOrg) fetchData();
  }, [selectedOrg, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Element;
      if (
        !target.closest(".menu-options-floating") &&
        !target.closest(".icon-button")
      ) {
        setMenuOnlineArticleId(null);
        setMenuSocialPostId(null);
        setMenuBroadcastId(null);
        setMenuPrintArticleId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (editingSentiment && !target.closest(".sentiment-popup")) {
        setEditingSentiment(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingSentiment]);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    handleSearchQuery(
      query,
      articles,
      facebookPosts,
      broadcastArticles,
      printMediaArticles,
      setFilteredArticles,
      setFilteredPosts,
      setFilteredBroadcastArticles,
      setFilteredPrintMediaArticles
    );
  };

  const getSortIcon = (order: SortOrder) => {
    return order === "ascending" ? (
      <FaSortAmountDown />
    ) : order === "descending" ? (
      <FaSortAmountUp />
    ) : (
      <FaSortAmountUp style={{ opacity: 0.4 }} />
    );
  };

  // Sort handlers
  const handleArticleSort = (): void => {
    setArticleSortOrder((prev) =>
      prev === "ascending" ? "descending" : "ascending"
    );
    setArticleAveSortOrder("");
    setArticleReachSortOrder("");
    setArticleRankSortOrder("");
  };

  const handleArticleAveSort = (): void => {
    setArticleAveSortOrder((prev) =>
      prev === "ascending" ? "descending" : "ascending"
    );
    setArticleSortOrder("");
    setArticleReachSortOrder("");
    setArticleRankSortOrder("");
  };

  const handleArticleReachSort = (): void => {
    setArticleReachSortOrder((prev) =>
      prev === "ascending" ? "descending" : "ascending"
    );
    setArticleSortOrder("");
    setArticleAveSortOrder("");
    setArticleRankSortOrder("");
  };

  const handleArticleRankSort = (): void => {
    setArticleRankSortOrder((prev) =>
      prev === "ascending" ? "descending" : "ascending"
    );
    setArticleSortOrder("");
    setArticleAveSortOrder("");
    setArticleReachSortOrder("");
  };

  // Source editing handlers
  const handleSourceEdit = (articleId: string, currentSource: string): void => {
    setEditingSource({ articleId, value: currentSource });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditingSource((prev) => (prev ? { ...prev, value: e.target.value } : null));
  };

  const confirmSourceUpdate = async (articleId: string, newSource: string): Promise<void> => {
    if (
      window.confirm(
        `Are you sure you want to change the source to "${newSource}"?`
      )
    ) {
      try {
        const response = await axios.put(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles/${articleId}`,
          { newSource },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.status === 200) {
          setArticles((prevArticles) =>
            prevArticles.map((article) =>
              article._id === articleId
                ? { ...article, source: newSource }
                : article
            )
          );

          setDisplayedArticles((prevDisplayedArticles) =>
            prevDisplayedArticles.map((article) =>
              article._id === articleId
                ? { ...article, source: newSource }
                : article
            )
          );

          toast.success("Source updated successfully");
          setEditingSource(null);
        }
      } catch (error: any) {
        console.error("Error updating source:", error);
        toast.error("Failed to update source");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, articleId: string, newSource: string): void => {
    if (e.key === "Enter") {
      confirmSourceUpdate(articleId, newSource);
    }
  };

  const handleBlur = (): void => {
    setEditingSource(null);
  };

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div>
      {scraping && (
        <div className="loading-overlay">
          <Player
            autoplay
            loop
            src={loadingAnimation}
            style={{ height: "220px", width: "220px" }}
          />
        </div>
      )}

      <CountryModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
      >
        <h2 style={{ fontFamily: "Raleway" }}>Edit Country</h2>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          {countries.map((country, index) => (
            <option key={index} value={country}>
              {country}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            confirmCountryUpdate(
              currentArticleId,
              selectedCountry,
              selectedOrg,
              localStorage.getItem("token"),
              setArticles,
              setIsCountryModalOpen,
              setEditingCountry,
              toast
            );
          }}
          className="modalSave"
        >
          Save Changes
        </button>
      </CountryModal>

      <div className="container">
        <Header
          userName={`${user.firstName} ${user.lastName}`}
          userRole={user.role}
          onSearch={handleSearch}
        />
      </div>
      <div className="content">
        <h2>{organizationData?.organization?.alias}'s Dashboard</h2>
        <div className="holder">
          {/* Card Section */}
          <div className="grid">
            <div className="card">
              <FaChartBar className="card-icon" />
              <div
                className="tooltip-container"
                onMouseEnter={() => setInfoTooltip("totalArticles")}
                onMouseLeave={() => setInfoTooltip(null)}
              >
                <IoInformationCircle className="tool-icon" />
                {infoTooltip === "totalArticles" && (
                  <div className="tooltips">
                    Total number of online, social, broadcast and print articles
                    found over time.
                  </div>
                )}
              </div>
              <h4>Total Mentions Overtime</h4>
              <p>{totalArticles}</p>
            </div>

            <div className="card">
              <FaRegCalendarAlt className="card-icon" />
              <div
                className="tooltip-container"
                onMouseEnter={() => setInfoTooltip("monthlyArticles")}
                onMouseLeave={() => setInfoTooltip(null)}
              >
                <IoInformationCircle className="tool-icon" />
                {infoTooltip === "monthlyArticles" && (
                  <div className="tooltips">
                    Number of online, social, broadcast and print articles found
                    this month.
                  </div>
                )}
              </div>
              <h4>Total Mentions this Month</h4>
              <p>{monthlyMentions}</p>
            </div>

            <div className="card">
              <FaKey className="card-icon" />
              <div
                className="tooltip-container"
                onMouseEnter={() => setInfoTooltip("totalKeywords")}
                onMouseLeave={() => setInfoTooltip(null)}
              >
                <IoInformationCircle className="tool-icon" />
                {infoTooltip === "totalKeywords" && (
                  <div className="tooltips">
                    Total number of keyphrases matched across articles.
                  </div>
                )}
              </div>
              <h4>Total Keyphrases</h4>
              <p>{totalKeywords}</p>
            </div>

            <div className="card">
              <FaRegListAlt className="card-icon" />
              <div
                className="tooltip-container"
                onMouseEnter={() => setInfoTooltip("totalTopics")}
                onMouseLeave={() => setInfoTooltip(null)}
              >
                <IoInformationCircle className="tool-icon" />
                {infoTooltip === "totalTopics" && (
                  <div className="tooltips">
                    The number of different media types where this organization
                    was mentioned.
                  </div>
                )}
              </div>
              <h4>No. of Media Types</h4>
              <p>{totalTopics}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="charts">
            <div className="chart-container">
              <h3>This Month's Top Online Keyword Trends</h3>
              <div className="chartBg">
                <Pie
                  data={pieData}
                  options={pieOptions}
                  width={chartWidth}
                  height={chartHeight}
                />
              </div>
            </div>
            <div className="chart-container">
              <h3>
                Aggregated Media Mentions Across Platforms ({currentYear})
              </h3>
              <div className="chartBg">
                <Line
                  data={lineData}
                  options={lineOptions}
                  width={chartWidth}
                  height={chartHeight}
                />
              </div>
            </div>
          </div>

          <div className="newsArea">
            <h3 className="underline" style={{ fontSize: "25px" }}>
              Latest News
            </h3>

            <div className="table-controls">
              <div
                className="date-container"
                onClick={() => setIsCalendarOpen(true)}
              >
                <LuCalendarDays className="calendar-icon" />
                <span className="user-date">
                  {startDate && endDate
                    ? `${startDate.toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                      })} - ${endDate.toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                      })}`
                    : "Select Date"}
                </span>

                {(startDate || endDate) && (
                  <button
                    className="clear-dates-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDate(null);
                      setEndDate(null);
                      setFilteredArticles(articles);
                    }}
                  >
                    ✕
                  </button>
                )}

                {isCalendarOpen && (
                  <div style={{ position: "absolute", zIndex: 1000 }}>
                    <DatePicker
                      selected={startDate}
                      onChange={(dates) => {
                        const [start, end] = dates as [Date | null, Date | null];
                        setStartDate(start);
                        setEndDate(end);

                        if (start && end) {
                          setIsCalendarOpen(false);
                        }
                      }}
                      startDate={startDate}
                      endDate={endDate}
                      selectsRange
                      inline
                      showYearDropdown
                      scrollableYearDropdown
                      maxDate={new Date()}
                    />
                  </div>
                )}
              </div>

              {user.role === "super_admin" && (
                <div className="reload-button-container">
                  <button
                    className={`reload-button ${
                      scraping ? "scraping" : "active"
                    }`}
                    onClick={() => {
                      const orgName =
                        organizationData?.organization?.organizationName;
                      if (!orgName) {
                        toast.error(
                          "Organization name missing, cannot scrape."
                        );
                        return;
                      }

                      handleScrape(
                        orgName,
                        setScraping,
                        setArticles,
                        setFilteredArticles,
                        setDisplayedArticles,
                        setTotalArticles
                      );
                    }}
                    disabled={scraping}
                  >
                    {scraping ? (
                      "Scraping..."
                    ) : (
                      <>
                        <TfiReload /> Reload Articles{" "}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Table Section for Online Media Articles */}
            <h3 style={{ fontSize: "16px" }}>Online Articles</h3>
            <div className="section">
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <div className="table-container">
                  <table className="articles-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Title</th>
                        <th>Summary</th>
                        <th
                          onClick={handleArticleSort}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="header-with-icon">
                            Date Published {getSortIcon(articleSortOrder)}
                          </div>
                        </th>
                        <th>Country</th>
                        <th>Sentiment</th>
                        <th
                          onClick={handleArticleAveSort}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="header-with-icon">
                            AVE {getSortIcon(articleAveSortOrder)}
                          </div>
                        </th>
                        <th>Coverage Type</th>
                        <th
                          onClick={handleArticleRankSort}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="header-with-icon">
                            Rank {getSortIcon(articleRankSortOrder)}
                          </div>
                        </th>
                        <th
                          onClick={handleArticleReachSort}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="header-with-icon">
                            Reach {getSortIcon(articleReachSortOrder)}
                          </div>
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: "center" }}>
                            No articles found for this organization.
                          </td>
                        </tr>
                      ) : (
                        [...filteredArticles]
                          .slice(0, 8)
                          .sort((a, b) => {
                            if (articleRankSortOrder) {
                              const rankDiff = (a.rank || 0) - (b.rank || 0);
                              return articleRankSortOrder === "ascending"
                                ? rankDiff
                                : -rankDiff;
                            } else if (articleAveSortOrder) {
                              const aveDiff = (a.ave || 0) - (b.ave || 0);
                              return articleAveSortOrder === "ascending"
                                ? aveDiff
                                : -aveDiff;
                            } else if (articleReachSortOrder) {
                              const reachDiff = (a.reach || 0) - (b.reach || 0);
                              return articleReachSortOrder === "ascending"
                                ? reachDiff
                                : -reachDiff;
                            } else if (articleSortOrder) {
                              const dateDiff =
                                new Date(a.publication_date).getTime() -
                                new Date(b.publication_date).getTime();
                              return articleSortOrder === "ascending"
                                ? dateDiff
                                : -dateDiff;
                            }
                            return 0;
                          })
                          .map((article, index) => (
                            <tr key={index}>
                              <td>
                                <div
                                  className="table-source"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "start",
                                    gap: "8px",
                                  }}
                                >
                                  {article.logo_url && (
                                    <img
                                      className="logo-img"
                                      src={article.logo_url}
                                      alt={`${article.source} logo`}
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "1px solid",
                                        padding: "1px",
                                      }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      fontWeight: "600",
                                      cursor:
                                        user.role === "super_admin"
                                          ? "pointer"
                                          : "default",
                                    }}
                                    title={
                                      user.role === "super_admin"
                                        ? "Click to edit source"
                                        : ""
                                    }
                                    onClick={() =>
                                      user.role === "super_admin" &&
                                      handleSourceEdit(
                                        article._id,
                                        article.source
                                      )
                                    }
                                  >
                                    {editingSource &&
                                    editingSource.articleId === article._id ? (
                                      <input
                                        type="text"
                                        className="sourceInput"
                                        value={editingSource.value}
                                        onChange={handleSourceChange}
                                        onKeyDown={(e) =>
                                          handleKeyPress(
                                            e,
                                            article._id,
                                            editingSource.value
                                          )
                                        }
                                        onBlur={handleBlur}
                                        autoFocus
                                      />
                                    ) : (
                                      article.source
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="url">
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {article.title} ⤴
                                </a>
                              </td>
                              <td className="snippet">
                                "
                                {article.snippet
                                  ? `${article.snippet
                                      .replace(/^Summary:\s*/, "")
                                      .split(" ")
                                      .slice(0, 15)
                                      .join(" ")}...`
                                  : article.title}
                                "
                              </td>
                              <td style={{ fontWeight: "500" }}>
                                {new Date(
                                  article.publication_date
                                ).toLocaleDateString()}
                              </td>
                              <td
                                className="source_country"
                                onClick={() => {
                                  if (user.role === "super_admin") {
                                    handleCountryEdit(
                                      setEditingCountry,
                                      setIsCountryModalOpen,
                                      setSelectedCountry,
                                      article._id,
                                      article.country
                                    );
                                  }
                                }}
                                title={
                                  user.role === "super_admin"
                                    ? "Click to change country"
                                    : ""
                                }
                                style={{
                                  cursor:
                                    user.role === "super_admin"
                                      ? "pointer"
                                      : "default",
                                }}
                              >
                                {article.country || "Unknown"}
                              </td>
                              <td>
                                {editingSentiment &&
                                editingSentiment.articleId === article._id ? (
                                  user.role === "super_admin" ? (
                                    <div className="sentiment-popup">
                                      <h4>Modify Sentiment</h4>
                                      <form>
                                        <label>
                                          <input
                                            type="radio"
                                            value="positive"
                                            checked={
                                              editingSentiment.value ===
                                              "positive"
                                            }
                                            onChange={(e) =>
                                              handleSentimentChange(
                                                e,
                                                setEditingSentiment
                                              )
                                            }
                                          />
                                          Positive
                                        </label>
                                        <label>
                                          <input
                                            type="radio"
                                            value="neutral"
                                            checked={
                                              editingSentiment.value ===
                                              "neutral"
                                            }
                                            onChange={(e) =>
                                              handleSentimentChange(
                                                e,
                                                setEditingSentiment
                                              )
                                            }
                                          />
                                          Neutral
                                        </label>
                                        <label>
                                          <input
                                            type="radio"
                                            value="negative"
                                            checked={
                                              editingSentiment.value ===
                                              "negative"
                                            }
                                            onChange={(e) =>
                                              handleSentimentChange(
                                                e,
                                                setEditingSentiment
                                              )
                                            }
                                          />
                                          Negative
                                        </label>
                                      </form>
                                    </div>
                                  ) : null
                                ) : (
                                  <span>{article.sentiment || "Unknown"}</span>
                                )}
                              </td>
                              <td>{article.ave || 0}</td>
                              <td>Online</td>
                              <td>{article.rank || 0}</td>
                              <td>{article.reach || 0}</td>
                              <td></td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
