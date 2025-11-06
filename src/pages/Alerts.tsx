import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Bell, Plus, Edit, Trash2, Calendar, Mail, Search } from "lucide-react";
import BannerUpload from "@/components/BannerUpload";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  role: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}

interface AlertItem {
  _id: string;
  alertName: string;
  subject: string;
  banner?: string;
  topic?: string;
  mediaType?: string;
  sentiment?: string;
  schedule: string;
  delivery: string;
  excludeDays?: string[];
  externalUsers: string[];
  startDate: string;
  isActive: boolean;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [subject, setSubject] = useState("");
  const [schedule, setSchedule] = useState("");
  const [delivery, setDelivery] = useState("");
  const [externalUsers, setExternalUsers] = useState("");
  const [emailError, setEmailError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [excludeDays, setExcludeDays] = useState<string[]>([]);
  const navigate = useNavigate();

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg = localStorage.getItem("selectedOrg");

  useEffect(() => {
    setFilteredAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "super_admin") {
      toast.error("Access denied. Only super admins can manage alerts.");
      navigate("/dashboard/" + (user.organizationId || selectedOrg));
      return;
    }

    fetchAlerts();
  }, [user, selectedOrg, navigate]);

  const fetchAlerts = async () => {
    try {
      const orgId = user?.role === "super_admin" ? selectedOrg : user?.organizationId;
      const response = await axios.get(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/alerts/${orgId}`
      );
      setAlerts(response.data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      toast.error("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmails(externalUsers)) return;

    const formData = new FormData();
    formData.append("alertName", alertName);
    formData.append("subject", subject);
    formData.append("schedule", schedule);
    formData.append("startDate", new Date().toISOString());
    formData.append("delivery", schedule === "monthly" ? "1" : delivery);

    externalUsers
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .forEach((email) => formData.append("externalUsers[]", email));

    // Optional fields
    if (banner) formData.append("banner", banner);
    if (topic) formData.append("topic", topic);
    if (mediaType) formData.append("mediaType", mediaType);
    if (sentiment) formData.append("sentiment", sentiment);
    excludeDays.forEach((day) => formData.append("excludeDays[]", day));

    try {
      let res;

      if (editingAlert) {
        // UPDATE
        res = await axios.put(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/alerts/update/${editingAlert._id}`,
          formData
        );

        toast.success("Alert updated successfully");
        setAlerts((prev) =>
          prev.map((a) => (a._id === editingAlert._id ? res.data.alert : a))
        );
      } else {
        // CREATE
        formData.append("organizationId", selectedOrg || "");

        res = await axios.post(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/create-alert`,
          formData
        );

        setAlerts((prev) => [...prev, res.data.details]);
        toast.success("Alert created successfully");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting alert:", error);
      toast.error("Failed to save alert");
    }
  };

  const openEditModal = async (alertId: string) => {
    try {
      const res = await axios.get(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/alerts/details/${alertId}`
      );

      const data = res.data;
      setEditingAlert(data);

      setAlertName(data.alertName);
      setSubject(data.subject);
      setSchedule(data.schedule);
      setDelivery(data.delivery);
      setExternalUsers(data.externalUsers.join(", "));
      setTopic(data.topic || "");
      setMediaType(data.mediaType || "");
      setSentiment(data.sentiment || "");
      setExcludeDays(data.excludeDays || []);
      setBanner(null); // Don't set banner on edit, user can upload new one

      setIsModalOpen(true);
    } catch (err) {
      console.error("Error loading alert:", err);
      toast.error("Failed to load alert details");
    }
  };

  const validateEmails = (emailString: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const emails = emailString.split(",").map(e => e.trim()).filter(Boolean);

    if (emails.length === 0) {
      setEmailError("At least one email is required");
      return false;
    }

    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      setEmailError(`Invalid emails: ${invalidEmails.join(", ")}`);
      return false;
    }

    setEmailError("");
    return true;
  };
  

  const handleDelete = async (alertId: string) => {
    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/alerts/${alertId}`
      );

      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      toast.success("Alert deleted successfully");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };


  const resetForm = () => {
    setEditingAlert(null);
    setAlertName("");
    setSubject("");
    setSchedule("");
    setDelivery("");
    setExternalUsers("");
    setEmailError("");
    setBanner(null);
    setTopic("");
    setMediaType("");
    setSentiment("");
    setExcludeDays([]);
  };

  const getColor = (email: string) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
      "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788"
    ];
    
    const color = colors[Math.abs(hash) % colors.length];
    const brightnessFactor = 1.2;
    
    const adjustBrightness = (hex: string, factor: number) => {
      const num = parseInt(hex, 16);
      const adjusted = Math.min(255, Math.floor(num * factor));
      return adjusted.toString(16).padStart(2, "0");
    };

    const r = adjustBrightness(color.substring(1, 3), brightnessFactor);
    const g = adjustBrightness(color.substring(3, 5), brightnessFactor);
    const b = adjustBrightness(color.substring(5, 7), brightnessFactor);
    
    const adjustedColor = `#${r}${g}${b}`;
    const backgroundColor = `${adjustedColor}55`;
    const borderColor = `${adjustedColor}FF`;
    const textColor = `${adjustedColor}FF`;

    return { backgroundColor, borderColor, textColor };
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();

    setFilteredAlerts(
      alerts.filter(
        (alert) =>
          alert.alertName.toLowerCase().includes(lowerCaseQuery) ||
          alert.subject.toLowerCase().includes(lowerCaseQuery) ||
          alert.externalUsers.some((email) =>
            email.toLowerCase().includes(lowerCaseQuery)
          )
      )
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Alerts Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage email alerts
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                  <DialogTitle>
                    {editingAlert ? "Edit Alert" : "Create New Alert"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAlert
                      ? "Update your alert settings"
                      : "Set up a new email alert"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="overflow-y-auto px-6 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="alertName">Alert Name</Label>
                        <Input
                          id="alertName"
                          value={alertName}
                          onChange={(e) => setAlertName(e.target.value)}
                          placeholder="e.g., Weekly Report"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="schedule">Schedule</Label>
                        <Select
                          value={schedule}
                          onValueChange={setSchedule}
                          required
                        >
                          <SelectTrigger id="schedule">
                            <SelectValue placeholder="Select schedule" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line for the email"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="banner">Banner Image (Optional)</Label>
                      <BannerUpload 
                        currentBanner={editingAlert?.banner}
                        onBannerChange={(file) => setBanner(file)} 
                      />
                    </div>
                    {schedule !== "monthly" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="delivery">Delivery Day</Label>
                        <Input
                          id="delivery"
                          type="number"
                          min="1"
                          max={schedule === "weekly" ? "7" : "31"}
                          value={delivery}
                          onChange={(e) => setDelivery(e.target.value)}
                          placeholder={
                            schedule === "weekly" ? "1-7 (Mon-Sun)" : "1-31"
                          }
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="externalUsers">Recipient Emails</Label>
                      <Input
                        id="externalUsers"
                        value={externalUsers}
                        onChange={(e) => {
                          setExternalUsers(e.target.value);
                          setEmailError("");
                        }}
                        placeholder="email1@example.com, email2@example.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple emails with commas
                      </p>
                      {emailError && (
                        <p className="text-xs text-destructive">{emailError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end px-6 py-4 border-t bg-muted/30">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAlert ? "Update Alert" : "Create Alert"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {filteredAlerts.length === 0 && searchQuery === "" ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                No alerts configured
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert to get started
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts ({filteredAlerts.length})</CardTitle>
              <CardDescription>
                Manage your configured email alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>People</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert._id}>
                        <TableCell className="font-medium">
                          {alert.alertName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {alert.externalUsers.map((email, idx) => {
                              const {
                                backgroundColor,
                                borderColor,
                                textColor,
                              } = getColor(email);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold"
                                  title={email}
                                  style={{
                                    backgroundColor,
                                    border: `2px solid ${borderColor}`,
                                    color: textColor,
                                  }}
                                >
                                  {email.substring(0, 2).toUpperCase()}
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={alert.isActive ? "default" : "secondary"}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            {alert.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">
                            {alert.schedule}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(alert._id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(alert._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
