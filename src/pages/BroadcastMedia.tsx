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
import { Textarea } from "@/components/ui/textarea";
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
  Radio,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { mapSentimentToLabel } from "@/utils/sentimentUtils";

interface BroadcastArticle {
  _id: string;
  mention: string;
  station: string;
  stationType: string;
  country: string;
  mentionDT: string;
  sentiment: string;
  ave: number;
  transcript?: string;
  logo_url?: string;
  url?: string;
}

export default function BroadcastMedia() {
  const { orgId } = useParams();
  const [articles, setArticles] = useState<BroadcastArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<BroadcastArticle[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Filters
  const [stationTypeFilter, setStationTypeFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("mentionDT");
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
  const [editingArticle, setEditingArticle] = useState<BroadcastArticle | null>(
    null
  );
  const [newArticle, setNewArticle] = useState({
    mention: "",
    station: "",
    stationType: "tv",
    country: "",
    mentionDT: "",
    sentiment: "neutral",
    ave: 0,
    transcript: "",
    logo_url:"",
    url: "",
  });

  useEffect(() => {
    if (orgId) fetchArticles();
  }, [orgId]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/broadcastMedia/multi",
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
      console.error("Error fetching broadcast articles:", error);
      toast.error("Failed to load broadcast articles");
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
          article.mention?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.station?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (article) => new Date(article.mentionDT) >= startDate
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (article) => new Date(article.mentionDT) <= endDate
      );
    }

    if (stationTypeFilter !== "all") {
      filtered = filtered.filter(
        (article) => article.stationType === stationTypeFilter
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
      let aVal: string | number = a[sortBy as keyof BroadcastArticle] as
        | string
        | number;
      let bVal: string | number = b[sortBy as keyof BroadcastArticle] as
        | string
        | number;

      if (sortBy === "mentionDT") {
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
    stationTypeFilter,
    sentimentFilter,
    countryFilter,
    sortBy,
    sortOrder,
  ]);

  const handleAddArticle = async () => {
    try {
      await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/broadcast`,
        { ...newArticle, organizationId: orgId }
      );
      toast.success("Broadcast article added successfully");
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
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/broadcast/${editingArticle._id}`,
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
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/broadcast/${id}`
      );
      toast.success("Article deleted successfully");
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    }
  };

  const openEditDialog = (article: BroadcastArticle) => {
    setEditingArticle(article);
    setNewArticle({
      mention: article.mention,
      station: article.station,
      stationType: article.stationType,
      country: article.country,
      mentionDT: article.mentionDT,
      sentiment: article.sentiment,
      ave: article.ave,
      transcript: article.transcript || "",
      logo_url: article.logo_url || "",
      url: article.url || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setNewArticle({
      mention: "",
      station: "",
      stationType: "tv",
      country: "",
      mentionDT: "",
      sentiment: "neutral",
      ave: 0,
      transcript: "",
      logo_url: "",
      url: "",
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

  const uniqueCountries = Array.from(
    new Set(articles.map((a) => a.country).filter(Boolean))
  );

  const cleanMentionHeadline = (mention: string) => {
    const summaryMatch = mention.match(
      /Summary:\s*(.*?)(Entities:|Sentiment:|Insert_or_Interview:|$)/s
    );
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    return mention;
  };


  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Radio className="h-8 w-8" />
                Broadcast Media
              </h1>
              <p className="text-muted-foreground">
                Track TV and radio coverage
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
                      ? "Update the broadcast article details"
                      : "Add a new broadcast coverage entry"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mention">mention</Label>
                    <Input
                      id="mention"
                      value={newArticle.mention}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          mention: e.target.value,
                        })
                      }
                      placeholder="Story mention"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="station">Station</Label>
                      <Input
                        id="station"
                        value={newArticle.station}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            station: e.target.value,
                          })
                        }
                        placeholder="Station name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stationType">Station Type</Label>
                      <Select
                        value={newArticle.stationType}
                        onValueChange={(value) =>
                          setNewArticle({ ...newArticle, stationType: value })
                        }
                      >
                        <SelectTrigger id="stationType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tv">TV</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <Label htmlFor="mentionDT">Date Published</Label>
                    <Input
                      id="mentionDT"
                      type="date"
                      value={newArticle.mentionDT}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          mentionDT: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transcript">Transcript (Optional)</Label>
                    <Textarea
                      id="transcript"
                      value={newArticle.transcript}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          transcript: e.target.value,
                        })
                      }
                      placeholder="Story transcript or summary..."
                      rows={6}
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
                  value={stationTypeFilter}
                  onValueChange={setStationTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Station Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tv">TV</SelectItem>
                    <SelectItem value="radio">Radio</SelectItem>
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
                <CardTitle>
                  Broadcast Coverage ({filteredArticles.length})
                </CardTitle>
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
                        <TableHead>Station</TableHead>
                        <TableHead>Headline</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('mentionDT')}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            <ArrowUpDown className={`h-4 w-4 ${sortBy === 'mentionDT' ? 'text-primary' : ''}`} />
                          </div>
                        </TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('ave')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            AVE
                            <ArrowUpDown className={`h-4 w-4 ${sortBy === 'ave' ? 'text-primary' : ''}`} />
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
                            <TableCell className="max-w-md">
                              <div className="flex items-center gap-3">
                                {article.logo_url && (
                                  <img
                                    src={article.logo_url}
                                    alt={article.station}
                                    className="w-10 h-10 rounded-full border-2 border-border object-cover flex-shrink-0"
                                  />
                                )}
                                <span className="font-medium">
                                  {article.station}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md">
                              {article.url ? (
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline text-primary block line-clamp-1"
                                >
                                  {cleanMentionHeadline(article.mention)}
                                </a>
                              ) : (
                                <span className="line-clamp-1">
                                  {cleanMentionHeadline(article.mention)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="uppercase">
                                {article.stationType}
                              </Badge>
                            </TableCell>
                            <TableCell>{article.country}</TableCell>
                            <TableCell>
                              {article.mentionDT &&
                              !isNaN(new Date(article.mentionDT).getTime())
                                ? format(new Date(article.mentionDT), "PP")
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
      </div>
    </SidebarLayout>
  );
}
