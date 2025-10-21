import { useEffect, useState, useRef, useMemo } from "react";
import axios, { isAxiosError } from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, FileText, Plus, Minus, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Report {
  _id: string;
  title: string;
  modules: string[] | Record<string, boolean>;
  scope: string[];
  createdBy: string;
  createdAt: string;
  created_at?: string;
}

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

const API_BASE = "https://sociallightbw-backend-34f7586fa57c.herokuapp.com";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleReports, setVisibleReports] = useState(20);
  const [dateSortOrder, setDateSortOrder] = useState<
    "ascending" | "descending"
  >("descending");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedReportId = searchParams.get("highlight");
  const rowRefs = useRef<Record<string, HTMLTableRowElement>>({});

  // typed read from localStorage (avoid implicit any)
  const user = useMemo<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null") as User | null;
    } catch {
      return null;
    }
  }, []);
  const selectedOrg = localStorage.getItem("selectedOrg");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchReports = async () => {
      setLoading(true);
      try {
        const orgId =
          user.role === "super_admin" ? selectedOrg : user.organizationId;
        if (!orgId) {
          toast.error("Organization ID not found");
          setReports([]);
          return;
        }

        // Don't assume array vs paginated object
        const res = await axios.get(
          `${API_BASE}/reports/generated-reports2/${orgId}?t=${Date.now()}`
        );

        const data = res.data as unknown;
        const list: Report[] = Array.isArray(data)
          ? (data as Report[])
          : Array.isArray((data as { items?: unknown })?.items)
          ? ((data as { items: unknown }).items as Report[]) ?? []
          : [];

        setReports(list);
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          console.error(
            "Failed to fetch reports:",
            err.response?.status,
            err.message
          );
        } else {
          console.error("Failed to fetch reports:", err);
        }
        toast.error("Failed to load generated reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, selectedOrg, navigate]);


  const baseList = searchQuery ? filteredReports : reports;
  const safeList = Array.isArray(baseList) ? baseList : [];

  const displayedReports = [...safeList]
    .sort((a, b) => {
      const da = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
      const db = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
      return dateSortOrder === "ascending" ? da - db : db - da;
    })
    .slice(0, visibleReports);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lower = query.toLowerCase();

    const filtered = (Array.isArray(reports) ? reports : []).filter(
      (report) => {
        const modulesStr =
          typeof report.modules === "object"
            ? Object.keys(report.modules).join(", ")
            : String(report.modules || "");
        const scopeStr = Array.isArray(report.scope)
          ? report.scope.join(", ")
          : String(report.scope || "");

        return (
          modulesStr.toLowerCase().includes(lower) ||
          scopeStr.toLowerCase().includes(lower) ||
          (report.createdBy || "").toLowerCase().includes(lower) ||
          (report.title || "").toLowerCase().includes(lower)
        );
      }
    );

    setFilteredReports(filtered);
    setVisibleReports(20);
  };

  const formatModules = (modules: string[] | Record<string, boolean>) => {
    if (Array.isArray(modules)) return modules.join(", ");
    if (typeof modules === "object" && modules)
      return Object.keys(modules).join(", ");
    return "";
  };

  const formatScope = (scope: string[]) =>
    Array.isArray(scope) ? scope.join(", ") : "";

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Generated Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all generated reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Reports List</CardTitle>
                <CardDescription>
                  All generated reports for your organization
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setDateSortOrder(
                      dateSortOrder === "ascending" ? "descending" : "ascending"
                    )
                  }
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayedReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Generate your first report to see it here"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Modules</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Date Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedReports.map((report) => (
                        <TableRow
                          key={report._id}
                          ref={(el) => {
                            if (el) rowRefs.current[report._id] = el;
                          }}
                          className={
                            highlightedReportId === report._id
                              ? "bg-primary/10 transition-colors duration-1000"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {report.title || "Untitled"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {formatModules(report.modules)
                                .split(", ")
                                .slice(0, 4)
                                .map((mod, i) => (
                                  <Badge key={i} variant="secondary">
                                    {mod}
                                  </Badge>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {Array.isArray(report.scope) &&
                            report.scope.length > 4 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {report.scope.slice(0, 4).join(", ")}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <p>{formatScope(report.scope)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              formatScope(report.scope)
                            )}
                          </TableCell>
                          <TableCell>{report.createdBy || "N/A"}</TableCell>
                          <TableCell>
                            {format(
                              new Date(
                                report.createdAt || report.created_at || ""
                              ),
                              "MMM dd, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const orgId =
                                  user?.role === "super_admin"
                                    ? selectedOrg
                                    : user?.organizationId;
                                
                                if (!orgId) {
                                  toast.error("Organization ID not found");
                                  return;
                                }
                                
                                navigate(`/report/${orgId}/${report._id}`);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {displayedReports.length} of{" "}
                    {searchQuery ? filteredReports.length : reports.length}{" "}
                    reports
                  </p>
                  <div className="flex gap-2">
                    {visibleReports > 20 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setVisibleReports((prev) => Math.max(prev - 20, 20))
                        }
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Show Less
                      </Button>
                    )}
                    {visibleReports <
                      (searchQuery
                        ? filteredReports.length
                        : reports.length) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setVisibleReports((prev) =>
                            Math.min(prev + 20, reports.length)
                          )
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Show More
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
