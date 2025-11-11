import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Download, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useReportData } from "@/hooks/useReportData";
import { ReportCoverPage } from "@/components/report/ReportCoverPage";
import { ReportContentsPage } from "@/components/report/ReportContentsPage";
import { ReportModulePage } from "@/components/report/ReportModulePage";
import { exportReportAsPDF, exportReportAsPPT } from "@/utils/reportExport";
import { moduleLabels } from "@/utils/reportConstants";

/* ---------- Local types ---------- */
type MediaKey = "articles" | "printmedia" | "broadcast" | "posts";
type ModuleName =
  | "executiveSummary"
  | "mediaSummary"
  | "sentimentTrend"
  | "topSources"
  | "topJournalists"
  | "volumeAndSentiment"
  | "wordCloud"
  | "kpiPerformance"
  | "sectorRanking"
  | "sectorialCompetitor"
  | "sectorialStakeholder"
  | "issueVisibility"
  | "issueImpact"
  | "reputationalRisks"
  | "reputationalOpportunities"
  | "esgAnalysis";

type ModulePage = { mediaType: MediaKey; module: ModuleName };
type Page = "cover" | "contents" | ModulePage;

type ModulesByMedia = Record<string, Record<string, boolean>>; // mediaType -> { module: enabled }

/* ---------- Helpers ---------- */
function normalizeModules(mods: unknown): ModulesByMedia {
  if (!mods || typeof mods !== "object") return {};

  // Handle top-level: modules is an array of module names
  if (Array.isArray(mods)) {
    const inner: Record<string, boolean> = {};
    for (const mod of mods) {
      if (typeof mod === "string") inner[mod] = true;
    }
    return Object.keys(inner).length ? { articles: inner } : {};
  }

  const obj = mods as Record<string, unknown>;
  const entries = Object.entries(obj);

  // Case 1: flat map of booleans -> assume articles
  if (
    entries.length &&
    entries.every(
      ([, v]) =>
        typeof v === "boolean" ||
        (Array.isArray(v) && v.every((m) => typeof m === "string"))
    )
  ) {
    const inner: Record<string, boolean> = {};
    for (const [key, v] of entries) {
      if (typeof v === "boolean") {
        if (v) inner[key] = true;
      } else if (Array.isArray(v)) {
        v.forEach((m) => {
          if (typeof m === "string") inner[m] = true;
        });
      }
    }
    return { articles: inner };
  }

  // Case 2: nested per-media
  const out: ModulesByMedia = {};

  for (const [media, val] of entries) {
    if (!val) continue;

    // modules.media = ["executiveSummary", "mediaSummary"]
    if (Array.isArray(val)) {
      const inner: Record<string, boolean> = {};
      val.forEach((m) => {
        if (typeof m === "string") inner[m] = true;
      });
      if (Object.keys(inner).length) out[media] = inner;
      continue;
    }

    // modules.media = { moduleName: true | { ... } }
    if (typeof val === "object") {
      const innerObj = val as Record<string, unknown>;
      const inner: Record<string, boolean> = {};
      for (const [mod, enabled] of Object.entries(innerObj)) {
        if (typeof enabled === "boolean") {
          if (enabled) inner[mod] = true;
        } else if (enabled && typeof enabled === "object") {
          inner[mod] = true;
        }
      }
      if (Object.keys(inner).length) out[media] = inner;
    }
  }

  return out;
}

type CreatedAtLike = { createdAt?: string; created_at?: string };
const getReportCreatedAt = (r?: CreatedAtLike) =>
  r?.createdAt ?? r?.created_at ?? "";

/* ---------- Component ---------- */
export default function ReportResults() {
  const { orgId, reportId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reportData, organizationData, loading } = useReportData(
    orgId,
    reportId
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [showEmptyModules, setShowEmptyModules] = useState(false);

  // Build modules & pages with safe fallbacks so hooks run even while loading
  const modulesData = useMemo<ModulesByMedia>(() => {
    // First try to get modules from formData.mediaSelections (old API format)
const formData = reportData?.formData as { mediaSelections?: Array<{ mediaType?: string; selectedModules?: string[] }> } | undefined;
if (formData?.mediaSelections && Array.isArray(formData.mediaSelections)) {
  const result: ModulesByMedia = {};
  formData.mediaSelections.forEach((entry) => {
    if (entry.mediaType && Array.isArray(entry.selectedModules)) {
      result[entry.mediaType] = {};
      entry.selectedModules.forEach((mod: string) => {
        result[entry.mediaType][mod] = true;
      });
    }
  });
      
      // Always ensure executiveSummary is included (but not sentimentTrend)
      // Find the first media type with modules and add executive summary to it
      const firstMediaType = Object.keys(result)[0];
      if (firstMediaType) {
        result[firstMediaType].executiveSummary = true;
      }
      
      console.log("[ReportResults] Using formData.mediaSelections:", result);
      return result;
    }

    // Fallback: try normalizeModules on reportData.modules
    const mods = normalizeModules(reportData?.modules);
    console.log("[ReportResults] Using normalized modules:", mods);
    
    // Ensure executiveSummary is always included in the first media type
    const firstMediaType = Object.keys(mods)[0];
    if (firstMediaType) {
      return {
        ...mods,
        [firstMediaType]: {
          ...(mods[firstMediaType] || {}),
          executiveSummary: true,
        },
      };
    }
    
    return mods;
  }, [reportData]);

  const mediaTypes: string[] = useMemo(
    () => Object.keys(modulesData),
    [modulesData]
  );

  // Helper function to check if a module has data
  const hasModuleData = (mediaType: MediaKey, moduleName: ModuleName): boolean => {
    const formDataUnknown = (reportData as { formData?: unknown }).formData;
    const formData = formDataUnknown && typeof formDataUnknown === "object" 
      ? (formDataUnknown as Record<string, unknown>) 
      : undefined;

    const dataSource = {
      ...(reportData || {}),
      ...(formData ?? {}),
    };

    // Executive summary check
    if (moduleName === "executiveSummary") {
      const execData = (dataSource as any).executiveSummary;
      return !!execData && (
        (typeof execData === "object" && Object.keys(execData).length > 0) ||
        (typeof execData === "string" && execData.trim().length > 0)
      );
    }

    // Sentiment trend check
    if (moduleName === "sentimentTrend") {
      const mediaBucket = (dataSource as any)[mediaType];
      const sentimentData = mediaBucket?.sentimentTrend || (dataSource as any).sentimentTrend || [];
      return Array.isArray(sentimentData) && sentimentData.length > 0;
    }

    // Other modules
    const mediaBucket = (dataSource as any)[mediaType];
    const moduleData = mediaBucket?.[moduleName];
    
    if (!moduleData) return false;
    
    if (Array.isArray(moduleData)) {
      return moduleData.length > 0;
    }
    
    if (typeof moduleData === "object") {
      return Object.keys(moduleData).length > 0;
    }
    
    return !!moduleData;
  };

  // --- Guarantee: Executive Summary is FIRST (exactly one), then everything else in natural order ---
  const allModules: ModulePage[] = useMemo(() => {
    const all: ModulePage[] = [];
    for (const mediaType of mediaTypes) {
      const mods = modulesData[mediaType] || {};
      for (const [module, enabled] of Object.entries(mods)) {
        if (!enabled) continue;
        all.push({ mediaType: mediaType as MediaKey, module: module as ModuleName });
      }
    }

    // Pull all executive summaries (if multiple media types have it)
    const execCandidates = all.filter((m) => m.module === "executiveSummary");

    // Choose one: prefer 'articles' if available, else the first one found
    const execPick =
      execCandidates.find((m) => m.mediaType === "articles") ??
      execCandidates[0];

    // Everything else (exclude ALL execs)
    const rest = all.filter((m) => m.module !== "executiveSummary");

    // If we found an exec, put it first; otherwise just the rest
    return execPick ? [execPick, ...rest] : rest;
  }, [mediaTypes, modulesData]);

  // Filter modules based on showEmptyModules state
  const orderedModules: ModulePage[] = useMemo(() => {
    if (showEmptyModules || !reportData) {
      return allModules;
    }
    
    return allModules.filter((module) => 
      hasModuleData(module.mediaType, module.module)
    );
  }, [allModules, showEmptyModules, reportData]);

  // Get empty modules with their names
  const emptyModules = useMemo(() => {
    if (!reportData) return [];
    return allModules
      .filter((module) => !hasModuleData(module.mediaType, module.module))
      .map((module) => moduleLabels[module.module] || module.module);
  }, [allModules, reportData]);

  const emptyModulesCount = emptyModules.length;

  const pages: Page[] = useMemo<Page[]>(
    () => ["cover", "contents", ...orderedModules],
    [orderedModules]
  );

  // after orderedModules
  const MODULE_START_PAGE = 3;

  const pageIndexByKey = useMemo(() => {
    const m = new Map<string, number>();
    orderedModules.forEach((p, i) => {
      m.set(`${p.mediaType}:${p.module}`, MODULE_START_PAGE + i);
    });
    return m;
  }, [orderedModules]);

  const firstExec = orderedModules.find((p) => p.module === "executiveSummary");
  const execPageNumber = firstExec
    ? pageIndexByKey.get(`${firstExec.mediaType}:${firstExec.module}`)
    : undefined;

  const totalPages = pages.length;

  // Keep currentPage in range if data changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const currentPageData = pages[currentPage - 1];

  // Organization visuals (safe defaults)
  const gradientTop = organizationData?.gradientTop || "#3175b6";
  const gradientBottom = organizationData?.gradientBottom || "#2e3e8a";
  const organizationName =
    organizationData?.alias ||
    organizationData?.organizationName ||
    "Organization";

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      toast({
        title: "Exporting PDF",
        description: "Preparing your report...",
      });

      await exportReportAsPDF(
        organizationName,
        totalPages,
        setCurrentPage,
        (current, total) => setExportProgress({ current, total })
      );

      toast({
        title: "Success",
        description: "Report exported as PDF successfully!",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export report as PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  const handleExportPPT = async () => {
    setIsExporting(true);
    try {
      toast({
        title: "Exporting PowerPoint",
        description: "Preparing your report...",
      });

      await exportReportAsPPT(
        organizationName,
        totalPages,
        setCurrentPage,
        (current, total) => setExportProgress({ current, total })
      );

      toast({
        title: "Success",
        description: "Report exported as PowerPoint successfully!",
      });
    } catch (error) {
      console.error("PPT export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export report as PowerPoint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  /* ---------- Early returns AFTER all hooks ---------- */
  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (!reportData) {
    return (
      <SidebarLayout>
        <div className="container mx-auto p-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/reports/${orgId ?? ""}?highlight=${reportId ?? ""}`)}
          >
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

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        {/* Empty Modules Alert */}
        {emptyModulesCount > 0 && (
          <Alert className="border-muted-foreground/20">
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>
                  {showEmptyModules 
                    ? `Showing all modules (${emptyModules.join(', ')} with no data)`
                    : `${emptyModules.join(', ')} excluded (no data)`
                  }
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmptyModules(!showEmptyModules)}
              >
                {showEmptyModules ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Empty Modules
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show All Modules
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() =>
              navigate(`/reports/${orgId ?? ""}?highlight=${reportId ?? ""}`)
            }
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPPT}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PowerPoint
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {Math.min(Math.max(currentPage, 1), totalPages)} of{" "}
                {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Export Progress Overlay */}
        {isExporting && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card border rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <h3 className="text-lg font-semibold">Exporting Report</h3>
                {exportProgress.total > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Processing page {exportProgress.current} of{" "}
                      {exportProgress.total}
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (exportProgress.current / exportProgress.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Please wait while we prepare your document...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden export container (light mode forced) */}
        <div className="fixed -left-[9999px] top-0 light" data-export-container>
          <div data-export-page className="bg-white">
            {currentPageData === "cover" && (
              <ReportCoverPage
                gradientTop={gradientTop}
                gradientBottom={gradientBottom}
                organizationName={organizationName}
                startDate={
                  (reportData?.startDate ||
                    reportData?.formData?.startDate) as string
                }
                endDate={
                  (reportData?.endDate ||
                    reportData?.formData?.endDate) as string
                }
                organizationLogoUrl={organizationData?.logoUrl}
              />
            )}

            {currentPageData === "contents" && (
              <ReportContentsPage
                reportData={reportData}
                modulesData={modulesData}
                mediaTypes={mediaTypes}
                onNavigateToPage={setCurrentPage}
              />
            )}

            {typeof currentPageData === "object" &&
              currentPageData !== null &&
              "mediaType" in currentPageData && (
                <ReportModulePage
                  mediaType={currentPageData.mediaType}
                  moduleName={currentPageData.module}
                  reportData={reportData}
                  pageNumber={currentPage}
                  organizationName={organizationName}
                  organizationLogoUrl={organizationData?.logoUrl}
                  industryName={organizationData?.industry}
                />
              )}
          </div>
        </div>

        {/* Render Current Page (visible) */}
        <div data-report-page>
          {currentPageData === "cover" && (
            <ReportCoverPage
              gradientTop={gradientTop}
              gradientBottom={gradientBottom}
              organizationName={organizationName}
              // startDate={(reportData?.startDate || reportData?.formData?.startDate) as string}
              // endDate={(reportData?.endDate || reportData?.formData?.endDate) as string}
              startDate={reportData?.startDate}
              endDate={reportData?.endDate}
              organizationLogoUrl={organizationData?.logoUrl}
            />
          )}

          {currentPageData === "contents" && (
            <ReportContentsPage
              reportData={reportData}
              modulesData={modulesData}
              mediaTypes={mediaTypes}
              onNavigateToPage={setCurrentPage}
            />
          )}

          {typeof currentPageData === "object" &&
            currentPageData !== null &&
            "mediaType" in currentPageData && (
              <ReportModulePage
                mediaType={currentPageData.mediaType}
                moduleName={currentPageData.module}
                reportData={reportData}
                pageNumber={currentPage}
                organizationName={organizationName}
                organizationLogoUrl={organizationData?.logoUrl}
                industryName={organizationData?.industry}
              />
            )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {/* First */}
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
              className="w-10 h-10"
            >
              1
            </Button>

            {/* Left ellipsis */}
            {currentPage > 3 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}

            {/* Middle neighbors */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p !== 1 && p !== totalPages && Math.abs(p - currentPage) <= 1
              )
              .map((p) => (
                <Button
                  key={p}
                  variant={currentPage === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className="w-10 h-10"
                >
                  {p}
                </Button>
              ))}

            {/* Right ellipsis */}
            {currentPage < totalPages - 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}

            {/* Last */}
            {totalPages > 1 && (
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                className="w-10 h-10"
              >
                {totalPages}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
}
