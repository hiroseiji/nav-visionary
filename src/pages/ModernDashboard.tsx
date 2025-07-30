import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { ArticlesTable } from '@/components/dashboard/ArticlesTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Import your existing utility functions
// import { fetchOrganizationData, generatePieChartData, generateLineData } from '../utils/dashboardUtils';

interface DashboardData {
  organizationName: string;
  totalArticles: number;
  monthlyMentions: number;
  totalKeywords: number;
  totalTopics: number;
  articles: any[];
  facebookPosts: any[];
  broadcastArticles: any[];
  printMediaArticles: any[];
}

export default function ModernDashboard() {
  const { orgId } = useParams();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [scraping, setScraping] = useState(false);

  // Sample data for demonstration - replace with actual data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sampleData: DashboardData = {
          organizationName: "First National Bank of Botswana",
          totalArticles: 14589,
          monthlyMentions: 1231,
          totalKeywords: 5,
          totalTopics: 4,
          articles: [
            {
              _id: "1",
              source: "Pressreader",
              title: "FNBB eyes green bond market...",
              snippet: "FNBB eyes green bond market...",
              publication_date: "2025-07-04",
              country: "Botswana",
              sentiment: "positive",
              ave: 31140000.00,
              coverage_type: "Not Set",
              rank: 4,
              reach: 31140000,
              url: "https://example.com",
              logo_url: ""
            }
          ],
          facebookPosts: [],
          broadcastArticles: [],
          printMediaArticles: []
        };
        
        setDashboardData(sampleData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchData();
    }
  }, [orgId]);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  };

  const handleDateClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleRefresh = async () => {
    setScraping(true);
    try {
      // Simulate scraping
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Articles refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh articles');
    } finally {
      setScraping(false);
    }
  };

  // Sample chart data - replace with actual data processing
  const currentYear = new Date().getFullYear();
  const pieData = {
    labels: ['Keyword 1', 'Keyword 2', 'Keyword 3'],
    datasets: [{
      data: [30, 40, 30],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      borderColor: ['#1e40af', '#047857', '#d97706'],
      borderWidth: 2,
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Online Articles',
        data: [1400, 1800, 1200, 1900, 1600, 2000, 1750, 1850, 1650, 1950, 1700, 1800],
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4,
      },
      {
        label: 'Social Media Posts',
        data: [800, 1200, 900, 1400, 1100, 1600, 1300, 1500, 1200, 1700, 1400, 1500],
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
      },
      {
        label: 'Broadcast Articles',
        data: [600, 800, 500, 900, 700, 1000, 850, 950, 750, 1100, 900, 1000],
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.4,
      },
      {
        label: 'Print Media Articles',
        data: [400, 600, 300, 700, 500, 800, 650, 750, 550, 900, 700, 800],
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4,
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-8 w-[100px]" />
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground">No data available</h2>
          <p className="text-muted-foreground">Please check your organization settings.</p>
        </div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {dashboardData.organizationName}'s Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor your organization's media presence across all platforms
        </p>
      </div>

      {/* Metrics Cards */}
      <DashboardMetrics
        totalArticles={dashboardData.totalArticles}
        monthlyMentions={dashboardData.monthlyMentions}
        totalKeywords={dashboardData.totalKeywords}
        totalTopics={dashboardData.totalTopics}
      />

      {/* Charts */}
      <DashboardCharts
        pieData={pieData}
        pieOptions={pieOptions}
        lineData={lineData}
        lineOptions={lineOptions}
        currentYear={currentYear}
      />

      {/* Latest News Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Latest News</CardTitle>
              <CardDescription>Recent media mentions and articles</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
                onClear={handleDateClear}
              />
              {user.role === 'super_admin' && (
                <Button
                  onClick={handleRefresh}
                  disabled={scraping}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${scraping ? 'animate-spin' : ''}`} />
                  {scraping ? 'Refreshing...' : 'Refresh Articles'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Articles Table */}
      <ArticlesTable
        articles={dashboardData.articles}
        userRole={user.role}
        orgId={orgId || ''}
      />

      {/* Additional tables would go here */}
      {/* Social Media Table, Broadcast Table, Print Media Table */}
    </div>
  );
}