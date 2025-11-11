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
  startDate?: string;
  endDate?: string;
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

        const data: ViewReportResponse = res.data;
        let report: Report;

        // --- Type guards (no `any`) ---

        const isNewShape = (
          v: ViewReportResponse
        ): v is ViewReportResponseNew =>
          typeof v === "object" && v !== null && "_id" in v; // your new docs all have _id

        const isLegacyShape = (
          v: ViewReportResponse
        ): v is ViewReportResponseLegacy =>
          typeof v === "object" &&
          v !== null &&
          !("_id" in v) &&
          "reportData" in v;

        // --- Case 1: endpoint returns the report document directly (new shape) ---

        if (isNewShape(data)) {
          const doc = data;

          const formData = (doc.formData ?? {}) as {
            startDate?: string;
            endDate?: string;
            [key: string]: unknown;
          };

          const startDate = doc.startDate ?? formData.startDate;
          const endDate = doc.endDate ?? formData.endDate;

          const flattenedBuckets: Partial<Report> =
            doc.reportData && typeof doc.reportData === "object"
              ? (doc.reportData as Partial<Report>)
              : {};

          report = {
            ...flattenedBuckets,
            reportData:
              doc.reportData && typeof doc.reportData === "object"
                ? doc.reportData
                : undefined,
            modules: doc.modules as Report["modules"],
            scope: (doc.scope as string[]) || [],
            title: doc.title || "",
            createdBy: doc.createdBy || "",
            createdAt: doc.createdAt || doc.created_at || "",
            organizationId: doc.organizationId,
            _id: doc._id || reportId!,
            formData,
            startDate,
            endDate,
          };
        }

        // --- Case 2: legacy wrapper { reportData, formData, organizationId } ---
        else if (isLegacyShape(data)) {
          const wrapper = data;

          const formData = (wrapper.formData ?? {}) as {
            startDate?: string;
            endDate?: string;
            [key: string]: unknown;
          };

          const inner = wrapper.reportData;

          // 2a: wrapper.reportData is itself a full doc (has _id, modules, etc)
          if (inner && typeof inner === "object" && "_id" in inner) {
            const doc = inner as unknown as ViewReportResponseNew;

            const startDate = doc.startDate ?? formData.startDate;
            const endDate = doc.endDate ?? formData.endDate;

            const flattenedBuckets: Partial<Report> =
              doc.reportData && typeof doc.reportData === "object"
                ? (doc.reportData as Partial<Report>)
                : {};

            report = {
              ...flattenedBuckets,
              reportData:
                doc.reportData && typeof doc.reportData === "object"
                  ? doc.reportData
                  : undefined,
              modules:
                (doc.modules as Report["modules"]) ||
                (wrapper.modules as Report["modules"]),
              scope: (doc.scope as string[]) || [],
              title: doc.title || "",
              createdBy: doc.createdBy || "",
              createdAt: doc.createdAt || doc.created_at || "",
              organizationId: wrapper.organizationId ?? doc.organizationId,
              _id: doc._id || reportId!,
              formData,
              startDate,
              endDate,
            };
          }
          // 2b: wrapper.reportData is just buckets; dates only in formData
          else {
            const startDate = formData.startDate;
            const endDate = formData.endDate;

            report = {
              ...(wrapper.reportData || {}),
              reportData: wrapper.reportData || undefined,
              modules: wrapper.modules as Report["modules"],
              organizationId: wrapper.organizationId,
              formData,
              _id: reportId!,
              createdBy: wrapper.createdBy || "",
              createdAt: wrapper.createdAt || "",
              startDate,
              endDate,
            };
          }
        }

        // --- Unknown shape ---
        else {
          throw new Error("Unexpected report response shape");
        }


        // Debug once if needed:
        // console.log("Normalized report:", report);

        setReportData(report);

        // --- Fetch organization ---
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
