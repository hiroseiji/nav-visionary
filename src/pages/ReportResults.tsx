import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, FileText, BarChart3, Globe, Megaphone, Calendar, MessageSquare } from "lucide-react";
import socialLightLogo from "/socialDark.png";
import reportsBg from "@/assets/reportsBg.png";
import { ExecutiveSummary } from "@/components/report-modules/ExecutiveSummary";
import { MediaSummary } from "@/components/report-modules/MediaSummary";
import { SentimentTrend } from "@/components/report-modules/SentimentTrend";
import { ReputationalRisks } from "@/components/report-modules/ReputationalRisks";
import { ReputationalOpportunities } from "@/components/report-modules/ReputationalOpportunities";
import { IssueImpact } from "@/components/report-modules/IssueImpact";
import { TopSources } from "@/components/report-modules/TopSources";
import { VolumeAndSentiment } from "@/components/report-modules/VolumeAndSentiment";
import { WordCloud } from "@/components/report-modules/WordCloud";
import { KPIPerformance } from "@/components/report-modules/KPIPerformance";
import { TopJournalists } from "@/components/report-modules/TopJournalists";
import { SectorRanking } from "@/components/report-modules/SectorRanking";

interface Report {
  _id: string;
  title: string;
  modules: string[] | Record<string, boolean>;
  scope: string[];
  createdBy: string;
  createdAt: string;
  created_at?: string;
  organizationId?: string;
}

interface Organization {
  _id: string;
  organizationName: string;
  alias?: string;
  logoUrl?: string;
  gradientTop?: string;
  gradientBottom?: string;
}

export default function ReportResults() {
  const { orgId, reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<Report | null>(null);
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/generated-reports/${orgId}`
        );
        const report = res.data.find((r: Report) => r._id === reportId);
        if (report) {
          setReportData(report);
          
          // Fetch organization data
          if (report.organizationId || orgId) {
            try {
              const orgRes = await axios.get(
                `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${report.organizationId || orgId}`
              );
              setOrganizationData(orgRes.data);
            } catch (orgErr) {
              console.error("Failed to fetch organization:", orgErr);
            }
          }
        } else {
          toast.error("Report not found");
          navigate(`/reports/${orgId}`);
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    if (orgId && reportId) {
      fetchReport();
    }
  }, [orgId, reportId, navigate]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (!reportData) {
    return (
      <SidebarLayout>
        <div className="container mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate(`/reports/${orgId}`)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report not found</h3>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const gradientTop = organizationData?.gradientTop || "#3175b6";
  const gradientBottom = organizationData?.gradientBottom || "#2e3e8a";
  const organizationName = organizationData?.alias || organizationData?.organizationName || "Organization";

  // Extract modules and media types
  const modulesData = typeof reportData.modules === "object" && !Array.isArray(reportData.modules)
    ? reportData.modules
    : {};
  
  const mediaTypes = Object.keys(modulesData);
  
  // Create pages array: [cover, contents, ...module pages]
  const pages = ['cover', 'contents', ...mediaTypes.flatMap(mediaType => {
    const modules = Object.keys(modulesData[mediaType] || {});
    return modules.map(module => ({ mediaType, module }));
  })];
  
  const totalPages = pages.length;
  const currentPageData = pages[currentPage - 1];

  const moduleLabels: Record<string, string> = {
    executiveSummary: "Executive Summary",
    mediaSummary: "Media Summary",
    sentimentTrend: "Sentiment Trend",
    reputationalRisks: "Reputational Risks",
    reputationalOpportunities: "Reputational Opportunities",
    issueImpact: "Issue Impact",
    topSources: "Top Sources",
    volumeAndSentiment: "Volume and Sentiment",
    wordCloud: "Word Cloud",
    kpiPerformance: "KPI Performance",
    topJournalists: "Top Journalists",
    sectorialCompetitor: "Sectorial Competitor",
    sectorialStakeholder: "Sectorial Stakeholder",
    sectorRanking: "Sector Ranking",
    esgAnalysis: "ESG Analysis"
  };

  const mediaTypeLabels: Record<string, string> = {
    posts: "Social Media",
    articles: "Online Media",
    broadcast: "Broadcast Media",
    printmedia: "Print Media"
  };

  const renderCoverPage = () => (
    <div 
      className="relative overflow-hidden rounded-3xl min-h-[85vh] flex flex-col"
      style={{
        background: `linear-gradient(180deg, ${gradientTop} 0%, ${gradientBottom} 100%)`,
        color: "white",
      }}
    >
      <img 
        src={reportsBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
      />
      <div className="relative z-10 pt-16 pb-8 flex justify-center">
        <img 
          src={socialLightLogo} 
          alt="Social Light" 
          className="h-16 w-auto"
        />
      </div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 -mt-20">
        <h1 className="text-6xl font-extrabold mb-6 tracking-tight">
          Media Insights Report
        </h1>
        <p className="text-2xl font-semibold opacity-90">
          Prepared for {organizationName}
        </p>
      </div>
      <div className="relative z-10 p-8 flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold opacity-95">
            {new Date(reportData.createdAt || reportData.created_at || "").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            })}
          </p>
        </div>
        {organizationData?.logoUrl && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <img 
              src={organizationData.logoUrl} 
              alt={organizationName}
              className="h-20 w-20 object-contain"
            />
          </div>
        )}
      </div>
      <div className="relative z-10 bg-black/20 py-3 px-8 flex items-center justify-between text-sm">
        <span className="opacity-80">© Social Light Botswana | {new Date().getFullYear()}</span>
        <span className="opacity-80">Unauthorized Reproduction is Prohibited</span>
      </div>
    </div>
  );

  const renderContentsPage = () => {
    // Collect all unique modules across all media types
    const allUniqueModules: string[] = [];
    const moduleSet = new Set<string>();
    
    mediaTypes.forEach(mediaType => {
      const modules = Object.keys(modulesData[mediaType] || {});
      modules.forEach(module => {
        if (!moduleSet.has(module)) {
          moduleSet.add(module);
          allUniqueModules.push(module);
        }
      });
    });

    return (
      <Card className="min-h-[85vh]">
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Report Data & Contents</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Report Data */}
            <Card className="border-2">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Volume</span>
                  </div>
                  <span className="text-lg font-bold">-</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Regions</span>
                  </div>
                  <span className="text-lg font-bold">{Array.isArray(reportData.scope) ? reportData.scope.join(", ") : "Global"}</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Reach</span>
                  </div>
                  <span className="text-lg font-bold">-</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Language</span>
                  </div>
                  <span className="text-lg font-bold">English</span>
                </div>
                
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Time Period</span>
                  </div>
                  <span className="text-lg font-bold">-</span>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Contents */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6">Contents</h3>
                <ol className="space-y-3">
                  {allUniqueModules.map((module, idx) => (
                    <li key={idx} className="flex justify-between items-center py-2 hover:bg-accent/50 px-2 rounded transition-colors">
                      <span className="font-medium">
                        {idx + 1}. {moduleLabels[module] || module}
                      </span>
                      <span className="text-sm text-muted-foreground">{idx + 3}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground italic mt-4">
            *Volume refers to mentions across selected sources, regions and time period.
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderModulePage = (mediaType: string, moduleName: string) => {
    const displayMediaType = mediaTypeLabels[mediaType] || mediaType;
    const displayModule = moduleLabels[moduleName] || moduleName;

    const renderModuleComponent = () => {
      switch (moduleName) {
        case "executiveSummary":
          return <ExecutiveSummary />;
        case "mediaSummary":
          return <MediaSummary />;
        case "sentimentTrend":
          return <SentimentTrend />;
        case "reputationalRisks":
          return <ReputationalRisks />;
        case "reputationalOpportunities":
          return <ReputationalOpportunities />;
        case "issueImpact":
          return <IssueImpact />;
        case "topSources":
          return <TopSources />;
        case "volumeAndSentiment":
          return <VolumeAndSentiment />;
        case "wordCloud":
          return <WordCloud />;
        case "kpiPerformance":
          return <KPIPerformance />;
        case "topJournalists":
          return <TopJournalists />;
        case "sectorRanking":
          return <SectorRanking />;
        default:
          return (
            <div className="bg-muted/30 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  Module content will be displayed here
                </p>
                <p className="text-sm text-muted-foreground">
                  This section would show {displayModule} data for {displayMediaType}
                </p>
              </div>
            </div>
          );
      }
    };

    return (
      <Card className="min-h-[85vh]">
        <CardContent className="p-8">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">{displayMediaType}</p>
            <h2 className="text-4xl font-bold text-foreground">{displayModule}</h2>
          </div>

          {renderModuleComponent()}
        </CardContent>
      </Card>
    );
  };

  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/reports/${orgId}`)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
        </div>

        {/* Render Current Page */}
        {currentPageData === 'cover' && renderCoverPage()}
        {currentPageData === 'contents' && renderContentsPage()}
        {typeof currentPageData === 'object' && renderModulePage(currentPageData.mediaType, currentPageData.module)}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10 h-10"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
}
