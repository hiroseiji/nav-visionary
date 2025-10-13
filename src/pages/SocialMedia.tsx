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
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, ThumbsUp, ThumbsDown, Minus, ArrowUpDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { mapSentimentToLabel } from "@/utils/sentimentUtils";

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
  reach: number;
  ave: number;
  url?: string;
}

export default function SocialMedia() {
  const { orgId } = useParams();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>("all"); // Platform filter
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  
  // Sorting
  const [sortField, setSortField] = useState<string>("createdTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(20);
  
  // Add/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [newPost, setNewPost] = useState({
    pageName: "",
    postId: "",
    message: "",
    source: "facebook", // Platform field
    group: "",
    country: "",
    createdTime: "",
    sentiment: "neutral",
    reach: 0,
    ave: 0,
    url: ""
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
      filtered = filtered.filter((post) => mapSentimentToLabel(post.sentiment) === sentimentFilter);
    }

    if (groupFilter !== "all") {
      filtered = filtered.filter((post) => post.group === groupFilter);
    }

    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField as keyof SocialPost] as string | number;
      let bVal: string | number = b[sortField as keyof SocialPost] as string | number;

      if (sortField === "createdTime") {
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
  }, [posts, searchQuery, sourceFilter, sentimentFilter, groupFilter, sortField, sortOrder]);

  const handleAddPost = async () => {
    try {
      await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/facebook`,
        { ...newPost, organizationId: orgId }
      );
      toast.success("Post added successfully");
      setIsDialogOpen(false);
      fetchPosts();
      resetForm();
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error("Failed to add post");
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    try {
      await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/facebook/${editingPost._id}`,
        newPost
      );
      toast.success("Post updated successfully");
      setIsDialogOpen(false);
      fetchPosts();
      resetForm();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/facebook/${id}`
      );
      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const openEditDialog = (post: SocialPost) => {
    setEditingPost(post);
    setNewPost({
      pageName: post.pageName,
      postId: post.postId,
      message: post.message,
      source: post.source, // Platform field
      group: post.group,
      country: post.country,
      createdTime: post.createdTime,
      sentiment: post.sentiment,
      reach: post.reach,
      ave: post.ave,
      url: post.url || ""
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPost(null);
    setNewPost({
      pageName: "",
      postId: "",
      message: "",
      source: "facebook", // Platform field
      group: "",
      country: "",
      createdTime: "",
      sentiment: "neutral",
      reach: 0,
      ave: 0,
      url: ""
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

  const uniqueSources = Array.from(new Set(posts.map(p => p.source).filter(Boolean))); // Platform options
  const uniqueGroups = Array.from(new Set(posts.map(p => p.group).filter(Boolean)));

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Social Media</h1>
              <p className="text-muted-foreground">Monitor social media coverage and engagement</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPost ? "Edit Post" : "Add New Post"}</DialogTitle>
                  <DialogDescription>
                    {editingPost ? "Update the post details below" : "Fill in the details for the new post"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pageName">Page Name</Label>
                    <Input
                      id="pageName"
                      value={newPost.pageName}
                      onChange={(e) => setNewPost({ ...newPost, pageName: e.target.value })}
                      placeholder="Page or account name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newPost.message}
                      onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                      placeholder="Post content..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="source">Platform</Label>
                      <Select value={newPost.source} onValueChange={(value) => setNewPost({ ...newPost, source: value })}>
                        <SelectTrigger id="source">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={newPost.country}
                        onChange={(e) => setNewPost({ ...newPost, country: e.target.value })}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group">Group</Label>
                    <Input
                      id="group"
                      value={newPost.group}
                      onChange={(e) => setNewPost({ ...newPost, group: e.target.value })}
                      placeholder="Group name"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sentiment">Sentiment</Label>
                      <Select value={newPost.sentiment} onValueChange={(value) => setNewPost({ ...newPost, sentiment: value })}>
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
                      <Label htmlFor="reach">Reach</Label>
                      <Input
                        id="reach"
                        type="number"
                        value={newPost.reach}
                        onChange={(e) => setNewPost({ ...newPost, reach: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ave">AVE</Label>
                      <Input
                        id="ave"
                        type="number"
                        value={newPost.ave}
                        onChange={(e) => setNewPost({ ...newPost, ave: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="createdTime">Date Published</Label>
                      <Input
                        id="createdTime"
                        type="date"
                        value={newPost.createdTime}
                        onChange={(e) => setNewPost({ ...newPost, createdTime: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        value={newPost.url}
                        onChange={(e) => setNewPost({ ...newPost, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={editingPost ? handleUpdatePost : handleAddPost}>
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
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
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
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdTime">Date</SelectItem>
                      <SelectItem value="reach">Reach</SelectItem>
                      <SelectItem value="ave">AVE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No posts found</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead className="text-right">Reach</TableHead>
                        <TableHead className="text-right">AVE</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.slice(0, visibleCount).map((post) => (
                        <TableRow key={post._id}>
                          <TableCell className="max-w-md">
                            <div className="line-clamp-2">{post.message}</div>
                            {post.url && (
                              <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                                View post <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </TableCell>
                          <TableCell>{post.pageName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{post.source}</Badge>
                          </TableCell>
                          <TableCell>
                            {post.createdTime && !isNaN(new Date(post.createdTime).getTime())
                              ? format(new Date(post.createdTime), "PP")
                              : "N/A"}
                          </TableCell>
                          <TableCell>{getSentimentBadge(post.sentiment)}</TableCell>
                          <TableCell className="text-right">{post.reach?.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{post.ave?.toLocaleString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(post)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeletePost(post._id)} className="text-destructive">
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
                      <Button variant="outline" onClick={() => setVisibleCount(visibleCount + 20)}>
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
