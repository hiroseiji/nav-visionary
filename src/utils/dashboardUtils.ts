import axios from 'axios';
import { toast } from 'sonner';
import type React from "react";

export type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export type EditingSentiment = { articleId: string; value: string } | null;
export type EditingCountry  = { articleId: string; currentCountry: string } | null;
export type EditingSource = { articleId: string; value: string } | null;

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
  _id: string;
  createdTime: string;
  message: string;
  source?: string;
  sentiment: string;
  link?: string;
  logo_url?: string;
}

export interface BroadcastArticle {
  stationType: any;
  _id: string;
  mentionDT: string;
  station?: string;
  mention?: string;
  title: string;
  source: string;
  sentiment: string;
  matched_keywords?: string[];
  country?: string;
  url?: string;
  ave?: number;
}

export interface PrintMediaArticle {
  _id: string;
  publicationDate: string;
  publication?: string;
  headline?: string;
  title: string;
  source: string;
  sentiment: string;
  matched_keywords?: string[];
  country?: string;
  url?: string;
  ave?: number;
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
  setLoading(true); 
  try {
    const { data } = await axios.get(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles`
    );
    const raw: Article[] = data.articles || [];

    const updated = raw.map(a => ({
      ...a,
      country: sourceCountryMap[a.source] || a.country,
    }));

    setArticles(updated);
    setDisplayedArticles(updated.slice(0, 8));
    setTotalArticles(updated.length);

    const now = new Date();
    const monthlyCount = updated.filter(a => {
      const d = new Date(a.publication_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    setMonthlyMentions(monthlyCount);
  } catch (err) {
    console.error("Error fetching articles:", err);
    setError("Failed to load articles");
    toast.error("Failed to load articles");
  } finally {
    setLoading(false);
  }
};


// Fetch broadcast articles
export const fetchBroadcastArticles = async (
  orgId: string | string[],
  setBroadcastArticles: (articles: BroadcastArticle[]) => void,
  setFilteredBroadcastArticles: (articles: BroadcastArticle[]) => void,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);
  try {
    const { data } = await axios.post(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/broadcastMedia/multi`,
      { organizationIds: Array.isArray(orgId) ? orgId : [orgId] },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setBroadcastArticles(data);
    setFilteredBroadcastArticles((data || []).slice(0, 8));
  } catch (e) {
    console.error("Error fetching broadcast articles:", e);
    toast.error("Failed to load broadcast articles");
  } finally {
    setLoading(false);
  }
};

export const fetchPrintMediaArticles = async (
  orgId: string | string[],
  setPrintMediaArticles: (articles: PrintMediaArticle[]) => void,
  setFilteredPrintMediaArticles: (articles: PrintMediaArticle[]) => void,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);
  try {
    const { data } = await axios.post(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/printMedia/multi`,
      { organizationIds: Array.isArray(orgId) ? orgId : [orgId] },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setPrintMediaArticles(data);
    setFilteredPrintMediaArticles((data || []).slice(0, 8));
  } catch (e) {
    console.error("Error fetching print media articles:", e);
    toast.error("Failed to load print media articles");
  } finally {
    setLoading(false);
  }
};


// Filter by date range
export const filterByDateRange = <T, K extends keyof T>(
  items: T[],
  dateField: K,
  startDate: Date | null,
  endDate: Date | null
): T[] => {
  if (!startDate || !endDate) return items;

  return items.filter((item) => {
    const value = item[dateField];
    const d =
      value instanceof Date
        ? value
        : new Date(String(value)); // handles string (and safely coerces anything else)
    return d >= startDate && d <= endDate;
  });
};


export const handleSourceEdit = (
  articleId: string,
  currentSource: string,
  setEditingSource: Setter<EditingSource>
) => {
  setEditingSource({ articleId, value: currentSource });
};

export const handleSourceChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setEditingSource: Setter<EditingSource>
) => {
  const value = e.target.value;
  // if not currently editing, do nothing (prevents creating a partial state)
  setEditingSource(prev => (prev ? { ...prev, value } : prev));
};


export const handleKeyPress = (
  e: React.KeyboardEvent<HTMLInputElement>,
  articleId: string,
  newSource: string,
  confirmSourceUpdate: (articleId: string, newSource: string) => void
) => { if (e.key === "Enter") confirmSourceUpdate(articleId, newSource); };

export const handleBlur = (setEditingSource: (v: null) => void) => setEditingSource(null);

export const confirmSourceUpdate = async (
  articleId: string,
  newSource: string,
  selectedOrg: string,
  token: string,
  setArticles: (updater: (prev: Article[]) => Article[]) => void,
  setDisplayedArticles: (updater: (prev: Article[]) => Article[]) => void,
  setEditingSource: (v: null) => void
) => {
  try {
    const res = await axios.put(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles/${articleId}`,
      { newSource },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 200) {
      const apply = (arr: Article[]) => arr.map(a => a._id === articleId ? { ...a, source: newSource } : a);
      setArticles(apply);
      setDisplayedArticles(apply);
      toast.success("Source updated successfully");
      setEditingSource(null);
    }
  } catch (e) {
    console.error("Error updating source:", e);
    toast.error("Failed to update source");
  }
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
  const q = (query || "").toLowerCase();

  setFilteredArticles(
    !q ? articles : articles.filter(a =>
      a.title?.toLowerCase().includes(q) || a.source?.toLowerCase().includes(q))
  );

  setFilteredPosts(
    !q ? facebookPosts : facebookPosts.filter(p =>
      p.message?.toLowerCase().includes(q))
  );

  setFilteredBroadcastArticles(
    !q ? broadcastArticles : broadcastArticles.filter(b =>
      b.station?.toLowerCase().includes(q) || b.mention?.toLowerCase().includes(q))
  );

  setFilteredPrintMediaArticles(
    !q ? printMediaArticles : printMediaArticles.filter(p =>
      p.publication?.toLowerCase().includes(q) || p.headline?.toLowerCase().includes(q))
  );
};

// Handle sentiment change
export const handleSentimentChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setEditingSentiment: Setter<EditingSentiment>
) => {
  setEditingSentiment(prev => (prev ? { ...prev, value: e.target.value } : prev));
};

// Handle sentiment edit
export const handleSentimentEdit = (
  setEditingSentiment: Setter<EditingSentiment>,
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
  orgId: string,
  articleId: string,
  label: string,
  token: string,
  setArticles: (updater: (prev: Article[]) => Article[]) => void,
  setEditingSentiment: (v: null) => void,
  t = toast
) => {
  try {
    const res = await axios.put(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/articles/${articleId}/sentiment`,
      { sentiment: label },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 200) {
      setArticles(prev => prev.map(a => a._id === articleId ? { ...a, sentiment: res.data.sentiment ?? label } : a));
      t.success("Sentiment updated successfully");
    } else throw new Error("Failed to update sentiment");
  } catch (e) {
    console.error("Sentiment update failed:", e);
    t.error("Failed to update sentiment");
  } finally {
    setEditingSentiment(null);
  }
};

export const confirmCountryUpdate = async (
  articleId: string,
  newCountry: string,
  selectedOrg: string,
  token: string,
  setArticles: (updater: (prev: Article[]) => Article[]) => void,
  setIsCountryModalOpen: (open: boolean) => void,
  setEditingCountry: (v: null) => void,
  t = toast
) => {
  try {
    const res = await axios.put(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/articles/${articleId}/country`,
      { country: newCountry },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 200) {
      setArticles(prev => prev.map(a => a._id === articleId ? { ...a, country: newCountry } : a));
      t.success("Country updated successfully");
      setIsCountryModalOpen(false);
    } else throw new Error("Update failed");
  } catch (e) {
    console.error("Error updating country:", e);
    t.error("Failed to update country.");
  } finally {
    setEditingCountry(null);
  }
};


// Handle country edit
export const handleCountryEdit = (
  setEditingCountry: Setter<EditingCountry>,
  setIsCountryModalOpen: Setter<boolean>,
  setSelectedCountry: Setter<string>,
  articleId: string,
  currentCountry: string
) => {
  setEditingCountry({ articleId, currentCountry });
  setSelectedCountry(currentCountry || "");
  setIsCountryModalOpen(true);
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
    organizationName,
    setScraping,
    setArticles,
    setFilteredArticles,
    setDisplayedArticles,
    setTotalArticles
) => {
    setScraping(true);
    try {
        const response = await axios.get("http://localhost:5001/scrape", {
            params: { organizationName },
        });

        toast.success("Scraping completed!");
        window.location.reload();

        const articles = response.data.articles || [];
        setArticles(articles);
        setFilteredArticles(articles);
        setDisplayedArticles(articles.slice(0, 8));
        setTotalArticles(articles.length);
    } catch (error) {
        console.error("Scraping error:", error);
        toast.error("Scraping failed. Please try again.");
    } finally {
        setScraping(false);
    }
};


const endpointMap = {
  articles: "articles",
  posts: "posts",
  broadcasts: "broadcastMedia",
  printmedias: "printMedia",
} as const;

type DeletableKinds = keyof typeof endpointMap;
type WithId = { _id: string };

export const handleDelete = async <T extends WithId>(
  type: DeletableKinds,
  id: string,
  selectedOrg: string,
  token: string,
  updateStateFn: Setter<T[]>,
  updateFilteredFn?: Setter<T[]>
): Promise<void> => {
  if (!window.confirm("Are you sure you want to delete this article?")) return;

  try {
    const res = await axios.delete(
      `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrg}/${endpointMap[type]}/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 200) {
      toast.success("Deleted successfully");
      const remove = (prev: T[]) => prev.filter(item => item._id !== id);
      updateStateFn(remove);
      if (updateFilteredFn) updateFilteredFn(remove);
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to delete item");
  }
};

// Handle menu click
export const handleMenuClick = (articleId: string) => {
  // Mock implementation
  console.log("Menu click:", articleId);
};

// Map sentiment to label
export const mapSentimentToLabel = (scoreOrLabel: number | string): string => {
  if (typeof scoreOrLabel === 'string') return scoreOrLabel.toLowerCase();
  const s = scoreOrLabel;
  if (s >= 0.75) return "positive";
  if (s <= -0.5) return "negative";
  if (s > 0 && s < 0.5) return "mixed";
  if (s === 0) return "neutral";
  return "neutral";
};

export const mapLabelToSentiment = (label: string): number => {
  const l = (label || "").toLowerCase();
  if (l === "positive") return 1;
  if (l === "negative") return -1;
  if (l === "mixed")    return 0.25;
  if (l === "neutral")  return 0;
  return 0;
};

export const generatePieChartData = (
  keywordDistribution: Record<string, { count: number; sources: string[] }>
) => {
  const keys = Object.keys(keywordDistribution);
  if (keys.length === 0) {
    return [{ name: "No Data", value: 1, fill: "#d3d3d3" }];
  }
  const keywords = keys.slice(0, 5);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  return keywords.map((keyword, index) => ({
    name: keyword,
    value: keywordDistribution[keyword].count,
    fill: colors[index % colors.length]
  }));
};


// Generate logo URL
export const generateLogoUrl = (source: string): string => {
  return `https://logo.clearbit.com/${source.toLowerCase().replace(/\s+/g, '')}.com`;
};

// Get screen config
export const getScreenConfig = (): {
  chartWidth: number;
  chartHeight: number;
  legendPosition: "top" | "bottom" | "left" | "right";
} => {
  const width = window.innerWidth;
  return {
    chartWidth: width < 768 ? 300 : 400,
    chartHeight: width < 768 ? 200 : 300,
    legendPosition: width < 768 ? "bottom" : "right",
  };
};


// Generate line data for Recharts
export const generateLineData = (
  articles: Article[],
  facebookPosts: FacebookPost[],
  broadcastArticles: BroadcastArticle[],
  printMediaArticles: PrintMediaArticle[]
) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const year = new Date().getFullYear();
  const online = Array(12).fill(0);
  const social = Array(12).fill(0);
  const broadcast = Array(12).fill(0);
  const print = Array(12).fill(0);

  articles.forEach(a => { const d = new Date(a.publication_date); if (d.getFullYear() === year) online[d.getMonth()]++; });
  facebookPosts.forEach(p => { const d = new Date(p.createdTime); if (d.getFullYear() === year) social[d.getMonth()]++; });
  broadcastArticles.forEach(b => { const d = new Date(b.mentionDT); if (d.getFullYear() === year) broadcast[d.getMonth()]++; });
  printMediaArticles.forEach(p => { const d = new Date(p.publicationDate); if (d.getFullYear() === year) print[d.getMonth()]++; });

  return months.map((month, index) => ({
    month,
    online: online[index],
    social: social[index],
    broadcast: broadcast[index],
    print: print[index]
  }));
};


