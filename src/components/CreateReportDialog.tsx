import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  CalendarIcon,
  Tv,
  Newspaper,
  Share2,
  Radio,
  LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Module {
  label?: string; // backend may send this
  name?: string; // or this
  title?: string; // or this
  mediaTypes?: string[]; // camelCase
  media_types?: string[]; // snake_case
}

interface MediaModules {
  [mediaType: string]: string[];
}

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export function CreateReportDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  user,
}: CreateReportDialogProps) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [reportType, setReportType] = useState<"full" | "custom">("custom");
  const [selectedMediaModules, setSelectedMediaModules] =
    useState<MediaModules>({});
  const [availableModules, setAvailableModules] = useState<
    Record<string, Module>
  >({});
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);

  const allMediaTypes = ["posts", "articles", "broadcast", "printmedia"];
  const mediaTypeMap: Record<string, string> = {
    social: "posts",
    online: "articles",
    print: "printmedia",
    broadcast: "broadcast",

    // also allow backend keys to pass through safely
    posts: "posts",
    articles: "articles",
    printmedia: "printmedia",
  };

  const mediaTypeConfig: Record<string, { label: string }> = {
    posts: { label: "Social Media" },
    articles: { label: "Online Media" },
    broadcast: { label: "Broadcast Media" },
    printmedia: { label: "Print Media" },
  };

  // Fetch available modules and countries
  useEffect(() => {
    if (open) {
      axios
        .get(
          "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/report-modules"
        )
        .then((response) => setAvailableModules(response.data))
        .catch((err) => console.error("Failed to load modules:", err));

      axios
        .get(
          "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/available-countries"
        )
        .then((response) => setAvailableCountries(response.data))
        .catch((err) => console.error("Failed to load countries:", err));
    }
  }, [open]);

  // Poll for report progress
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (polling && reportId) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(
            `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/report-progress/${reportId}`
          );
          const data = response.data;
          setProgress(data.progress || 0);

          if (data.status === "ready") {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            setPolling(false);
            setLoading(false);
            onOpenChange(false);
            navigate(`/report-results/${organizationId}/${reportId}`);
          }
        } catch (error) {
          console.error("Polling failed:", error);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          setPolling(false);
          setLoading(false);
          toast.error("Failed to fetch report progress.");
        }
      }, 3000);

      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setPolling(false);
        setLoading(false);
        toast.error("Report generation timed out. Please try again later.");
      }, 10 * 60 * 1000);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [polling, reportId, navigate, organizationId, onOpenChange]);

  const handleModuleToggle = (mediaType: string, moduleKey: string) => {
    setSelectedMediaModules((prev) => {
      const current = prev[mediaType] || [];
      const updated = current.includes(moduleKey)
        ? current.filter((m) => m !== moduleKey)
        : [...current, moduleKey];

      if (updated.length === 0) {
        const { [mediaType]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [mediaType]: updated };
    });
  };

  const handleSelectAllModules = (mediaType: string) => {
    const allModules = getModulesForMediaType(mediaType).map((m) => m.key);
    setSelectedMediaModules((prev) => ({ ...prev, [mediaType]: allModules }));
  };

  const handleDeselectAllModules = (mediaType: string) => {
    setSelectedMediaModules((prev) => {
      const { [mediaType]: _, ...rest } = prev;
      return rest;
    });
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  const toggleAllCountries = () => {
    if (selectedCountries.length === availableCountries.length) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries([...availableCountries]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    if (selectedCountries.length === 0) {
      toast.error("Please select at least one country");
      return;
    }

    setLoading(true);

    try {
      const modulesPerMediaType: Record<
        string,
        Record<string, boolean | { granularity: string }>
      > = {};

      if (reportType === "full") {
        // Include all modules for all media types
        allMediaTypes.forEach((mediaType) => {
          const moduleObject: Record<
            string,
            boolean | { granularity: string }
          > = {};
          const allModules = Object.entries(availableModules)
            .filter(([_, mod]) => mod.mediaTypes.includes(mediaType))
            .map(([key]) => key);

          allModules.forEach((mod) => {
            moduleObject[mod] =
              mod === "sentimentTrend" ? { granularity: "month" } : true;
          });

          if (allModules.length > 0) {
            modulesPerMediaType[mediaTypeMap[mediaType]] = moduleObject;
          }
        });
      } else {
        // Use selected modules
        Object.entries(selectedMediaModules).forEach(([mediaType, modules]) => {
          if (modules.length > 0) {
            const moduleObject: Record<
              string,
              boolean | { granularity: string }
            > = {};
            modules.forEach((mod) => {
              moduleObject[mod] =
                mod === "sentimentTrend" ? { granularity: "month" } : true;
            });
            modulesPerMediaType[mediaTypeMap[mediaType]] = moduleObject;
          }
        });
      }

      const response = await axios.post(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/custom-report",
        {
          organizationId,
          orgName: organizationName,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          modules: modulesPerMediaType,
          localOrGlobal: selectedCountries,
          createdBy: `${user.firstName} ${user.lastName}`,
        }
      );

      if (response.status === 202) {
        const newReportId = response.data.reportId;
        setReportId(newReportId);
        setPolling(true);
        toast.success("Report generation started!");
      }
    } catch (err) {
      console.error("Failed to trigger report generation:", err);
      toast.error("Failed to generate report");
      setLoading(false);
    }
  };

  const getModulesForMediaType = (mediaType: string) => {
    return Object.entries(availableModules)
      .filter(([_, module]) => {
        const m = module as Module;

        const types = m.mediaTypes || m.media_types || []; // fallback if missing

        if (!Array.isArray(types)) return false;

        // support wildcards like "all" or "*"
        if (types.includes("*") || types.includes("all")) return true;

        return types.includes(mediaType);
      })
      .map(([key, module]) => {
        const m = module as Module;

        const rawLabel =
          m.label ||
          m.name ||
          m.title ||
          // fallback: prettify the key, e.g. "executiveSummary" → "Executive Summary"
          key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

        return { key, label: rawLabel };
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto px-8">
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive media report for {organizationName}
          </DialogDescription>
        </DialogHeader>

        {polling && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Generating report... {progress}%
            </p>
            <Progress value={progress} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Range */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) =>
                      date > new Date() ||
                      (startDate ? date < startDate : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Country Scope */}
          <div className="space-y-3">
            <Label>Country Scope</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="all-countries"
                  checked={
                    selectedCountries.length === availableCountries.length
                  }
                  onCheckedChange={toggleAllCountries}
                />
                <label
                  htmlFor="all-countries"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All
                </label>
              </div>
              {availableCountries.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={country}
                    checked={selectedCountries.includes(country)}
                    onCheckedChange={() => toggleCountry(country)}
                  />
                  <label htmlFor={country} className="text-sm cursor-pointer">
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-3">
            <Label>Report Type</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value) => {
                setReportType(value as "full" | "custom");
                if (value === "custom") {
                  setSelectedMediaModules({});
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal cursor-pointer">
                  Full Report (All modules for all media types)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Custom Report (Select specific modules)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Media Type & Module Selection (Custom Only) */}
          {reportType === "custom" && (
            <div className="space-y-3">
              <Label>Select Media Types & Modules</Label>
              <Accordion type="multiple" className="w-full">
                {allMediaTypes.map((mediaType) => {
                  const config = mediaTypeConfig[mediaType];
                  const modules = getModulesForMediaType(mediaType);
                  const selectedCount =
                    selectedMediaModules[mediaType]?.length || 0;
                  const allSelected = selectedCount === modules.length;

                  return (
                    <AccordionItem
                      key={mediaType}
                      value={mediaType}
                      className="border rounded-lg px-4 mb-2"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium">{config.label}</span>
                          {selectedCount > 0 && (
                            <span className="ml-auto mr-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                              {selectedCount} selected
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAllModules(mediaType)}
                              disabled={allSelected}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeselectAllModules(mediaType)
                              }
                              disabled={selectedCount === 0}
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {modules.map(({ key, label }) => (
                              <div
                                key={key}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`${mediaType}-${key}`}
                                  checked={
                                    selectedMediaModules[mediaType]?.includes(
                                      key
                                    ) || false
                                  }
                                  onCheckedChange={() =>
                                    handleModuleToggle(mediaType, key)
                                  }
                                />
                                <label
                                  htmlFor={`${mediaType}-${key}`}
                                  className="text-sm cursor-pointer leading-tight"
                                >
                                  {label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || polling}>
              {loading || polling ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
