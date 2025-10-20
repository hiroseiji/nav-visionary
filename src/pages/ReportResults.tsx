import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { ReportCoverPage } from "@/components/report/ReportCoverPage";
import { ReportContentsPage } from "@/components/report/ReportContentsPage";
import { ReportModulePage } from "@/components/report/ReportModulePage";

/* ---------- Local types ---------- */
type ModulePage = { mediaType: string; module: string };
type Page = "cover" | "contents" | ModulePage;

type ModulesByMedia = Record<string, Record<string, boolean>>; // mediaType -> { module: enabled }

/* ---------- Helpers ---------- */
function normalizeModules(mods: unknown): ModulesByMedia {
  if (!mods || typeof mods !== "object" || Array.isArray(mods)) return {};

  const obj = mods as Record<string, unknown>;
  const entries = Object.entries(obj);

  // Flat shape? (every value is boolean)
  if (entries.length && entries.every(([, v]) => typeof v === "boolean")) {
    return { articles: obj as Record<string, boolean> }; // default bucket
  }

  // Nested shape
  const out: ModulesByMedia = {};
  for (const [media, val] of entries) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const innerObj = val as Record<string, unknown>;
      const inner: Record<string, boolean> = {};
      for (const [mod, enabled] of Object.entries(innerObj)) {
        if (typeof enabled === "boolean") inner[mod] = enabled;
        else if (enabled && typeof enabled === "object") inner[mod] = true; // tolerate truthy objects
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
  const { reportData, organizationData, loading } = useReportData(
    orgId,
    reportId
  );
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Build modules & pages with safe fallbacks so hooks run even while loading
  const modulesData = useMemo<ModulesByMedia>(() => {
    const mods = normalizeModules(reportData?.modules); // existing
    return {
      ...mods,
      articles: {
        ...(mods.articles || {}),
        executiveSummary: true,
        sentimentTrend: true,
      },
    };
  }, [reportData?.modules]);

  const mediaTypes: string[] = useMemo(
    () => Object.keys(modulesData),
    [modulesData]
  );

  // --- Guarantee: Executive Summary is FIRST (exactly one), then everything else in natural order ---
  const orderedModules: ModulePage[] = useMemo(() => {
    const all: ModulePage[] = [];
    for (const mediaType of mediaTypes) {
      const mods = modulesData[mediaType] || {};
      for (const [module, enabled] of Object.entries(mods)) {
        if (!enabled) continue;
        all.push({ mediaType, module });
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
            onClick={() => navigate(`/reports/${orgId ?? ""}`)}
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
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/reports/${orgId ?? ""}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {Math.min(Math.max(currentPage, 1), totalPages)} of{" "}
              {totalPages}
            </span>
          </div>
        </div>

        {/* Render Current Page */}
        {currentPageData === "cover" && (
          <ReportCoverPage
            gradientTop={gradientTop}
            gradientBottom={gradientBottom}
            organizationName={organizationName}
            reportCreatedAt={getReportCreatedAt(reportData)}
            organizationLogoUrl={organizationData?.logoUrl}
          />
        )}

        {currentPageData === "contents" && (
          <ReportContentsPage
            reportData={reportData}
            modulesData={modulesData}
            mediaTypes={mediaTypes}
          />
        )}

        {typeof currentPageData === "object" &&
          currentPageData !== null &&
          "mediaType" in currentPageData && (
            <ReportModulePage
              mediaType={currentPageData.mediaType}
              moduleName={currentPageData.module}
              reportData={reportData}
            />
          )}

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
