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
  modules?: Record<string, unknown>;

  scope?: string[];
  createdBy?: string;
  createdAt?: string;
  created_at?: string;
  organizationId?: string;

  startDate?: string;
  endDate?: string;

  posts?: MediaBucket;
  articles?: MediaBucket;
  broadcast?: MediaBucket;
  printmedia?: MediaBucket;

  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];

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
    filters?: {
      startDate?: string;
      endDate?: string;
    };
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

        // --- Case 1: "new" full-document shape (what you're seeing in Mongo now) ---
        // e.g. { _id, organizationId, title, createdAt, createdBy, formData, modules, ... }
        if ("_id" in data || "modules" in data) {
          const doc = data as ViewReportResponseNew;
          const formData = doc.formData || {};

          // Normalize dates from plausible locations
          const startDate =
            (doc as { startDate?: string }).startDate ??
            (formData as { startDate?: string }).startDate;
          const endDate =
            (doc as { endDate?: string }).endDate ??
            (formData as { endDate?: string }).endDate;

          report = {
            // If this doc also has a nested reportData with buckets, flatten them
            ...(doc.reportData || {}),

            // Preserve original nested block & meta
            reportData: doc.reportData || undefined,
            modules: doc.modules,
            scope: doc.scope,
            title: doc.title,
            createdBy: doc.createdBy,
            createdAt: doc.createdAt || doc.created_at,
            organizationId: doc.organizationId,
            _id: doc._id || reportId,
            formData,

            // Hoisted, so the cover page can use reportData.startDate / endDate
            startDate,
            endDate,
          };
        }

        // --- Case 2: legacy wrapper shape { reportData, formData, organizationId } ---
        else if ("reportData" in data) {
          const saved = data as ViewReportResponseLegacy;
          const formData = saved.formData || {};

          const startDate =
            (formData as { startDate?: string }).startDate ??
            saved.reportData?.filters?.startDate;
          const endDate =
            (formData as { endDate?: string }).endDate ??
            saved.reportData?.filters?.endDate;

          report = {
            ...(saved.reportData || {}),
            reportData: saved.reportData || undefined,
            modules: saved.modules,
            organizationId: saved.organizationId,
            formData,
            _id: reportId,
            createdBy: saved.createdBy,
            createdAt: saved.createdAt,
            startDate,
            endDate,
          };
        }

        // Unknown shape
        else {
          throw new Error("Unexpected report response shape");
        }

        // Debug once if you're curious:
        // console.log("Normalized report for viewer:", report);

        setReportData(report);

        // --- Fetch organization details ---
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
