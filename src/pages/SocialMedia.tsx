import React, { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  Plus,
  MoreVertical,
  ArrowUpDown,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  mapSentimentToLabel,
  mapLabelToSentiment,
} from "@/utils/sentimentUtils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SocialPost {
  _id: string;
  pageName: string;
  postId: string;
  message: string;
  source: string; // This is the platform (facebook, twitter, etc.)
  group: string;
  country: string;
  createdTime: string;
  sentiment: string;
  rank: number;
  reach: number;
  ave: number;
  logo_url?: string;
  link?: string;
}

export default function SocialMedia() {
  const { orgId } = useParams();
  const fetchSeq = useRef(0);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>("all"); // Platform filter
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("createdTime");
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Add/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [newPost, setNewPost] = useState({
    pageName: "",
    postId: "",
    message: "",
    source: "facebook",
    sourceCustom: "",
    group: "",
    country: "",
    createdTime: "",
    sentiment: "",
    reach: 0,
  });

  useEffect(() => {
    if (orgId) fetchPosts();
  }, [orgId]);

  // Refetch when filters change
  useEffect(() => {
    if (orgId) {
      setCurrentPage(1);
      fetchPosts(1, 30, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    startDate,
    endDate,
    sourceFilter,
    groupFilter,
    countryFilter,
    sentimentFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchPosts = async (page = 1, limit = 30, append = false) => {
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
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      if (groupFilter !== "all") params.append("group", groupFilter);
      if (countryFilter !== "all") params.append("country", countryFilter);
      if (sentimentFilter !== "all")
        params.append("sentiment", sentimentFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const res = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/posts/multi2?${params.toString()}`,
        { organizationIds: Array.isArray(orgId) ? orgId : [orgId] },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (seq !== fetchSeq.current) return;

      const data = res.data;
      const list = Array.isArray(data.items) ? data.items : [];

      if (append) {
        setPosts((prev) => [...prev, ...list]);
        setFilteredPosts((prev) => [...prev, ...list]);
      } else {
        setPosts(list);
        setFilteredPosts(list);
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
      console.error("Error fetching social posts:", e);
      toast.error("Failed to load social posts");
      return null;
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    await fetchPosts(nextPage, 50, true);
  };

  // Client-side filtering removed - now handled by backend

  const handleAddPost = async () => {
    // 1. Required field validation
    if (!newPost.pageName.trim()) return toast.error("Page name is required.");
    if (!newPost.postId.trim()) return toast.error("Post URL is required.");
    if (!newPost.message.trim())
      return toast.error("Post message is required.");
    if (!newPost.source) return toast.error("Platform is required.");
    if (!newPost.sentiment) return toast.error("Sentiment is required.");
    if (!newPost.createdTime) return toast.error("Date published is required.");
    if (!newPost.reach || Number(newPost.reach) <= 0)
      return toast.error("Reach is required.");

    // Handle "other" platform
    const finalSource =
      newPost.source === "other"
        ? newPost.sourceCustom?.trim()
        : newPost.source;

    if (!finalSource) return toast.error("Please specify the platform.");

    // 2. Clean + structured payload (same style as print)
    const payload = {
      pageName: newPost.pageName.trim(),
      postId: newPost.postId.trim(),
      message: newPost.message.trim(),
      source: finalSource.trim(),
      group: newPost.group.trim(),
      country: newPost.country.trim(),
      createdTime: new Date(newPost.createdTime),
      reach: Number(newPost.reach),
      sentiment: mapLabelToSentiment(newPost.sentiment),
      organizationId: orgId,
    };

    setSaving(true);
    try {
      const response = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/posts`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201) {
        const saved = response.data.post as SocialPost;
        const patchedPost: SocialPost = {
          ...saved,
          sentiment: newPost.sentiment,
        };
        setPosts((prev) => [patchedPost, ...prev]);
        toast.success("Post added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to add post"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !orgId) return;
    setSaving(true);

    // Resolve platform (supporting "other")
    const finalSource =
      newPost.source === "other"
        ? newPost.sourceCustom?.trim()
        : newPost.source;

    const payload = {
      pageName: newPost.pageName.trim(),
      postId: editingPost.postId,
      link: newPost.postId?.trim(),
      message: newPost.message.trim(),
      source: finalSource?.trim(),
      group: newPost.group?.trim(),
      country: newPost.country?.trim(),
      createdTime: format(new Date(newPost.createdTime), "yyyy-MM-dd"),
      reach: Number(newPost.reach),
      sentiment: mapLabelToSentiment(newPost.sentiment),
    };

    // Snapshot for rollback
    const prevPosts = posts;

    // Optimistic UI copy (mirroring print handler)
    const optimistic: SocialPost = {
      ...editingPost,
      pageName: payload.pageName ?? editingPost.pageName,
      postId: payload.postId ?? editingPost.postId,
      link: payload.link ?? editingPost.link,
      message: payload.message ?? editingPost.message,
      source: payload.source ?? editingPost.source,
      group: payload.group ?? editingPost.group,
      country: payload.country ?? editingPost.country,
      createdTime: payload.createdTime ?? editingPost.createdTime,
      reach: payload.reach ?? editingPost.reach,
      sentiment: mapSentimentToLabel(payload.sentiment),
    };

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p._id === editingPost._id ? optimistic : p))
    );

    try {
      const res = await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/posts/${editingPost._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Post updated successfully");

      // trust backend copy if it returned one (same pattern as print)
      const updated: SocialPost = res.data?.post
        ? {
            ...optimistic,
            ...res.data.post,
            sentiment: mapSentimentToLabel(res.data.post.sentiment),
          }
        : optimistic;

      // Final UI update
      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? updated : p))
      );

      setIsDialogOpen(false);
      resetForm();

      // optional: soft revalidate
      setTimeout(() => fetchPosts(), 300);
    } catch (e) {
      // rollback on failure
      setPosts(prevPosts);

      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : "Failed to update post";

      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgId}/posts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to delete post";
      toast.error(errorMsg);
    }
  };

  const openEditDialog = (post: SocialPost) => {
    // Normalize the source
    const allowedPlatforms = [
      "Facebook",
      "Twitter",
      "Instagram",
      "Linkedin",
      "Tiktok",
    ];
    const rawSource = (post.source ?? "").toString().trim();
    const sourceLower = rawSource.toLowerCase();
    const isListed = allowedPlatforms.includes(sourceLower);

    const source = isListed ? sourceLower : "other";
    const sourceCustom = isListed ? "" : rawSource;

    // Normalize sentiment → label for UI
    const sentimentLabel =
      typeof post.sentiment === "number"
        ? mapSentimentToLabel(post.sentiment)
        : post.sentiment || "neutral";

    setEditingPost(post);

    setNewPost({
      pageName: post.pageName ?? "",
      postId: post.link
        ? post.link // use stored link
        : post.postId.startsWith("http") // if postId itself is a URL
        ? post.postId
        : post.source?.toLowerCase() === "facebook"
        ? `https://facebook.com/${post.postId}` // fallback for FB
        : post.postId,
      message: post.message ?? "",
      source, // "facebook" | "twitter" | ... | "other"
      sourceCustom, // custom text for "other"
      group: post.group ?? "",
      country: post.country ?? "",
      createdTime: post.createdTime
        ? new Date(post.createdTime).toISOString().split("T")[0]
        : "",
      sentiment: sentimentLabel.toLowerCase(),
      reach: Number(post.reach ?? 0),
    });

    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPost(null);
    setNewPost({
      pageName: "",
      postId: "",
      message: "",
      source: "facebook",
      sourceCustom: "",
      group: "",
      country: "",
      createdTime: "",
      sentiment: "neutral",
      reach: 0,
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

  const uniqueSources = Array.from(
    new Set(posts.map((a) => a.source).filter(Boolean))
  );
  const uniqueGroups = Array.from(
    new Set(posts.map((a) => a.group).filter(Boolean))
  );
  const uniqueCountries = Array.from(
    new Set(posts.map((a) => a.country).filter(Boolean))
  );

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Social Media</h1>
            <p className="text-muted-foreground">
              Monitor social media coverage and engagement
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
                Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? "Edit Post" : "Add New Post"}
                </DialogTitle>
                <DialogDescription>
                  {editingPost
                    ? "Update the post details below"
                    : "Fill in the details for the new post"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="pageName">Page Name</Label>
                  <Input
                    id="pageName"
                    value={newPost.pageName}
                    onChange={(e) =>
                      setNewPost({ ...newPost, pageName: e.target.value })
                    }
                    placeholder="Page or account name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postId">
                    Post URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="postId"
                    value={newPost.postId}
                    onChange={(e) =>
                      setNewPost({ ...newPost, postId: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newPost.message}
                    onChange={(e) =>
                      setNewPost({ ...newPost, message: e.target.value })
                    }
                    placeholder="Post content..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="source">Platform</Label>
                      <Select
                        value={newPost.source}
                        onValueChange={(value) =>
                          setNewPost({ ...newPost, source: value })
                        }
                      >
                        <SelectTrigger id="source">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Twitter">X</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Linkedin">LinkedIn</SelectItem>
                          <SelectItem value="Tiktok">TikTok</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>

                      {newPost.source === "other" && (
                        <Input
                          className="mt-2"
                          placeholder="Specify platform (e.g., Threads, YouTube)"
                          value={newPost.sourceCustom ?? ""}
                          onChange={(e) =>
                            setNewPost((s) => ({
                              ...s,
                              sourceCustom: e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newPost.country}
                      onChange={(e) =>
                        setNewPost({ ...newPost, country: e.target.value })
                      }
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="group">Group (Optional)</Label>
                  <Input
                    id="group"
                    value={newPost.group}
                    onChange={(e) =>
                      setNewPost({ ...newPost, group: e.target.value })
                    }
                    placeholder="Group name"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sentiment">Sentiment</Label>
                    <Select
                      value={newPost.sentiment}
                      onValueChange={(value) =>
                        setNewPost({ ...newPost, sentiment: value })
                      }
                    >
                      <SelectTrigger id="sentiment">
                        <SelectValue placeholder="Select sentiment" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reach">Post Reach</Label>
                    <Input
                      id="reach"
                      type="number"
                      value={newPost.reach}
                      onChange={(e) =>
                        setNewPost({
                          ...newPost,
                          reach: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="createdTime">Date Posted</Label>
                    <Input
                      id="createdTime"
                      type="date"
                      value={newPost.createdTime}
                      onChange={(e) =>
                        setNewPost({
                          ...newPost,
                          createdTime: e.target.value,
                        })
                      }
                    />
                  </div>
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
                  onClick={editingPost ? handleUpdatePost : handleAddPost}
                >
                  {editingPost ? "Update" : "Add"} Post
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
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
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {uniqueGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
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
                    onSelect={(date) => setStartDate(date)}
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
                    onSelect={(date) => setEndDate(date)}
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

        {/* Posts Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Posts ({totalCount})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading posts...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts found
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message</TableHead>
                      <TableHead>Page Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("createdTime")}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              sortBy === "createdTime" ? "text-primary" : ""
                            }`}
                          />
                        </div>
                      </TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Sentiment</TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
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
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
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
                    {filteredPosts.map((post) => (
                      <TableRow key={post._id}>
                        <TableCell className="max-w-md">
                          <div className="flex items-start gap-3">
                            {post.logo_url && (
                              <img
                                src={post.logo_url}
                                alt={post.pageName || "Source logo"}
                                className="w-10 h-10 rounded-full border-2 border-border object-cover flex-shrink-0"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              {(() => {
                                // 1) Prefer backend link
                                let href = post.link || "";

                                // 2) If no link but postId looks like a URL, use that
                                if (
                                  !href &&
                                  typeof post.postId === "string" &&
                                  post.postId.startsWith("http")
                                ) {
                                  href = post.postId;
                                }

                                // 3) Legacy fallback: Facebook by ID/slug
                                if (
                                  !href &&
                                  typeof post.postId === "string" &&
                                  post.source &&
                                  post.source.toLowerCase() === "facebook"
                                ) {
                                  href = `https://facebook.com/${post.postId}`;
                                }

                                const text =
                                  post.message && post.message.length > 0
                                    ? post.message
                                    : post.postId || "N/A";

                                if (href) {
                                  return (
                                    <>
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="line-clamp-2 hover:underline text-primary cursor-pointer"
                                      >
                                        {text}
                                      </a>
                                    </>
                                  );
                                }
                                return (
                                  <div className="line-clamp-2">{text}</div>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{post.pageName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {post.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.createdTime &&
                          !isNaN(new Date(post.createdTime).getTime())
                            ? format(new Date(post.createdTime), "PP")
                            : "N/A"}
                        </TableCell>
                        <TableCell>{post.country}</TableCell>
                        <TableCell>
                          {getSentimentBadge(post.sentiment)}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.rank?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.reach?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.ave?.toLocaleString()}
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
                                onClick={() => openEditDialog(post)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeletePost(post._id)}
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
                    Viewing {filteredPosts.length} out of {totalCount} posts
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
