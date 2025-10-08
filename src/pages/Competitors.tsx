import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, ThumbsUp, ThumbsDown, Minus, Plus } from "lucide-react";

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

interface Article {
  _id: string;
  title: string;
  source: string;
  sentiment: string;
  publication_date: string;
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
  const navigate = useNavigate();

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg = localStorage.getItem("selectedOrg");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchCompetitorData = async () => {
      try {
        const orgId = user.role === "super_admin" ? selectedOrg : user.organizationId;
        
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
  }, [user, selectedOrg, navigate]);

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === "positive") return <ThumbsUp className="h-4 w-4 text-green-500" />;
    if (sentiment === "negative") return <ThumbsDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentBadge = (sentiment: string) => {
    const variant = sentiment === "positive" ? "default" : sentiment === "negative" ? "destructive" : "secondary";
    return <Badge variant={variant}>{sentiment}</Badge>;
  };

  const renderArticleTable = (articles: Article[], type: string) => {
    const filtered = articles
      .filter(a => searchQuery ? a.title?.toLowerCase().includes(searchQuery.toLowerCase()) : true)
      .filter(a => sentimentFilter === "all" ? true : a.sentiment === sentimentFilter)
      .slice(0, visibleArticles);

    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Date</TableHead>
                {type === "online" && <TableHead>Country</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === "online" ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    No articles found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((article) => (
                  <TableRow key={article._id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>{article.source}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(article.sentiment)}
                        {getSentimentBadge(article.sentiment)}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(article.publication_date).toLocaleDateString()}</TableCell>
                    {type === "online" && <TableCell>{article.country || "N/A"}</TableCell>}
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
