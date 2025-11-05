import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Plus,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ArrowUpDown,
  CalendarIcon,
  Newspaper,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { mapSentimentToLabel } from "@/utils/sentimentUtils";

interface PrintArticle {
  _id: string;
  headline: string;
  byline: string;
  section: string;
  country: string;
  publicationDate: string;
  sentiment: string;
  ave: number;
  url?: string;
}

export default function PrintMedia() {
  const { orgId } = useParams();
  const [articles, setArticles] = useState<PrintArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<PrintArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Filters
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("publicationDate");
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

  // Add/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<PrintArticle | null>(
    null
  );
  const [newArticle, setNewArticle] = useState({
    headline: "",
    byline: "",
    section: "",
    country: "",
    publicationDate: "",
    sentiment: "neutral",
    ave: 0,
  });

  useEffect(() => {
    if (orgId) fetchArticles();
  }, [orgId]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/printMedia/multi",
        { organizationIds: [orgId] },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // response.data is already the array
      const articles = Array.isArray(response.data) ? response.data : [];
      setArticles(articles);
      setFilteredArticles(articles);
    } catch (error) {
      console.error("Error fetching print articles:", error);
      toast.error("Failed to load print articles");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...articles];

    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.byline?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (article) => new Date(article.publicationDate) >= startDate
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (article) => new Date(article.publicationDate) <= endDate
      );
    }

    if (sectionFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.section === sectionFilter
      );
    }

    if (sentimentFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.sentiment === sentimentFilter
      );
    }

    if (countryFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.country === countryFilter
      );
    }

    filtered.sort((a, b) => {
      let aVal: string | number = a[sortBy as keyof PrintArticle] as
        | string
        | number;
      let bVal: string | number = b[sortBy as keyof PrintArticle] as
        | string
        | number;

      if (sortBy === "publicationDate") {
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
    sectionFilter,
    sentimentFilter,
    countryFilter,
    sortBy,
    sortOrder,
  ]);

  const handleAddArticle = async () => {
    if (!newArticle.headline) return toast.error("Headline is required.");
    if (!newArticle.publicationDate) return toast.error("Publication date is required.");

    setSaving(true);
    try {
      const response = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/print`,
        { ...newArticle, organizationId: orgId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Print article added successfully");
      }

      setIsDialogOpen(false);
      fetchArticles();
      resetForm();
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
    if (!editingArticle) return;
    if (!newArticle.headline) return toast.error("Headline is required.");

    setSaving(true);
    try {
      await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/print/${editingArticle._id}`,
        newArticle,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Article updated successfully");
      setIsDialogOpen(false);
      fetchArticles();
      resetForm();
    } catch (error) {
      console.error("Error updating article:", error);
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to update article";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?"))
      return;
    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/print/${id}`,
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
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to delete article";
      toast.error(errorMsg);
    }
  };

  const openEditDialog = (article: PrintArticle) => {
    setEditingArticle(article);
    setNewArticle({
      headline: article.headline,
      byline: article.byline,
      section: article.section,
      country: article.country,
      publicationDate: article.publicationDate,
      sentiment: article.sentiment,
      ave: article.ave,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setNewArticle({
      headline: "",
      byline: "",
      section: "",
      country: "",
      publicationDate: "",
      sentiment: "neutral",
      ave: 0,
    });
  };

  const getSentimentBadge = (sentiment: string | number) => {
    const sentimentLabel = mapSentimentToLabel(sentiment);
    const sentimentLower = sentimentLabel.toLowerCase();
    let variant: "positive" | "negative" | "neutral" | "mixed" = "neutral";
    
    if (sentimentLower === 'positive') variant = 'positive';
    else if (sentimentLower === 'negative') variant = 'negative';
    else if (sentimentLower === 'mixed') variant = 'mixed';
    else variant = 'neutral';
    
    return (
      <Badge variant={variant}>
        <span className="capitalize">{sentimentLabel}</span>
      </Badge>
    );
  };

  const uniqueSections = Array.from(
    new Set(articles.map((a) => a.section).filter(Boolean))
  );
  const uniqueCountries = Array.from(
    new Set(articles.map((a) => a.country).filter(Boolean))
  );

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Print Media
              </h1>
              <p className="text-muted-foreground">
                Manage print media coverage and articles
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? "Edit Article" : "Add New Article"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingArticle
                      ? "Update the print article details"
                      : "Add a new print media coverage entry"}
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
                      <Label htmlFor="byline">byline</Label>
                      <Input
                        id="byline"
                        value={newArticle.byline}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            byline: e.target.value,
                          })
                        }
                        placeholder="Newspaper name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={newArticle.section}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            section: e.target.value,
                          })
                        }
                        placeholder="e.g., Business, News"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
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
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="publicationDate">Date Published</Label>
                    <Input
                      id="publicationDate"
                      type="date"
                      value={newArticle.publicationDate}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          publicationDate: e.target.value,
                        })
                      }
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
                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {uniqueSections.map((section) => (
                      <SelectItem key={section} value={section}>
                        {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        <TableHead>Headline</TableHead>
                        <TableHead>Publication</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("publicationDate")}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            <ArrowUpDown
                              className={`h-4 w-4 ${
                                sortBy === "publicationDate"
                                  ? "text-primary"
                                  : ""
                              }`}
                            />
                          </div>
                        </TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
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
                                  className="hover:underline text-primary block line-clamp-1"
                                >
                                  {article.headline}
                                </a>
                              ) : (
                                <span className="block line-clamp-1">
                                  {article.headline}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{article.byline}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{article.section}</Badge>
                            </TableCell>
                            <TableCell>{article.country}</TableCell>
                            <TableCell>
                              {article.publicationDate &&
                              !isNaN(
                                new Date(article.publicationDate).getTime()
                              )
                                ? format(
                                    new Date(article.publicationDate),
                                    "PP"
                                  )
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {getSentimentBadge(article.sentiment)}
                            </TableCell>
                            <TableCell className="text-right">
                              {article.ave?.toLocaleString()}
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
    </SidebarLayout>
  );
}
