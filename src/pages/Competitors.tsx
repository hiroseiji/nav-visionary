import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, ThumbsUp, ThumbsDown, Minus, Plus, Pencil, Trash2 } from "lucide-react";
import { mapSentimentToLabel } from "@/utils/sentimentUtils";

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

interface Article {
  _id: string;
  title: string;
  source?: string;
  station?: string;
  publication?: string;
  sentiment: string;
  publication_date?: string;
  publicationDate?: string;
  mentionDT?: string;
  country?: string;
}

export default function Competitors() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineArticles, setOnlineArticles] = useState<Article[]>([]);
  const [broadcastArticles, setBroadcastArticles] = useState<Article[]>([]);
  const [printArticles, setPrintArticles] = useState<Article[]>([]);
  const [visibleArticles, setVisibleArticles] = useState(20);
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const navigate = useNavigate();
  const { orgId } = useParams();

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!orgId) {
      navigate("/login");
      return;
    }

    const fetchCompetitorData = async () => {
      try {
        
        const [onlineRes, printRes, broadcastRes] = await Promise.all([
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/competitorArticles`),
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/printMedia`),
          axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/broadcastMedia`),
        ]);

        setOnlineArticles(onlineRes.data);
        setPrintArticles(printRes.data);
        setBroadcastArticles(broadcastRes.data);
      } catch (err) {
        console.error("Failed to fetch competitor data:", err);
        toast.error("Failed to load competitor data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitorData();
  }, [user, orgId, navigate]);

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === "positive") return <ThumbsUp className="h-4 w-4 text-green-500" />;
    if (sentiment === "negative") return <ThumbsDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentBadge = (sentiment: string | number) => {
    const normalizedSentiment = mapSentimentToLabel(sentiment);
    const variant = normalizedSentiment as "positive" | "negative" | "neutral" | "mixed";
    
    return <Badge variant={variant} className="capitalize">{normalizedSentiment}</Badge>;
  };

  const renderArticleTable = (articles: Article[], type: string) => {
    const filtered = articles
      .filter(a => searchQuery ? a.title?.toLowerCase().includes(searchQuery.toLowerCase()) : true)
      .filter(a => sentimentFilter === "all" ? true : a.sentiment === sentimentFilter)
      .slice(0, visibleArticles);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Source</TableHead>
                <TableHead className="font-medium">Sentiment</TableHead>
                <TableHead className="font-medium">Date</TableHead>
                {type === "online" && <TableHead className="font-medium">Country</TableHead>}
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === "online" ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    No articles found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((article) => (
                  <TableRow key={article._id} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                    <TableCell className="font-medium py-4 text-sm">{article.title}</TableCell>
                    <TableCell className="py-4 text-sm">
                      {type === "broadcast" ? article.station : type === "print" ? article.publication : article.source}
                    </TableCell>
                    <TableCell className="py-4">
                      {getSentimentBadge(article.sentiment)}
                    </TableCell>
                    <TableCell className="py-4 text-sm">
                      {new Date(
                        type === "broadcast" ? article.mentionDT || "" : 
                        type === "print" ? article.publicationDate || "" : 
                        article.publication_date || ""
                      ).toLocaleDateString()}
                    </TableCell>
                    {type === "online" && <TableCell className="py-4 text-sm">{article.country || "N/A"}</TableCell>}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingArticle(article._id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit article"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user?.role === 'super_admin' && (
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this article?')) {
                                try {
                                  await axios.delete(
                                    `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/competitorArticles/${article._id}`
                                  );
                                  toast.success('Article deleted successfully');
                                  // Refresh data
                                  const [onlineRes, printRes, broadcastRes] = await Promise.all([
                                    axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/competitorArticles`),
                                    axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/printMedia`),
                                    axios.get(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/organizations/${orgId}/broadcastMedia`),
                                  ]);
                                  setOnlineArticles(onlineRes.data);
                                  setPrintArticles(printRes.data);
                                  setBroadcastArticles(broadcastRes.data);
                                } catch (err) {
                                  console.error('Failed to delete article:', err);
                                  toast.error('Failed to delete article');
                                }
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete article"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {articles.length} articles</p>
            <div className="flex gap-2">
              {visibleArticles > 20 && (
                <Button variant="outline" size="sm" onClick={() => setVisibleArticles(prev => Math.max(prev - 20, 20))}>
                  <Minus className="h-4 w-4 mr-2" />
                  Show Less
                </Button>
              )}
              {visibleArticles < articles.length && (
                <Button variant="outline" size="sm" onClick={() => setVisibleArticles(prev => prev + 20)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Show More
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Competitor Analysis</h1>
          <p className="text-muted-foreground mt-2">Monitor and analyze competitor media presence</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="online" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="online">Online ({onlineArticles.length})</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast ({broadcastArticles.length})</TabsTrigger>
            <TabsTrigger value="print">Print ({printArticles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="online">
            <Card>
              <CardHeader>
                <CardTitle>Online Media Coverage</CardTitle>
                <CardDescription>Competitor mentions in online news sources</CardDescription>
              </CardHeader>
              <CardContent>
                {renderArticleTable(onlineArticles, "online")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Media Coverage</CardTitle>
                <CardDescription>Competitor mentions in TV and radio</CardDescription>
              </CardHeader>
              <CardContent>
                {renderArticleTable(broadcastArticles, "broadcast")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="print">
            <Card>
              <CardHeader>
                <CardTitle>Print Media Coverage</CardTitle>
                <CardDescription>Competitor mentions in newspapers and magazines</CardDescription>
              </CardHeader>
              <CardContent>
                {renderArticleTable(printArticles, "print")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
