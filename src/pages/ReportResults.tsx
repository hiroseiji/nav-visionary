import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, FileText } from "lucide-react";

interface Report {
  _id: string;
  title: string;
  modules: string[] | Record<string, boolean>;
  scope: string[];
  createdBy: string;
  createdAt: string;
  created_at?: string;
}

export default function ReportResults() {
  const { orgId, reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/generated-reports/${orgId}`
        );
        const report = res.data.find((r: Report) => r._id === reportId);
        if (report) {
          setReportData(report);
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

  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/reports/${orgId}`)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">{reportData.title || "Untitled Report"}</h1>
          <p className="text-muted-foreground mt-2">
            Created by {reportData.createdBy} on {new Date(reportData.createdAt || reportData.created_at || "").toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Modules</h3>
              <div className="flex flex-wrap gap-2">
                {(typeof reportData.modules === "object" && !Array.isArray(reportData.modules)
                  ? Object.keys(reportData.modules)
                  : Array.isArray(reportData.modules)
                  ? reportData.modules
                  : []
                ).map((module, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                    {module}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Scope</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(reportData.scope) ? reportData.scope : []).map((country, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Report visualizations and detailed analytics will be displayed here. This is a placeholder for the full report viewing functionality.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
