import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Module {
  label: string;
  mediaTypes: string[];
}

interface MediaSelection {
  mediaType: string;
  selectedModules: string[];
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
  user 
}: CreateReportDialogProps) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [reportType, setReportType] = useState<"full" | "custom">("custom");
  const [mediaSelections, setMediaSelections] = useState<MediaSelection[]>([
    { mediaType: "posts", selectedModules: [] }
  ]);
  const [availableModules, setAvailableModules] = useState<Record<string, Module>>({});
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);

  const allMediaTypes = ["posts", "articles", "broadcast", "printmedia"];
  const mediaTypeLabels: Record<string, string> = {
    posts: "Social Media",
    articles: "Online Media",
    broadcast: "Broadcast Media",
    printmedia: "Print Media"
  };

  // Fetch available modules and countries
  useEffect(() => {
    if (open) {
      axios
        .get("https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/report-modules")
        .then((response) => setAvailableModules(response.data))
        .catch((err) => console.error("Failed to load modules:", err));

      axios
        .get("https://sociallightbw-backend-34f7586fa57c.herokuapp.com/reports/available-countries")
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

  const handleMediaTypeChange = (index: number, newType: string) => {
    const updated = [...mediaSelections];
    updated[index] = { mediaType: newType, selectedModules: [] };
    setMediaSelections(updated);
  };

  const handleModuleToggle = (index: number, moduleKey: string) => {
    const updated = [...mediaSelections];
    const selected = updated[index].selectedModules;
    
    if (selected.includes(moduleKey)) {
      updated[index].selectedModules = selected.filter(m => m !== moduleKey);
    } else {
      updated[index].selectedModules = [...selected, moduleKey];
    }
    
    setMediaSelections(updated);
  };

  const handleAddMediaSelection = () => {
    setMediaSelections([...mediaSelections, { mediaType: "posts", selectedModules: [] }]);
  };

  const handleRemoveMediaSelection = (index: number) => {
    setMediaSelections(mediaSelections.filter((_, i) => i !== index));
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
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
      const modulesPerMediaType: Record<string, Record<string, boolean | { granularity: string }>> = {};

      for (const entry of mediaSelections) {
        const { mediaType, selectedModules } = entry;
        if (!mediaType) continue;

        const moduleObject: Record<string, boolean | { granularity: string }> = {};
        const modulesToInclude = reportType === "full"
          ? Object.entries(availableModules)
              .filter(([_, mod]) => mod.mediaTypes.includes(mediaType))
              .map(([key]) => key)
          : selectedModules;

        modulesToInclude.forEach((mod) => {
          moduleObject[mod] = mod === "sentimentTrend" ? { granularity: "month" } : true;
        });

        if (modulesToInclude.length > 0) {
          modulesPerMediaType[mediaType] = moduleObject;
        }
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
          createdBy: `${user.firstName} ${user.lastName}`
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
      .filter(([_, module]) => module.mediaTypes.includes(mediaType))
      .map(([key, module]) => ({ key, label: module.label }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive media report for {organizationName}
          </DialogDescription>
        </DialogHeader>

        {polling && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Generating report... {progress}%</p>
            <Progress value={progress} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
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
                  checked={selectedCountries.length === availableCountries.length}
                  onCheckedChange={toggleAllCountries}
                />
                <label htmlFor="all-countries" className="text-sm font-medium cursor-pointer">
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
            <RadioGroup value={reportType} onValueChange={(value) => {
              setReportType(value as "full" | "custom");
              if (value === "full") {
                setMediaSelections(allMediaTypes.map(type => ({
                  mediaType: type,
                  selectedModules: Object.entries(availableModules)
                    .filter(([_, mod]) => mod.mediaTypes.includes(type))
                    .map(([key]) => key)
                })));
              } else {
                setMediaSelections([{ mediaType: "posts", selectedModules: [] }]);
              }
            }}>
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

          {/* Media Selections (Custom Only) */}
          {reportType === "custom" && (
            <div className="space-y-4">
              {mediaSelections.map((selection, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Media Type</Label>
                    {mediaSelections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMediaSelection(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Select
                    value={selection.mediaType}
                    onValueChange={(value) => handleMediaTypeChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allMediaTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {mediaTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <Label>Modules</Label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {getModulesForMediaType(selection.mediaType).map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${index}-${key}`}
                            checked={selection.selectedModules.includes(key)}
                            onCheckedChange={() => handleModuleToggle(index, key)}
                          />
                          <label htmlFor={`${index}-${key}`} className="text-sm cursor-pointer">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddMediaSelection}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Media Type
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
