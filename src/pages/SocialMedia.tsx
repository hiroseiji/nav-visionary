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
import { Textarea } from "@/components/ui/textarea";
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
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  mapSentimentToLabel,
  mapLabelToSentiment,
} from "@/utils/sentimentUtils";

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
  url?: string;
  logo_url?: string;
  link?: string;
}

export default function SocialMedia() {
  const { orgId } = useParams();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>("all"); // Platform filter
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

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
  const [visibleCount, setVisibleCount] = useState(20);

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
    ave: 0,
    link: "",
  });

  useEffect(() => {
    if (orgId) fetchPosts();
  }, [orgId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/posts/multi`,
        {
          organizationIds: [orgId], // wrap it in an array
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const posts = response.data || [];
      setPosts(posts);
      setFilteredPosts(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load social media posts");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...posts];

    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.pageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.source?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((post) => post.source === sourceFilter);
    }

    if (sentimentFilter !== "all") {
      filtered = filtered.filter(
        (post) => mapSentimentToLabel(post.sentiment) === sentimentFilter
      );
    }

    if (groupFilter !== "all") {
      filtered = filtered.filter((post) => post.group === groupFilter);
    }

    filtered.sort((a, b) => {
      let aVal: string | number = a[sortBy as keyof SocialPost] as
        | string
        | number;
      let bVal: string | number = b[sortBy as keyof SocialPost] as
        | string
        | number;

      if (sortBy === "createdTime") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredPosts(filtered);
  }, [
    posts,
    searchQuery,
    sourceFilter,
    sentimentFilter,
    groupFilter,
    sortBy,
    sortOrder,
  ]);

  const handleAddPost = async () => {
    // 1. Required field validation
    if (!newPost.pageName.trim()) return toast.error("Page name is required.");
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
      postId: newPost.postId?.trim(), // fallback ID
      message: newPost.message.trim(),
      source: finalSource.trim(),
      group: newPost.group.trim(),
      country: newPost.country.trim(),
      link: newPost.link.trim(),
      createdTime: new Date(newPost.createdTime),
      reach: Number(newPost.reach),
      ave: Number(newPost.ave) || 0,
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
        // Backend returns the post directly in response.data
        const backendPost = response.data as SocialPost;
        const patchedPost: SocialPost = {
          ...backendPost,
          sentiment: newPost.sentiment,
        };
        setPosts((prev) => [patchedPost, ...prev]);
        toast.success("Post added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
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
      postId: newPost.postId?.trim() ?? editingPost.postId,
      message: newPost.message.trim(),
      source: finalSource?.trim(),
      group: newPost.group?.trim(),
      country: newPost.country?.trim(),
      createdTime: format(new Date(newPost.createdTime), "yyyy-MM-dd"),
      reach: Number(newPost.reach),
      ave: Number(newPost.ave),
      sentiment: mapLabelToSentiment(newPost.sentiment),
      link: newPost.link?.trim(),
    };

    // Snapshot for rollback
    const prevPosts = posts;

    // Optimistic UI copy (mirroring print handler)
    const optimistic: SocialPost = {
      ...editingPost,
      pageName: payload.pageName ?? editingPost.pageName,
      postId: payload.postId ?? editingPost.postId,
      message: payload.message ?? editingPost.message,
      source: payload.source ?? editingPost.source,
      group: payload.group ?? editingPost.group,
      country: payload.country ?? editingPost.country,
      createdTime: payload.createdTime ?? editingPost.createdTime,
      reach: payload.reach ?? editingPost.reach,
      ave: payload.ave ?? editingPost.ave,
      sentiment: mapSentimentToLabel(payload.sentiment),
      link: payload.link ?? editingPost.link,
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
      "facebook",
      "twitter",
      "instagram",
      "linkedin",
      "tiktok",
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
      postId: post.postId ?? "",
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
      ave: Number(post.ave ?? 0),
      link: post.link ?? "",
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
      ave: 0,
      link: "",
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
    new Set(posts.map((p) => p.source).filter(Boolean))
  ); // Platform options
  const uniqueGroups = Array.from(
    new Set(posts.map((p) => p.group).filter(Boolean))
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
                  <Label htmlFor="link">Post Link</Label>
                  <Input
                    id="link"
                    value={newPost.link}
                    onChange={(e) =>
                      setNewPost({ ...newPost, link: e.target.value })
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
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
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
                  <div className="grid gap-2">
                    <Label htmlFor="ave">AVE</Label>
                    <Input
                      id="ave"
                      type="number"
                      value={newPost.ave}
                      onChange={(e) =>
                        setNewPost({
                          ...newPost,
                          ave: Number(e.target.value),
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Posts ({filteredPosts.length})</CardTitle>
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
                    {filteredPosts.slice(0, visibleCount).map((post) => (
                      <TableRow key={post._id}>
                        <TableCell className="max-w-md">
                          <div className="flex items-start gap-3">
                            {post.logo_url && (
                              <img
                                src={post.logo_url}
                                alt={post.pageName}
                                className="w-10 h-10 rounded-full border-2 border-border object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              {post.link ? (
                                <a
                                  href={post.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="line-clamp-2 hover:underline text-primary cursor-pointer"
                                >
                                  {post.message}
                                </a>
                              ) : (
                                <div className="line-clamp-2">
                                  {post.message}
                                </div>
                              )}
                              {post.link && (
                                <a
                                  href={post.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                >
                                </a>
                              )}
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
                {filteredPosts.length > visibleCount && (
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
