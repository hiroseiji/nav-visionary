import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";

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
  issueVisibility?: unknown;
  reputationalRisks?: unknown;
  reputationalOpportunities?: unknown;
  esgAnalysis?: unknown;
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
  startDate?: string;
  endDate?: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    [key: string]: unknown;
  };

  articles?: MediaBucket;
  printmedia?: MediaBucket;
  broadcast?: MediaBucket;
  posts?: MediaBucket;

  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];

  formData?: Partial<Report> & Record<string, unknown>;
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
        const reportUrl = `${API_BASE}/reports/generated-reports2/view/${reportId}?t=${Date.now()}`;
        const res = await axios.get<{reportData: Report; formData: Record<string, unknown>; organizationId: string}>(reportUrl, {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          validateStatus: (s) => s >= 200 && s < 300, // treat 304 as failure
        });

        // The API returns { reportData, formData, organizationId }
        // Merge them into a single Report object
        const saved = res.data;
        const report: Report = {
          ...saved.reportData,
          formData: saved.formData,
          organizationId: saved.organizationId,
          _id: reportId || "",
          createdBy: "",
          createdAt: "",
        } as Report;
        setReportData(report);

        const orgIdToFetch = report.organizationId || orgId;
        if (orgIdToFetch) {
          const orgUrl = `${API_BASE}/organizations/${orgIdToFetch}?t=${Date.now()}`;
          const orgRes = await axios.get<{organization: Organization} | Organization>(orgUrl, {
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            validateStatus: (s) => s >= 200 && s < 300,
          });
          // Handle both response formats: nested { organization: {...} } or direct {...}
          const orgData = 'organization' in orgRes.data ? orgRes.data.organization : orgRes.data;
          setOrganizationData(orgData);
        } else {
          setOrganizationData(null);
        }
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          console.error("Failed to fetch report/org:", err.response?.status, err.message);
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
