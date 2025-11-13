import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CalendarIcon,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  mapSentimentToLabel,
  mapLabelToSentiment,
} from "@/utils/sentimentUtils";
import { AxiosError } from "axios";

interface Article {
  _id: string;
  title: string;
  source: string;
  snippet: string;
  country: string;
  publication_date: string;
  ave: number;
  reach: number;
  sentiment: string;
  coverage_type: string;
  rank?: number;
  url?: string;
  logo_url?: string;
}

export default function OnlineMedia() {
  const fetchSeq = useRef(0);
  const { orgId } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Filters
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [coverageTypeFilter, setCoverageTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("publication_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add/Edit article dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    source: "",
    country: "",
    publication_date: "",
    reach: 0,
    sentiment: "neutral",
    url: "",
    snippet: "",
    cpm: 0,
    coverage_type: "Not Set",
  });

  // Fetch articles
  useEffect(() => {
    if (orgId) fetchArticles();
  }, [orgId]);

  const fetchArticles = async (page = 1, limit = 30, append = false) => {
    if (!orgId) return;

    if (!append) setLoading(true);
    else setLoadingMore(true);
    
    const seq = ++fetchSeq.current;

    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));

      if (searchQuery) params.append("search", searchQuery);
      if (startDate)
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));
      if (coverageTypeFilter && coverageTypeFilter !== "all")
        params.append("coverageType", coverageTypeFilter);
      if (countryFilter && countryFilter !== "all")
        params.append("country", countryFilter);
      if (sentimentFilter && sentimentFilter !== "all")
        params.append("sentiment", sentimentFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const res = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/articles/multi2?${params.toString()}`,
        { organizations: Array.isArray(orgId) ? orgId : [orgId] },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (seq !== fetchSeq.current) return;

      const data = res.data;
      const list = Array.isArray(data.items) ? data.items : [];

      if (append) {
        setArticles((prev) => [...prev, ...list]);
        setFilteredArticles((prev) => [...prev, ...list]);
      } else {
        setArticles(list);
        setFilteredArticles(list);
      }

      setCurrentPage(data.page || page);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total || list.length);

      return {
        page: data.page,
        total: data.total,
        pages: data.pages,
      };
    } catch (e) {
      if (seq !== fetchSeq.current) return;
      console.error("Error fetching online articles:", e);
      toast.error("Failed to load online articles");
      return null;
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // Refetch when filters change
  useEffect(() => {
    if (orgId) {
      setCurrentPage(1);
      fetchArticles(1, 30, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, startDate, endDate, coverageTypeFilter, sentimentFilter, countryFilter, sortBy, sortOrder]);

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    await fetchArticles(nextPage, 50, true);
  };

  // Client-side filtering removed - now handled by backend

  const handleAddArticle = async () => {
    if (!newArticle.source) return toast.error("Source name is required.");
    if (!newArticle.title) return toast.error("Article title is required.");
    if (!newArticle.url) return toast.error("Article URL is required.");
    if (!newArticle.publication_date)
      return toast.error("Publication date is required.");
    if (!newArticle.reach || Number(newArticle.reach) <= 0)
      return toast.error("Reach must be a positive number.");

    setSaving(true);
    try {
      const payload = {
        title: newArticle.title.trim(),
        source: newArticle.source.trim(),
        snippet: newArticle.snippet.trim() || newArticle.title.trim(),
        country: newArticle.country,
        publication_date: format(
          new Date(newArticle.publication_date),
          "yyyy-MM-dd"
        ),
        reach: Number(newArticle.reach),
        sentiment: mapLabelToSentiment(newArticle.sentiment),
        url: newArticle.url.trim(),
        cpm: Number(newArticle.cpm) || 0,
        coverage_type: newArticle.coverage_type || "Not Set",
      };

      const response = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/articles`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201 && response.data.article) {
        setArticles((prev) => [response.data.article, ...prev]);
        toast.success("Article added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error("Error adding article:", error);
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to add article";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle || !orgId) return;
    setSaving(true);

    const payload = {
      title: newArticle.title.trim(),
      source: newArticle.source.trim(),
      snippet: newArticle.snippet.trim() || newArticle.title.trim(),
      country: newArticle.country,
      publication_date: format(
        new Date(newArticle.publication_date),
        "yyyy-MM-dd"
      ),
      reach: Number(newArticle.reach),
      sentiment: mapLabelToSentiment(newArticle.sentiment),
      url: newArticle.url.trim(),
      cpm: Number(newArticle.cpm) || 0,
      coverage_type: newArticle.coverage_type || "Not Set",
    };

    // snapshot for rollback
    const prevArticles = articles;

    // optimistic UI: ensure sentiment stays a string label for Article type
    const optimistic: Article = {
      ...editingArticle,
      title: payload.title ?? editingArticle.title,
      source: payload.source ?? editingArticle.source,
      snippet: payload.snippet ?? editingArticle.snippet,
      country: payload.country ?? editingArticle.country,
      publication_date:
        payload.publication_date ?? editingArticle.publication_date,
      reach: (payload.reach as number) ?? editingArticle.reach,
      sentiment: mapSentimentToLabel(payload.sentiment),
      url: payload.url ?? editingArticle.url,
      coverage_type: payload.coverage_type ?? editingArticle.coverage_type,
    };

    setArticles((prev) =>
      prev.map((a) => (a._id === editingArticle._id ? optimistic : a))
    );

    try {
      const res = await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/articles/${editingArticle._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Article updated successfully");

      // trust backend copy if it returned one, otherwise keep optimistic
      const updated: Article = res.data?.article
        ? {
            ...optimistic,
            ...res.data.article,
            sentiment: mapSentimentToLabel(res.data.article.sentiment),
          }
        : optimistic;

      setArticles((prev) =>
        prev.map((a) => (a._id === editingArticle._id ? updated : a))
      );

      // close after success
      setIsDialogOpen(false);
      resetForm();

      // optional: soft revalidate later
      setTimeout(() => fetchArticles(), 300);
    } catch (e) {
      // rollback on real failure
      setArticles(prevArticles);
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : "Failed to update article";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?"))
      return;

    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/articles/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Article deleted successfully");
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    }
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setNewArticle({
      title: article.title || "",
      source: article.source,
      country: article.country,
      publication_date: article.publication_date
        ? new Date(article.publication_date).toISOString().split("T")[0]
        : "",
      reach: article.reach,
      sentiment: mapSentimentToLabel(article.sentiment),
      url: article.url || "",
      snippet: article.snippet,
      cpm: 0,
      coverage_type: article.coverage_type || "Not Set",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setNewArticle({
      title: "",
      source: "",
      country: "",
      publication_date: "",
      reach: 0,
      sentiment: "neutral",
      url: "",
      snippet: "",
      cpm: 0,
      coverage_type: "Not Set",
    });
  };

  const getSentimentBadge = (sentiment: string | number) => {
    const sentimentLabel = mapSentimentToLabel(sentiment);
    const sentimentLower = sentimentLabel.toLowerCase();
    let variant: "positive" | "negative" | "neutral" | "mixed" = "neutral";

    if (sentimentLower === "positive") variant = "positive";
    else if (sentimentLower === "negative") variant = "negative";
    else if (sentimentLower === "mixed") variant = "mixed";
    else variant = "neutral";

    return (
      <Badge variant={variant}>
        <span className="capitalize">{sentimentLabel}</span>
      </Badge>
    );
  };

  const uniqueCountries = Array.from(
    new Set(articles.map((a) => a.country).filter(Boolean))
  );

  const uniqueCoverageTypes = Array.from(
    new Set(articles.map((a) => a.coverage_type).filter(Boolean))
  );

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Online Media</h1>
            <p className="text-muted-foreground">
              Manage and track online media coverage
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? "Edit Article" : "Add New Article"}
                </DialogTitle>
                <DialogDescription>
                  {editingArticle
                    ? "Update the article details below"
                    : "Fill in the details for the new article"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={newArticle.source}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        source: e.target.value,
                      })
                    }
                    placeholder="Media source"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newArticle.title}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        title: e.target.value,
                      })
                    }
                    placeholder="Article title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newArticle.url}
                    onChange={(e) =>
                      setNewArticle({ ...newArticle, url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="snippet">Snippet</Label>
                  <Input
                    id="snippet"
                    value={newArticle.snippet}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        snippet: e.target.value,
                      })
                    }
                    placeholder="Article snippet"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="publication_date">Date</Label>
                  <Input
                    id="publication_date"
                    type="date"
                    value={newArticle.publication_date}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        publication_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sentiment">Sentiment</Label>
                  <Select
                    value={newArticle.sentiment}
                    onValueChange={(value) =>
                      setNewArticle({ ...newArticle, sentiment: value })
                    }
                  >
                    <SelectTrigger id="sentiment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={newArticle.country}
                    onValueChange={(value) =>
                      setNewArticle({ ...newArticle, country: value })
                    }
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCountries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reach">Reach</Label>
                  <Input
                    id="reach"
                    type="number"
                    value={newArticle.reach}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        reach: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    editingArticle ? handleUpdateArticle : handleAddArticle
                  }
                  disabled={saving}
                >
                  {saving ? "Updating…" : editingArticle ? "Update" : "Add"}{" "}
                  Article
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={sentimentFilter}
                onValueChange={setSentimentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={coverageTypeFilter}
                onValueChange={setCoverageTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Coverage Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coverage Types</SelectItem>
                  {uniqueCoverageTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Articles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Articles ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading articles...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No articles found
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Headline</TableHead>
                      {/* <TableHead>Summary</TableHead> */}
                      <TableHead>Country</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => handleSort("publication_date")}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              sortBy === "publication_date"
                                ? "text-primary"
                                : ""
                            }`}
                          />
                        </div>
                      </TableHead>
                      <TableHead>Sentiment</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/30"
                        onClick={() => handleSort("ave")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          AVE
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              sortBy === "ave" ? "text-primary" : ""
                            }`}
                          />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/30"
                        onClick={() => handleSort("reach")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Reach
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              sortBy === "reach" ? "text-primary" : ""
                            }`}
                          />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/30"
                        onClick={() => handleSort("rank")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Relevancy
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              sortBy === "rank" ? "text-primary" : ""
                            }`}
                          />
                        </div>
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => (
                      <TableRow key={article._id}>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            {article.logo_url && (
                              <img
                                src={article.logo_url}
                                alt={`${article.source} logo`}
                                className="h-8 w-8 rounded-full object-cover border"
                              />
                            )}
                            <span className="font-medium text-sm">
                              {article.source}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{article.title}</TableCell>
                        {/* <TableCell>{article.snippet}</TableCell> */}
                        <TableCell>{article.country}</TableCell>
                        <TableCell>
                          {article.publication_date &&
                          !isNaN(new Date(article.publication_date).getTime())
                            ? format(new Date(article.publication_date), "PP")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {getSentimentBadge(article.sentiment)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {article.coverage_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {article.ave?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {article.reach?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {article.rank?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(article)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteArticle(article._id)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Viewing {filteredArticles.length} out of {totalCount} articles
                  </p>
                  {currentPage < totalPages && (
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {/* </div> */}
    </SidebarLayout>
  );
}
