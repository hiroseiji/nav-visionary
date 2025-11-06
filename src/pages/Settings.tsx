import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User as UserIcon, Lock, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { orgId } = useParams();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || '{}')
  );
  
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email] = useState(user.email || "");
  
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "system"
  );
  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem("settings_prefs") || '{"notifications": true}').notifications
  );
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || '{}');
    if (u) setUser(u);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = { ...user, firstName, lastName };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdCurrent || !pwdNew || !pwdConfirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (pwdNew !== pwdConfirm) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      // TODO: call your API
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
      toast.success("Password updated successfully");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem("settings_prefs", JSON.stringify({ notifications, theme }));
    localStorage.setItem("theme", theme);
    toast.success("Preferences saved successfully");
  };

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        {/* <div className="container mx-auto p-6 max-w-4xl"> */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={pwdCurrent}
                    onChange={(e) => setPwdCurrent(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                <CardTitle>Preferences</CardTitle>
              </div>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* </div> */}
    </SidebarLayout>
  );
};

export default Settings;
