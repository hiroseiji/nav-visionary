import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState("posts");
  const [granularity, setGranularity] = useState("month");
  const [totalArticles, setTotalArticles] = useState(0);
  const [monthlyMentions, setMonthlyMentions] = useState(0);
  const navigate = useNavigate();

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg = localStorage.getItem("selectedOrg");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const orgId = user.role === "super_admin" ? selectedOrg : user.organizationId;
        // Add your analytics API calls here
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        toast.error("Failed to load analytics data.");
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, selectedOrg, navigate]);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2">Comprehensive analytics and insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posts">Social Posts</SelectItem>
                <SelectItem value="articles">Online Articles</SelectItem>
                <SelectItem value="broadcast">Broadcast</SelectItem>
                <SelectItem value="print">Print Media</SelectItem>
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* First Card - Primary Blue */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Total Mentions</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-primary-foreground/30 hover:border-primary-foreground/50 cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of brand mentions across all channels</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">{totalArticles.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-white/20">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm text-primary-foreground/90">Increased from last month</span>
                </div>
              </div>
            </div>

            {/* Second Card - White */}
            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">This Month</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of mentions this month</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">{monthlyMentions.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-muted">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Increased from last month</span>
                </div>
              </div>
            </div>

            {/* Third Card - White */}
            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Active Topics</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Active media channels being monitored</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">12</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-muted">
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Same as last month</span>
                </div>
              </div>
            </div>

            {/* Fourth Card - White */}
            <div className="bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium">Engagement Rate</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full p-2 border-2 border-[#1e40af] hover:border-[#1e3a8a] cursor-help transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-[#1e40af]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average engagement rate across all content</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-bold">87%</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-1.5 bg-muted">
                    <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Decreased from last month</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mentions Over Time</CardTitle>
                <CardDescription>Tracking your brand mentions across all channels</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart visualization will be integrated here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Keywords</CardTitle>
                <CardDescription>Most mentioned keywords in your content</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Keyword cloud and distribution will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>Where your mentions are coming from</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Source breakdown charts will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Coverage</CardTitle>
                <CardDescription>Map of your brand's geographic reach</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Geographic map visualization will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
