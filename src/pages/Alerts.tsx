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
import { Bell, Plus, Edit, Trash2, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";

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
  schedule: string;
  delivery: string;
  externalUsers: string[];
  startDate: string;
  isActive: boolean;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [subject, setSubject] = useState("");
  const [schedule, setSchedule] = useState("");
  const [delivery, setDelivery] = useState("");
  const [externalUsers, setExternalUsers] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const selectedOrg = localStorage.getItem("selectedOrg");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmails(externalUsers)) return;

    const formData = new FormData();
    formData.append("organizationId", selectedOrg || "");
    formData.append("alertName", alertName);
    formData.append("subject", subject);
    formData.append("startDate", new Date().toISOString());
    formData.append("schedule", schedule);
    formData.append("delivery", schedule === "monthly" ? "1" : delivery);
    
    externalUsers.split(",").map(e => e.trim()).filter(Boolean).forEach(email => {
      formData.append("externalUsers[]", email);
    });

    try {
      const response = await axios.post(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/create-alert",
        formData
      );
      
      setAlerts(prev => [...prev, response.data.details]);
      toast.success("Alert created successfully");
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await axios.delete(`https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/alerts/${alertId}`);
      setAlerts(prev => prev.filter(a => a._id !== alertId));
      toast.success("Alert deleted successfully");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  const resetForm = () => {
    setAlertName("");
    setSubject("");
    setSchedule("");
    setDelivery("");
    setExternalUsers("");
    setEmailError("");
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Alerts Management</h1>
            <p className="text-muted-foreground mt-2">Configure and manage email alerts</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>Set up a new email alert for your organization</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="alertName">Alert Name</Label>
                  <Input
                    id="alertName"
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                    placeholder="e.g., Weekly Report"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line for the email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select value={schedule} onValueChange={setSchedule} required>
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
                {schedule !== "monthly" && (
                  <div className="space-y-2">
                    <Label htmlFor="delivery">Delivery Day</Label>
                    <Input
                      id="delivery"
                      type="number"
                      min="1"
                      max={schedule === "weekly" ? "7" : "31"}
                      value={delivery}
                      onChange={(e) => setDelivery(e.target.value)}
                      placeholder={schedule === "weekly" ? "1-7 (Mon-Sun)" : "1-31"}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
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
                  <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                  {emailError && (
                    <p className="text-xs text-destructive">{emailError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Alert</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No alerts configured</h3>
              <p className="text-muted-foreground mb-4">Create your first alert to get started</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Manage your configured email alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert._id}>
                        <TableCell className="font-medium">{alert.alertName}</TableCell>
                        <TableCell>{alert.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{alert.schedule}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{alert.externalUsers.length} recipients</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={alert.isActive ? "default" : "secondary"}>
                            {alert.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
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
