import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { ReportCoverPage } from "@/components/report/ReportCoverPage";
import { ReportContentsPage } from "@/components/report/ReportContentsPage";
import { ReportModulePage } from "@/components/report/ReportModulePage";

export default function ReportResults() {
  const { orgId, reportId } = useParams();
  const navigate = useNavigate();
  const { reportData, organizationData, loading } = useReportData(orgId, reportId);
  const [currentPage, setCurrentPage] = useState(1);

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
  const allModulePages: Array<{ mediaType: string; module: string }> = [];
  const executiveSummaryPages: Array<{ mediaType: string; module: string }> = [];
  const otherModulePages: Array<{ mediaType: string; module: string }> = [];
  
  mediaTypes.forEach(mediaType => {
    const modules = Object.keys(modulesData[mediaType] || {});
    modules.forEach(module => {
      const page = { mediaType, module };
      if (module === 'executiveSummary') {
        executiveSummaryPages.push(page);
      } else {
        otherModulePages.push(page);
      }
    });
  });
  
  // Executive Summary first, then other modules
  const orderedModules = [...executiveSummaryPages, ...otherModulePages];
  const pages = ['cover', 'contents', ...orderedModules];
  
  const totalPages = pages.length;
  const currentPageData = pages[currentPage - 1];

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
        {currentPageData === 'cover' && (
          <ReportCoverPage
            gradientTop={gradientTop}
            gradientBottom={gradientBottom}
            organizationName={organizationName}
            reportCreatedAt={reportData.createdAt || reportData.created_at || ""}
            organizationLogoUrl={organizationData?.logoUrl}
          />
        )}
        {currentPageData === 'contents' && (
          <ReportContentsPage
            reportData={reportData}
            modulesData={modulesData}
            mediaTypes={mediaTypes}
          />
        )}
        {typeof currentPageData === 'object' && (
          <ReportModulePage 
            mediaType={currentPageData.mediaType} 
            moduleName={currentPageData.module}
          />
        )}

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
            {/* Always show first page */}
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
              className="w-10 h-10"
            >
              1
            </Button>

            {/* Show ellipsis if current page is far from start */}
            {currentPage > 3 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}

            {/* Show pages around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show pages within 1 of current page, but not first or last
                return page !== 1 && page !== totalPages && Math.abs(page - currentPage) <= 1;
              })
              .map((page) => (
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

            {/* Show ellipsis if current page is far from end */}
            {currentPage < totalPages - 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}

            {/* Always show last page if there's more than 1 page */}
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
