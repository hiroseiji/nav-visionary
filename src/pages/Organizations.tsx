import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

const monitoringTypes = [
  { value: "broadcast", label: "Broadcast Media" },
  { value: "online", label: "Online Media" },
  { value: "print", label: "Print Media" },
  { value: "social", label: "Social Media" },
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
  status?: string;
}

const Organizations = () => {
  const { orgId } = useParams();
  const [currentUser] = useState(
    JSON.parse(localStorage.getItem("user") || '{}')
  );
  
  const [view, setView] = useState<"list" | "form">("list");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  
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
  });
  
  const [keywordInput, setKeywordInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; orgId: string | null }>({
    open: false,
    orgId: null,
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

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
    });
    setKeywordInput("");
    setCompetitorInput("");
    setEditMode(false);
    setEditingOrgId(null);
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonitoringTypeToggle = (type: string) => {
    setFormData((prev) => {
      const current = prev.monitoringType || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, monitoringType: updated };
    });
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !formData.keywords.includes(trimmed) && formData.keywords.length < 30) {
      setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
      setKeywordInput("");
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
    if (trimmed && !formData.competitors.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, competitors: [...prev.competitors, trimmed] }));
      setCompetitorInput("");
    }
  };

  const handleRemoveCompetitor = (competitor: string) => {
    setFormData((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c !== competitor),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.competitors.length === 0) {
      toast.warning("Please add at least one competitor");
      return;
    }
    if (formData.keywords.length === 0) {
      toast.warning("Please add at least one keyword");
      return;
    }

    try {
      const url = editMode
        ? `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${editingOrgId}`
        : "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations";
      
      const method = editMode ? "put" : "post";
      
      await axios[method](url, formData);
      
      toast.success(editMode ? "Organization updated successfully" : "Organization created successfully");
      resetForm();
      setView("list");
      fetchOrganizations();
    } catch (error) {
      toast.error("Failed to save organization");
    }
  };

  const handleEdit = (org: Organization) => {
    setFormData(org);
    setEditMode(true);
    setEditingOrgId(org._id || null);
    setView("form");
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
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Access Denied</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You do not have permission to view this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                {view === "list" ? "Organizations" : editMode ? "Edit Organization" : "Add Organization"}
              </h1>
              <p className="text-muted-foreground">
                {view === "list" ? "Manage all organizations" : "Fill in organization details"}
              </p>
            </div>
            {view === "list" ? (
              <Button onClick={() => { resetForm(); setView("form"); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setView("list"); resetForm(); }}>
                Back to List
              </Button>
            )}
          </div>

          {view === "list" ? (
            <Card>
              <CardHeader>
                <CardTitle>All Organizations</CardTitle>
                <CardDescription>View and manage all organizations</CardDescription>
              </CardHeader>
              <CardContent>
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
                            <TableCell className="font-medium">{org.organizationName}</TableCell>
                            <TableCell>{org.email}</TableCell>
                            <TableCell>{org.industry}</TableCell>
                            <TableCell>{org.country}</TableCell>
                            <TableCell>
                              <Badge variant={org.status === "active" ? "default" : "secondary"}>
                                {org.status || "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(org)}
                              >
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
          ) : (
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Core organization details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="organizationName">Organization Name *</Label>
                          <Input
                            id="organizationName"
                            value={formData.organizationName}
                            onChange={(e) => handleChange("organizationName", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry *</Label>
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
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country *</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => handleChange("country", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>Contact details and social media</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={(e) => handleChange("phoneNumber", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={formData.website}
                            onChange={(e) => handleChange("website", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facebookUrl">Facebook URL</Label>
                          <Input
                            id="facebookUrl"
                            value={formData.facebookUrl}
                            onChange={(e) => handleChange("facebookUrl", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                          <Input
                            id="linkedinUrl"
                            value={formData.linkedinUrl}
                            onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="xHandle">X (Twitter) Handle</Label>
                          <Input
                            id="xHandle"
                            value={formData.xHandle}
                            onChange={(e) => handleChange("xHandle", e.target.value)}
                            placeholder="@username"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monitoring Configuration</CardTitle>
                      <CardDescription>Set up keywords and competitors</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Monitoring Types</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {monitoringTypes.map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={type.value}
                                checked={formData.monitoringType.includes(type.value)}
                                onCheckedChange={() => handleMonitoringTypeToggle(type.value)}
                              />
                              <Label htmlFor={type.value} className="cursor-pointer">
                                {type.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (up to 30) *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="keywords"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                            placeholder="Add a keyword and press Enter"
                          />
                          <Button type="button" onClick={handleAddKeyword}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                              {keyword}
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(keyword)}
                                className="ml-2"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="competitors">Competitors *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="competitors"
                            value={competitorInput}
                            onChange={(e) => setCompetitorInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCompetitor())}
                            placeholder="Add a competitor and press Enter"
                          />
                          <Button type="button" onClick={handleAddCompetitor}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.competitors.map((competitor, index) => (
                            <Badge key={index} variant="secondary">
                              {competitor}
                              <button
                                type="button"
                                onClick={() => handleRemoveCompetitor(competitor)}
                                className="ml-2"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => { setView("list"); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? "Update Organization" : "Create Organization"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, orgId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarLayout>
  );
};

export default Organizations;
