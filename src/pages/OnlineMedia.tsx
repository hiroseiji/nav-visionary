import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, ThumbsUp, ThumbsDown, Minus, CalendarIcon, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  mapSentimentToLabel,
  mapLabelToSentiment,
} from "@/utils/sentimentUtils";

interface Article {
  _id: string;
  headline: string;
  source: string;
  country: string;
  datePublished: string;
  ave: number;
  reach: number;
  sentiment: string;
  visibility: string;
  focusOfCoverage: string;
  url?: string;
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
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<string>("datePublished");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [visibleCount, setVisibleCount] = useState(20);

  // Add/Edit article dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [newArticle, setNewArticle] = useState({
    headline: "",
    source: "",
    country: "",
    datePublished: "",
    ave: 0,
    reach: 0,
    sentiment: "neutral",
    visibility: "moderate",
    focusOfCoverage: "",
    url: "",
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
          article.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.source?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (startDate) {
      filtered = filtered.filter(
        (article) => new Date(article.datePublished) >= startDate
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (article) => new Date(article.datePublished) <= endDate
      );
    }

    // Sentiment filter
    if (sentimentFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.sentiment === sentimentFilter
      );
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.visibility === visibilityFilter
      );
    }

    // Focus filter
    if (focusFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.focusOfCoverage === focusFilter
      );
    }

    // Country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.country === countryFilter
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField as keyof Article] as
        | string
        | number;
      let bVal: string | number = b[sortField as keyof Article] as
        | string
        | number;

      if (sortField === "datePublished") {
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
    visibilityFilter,
    focusFilter,
    countryFilter,
    sortField,
    sortOrder,
  ]);

  const handleAddArticle = async () => {
    try {
      await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/online`,
        { ...newArticle, organizationId: orgId }
      );
      toast.success("Article added successfully");
      setIsDialogOpen(false);
      fetchArticles();
      resetForm();
    } catch (error) {
      console.error("Error adding article:", error);
      toast.error("Failed to add article");
    }
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle) return;
    try {
      await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/online/${editingArticle._id}`,
        newArticle
      );
      toast.success("Article updated successfully");
      setIsDialogOpen(false);
      fetchArticles();
      resetForm();
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Failed to update article");
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?"))
      return;
    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/online/${id}`
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
      headline: article.headline,
      source: article.source,
      country: article.country,
      datePublished: article.datePublished,
      ave: article.ave,
      reach: article.reach,
      sentiment: article.sentiment,
      visibility: article.visibility,
      focusOfCoverage: article.focusOfCoverage,
      url: article.url || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setNewArticle({
      headline: "",
      source: "",
      country: "",
      datePublished: "",
      ave: 0,
      reach: 0,
      sentiment: "neutral",
      visibility: "moderate",
      focusOfCoverage: "",
      url: "",
    });
  };

  const getSentimentBadge = (sentiment: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      positive: "default",
      negative: "destructive",
      neutral: "secondary",
    };
    const icons: Record<string, React.ReactNode> = {
      positive: <ThumbsUp className="h-3 w-3" />,
      negative: <ThumbsDown className="h-3 w-3" />,
      neutral: <Minus className="h-3 w-3" />,
    };
    return (
      <Badge variant={variants[sentiment] || "secondary"} className="gap-1">
        {icons[sentiment]}
        {sentiment}
      </Badge>
    );
  };

  const uniqueCountries = Array.from(
    new Set(articles.map((a) => a.country).filter(Boolean))
  );

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Online Media
              </h1>
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
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      value={newArticle.headline}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          headline: e.target.value,
                        })
                      }
                      placeholder="Article headline"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={newArticle.country}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            country: e.target.value,
                          })
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ave">AVE</Label>
                      <Input
                        id="ave"
                        type="number"
                        value={newArticle.ave}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            ave: Number(e.target.value),
                          })
                        }
                        placeholder="0"
                      />
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
                  <div className="grid grid-cols-3 gap-4">
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
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={newArticle.visibility}
                        onValueChange={(value) =>
                          setNewArticle({ ...newArticle, visibility: value })
                        }
                      >
                        <SelectTrigger id="visibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="datePublished">Date</Label>
                      <Input
                        id="datePublished"
                        type="date"
                        value={newArticle.datePublished}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            datePublished: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="focusOfCoverage">Focus of Coverage</Label>
                    <Input
                      id="focusOfCoverage"
                      value={newArticle.focusOfCoverage}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          focusOfCoverage: e.target.value,
                        })
                      }
                      placeholder="Main topic or focus"
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
                  >
                    {editingArticle ? "Update" : "Add"} Article
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
                  </SelectContent>
                </Select>
                <Select
                  value={visibilityFilter}
                  onValueChange={setVisibilityFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
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
              <div className="flex justify-between items-center">
                <CardTitle>Articles ({filteredArticles.length})</CardTitle>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="datePublished">Date</SelectItem>
                      <SelectItem value="ave">AVE</SelectItem>
                      <SelectItem value="reach">Reach</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                        <TableHead>Headline</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="text-right">AVE</TableHead>
                        <TableHead className="text-right">Reach</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles
                        .slice(0, visibleCount)
                        .map((article) => (
                          <TableRow key={article._id}>
                            <TableCell className="font-medium max-w-md">
                              {article.url ? (
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline text-primary"
                                >
                                  {article.headline}
                                </a>
                              ) : (
                                article.headline
                              )}
                            </TableCell>
                            <TableCell>{article.source}</TableCell>
                            <TableCell>{article.country}</TableCell>
                            <TableCell>
                              {article.datePublished && !isNaN(new Date(article.datePublished).getTime())
                                ? format(new Date(article.datePublished), "PP")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {getSentimentBadge(article.sentiment)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {article.visibility}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              ${article.ave?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {article.reach?.toLocaleString()}
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
                                    onClick={() =>
                                      handleDeleteArticle(article._id)
                                    }
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
      </div>
    </SidebarLayout>
  );
}
