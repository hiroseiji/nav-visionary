import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Globe, Megaphone, Calendar, MessageSquare } from "lucide-react";
import { moduleLabels } from "@/utils/reportConstants";
import { Report } from "@/hooks/useReportData";

interface ReportContentsPageProps {
  reportData: Report;
  modulesData: Record<string, any>;
  mediaTypes: string[];
}

export const ReportContentsPage = ({ reportData, modulesData, mediaTypes }: ReportContentsPageProps) => {
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
  
  // Ensure Executive Summary is first
  const sortedModules = allUniqueModules.sort((a, b) => {
    if (a === 'executiveSummary') return -1;
    if (b === 'executiveSummary') return 1;
    return 0;
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
                {sortedModules.map((module, idx) => (
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
