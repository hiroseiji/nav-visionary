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

  return { reportData, organizationData, loading };
};
