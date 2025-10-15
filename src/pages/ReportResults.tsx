import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, FileText } from "lucide-react";
import socialLightLogo from "/socialDark.png";
import reportsBg from "@/assets/reportsBg.png";

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

  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/reports/${orgId}`)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>

        {/* Cover Page */}
        <div 
          className="relative overflow-hidden rounded-3xl min-h-[90vh] flex flex-col"
          style={{
            background: `linear-gradient(180deg, ${gradientTop} 0%, ${gradientBottom} 100%)`,
            color: "white",
          }}
        >
          {/* Background Pattern Overlay */}
          <img 
            src={reportsBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />

          {/* Header with Logo */}
          <div className="relative z-10 pt-16 pb-8 flex justify-center">
            <img 
              src={socialLightLogo} 
              alt="Social Light" 
              className="h-16 w-auto"
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 -mt-20">
            <h1 className="text-6xl font-extrabold mb-6 tracking-tight">
              Media Insights Report
            </h1>
            <p className="text-2xl font-semibold opacity-90">
              Prepared for {organizationName}
            </p>
          </div>

          {/* Footer Section */}
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

            {/* Organization Logo */}
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

          {/* Bottom Bar */}
          <div className="relative z-10 bg-black/20 py-3 px-8 flex items-center justify-between text-sm">
            <span className="opacity-80">© Social Light Botswana | {new Date().getFullYear()}</span>
            <span className="opacity-80">Unauthorized Reproduction is Prohibited</span>
          </div>
        </div>

        {/* Report Details Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-lg">Modules</h3>
              <div className="flex flex-wrap gap-2">
                {(typeof reportData.modules === "object" && !Array.isArray(reportData.modules)
                  ? Object.keys(reportData.modules)
                  : Array.isArray(reportData.modules)
                  ? reportData.modules
                  : []
                ).map((module, i) => (
                  <span key={i} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                    {module}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Scope</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(reportData.scope) ? reportData.scope : []).map((country, i) => (
                  <span key={i} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium">
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
