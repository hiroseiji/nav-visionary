import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

export interface Report {
  _id: string;
  title: string;
  modules: string[] | Record<string, boolean>;
  scope: string[];
  createdBy: string;
  createdAt: string;
  created_at?: string;
  organizationId?: string;
}

export interface Organization {
  _id: string;
  organizationName: string;
  alias?: string;
  logoUrl?: string;
  gradientTop?: string;
  gradientBottom?: string;
}

export const useReportData = (orgId: string | undefined, reportId: string | undefined) => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<Report | null>(null);
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Use direct endpoint to fetch specific report
        const res = await axios.get(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/generated-reports/view/${reportId}`
        );
        const report = res.data;
        
        setReportData(report);
        
        // Fetch organization data
        const orgIdToFetch = report.organizationId || orgId;
        if (orgIdToFetch) {
          try {
            const orgRes = await axios.get(
              `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${orgIdToFetch}`
            );
            setOrganizationData(orgRes.data);
          } catch (orgErr) {
            console.error("Failed to fetch organization:", orgErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
        toast.error("Failed to load report");
        navigate(`/reports/${orgId || ''}`);
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId, orgId, navigate]);

  return { reportData, organizationData, loading };
};
