import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";

/* ---------- Types ---------- */

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
  industry?: string;
}

export interface Report {
  _id: string;
  title?: string;

  // Full modules map from backend
  modules?: Record<string, unknown>;

  scope?: string[];
  createdBy?: string;
  createdAt?: string;
  created_at?: string;
  organizationId?: string;

  startDate?: string;
  endDate?: string;

  // Flattened media buckets used directly by the viewer
  posts?: MediaBucket;
  articles?: MediaBucket;
  broadcast?: MediaBucket;
  printmedia?: MediaBucket;

  // Legacy top-level sentiment fields
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];

  // Keep original nested block (for safety / debugging)
  reportData?: {
    posts?: MediaBucket;
    articles?: MediaBucket;
    broadcast?: MediaBucket;
    printmedia?: MediaBucket;
    executiveSummary?: unknown;
    [key: string]: unknown;
  };

  formData?: Record<string, unknown>;
}

/**
 * Shape A (new): endpoint returns a full report doc, like the JSON you pasted.
 */
interface ViewReportResponseNew {
  _id: string;
  title?: string;
  modules?: Record<string, unknown>;
  scope?: string[];
  createdBy?: string;
  createdAt?: string;
  created_at?: string;
  organizationId?: string;
  reportData?: Report["reportData"];
  formData?: Record<string, unknown>;
}

/**
 * Shape B (legacy): endpoint wraps data inside { reportData, formData, organizationId }.
 */
interface ViewReportResponseLegacy {
  reportData?: {
    posts?: MediaBucket;
    articles?: MediaBucket;
    broadcast?: MediaBucket;
    printmedia?: MediaBucket;
    [key: string]: unknown;
  };
  formData?: Record<string, unknown>;
  organizationId?: string;
  modules?: Record<string, unknown>;
  createdBy?: string;
  createdAt?: string;
}

/**
 * Union of possible response shapes.
 */
type ViewReportResponse = ViewReportResponseNew | ViewReportResponseLegacy;

type OrganizationResponse = { organization: Organization } | Organization;

/* ---------- Hook ---------- */

const API_BASE = "https://sociallightbw-backend-34f7586fa57c.herokuapp.com";

export const useReportData = (
  orgId: string | undefined,
  reportId: string | undefined
) => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<Report | null>(null);
  const [organizationData, setOrganizationData] = useState<Organization | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const reportUrl = `${API_BASE}/reports/generated-reports2/view/${reportId}?t=${Date.now()}`;

        const res = await axios.get<ViewReportResponse>(reportUrl, {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          validateStatus: (s) => s >= 200 && s < 300,
        });

        const data = res.data;
        let report: Report;

        if ("_id" in data || "modules" in data) {
          const doc = data as ViewReportResponseNew;

          report = {
            ...(doc.reportData || {}),
            reportData: doc.reportData || undefined,
            modules: doc.modules,
            scope: doc.scope,
            title: doc.title,
            createdBy: doc.createdBy,
            createdAt: doc.createdAt || doc.created_at,
            organizationId: doc.organizationId,
            _id: doc._id || reportId!,
            formData: doc.formData || {},
          };
        }

        // Case 2: LEGACY wrapper shape:
        else if ("reportData" in data) {
          const saved = data as ViewReportResponseLegacy;

          report = {
            ...(saved.reportData || {}),
            reportData: saved.reportData || undefined,
            modules: saved.modules,
            organizationId: saved.organizationId,
            formData: saved.formData || {},
            _id: reportId!,
            createdBy: saved.createdBy,
            createdAt: saved.createdAt,
          };
        }

        // Unknown shape
        else {
          throw new Error("Unexpected report response shape");
        }

        setReportData(report);

        // Fetch organization
        const orgIdToFetch = report.organizationId || orgId;
        if (orgIdToFetch) {
          const orgUrl = `${API_BASE}/organizations/${orgIdToFetch}?t=${Date.now()}`;
          const orgRes = await axios.get<OrganizationResponse>(orgUrl, {
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            validateStatus: (s) => s >= 200 && s < 300,
          });

          const orgData: Organization =
            "organization" in orgRes.data
              ? orgRes.data.organization
              : orgRes.data;
          setOrganizationData(orgData);
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
