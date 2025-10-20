import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";

// --- Types that match what your ReportModulePage expects (trim as needed) ---
export interface SentimentPoint {
  date: string;
  sentiment: number;
  rolling: number;
  industryTrend?: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed?: number;
}
export interface SentimentAnnotation {
  date: string;
  type: string;
  category: string;
  summary: string;
}
export interface MediaBucket {
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];
  mediaSummary?: unknown;
  topSources?: unknown;
  topJournalists?: unknown;
  volumeAndSentiment?: unknown;
  wordCloud?: unknown;
  kpiPerformance?: unknown;
  sectorRanking?: unknown;
  issueImpact?: unknown;
  reputationalRisks?: unknown;
  reputationalOpportunities?: unknown;
}

export interface Organization {
  _id: string;
  organizationName: string;
  alias?: string;
  logoUrl?: string;
  gradientTop?: string;
  gradientBottom?: string;
}


export interface Report {
  _id: string;
  title: string;
  modules: string[] | Record<string, boolean>;
  scope: string[];
  createdBy: string;
  createdAt: string;
  created_at?: string;
  organizationId?: string;

  // buckets (some reports put these under root, some under formData)
  articles?: MediaBucket;
  printmedia?: MediaBucket;
  broadcast?: MediaBucket;
  posts?: MediaBucket;

  // optional root-level fallbacks
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];

  // sometimes you stash everything under formData
  formData?: Partial<Report> & Record<string, unknown>;
}

export interface Organization {
  _id: string;
  organizationName: string;
  alias?: string;
  logoUrl?: string;
  gradientTop?: string;
  gradientBottom?: string;
}

const API_BASE = "https://sociallightbw-backend-34f7586fa57c.herokuapp.com";

export const useReportData = (
  orgId: string | undefined,
  reportId: string | undefined
) => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<Report | null>(null);
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        // Use the JSON endpoint (NOT /view/:id) and bypass cache during dev
        const reportUrl = `${API_BASE}/reports/generated-reports/${reportId}?format=json&t=${Date.now()}`;
        const res = await axios.get<Report>(reportUrl, {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          // Make 304s unlikely while testing:
          validateStatus: (s) => s >= 200 && s < 300, // treat 304 as failure
        });

        const report = res.data;
        setReportData(report);

        // org lookup (prefer report.organizationId)
        const orgIdToFetch = report.organizationId || orgId;
        if (orgIdToFetch) {
          const orgUrl = `${API_BASE}/organizations/${orgIdToFetch}?t=${Date.now()}`;
          const orgRes = await axios.get<Organization>(orgUrl, {
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            validateStatus: (s) => s >= 200 && s < 300,
          });
          setOrganizationData(orgRes.data);
        } else {
          setOrganizationData(null);
        }
      } catch (err: unknown) {               
        if (isAxiosError(err)) {           
          console.error(
            "Failed to fetch report/org:",
            err.response?.status,
            err.message
          );
        } else {
          console.error("Failed to fetch report/org:", err);
        }
        toast.error("Failed to load report");
        navigate(`/reports/${orgId || ""}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, orgId, navigate]);

  return { reportData, organizationData, loading };
};
