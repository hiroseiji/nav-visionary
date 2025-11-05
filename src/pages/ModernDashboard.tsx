import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaEllipsisV,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { LuCalendarDays } from "react-icons/lu";
import { Player } from "@lottiefiles/react-lottie-player";
import { IoInformationCircle } from "react-icons/io5";
import { TfiReload } from "react-icons/tfi";
import { LuThumbsDown, LuThumbsUp } from "react-icons/lu";
import { ImConfused } from "react-icons/im";
import { MdOutlineSentimentNeutral } from "react-icons/md";
import { FaAngleDown } from "react-icons/fa6";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "../components/Header";
import loadingAnimation from "../assets/loadingAnimation.json";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ThemeContext } from "../components/ThemeContext";
import CountryModal from "../components/CountryModal";
import { SidebarLayout } from "../components/SidebarLayout";
import { DashboardCharts } from "../components/dashboard/DashboardCharts";
import { ArticlesTable } from "../components/dashboard/ArticlesTable";
import {
  fetchOrganizationData,
  fetchBroadcastArticles,
  fetchPrintMediaArticles,
  fetchSocialPosts,
  fetchArticles,
  handleDelete,
  handleSearchQuery,
  filterByDateRange,
  confirmSentimentUpdate,
  handleSentimentChange,
  confirmCountryUpdate,
  fetchCountries,
  handleScrape,
  handleSentimentEdit,
  handleMenuClick,
  handleCountryEdit,
  handleSentimentCancel,
  generateLogoUrl,
  generateLineData,
  generatePieChartData,
  Article,
  FacebookPost,
  BroadcastArticle,
  PrintMediaArticle,
  OrganizationData,
} from "../utils/dashboardUtils";
import { mapSentimentToLabel } from "@/utils/sentimentUtils";
import { Button } from "@/components/ui/button";

interface EditingSource {
  articleId: string;
  value: string;
}

interface EditingSentiment {
  articleId: string;
  value: string;
}

interface EditingCountry {
  articleId: string;
  currentCountry: string;
}

function ModernDashboard() {
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const selectedOrg = localStorage.getItem("selectedOrg");
  const { orgId } = useParams<{ orgId: string }>();
  const selectedOrgId = localStorage.getItem("selectedOrgId");
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [scraping, setScraping] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPostsAndArticles, setTotalPostsAndArticles] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [monthlyMentions, setMonthlyMentions] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [editingSource, setEditingSource] = useState<EditingSource | null>(null);
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [editingSentiment, setEditingSentiment] = useState<EditingSentiment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FacebookPost[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [keywordDistribution, setKeywordDistribution] = useState<Record<string, { count: number; sources: string[] }>>({});
  const [printMediaArticles, setPrintMediaArticles] = useState<PrintMediaArticle[]>([]);
  const [filteredPrintMediaArticles, setFilteredPrintMediaArticles] = useState<PrintMediaArticle[]>([]);
  const [broadcastArticles, setBroadcastArticles] = useState<BroadcastArticle[]>([]);
  const [filteredBroadcastArticles, setFilteredBroadcastArticles] = useState<BroadcastArticle[]>([]);
  const { theme } = useContext(ThemeContext);
  const [totalTopics, setTotalTopics] = useState(0);
  const [infoTooltip, setInfoTooltip] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [editingCountry, setEditingCountry] = useState<EditingCountry | null>(null);
  const [sourceCountryMap, setSourceCountryMap] = useState<Record<string, string>>({});
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const currentArticleId = editingCountry?.articleId;

  // Shared sort states
  const [articleSortOrder, setArticleSortOrder] = useState<"ascending" | "descending">("descending");
  const [postSortOrder, setPostSortOrder] = useState<"ascending" | "descending">("descending");
  const [broadcastSortOrder, setBroadcastSortOrder] = useState<"ascending" | "descending">("descending");
  const [printSortOrder, setPrintSortOrder] = useState<"ascending" | "descending">("descending");

  // Shared sort ave states
  const [articleAveSortOrder, setArticleAveSortOrder] = useState<"ascending" | "descending" | "">("");
  const [postAveSortOrder, setPostAveSortOrder] = useState<"ascending" | "descending" | "">("");
  const [broadcastAveSortOrder, setBroadcastAveSortOrder] = useState<"ascending" | "descending" | "">("");
  const [printAveSortOrder, setPrintAveSortOrder] = useState<"ascending" | "descending" | "">("");

  // Shared sort reach states
  const [articleReachSortOrder, setArticleReachSortOrder] = useState<"ascending" | "descending" | "">("");
  const [postReachSortOrder, setPostReachSortOrder] = useState<"ascending" | "descending" | "">("");

  // Shared sort rank states
  const [articleRankSortOrder, setArticleRankSortOrder] = useState<"ascending" | "descending" | "">("");
  const [postRankSortOrder, setPostRankSortOrder] = useState<"ascending" | "descending" | "">("");

  const [menuOnlineArticleId, setMenuOnlineArticleId] = useState<string | null>(null);
  const [menuSocialPostId, setMenuSocialPostId] = useState<string | null>(null);
  const [menuBroadcastId, setMenuBroadcastId] = useState<string | null>(null);
  const [menuPrintArticleId, setMenuPrintArticleId] = useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [pieData, setPieData] = useState<Array<{ name: string; value: number; fill: string }>>([]);
  const [lineData, setLineData] = useState<Array<{ month: string; online: number; social: number; broadcast: number; print: number }>>([]);

  // For articles
  useEffect(() => {
    setFilteredArticles(
      filterByDateRange(articles, "publication_date", startDate, endDate)
    );
  }, [startDate, endDate, articles]);

  // For posts (social media) - filter by createdTime
  useEffect(() => {
    setFilteredPosts(
      filterByDateRange(facebookPosts, "createdTime", startDate, endDate)
    );
  }, [startDate, endDate, facebookPosts]);

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
    const currentOrgId =
      user.role === "super_admin" ? selectedOrg : user.organizationId;
    if (currentOrgId) {
      fetchOrganizationData(
        currentOrgId,
        setOrganizationData,
        setTotalKeywords,
        setError,
        navigate
      );
    }
  }, [user.role, selectedOrg, user.organizationId, navigate]);

  // Process keyword distribution
  useEffect(() => {
    if (articles.length > 0) {
      const selectedMonth = startDate
        ? new Date(startDate).getMonth()
        : new Date().getMonth();
      const selectedYear = startDate
        ? new Date(startDate).getFullYear()
        : new Date().getFullYear();

      const keywordMap: Record<string, { count: number; sources: Set<string> }> = {};

      articles.forEach((article) => {
        const articleDate = new Date(article.publication_date);
        if (
          Array.isArray(article.matched_keywords) &&
          articleDate.getMonth() === selectedMonth &&
          articleDate.getFullYear() === selectedYear
        ) {
          article.matched_keywords.forEach((keyword) => {
            if (!keywordMap[keyword]) {
              keywordMap[keyword] = { count: 0, sources: new Set() };
            }
            keywordMap[keyword].count += 1;
            keywordMap[keyword].sources.add(article.source);
          });
        }
      });

      const processedKeywordMap: Record<string, { count: number; sources: string[] }> = {};
      Object.keys(keywordMap).forEach((key) => {
        processedKeywordMap[key] = {
          count: keywordMap[key].count,
          sources: Array.from(keywordMap[key].sources)
        };
      });

      setKeywordDistribution(processedKeywordMap);
    }
  }, [articles, startDate]);

  useEffect(() => {
    fetchCountries().then((data) => {
      console.log("Fetched countries", data);
      setCountries(data);
    });
  }, []);


// Generate pie chart data
useEffect(() => {
  const newPieData = generatePieChartData(keywordDistribution);
  setPieData(newPieData);
}, [keywordDistribution]);


  // Generate dataset for the current year
  const currentYear = new Date().getFullYear();

  // Generate line chart data
  useEffect(() => {
    const newLineData = generateLineData(
      articles,
      facebookPosts,
      broadcastArticles,
      printMediaArticles
    );
    setLineData(newLineData);
  }, [articles, facebookPosts, broadcastArticles, printMediaArticles]);

  const hasFetched = useRef(false);

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
    if (selectedOrg) {
      fetchSocialPosts(
        selectedOrg,
        setFacebookPosts,
        setFilteredPosts,
        setLoading
      );
    }
  }, [selectedOrg]);

  useEffect(() => {
    const fetchOrgData = async () => {
      if (hasFetched.current) return; // Prevent duplicate fetches

      try {
        const currentOrgId =
          user.role === "super_admin"
            ? selectedOrg || localStorage.getItem("selectedOrg")
            : user.organizationId;

        if (!currentOrgId) {
          throw new Error("No organization selected.");
        }

        const response = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${currentOrgId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const orgData = response.data;
        setOrganizationData(orgData);

        // Calculate the total number of keywords from the keywords array
        const totalKeywordsCount = orgData.organization.keywords?.length || 0;
        setTotalKeywords(totalKeywordsCount); // Update state

        hasFetched.current = true; // Prevent further fetch attempts
      } catch (error) {
        console.error("Error fetching organization data:", error);
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
  }, [user, selectedOrg, navigate]);

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

  const handleSearch = (query: string) => {
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

  const getSortIcon = (order: string) => {
    return order === "ascending" ? (
      <FaSortAmountDown />
    ) : order === "descending" ? (
      <FaSortAmountUp />
    ) : (
      <FaSortAmountUp style={{ opacity: 0.4 }} />
    );
  };

  // Render loading spinner if data is loading
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div>
      {scraping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Replace spinner with Lottie animation */}
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
          className="w-full p-2 border rounded"
        >
          {countries.map((country, index) => (
            <option key={index} value={country}>
              {country}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            console.log("Country Update Called With:", {
              currentArticleId,
              selectedCountry,
              selectedOrg,
              token: localStorage.getItem("token"),
            });

            if (currentArticleId && selectedOrg && token) {
              confirmCountryUpdate(
                currentArticleId,
                selectedCountry,
                selectedOrg,
                token,
                setArticles,
                setIsCountryModalOpen,
                setEditingCountry,
                toast
              );
            }
          }}
          className="w-full mt-4 p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Save Changes
        </button>
      </CountryModal>

      <SidebarLayout>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
          <h2 className="text-3xl font-bold">
            {organizationData?.organization?.alias || "Organization"}'s
            Dashboard
          </h2>
          <TooltipProvider>
            {/* Card Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* First Card - Primary Blue with gradient */}
              <div
                className="rounded-2xl p-6 text-primary-foreground"
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
                  <p className="text-6xl font-medium">{totalArticles}</p>
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

              {/* Second Card - White */}
              <div className="bg-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-medium">Monthly Mentions</h4>
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
                  <p className="text-6xl font-medium">{monthlyMentions}</p>
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

              {/* Third Card - White */}
              <div className="bg-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-medium">Total Keyphrases</h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                        <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tracked keyphrases and keywords</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-3">
                  <p className="text-6xl font-medium">{totalKeywords}</p>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md p-1.5 bg-muted">
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Same as last month
                    </span>
                  </div>
                </div>
              </div>

              {/* Fourth Card - White */}
              <div className="bg-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-medium">Media Types</h4>
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
                  {["Online", "Broadcast", "Social", "Print"].map(
                    (type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md"
                      >
                        {type}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <DashboardCharts
              pieData={pieData}
              lineData={lineData}
              currentYear={currentYear}
            />
          </TooltipProvider>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-semibold mb-6 underline">
              Latest News
            </h3>

            {/* Online Articles Table */}
            <div className="mb-8">
              <ArticlesTable
                title="Online Articles"
                subtitle="Latest online media mentions"
                articles={filteredArticles}
                actionButton={
                  user.role === "super_admin" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className={scraping ? "cursor-not-allowed opacity-50" : ""}
                      onClick={() => {
                        const orgName =
                          organizationData?.organization?.organizationName;
                        if (!orgName) {
                          toast.error("Organization name missing, cannot scrape.");
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
                          <TfiReload className="h-4 w-4" />
                          <span>Reload Articles</span>
                        </>
                      )}
                    </Button>
                  ) : undefined
                }
                onDelete={(articleId) => {
                  handleDelete(
                    "articles",
                    articleId,
                    selectedOrg || "",
                    token || "",
                    setArticles,
                    setFilteredArticles
                  );
                }}
                onArticleUpdate={async (articleId, updatedData) => {
                  try {
                    const response = await axios.put(
                      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles/${articleId}`,
                      updatedData,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (response.data) {
                      setArticles((prev) =>
                        prev.map((article) =>
                          article._id === articleId
                            ? { ...article, ...updatedData }
                            : article
                        )
                      );
                      setFilteredArticles((prev) =>
                        prev.map((article) =>
                          article._id === articleId
                            ? { ...article, ...updatedData }
                            : article
                        )
                      );
                      toast.success("Article updated successfully");
                    }
                  } catch (error) {
                    console.error("Error updating article:", error);
                    toast.error("Failed to update article");
                  }
                }}
                userRole={user.role}
                orgId={selectedOrg || ""}
              />
            </div>

            {/* Broadcast Media Table */}
            <div className="mb-8">
              {/* <h4 className="text-lg font-semibold mb-4">Broadcast Media</h4> */}
              <ArticlesTable
                title="Broadcast Articles"
                subtitle="Latest broadcast media mentions"
                viewAllLink={`/media/broadcast/${selectedOrg}`}
                articles={filteredBroadcastArticles.map((article) => ({
                  _id: article._id,
                  title: article.mention || "",
                  source: article.station || "",
                  publication_date: article.mentionDT,
                  sentiment: article.sentiment,
                  country: article.country || "",
                  url: article.url || "",
                  ave: article.ave || 0,
                  coverage_type: article.stationType || "Broadcast",
                  station_type:
                    article.stationType || article.station_type || "",
                  rank: 0,
                  reach: 0,
                  snippet: "",
                  logo_url: article.logo_url || "",
                  matched_keywords: article.matched_keywords,
                }))}
                hideReach={true}
                coverageLabel="Type"
                thirdFilterLabel="All Station Types"
                thirdFilterField="station_type"
                onDelete={(articleId) => {
                  handleDelete(
                    "broadcasts",
                    articleId,
                    selectedOrg || "",
                    token || "",
                    setBroadcastArticles,
                    setFilteredBroadcastArticles
                  );
                }}
                onArticleUpdate={async (articleId, updatedData) => {
                  try {
                    const response = await axios.put(
                      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/broadcast/${articleId}`,
                      updatedData,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (response.data) {
                      setBroadcastArticles((prev) =>
                        prev.map((article) =>
                          article._id === articleId
                            ? { ...article, ...updatedData }
                            : article
                        )
                      );
                      setFilteredBroadcastArticles((prev) =>
                        prev.map((article) =>
                          article._id === articleId
                            ? { ...article, ...updatedData }
                            : article
                        )
                      );
                      toast.success("Broadcast article updated successfully");
                    }
                  } catch (error) {
                    console.error("Error updating broadcast article:", error);
                    toast.error("Failed to update broadcast article");
                  }
                }}
                userRole={user.role}
                orgId={selectedOrg || ""}
              />
            </div>

            {/* Print Media Table */}
            <div className="mb-8">
              {/* <h4 className="text-lg font-semibold mb-4">Print Media</h4> */}
              <ArticlesTable
                title="Print Articles"
                subtitle="Latest print media mentions"
                viewAllLink={`/media/print/${selectedOrg}`}
                articles={filteredPrintMediaArticles.map((article) => ({
                  _id: article._id,
                  title: article.headline || "",
                  source: article.publication || "",
                  publication_date: article.publicationDate,
                  sentiment: article.sentiment,
                  country: article.country || "",
                  url: article.url || "",
                  ave: article.ave || 0,
                  coverage_type: article.byline || "Print",
                  section: article.section,
                  rank: 0,
                  reach: 0,
                  snippet: "",
                  logo_url: "",
                  matched_keywords: article.matched_keywords,
                }))}
                hideReach={true}
                coverageLabel="Section"
                useSectionField={true}
                hideThirdFilter={true}
                onDelete={(articleId) => {
                  handleDelete(
                    "printmedias",
                    articleId,
                    selectedOrg || "",
                    token || "",
                    setPrintMediaArticles,
                    setFilteredPrintMediaArticles
                  );
                }}
                onArticleUpdate={async (articleId, updatedData) => {
                  try {
                    const response = await axios.put(
                      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/printmedia/${articleId}`,
                      updatedData,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (response.data) {
                      setPrintMediaArticles((prev) =>
                        prev.map((article) =>
                          article._id === articleId
                            ? { ...article, ...updatedData }
                            : article
                        )
                      );
                      setFilteredPrintMediaArticles((prev) =>
                        prev.map((article) =>
                          article._id === articleId
                            ? { ...article, ...updatedData }
                            : article
                        )
                      );
                      toast.success("Print article updated successfully");
                    }
                  } catch (error) {
                    console.error("Error updating print article:", error);
                    toast.error("Failed to update print article");
                  }
                }}
                userRole={user.role}
                orgId={selectedOrg || ""}
              />
            </div>

            {/* Social Media Table */}
            <div className="mb-8">
              {/* <h4 className="text-lg font-semibold mb-4">Social Media</h4> */}
              <ArticlesTable
                title="Social Media Posts"
                subtitle="Latest social media mentions"
                viewAllLink={`/media/social/${selectedOrg}`}
                showRankInsteadOfCoverage={true}
                thirdFilterLabel="All Sources"
                thirdFilterField="source"
                articles={filteredPosts.map((post) => ({
                  _id: post._id,
                  title: post.message || "",
                  source: post.source || "Facebook",
                  publication_date: post.createdTime,
                  sentiment: post.sentiment,
                  country: post.country || "",
                  url: post.link || "",
                  ave: post.ave,
                  coverage_type: "Social",
                  rank: post.rank,
                  reach: post.reach,
                  snippet: post.message || "",
                  logo_url: post.logo_url || "",
                  matched_keywords: [],
                }))}
                onDelete={(postId) => {
                  handleDelete(
                    "posts",
                    postId,
                    selectedOrg || "",
                    token || "",
                    setFacebookPosts,
                    setFilteredPosts
                  );
                }}
                onArticleUpdate={async (postId, updatedData) => {
                  try {
                    const response = await axios.put(
                      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/posts/${postId}`,
                      updatedData,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (response.data) {
                      setFacebookPosts((prev) =>
                        prev.map((post) =>
                          post._id === postId
                            ? { ...post, ...updatedData }
                            : post
                        )
                      );
                      setFilteredPosts((prev) =>
                        prev.map((post) =>
                          post._id === postId
                            ? { ...post, ...updatedData }
                            : post
                        )
                      );
                      toast.success("Social post updated successfully");
                    }
                  } catch (error) {
                    console.error("Error updating social post:", error);
                    toast.error("Failed to update social post");
                  }
                }}
                userRole={user.role}
                orgId={selectedOrg || ""}
              />
            </div>
          </div>
        </div>
      </SidebarLayout>
    </div>
  );
}

export default ModernDashboard;