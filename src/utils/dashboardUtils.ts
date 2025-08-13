import axios from 'axios';
import { toast } from 'sonner';

// Types
export interface Article {
  _id: string;
  source: string;
  title: string;
  snippet: string;
  publication_date: string;
  country: string;
  sentiment: string;
  ave: number;
  coverage_type: string;
  rank: number;
  reach: number;
  url: string;
  logo_url: string;
  matched_keywords?: string[];
}

export interface FacebookPost {
  createdTime: string;
  // Add other post properties as needed
}

export interface BroadcastArticle {
  mentionDT: string;
  // Add other broadcast properties as needed
}

export interface PrintMediaArticle {
  publicationDate: string;
  // Add other print media properties as needed
}

export interface OrganizationData {
  organization: {
    alias: string;
    organizationName: string;
    keywords: string[];
  };
}

// Fetch organization data
export const fetchOrganizationData = async (
  orgId: string,
  setOrganizationData: (data: OrganizationData) => void,
  setTotalKeywords: (count: number) => void,
  setError: (error: string) => void,
  navigate: (path: string) => void
) => {
  try {
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
    setTotalKeywords(orgData.organization.keywords?.length || 0);
  } catch (error) {
    console.error("Error fetching organization data:", error);
    setError("Failed to load organization data.");
    toast.error("Failed to fetch organization data. Please try again.");
    navigate("/login");
  }
};

// Fetch articles
export const fetchArticles = async (
  selectedOrg: string,
  sourceCountryMap: Record<string, string>,
  setArticles: (articles: Article[]) => void,
  setDisplayedArticles: (articles: Article[]) => void,
  setTotalArticles: (count: number) => void,
  setMonthlyMentions: (count: number) => void,
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    const response = await axios.get(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles`
    );
    const articlesData = response.data.articles || [];
    setArticles(articlesData);
    setDisplayedArticles(articlesData.slice(0, 8));
    setTotalArticles(articlesData.length);
    
    // Calculate monthly mentions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCount = articlesData.filter((article: Article) => {
      const date = new Date(article.publication_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    setMonthlyMentions(monthlyCount);
  } catch (error) {
    console.error("Error fetching articles:", error);
    setError("Failed to load articles");
  } finally {
    setLoading(false);
  }
};

// Fetch broadcast articles
export const fetchBroadcastArticles = async (
  selectedOrg: string,
  setBroadcastArticles: (articles: BroadcastArticle[]) => void,
  setFilteredBroadcastArticles: (articles: BroadcastArticle[]) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    // Mock implementation - replace with actual API call
    setBroadcastArticles([]);
    setFilteredBroadcastArticles([]);
  } catch (error) {
    console.error("Error fetching broadcast articles:", error);
  } finally {
    setLoading(false);
  }
};

// Fetch print media articles
export const fetchPrintMediaArticles = async (
  selectedOrg: string,
  setPrintMediaArticles: (articles: PrintMediaArticle[]) => void,
  setFilteredPrintMediaArticles: (articles: PrintMediaArticle[]) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    // Mock implementation - replace with actual API call
    setPrintMediaArticles([]);
    setFilteredPrintMediaArticles([]);
  } catch (error) {
    console.error("Error fetching print media articles:", error);
  } finally {
    setLoading(false);
  }
};

// Filter by date range
export const filterByDateRange = (
  items: any[],
  dateField: string,
  startDate: Date | null,
  endDate: Date | null
): any[] => {
  if (!startDate || !endDate) return items;
  
  return items.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

// Handle search query
export const handleSearchQuery = (
  query: string,
  articles: Article[],
  facebookPosts: FacebookPost[],
  broadcastArticles: BroadcastArticle[],
  printMediaArticles: PrintMediaArticle[],
  setFilteredArticles: (articles: Article[]) => void,
  setFilteredPosts: (posts: FacebookPost[]) => void,
  setFilteredBroadcastArticles: (articles: BroadcastArticle[]) => void,
  setFilteredPrintMediaArticles: (articles: PrintMediaArticle[]) => void
) => {
  if (!query.trim()) {
    setFilteredArticles(articles);
    setFilteredPosts(facebookPosts);
    setFilteredBroadcastArticles(broadcastArticles);
    setFilteredPrintMediaArticles(printMediaArticles);
    return;
  }

  const lowerQuery = query.toLowerCase();
  
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.source.toLowerCase().includes(lowerQuery)
  );
  
  setFilteredArticles(filteredArticles);
  setFilteredPosts(facebookPosts);
  setFilteredBroadcastArticles(broadcastArticles);
  setFilteredPrintMediaArticles(printMediaArticles);
};

// Handle sentiment change
export const handleSentimentChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setEditingSentiment: (sentiment: any) => void
) => {
  setEditingSentiment((prev: any) => ({ ...prev, value: e.target.value }));
};

// Handle sentiment edit
export const handleSentimentEdit = (
  setEditingSentiment: (sentiment: any) => void,
  articleId: string,
  currentSentiment: string
) => {
  setEditingSentiment({ articleId, value: currentSentiment });
};

// Handle sentiment cancel
export const handleSentimentCancel = (
  setEditingSentiment: (sentiment: null) => void
) => {
  setEditingSentiment(null);
};

// Confirm sentiment update
export const confirmSentimentUpdate = async (
  articleId: string,
  newSentiment: string,
  selectedOrg: string,
  token: string,
  setArticles: (updater: (prev: Article[]) => Article[]) => void,
  setEditingSentiment: (sentiment: null) => void,
  toast: any
) => {
  try {
    const response = await axios.put(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles/${articleId}`,
      { sentiment: newSentiment },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      setArticles((prev: Article[]) =>
        prev.map(article =>
          article._id === articleId
            ? { ...article, sentiment: newSentiment }
            : article
        )
      );
      toast.success("Sentiment updated successfully");
      setEditingSentiment(null);
    }
  } catch (error) {
    console.error("Error updating sentiment:", error);
    toast.error("Failed to update sentiment");
  }
};

// Handle country edit
export const handleCountryEdit = (
  setEditingCountry: (country: any) => void,
  setIsCountryModalOpen: (open: boolean) => void,
  setSelectedCountry: (country: string) => void,
  articleId: string,
  currentCountry: string
) => {
  setEditingCountry({ articleId, currentCountry });
  setSelectedCountry(currentCountry || "");
  setIsCountryModalOpen(true);
};

// Confirm country update
export const confirmCountryUpdate = async (
  articleId: string,
  newCountry: string,
  selectedOrg: string,
  token: string,
  setArticles: (updater: (prev: Article[]) => Article[]) => void,
  setIsCountryModalOpen: (open: boolean) => void,
  setEditingCountry: (country: null) => void,
  toast: any
) => {
  try {
    const response = await axios.put(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles/${articleId}`,
      { country: newCountry },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      setArticles((prev: Article[]) =>
        prev.map(article =>
          article._id === articleId
            ? { ...article, country: newCountry }
            : article
        )
      );
      toast.success("Country updated successfully");
      setIsCountryModalOpen(false);
      setEditingCountry(null);
    }
  } catch (error) {
    console.error("Error updating country:", error);
    toast.error("Failed to update country");
  }
};

// Fetch countries
export const fetchCountries = async (): Promise<string[]> => {
  // Mock implementation - replace with actual API call
  return [
    "Botswana", "South Africa", "Zimbabwe", "Namibia", "Zambia",
    "United States", "United Kingdom", "Canada", "Australia"
  ];
};

// Handle scrape
export const handleScrape = async (
  orgName: string,
  setScraping: (scraping: boolean) => void,
  setArticles: (articles: Article[]) => void,
  setFilteredArticles: (articles: Article[]) => void,
  setDisplayedArticles: (articles: Article[]) => void,
  setTotalArticles: (count: number) => void
) => {
  setScraping(true);
  try {
    // Mock implementation - replace with actual scraping logic
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast.success("Articles refreshed successfully");
    // Refresh articles here
  } catch (error) {
    console.error("Error scraping:", error);
    toast.error("Failed to refresh articles");
  } finally {
    setScraping(false);
  }
};

// Handle delete
export const handleDelete = async (articleId: string) => {
  // Mock implementation
  console.log("Delete article:", articleId);
};

// Handle menu click
export const handleMenuClick = (articleId: string) => {
  // Mock implementation
  console.log("Menu click:", articleId);
};

// Map sentiment to label
export const mapSentimentToLabel = (sentiment: string): string => {
  switch (sentiment) {
    case "positive": return "Positive";
    case "negative": return "Negative";
    case "neutral": return "Neutral";
    default: return "Unknown";
  }
};

// Generate logo URL
export const generateLogoUrl = (source: string): string => {
  return `https://logo.clearbit.com/${source.toLowerCase().replace(/\s+/g, '')}.com`;
};

// Get screen config
export const getScreenConfig = () => {
  const width = window.innerWidth;
  return {
    chartWidth: width < 768 ? 300 : 400,
    chartHeight: width < 768 ? 200 : 300,
    legendPosition: width < 768 ? 'bottom' : 'right'
  };
};

// Generate line data
export const generateLineData = (
  articles: Article[],
  facebookPosts: FacebookPost[],
  broadcastArticles: BroadcastArticle[],
  printMediaArticles: PrintMediaArticle[]
) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  const onlineData = new Array(12).fill(0);
  const socialData = new Array(12).fill(0);
  const broadcastData = new Array(12).fill(0);
  const printData = new Array(12).fill(0);
  
  articles.forEach(article => {
    const date = new Date(article.publication_date);
    if (date.getFullYear() === currentYear) {
      onlineData[date.getMonth()]++;
    }
  });
  
  return {
    labels: months,
    datasets: [
      {
        label: 'Online Articles',
        data: onlineData,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4,
      },
      {
        label: 'Social Media Posts',
        data: socialData,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
      },
      {
        label: 'Broadcast Articles',
        data: broadcastData,
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.4,
      },
      {
        label: 'Print Media Articles',
        data: printData,
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4,
      }
    ]
  };
};

// Get gradient
export const getGradient = (ctx: CanvasRenderingContext2D, colors: string[]) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
};

// Generate pie chart data
export const generatePieChartData = (
  keywordDistribution: Record<string, { count: number; sources: string[] }>,
  getGradient: (ctx: CanvasRenderingContext2D, colors: string[]) => CanvasGradient,
  ctx: CanvasRenderingContext2D
) => {
  const keywords = Object.keys(keywordDistribution).slice(0, 5);
  const data = keywords.map(keyword => keywordDistribution[keyword].count);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return {
    labels: keywords,
    datasets: [{
      data,
      backgroundColor: colors.slice(0, keywords.length),
      borderColor: colors.slice(0, keywords.length),
      borderWidth: 2,
    }]
  };
};

// Generate pie chart options
export const generatePieChartOptions = (
  pieData: any,
  keywordDistribution: Record<string, { count: number; sources: string[] }>,
  theme: string,
  legendPosition: string
) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: legendPosition as 'top' | 'bottom' | 'left' | 'right',
        labels: {
          color: theme === "light" ? "#7a7a7a" : "#fff",
          font: {
            family: "Raleway",
            size: 12,
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const keyword = context.label;
            const count = context.parsed;
            return `${keyword}: ${count} mentions`;
          }
        }
      }
    }
  };
};