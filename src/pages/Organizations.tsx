import { useState, useEffect, useId } from "react";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { fetchCountries } from "@/utils/dashboardUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, AlertCircle, SlidersHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const industries = [
  "Banking & Financial Services",
  "Insurance",
  "Technology & Software",
  "Telecommunications & ISPs",
  "Marketing & Communications",
  "Media & Entertainment",
  "Retail & eCommerce",
  "Manufacturing & Industrial",
  "Mining & Metals",
  "Energy, Oil & Gas",
  "Utilities (Power & Water)",
  "Healthcare & Pharmaceuticals",
  "Education & Research",
  "Government & Public Sector",
  "Nonprofit & NGOs",
  "Agriculture & Agribusiness",
  "Food & Beverage (FMCG)",
  "Transportation & Logistics",
  "Real Estate & Construction",
  "Hospitality & Tourism",
  "Automotive & Mobility",
  "Professional Services (Legal, Consulting)",
  "Security & Defense",
  "Other / Not Listed",
];

interface Organization {
  _id?: string;
  organizationName: string;
  industry: string;
  address: string;
  country: string;
  email: string;
  phoneNumber: string;
  website: string;
  facebookUrl: string;
  linkedinUrl: string;
  xHandle: string;
  monitoringType: string[];
  keywords: string[];
  competitors: string[];
  gradientTop: string;
  gradientBottom: string;
  accentColor: string;
  logoUrl?: string;
  status?: string;
}

const Organizations = () => {
  const [currentUser] = useState(
    JSON.parse(localStorage.getItem("user") || '{}')
  );
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Organization>({
    organizationName: "",
    industry: "",
    address: "",
    country: "",
    email: "",
    phoneNumber: "",
    website: "",
    facebookUrl: "",
    linkedinUrl: "",
    xHandle: "",
    monitoringType: [],
    keywords: [],
    competitors: [],
    gradientTop: "#3175b6",
    gradientBottom: "#2e3e8a",
    accentColor: "#66aaff",
    logoUrl: "",
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; orgId: string | null }>({
    open: false,
    orgId: null,
  });

  const gradTopId = useId();
  const gradBottomId = useId();
  const accentColorId = useId();

  useEffect(() => {
    fetchOrganizations();
    loadCountries();
  }, []);

  const loadCountries = async () => {
    const countryList = await fetchCountries();
    setCountries(countryList);
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations"
      );
      setOrganizations(response.data);
    } catch (error) {
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organizationName: "",
      industry: "",
      address: "",
      country: "",
      email: "",
      phoneNumber: "",
      website: "",
      facebookUrl: "",
      linkedinUrl: "",
      xHandle: "",
      monitoringType: [],
      keywords: [],
      competitors: [],
      gradientTop: "#3175b6",
      gradientBottom: "#2e3e8a",
      accentColor: "#66aaff",
      logoUrl: "",
    });
    setLogoFile(null);
    setLogoPreview("");
    setKeywordInput("");
    setCompetitorInput("");
    setEditingOrg(null);
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !formData.keywords.includes(trimmed) && formData.keywords.length < 30) {
      setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
      setKeywordInput("");
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const handleAddCompetitor = () => {
    const trimmed = competitorInput.trim();
    if (trimmed && !formData.competitors.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setFormData((prev) => ({ ...prev, competitors: [...prev.competitors, trimmed] }));
      setCompetitorInput("");
    }
  };

  const handleCompetitorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCompetitor();
    }
  };

  const handleRemoveCompetitor = (competitor: string) => {
    setFormData((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c !== competitor),
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organizationName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (formData.competitors.length === 0) {
      toast.warning("Please add at least one competitor.");
      return;
    }

    if (formData.keywords.length === 0) {
      toast.warning("Please add at least one keyword.");
      return;
    }

    setSaving(true);

    try {
      const url = editingOrg
        ? `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${editingOrg._id}`
        : "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations";
      
      const method = editingOrg ? "put" : "post";
      const token = localStorage.getItem("token");

      if (logoFile) {
        const fd = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          fd.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value ?? ""));
        });
        fd.append("logo", logoFile, "logo.png");

        await axios[method](url, fd, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else {
        await axios[method](url, formData, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      toast.success(editingOrg ? "Organization updated successfully" : "Organization created successfully");
      resetForm();
      setModalOpen(false);
      fetchOrganizations();
    } catch (error) {
      console.error("Error saving organization:", error);
      toast.error("Failed to save organization");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setFormData({
      organizationName: org.organizationName,
      industry: org.industry || "",
      address: org.address || "",
      country: org.country || "",
      email: org.email || "",
      phoneNumber: org.phoneNumber || "",
      website: org.website || "",
      facebookUrl: org.facebookUrl || "",
      linkedinUrl: org.linkedinUrl || "",
      xHandle: org.xHandle || "",
      monitoringType: org.monitoringType || [],
      keywords: org.keywords || [],
      competitors: org.competitors || [],
      gradientTop: org.gradientTop || "#3175b6",
      gradientBottom: org.gradientBottom || "#2e3e8a",
      accentColor: org.accentColor || "#66aaff",
      logoUrl: org.logoUrl || "",
    });
    setLogoFile(null);
    setLogoPreview(org.logoUrl || "");
    setEditingOrg(org);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.orgId) return;

    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${deleteDialog.orgId}`
      );
      toast.success("Organization deleted successfully");
      setDeleteDialog({ open: false, orgId: null });
      fetchOrganizations();
    } catch (error) {
      toast.error("Failed to delete organization");
    }
  };

  if (currentUser.role !== "super_admin") {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
              </div>
              <p className="text-muted-foreground">
                You do not have permission to view this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  const previewSrc = logoFile ? logoPreview : formData.logoUrl;

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizations</h1>
            <p className="text-muted-foreground">Manage all organizations</p>
          </div>
          <Button onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length > 0 ? (
                    organizations.map((org) => (
                      <TableRow key={org._id}>
                        <TableCell className="font-medium">
                          {org.organizationName}
                        </TableCell>
                        <TableCell>{org.email}</TableCell>
                        <TableCell>{org.industry}</TableCell>
                        <TableCell>{org.country}</TableCell>
                        <TableCell>
                          <Badge variant={org.status === "active" ? "default" : "secondary"}>
                            {org.status || "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(org)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, orgId: org._id || null })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, orgId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Organization Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editingOrg ? "Edit Organization" : "Create Organization"}</DialogTitle>
            <DialogDescription>
              Fill in the organization details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
            <form onSubmit={handleSubmit} className="space-y-4 pb-6">
              {/* Company Name */}
              <div className="space-y-1.5">
                <Label htmlFor="organizationName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  required
                />
              </div>

              {/* Industry & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="industry">
                    Industry <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleChange("industry", value)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="country">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleChange("country", value)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Contact Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Branding Section */}
              <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold">Branding</h3>
                
                {/* Logo Upload */}
                <div className="space-y-1.5">
                  <Label htmlFor="logo">Organization Logo (PNG recommended)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {previewSrc && (
                    <div 
                      className="mt-2 w-24 h-24 rounded-full border-4 overflow-hidden flex items-center justify-center bg-background"
                      style={{ borderColor: formData.accentColor }}
                    >
                      <img 
                        src={previewSrc} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Gradient Colors */}
                <div className="space-y-2">
                  <Label>Gradient Colors</Label>
                  <div className="flex gap-3 items-center">
                    <button
                      type="button"
                      className="w-12 h-12 rounded border flex items-center justify-center cursor-pointer"
                      style={{ background: formData.gradientTop }}
                      onClick={() => document.getElementById(gradTopId)?.click()}
                      title={`Top: ${formData.gradientTop}`}
                    >
                      <SlidersHorizontal size={16} className="text-white drop-shadow" />
                    </button>
                    <input
                      id={gradTopId}
                      type="color"
                      value={formData.gradientTop}
                      onChange={(e) => handleChange("gradientTop", e.target.value.toUpperCase())}
                      className="sr-only"
                    />

                    <button
                      type="button"
                      className="w-12 h-12 rounded border flex items-center justify-center cursor-pointer"
                      style={{ background: formData.gradientBottom }}
                      onClick={() => document.getElementById(gradBottomId)?.click()}
                      title={`Bottom: ${formData.gradientBottom}`}
                    >
                      <SlidersHorizontal size={16} className="text-white drop-shadow" />
                    </button>
                    <input
                      id={gradBottomId}
                      type="color"
                      value={formData.gradientBottom}
                      onChange={(e) => handleChange("gradientBottom", e.target.value.toUpperCase())}
                      className="sr-only"
                    />

                    <button
                      type="button"
                      className="w-12 h-12 rounded border flex items-center justify-center cursor-pointer"
                      style={{ background: formData.accentColor }}
                      onClick={() => document.getElementById(accentColorId)?.click()}
                      title={`Accent: ${formData.accentColor}`}
                    >
                      <SlidersHorizontal size={16} className="text-white drop-shadow" />
                    </button>
                    <input
                      id={accentColorId}
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value.toUpperCase())}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Style: Linear 180°</p>
                  
                  {/* Gradient Preview */}
                  <div
                    className="w-full h-20 rounded"
                    style={{
                      background: `linear-gradient(180deg, ${formData.gradientTop} 0%, ${formData.gradientBottom} 100%)`,
                    }}
                  />
                  <p className="text-xs text-muted-foreground">*Will be used to style the report cover.</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold">Media Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input
                      id="facebookUrl"
                      type="url"
                      placeholder="https://"
                      value={formData.facebookUrl}
                      onChange={(e) => handleChange("facebookUrl", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="linkedinUrl">LinkedIn</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="xHandle">X Handle</Label>
                    <Input
                      id="xHandle"
                      placeholder="@exampleorg"
                      value={formData.xHandle}
                      onChange={(e) => handleChange("xHandle", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <Label>
                  Keywords (max 30) <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a keyword and press Enter"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                  />
                  <Button
                    type="button"
                    onClick={handleAddKeyword}
                    disabled={formData.keywords.length >= 30}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-destructive"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Competitors */}
              <div className="space-y-1.5">
                <Label>
                  Competitors <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a competitor and press Enter"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={handleCompetitorKeyDown}
                  />
                  <Button type="button" onClick={handleAddCompetitor} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.competitors.map((competitor, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {competitor}
                      <button
                        type="button"
                        onClick={() => handleRemoveCompetitor(competitor)}
                        className="hover:text-destructive"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingOrg ? "Update Organization" : "Create Organization"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
};

export default Organizations;
