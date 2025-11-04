import React, { useEffect, useState } from "react";
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
  const [visibleCount, setVisibleCount] = useState(20);

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
  });

  // Fetch articles
  useEffect(() => {
    if (orgId) fetchArticles();
  }, [orgId]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/articles/multi`,
        {
          organizationIds: [orgId],
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Correct access to article array
      const articles = response.data.articles || [];
      setArticles(articles);
      setFilteredArticles(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...articles];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.source?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (startDate) {
      filtered = filtered.filter(
        (article) => new Date(article.publication_date) >= startDate
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (article) => new Date(article.publication_date) <= endDate
      );
    }

    // Sentiment filter
    if (sentimentFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.sentiment === sentimentFilter
      );
    }

    // Coverage type filter
    if (coverageTypeFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.coverage_type === coverageTypeFilter
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortBy as keyof Article] as
        | string
        | number;
      let bVal: string | number = b[sortBy as keyof Article] as
        | string
        | number;

      if (sortBy === "publication_date") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredArticles(filtered);
  }, [
    articles,
    searchQuery,
    startDate,
    endDate,
    sentimentFilter,
    coverageTypeFilter,
    countryFilter,
    sortBy,
    sortOrder,
  ]);

  const handleAddArticle = async () => {
    setSaving(true);
    try {
      const newPayload = {
        title: newArticle.title.trim(),
        source: newArticle.source.trim(),
        snippet: newArticle.snippet.trim(),
        country: newArticle.country,
        publication_date: newArticle.publication_date,
        reach: Number(newArticle.reach),
        sentiment: mapLabelToSentiment(newArticle.sentiment), // convert string to numeric
        url: newArticle.url?.trim() || "",
      };

      await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/articles`,
        newPayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Article added successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error("Error adding article:", error);
      toast.error("Failed to add article");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle || !orgId) return;

    setSaving(true);

    // Build payload with proper types
    const payload: Record<string, string | number> = {
      title: newArticle.title?.trim() || "",
      snippet: newArticle.snippet?.trim() || "",
      source: newArticle.source?.trim() || "",
      url: newArticle.url?.trim() || "",
      publication_date: newArticle.publication_date,
      country: newArticle.country || "",
      reach: Number(newArticle.reach) || 0,
      sentiment: mapLabelToSentiment(newArticle.sentiment),
    };

    // Strip empty values
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== "" && v !== undefined)
    ) as Record<string, string | number>;

    // Abort after 25s to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/articles/${editingArticle._id}`,
        cleanPayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          timeout: 27000,
        }
      );

      // Optimistic UI update
      setArticles((prev) =>
        prev.map((article) =>
          article._id === editingArticle._id
            ? {
                ...article,
                title: newArticle.title,
                source: newArticle.source,
                country: newArticle.country,
                publication_date: newArticle.publication_date,
                reach: newArticle.reach,
                url: newArticle.url || article.url || "",
                snippet: newArticle.snippet,
                sentiment: mapSentimentToLabel(mapLabelToSentiment(newArticle.sentiment)),
              }
            : article
        )
      );

      toast.success("Article updated successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error("Error updating article:", err);
      let errorMessage = "Failed to update article. Please try again.";
      
      if (axios.isAxiosError(err)) {
        if (err.code === "ERR_CANCELED") {
          errorMessage = "Update timed out.";
        } else if (err.response?.data && typeof err.response.data === "object" && "message" in err.response.data) {
          errorMessage = String(err.response.data.message);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      clearTimeout(timeoutId);
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
            <CardTitle>Articles ({filteredArticles.length})</CardTitle>
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
                      <TableHead>Summary</TableHead>
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
                    {filteredArticles.slice(0, visibleCount).map((article) => (
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
                        <TableCell>{article.snippet}</TableCell>
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
                {filteredArticles.length > visibleCount && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount(visibleCount + 20)}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {/* </div> */}
    </SidebarLayout>
  );
}
