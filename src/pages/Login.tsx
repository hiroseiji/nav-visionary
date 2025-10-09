import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { LoginCredentials, LoginResponse, Organization } from "@/types/auth";

const API_BASE = "https://sociallightbw-backend-34f7586fa57c.herokuapp.com";

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOrgSelect, setShowOrgSelect] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post<LoginResponse>(`${API_BASE}/login`, credentials);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "org_admin") {
        localStorage.setItem("organizationId", user.organizationId || "");
        localStorage.setItem("selectedOrg", user.organizationId || "");
        localStorage.setItem("selectedOrgId", user.organizationId || "");
        toast.success("Login successful!");
        await new Promise((resolve) => setTimeout(resolve, 500));
        navigate(`/dashboard/${user.organizationId}`);
      } else if (user.role === "super_admin") {
        const orgResponse = await axios.get<Organization[]>(`${API_BASE}/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrganizations(orgResponse.data);
        setShowOrgSelect(true);
      }
    } catch (error: unknown) {
      console.error("Login failed:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      toast.error(errorMessage || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgContinue = async () => {
    if (!selectedOrg) {
      toast.error("Please select an organization");
      return;
    }

    localStorage.setItem("organizationId", selectedOrg);
    localStorage.setItem("selectedOrg", selectedOrg);
    localStorage.setItem("selectedOrgId", selectedOrg);
    setShowOrgSelect(false);
    toast.success("Organization selected!");
    navigate(`/dashboard/${selectedOrg}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Welcome section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] p-12 flex-col justify-center items-center text-white">
        {/* Flowing white curves - diagonal organic flowing lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M-100,-50 Q200,250 400,200 T800,400 T1100,600" stroke="white" strokeWidth="4" fill="none" opacity="0.08"/>
          <path d="M-200,100 Q100,350 350,300 T700,500 T1200,700" stroke="white" strokeWidth="3.5" fill="none" opacity="0.07"/>
          <path d="M-150,250 Q150,450 450,400 T850,650 T1300,850" stroke="white" strokeWidth="3" fill="none" opacity="0.06"/>
          <path d="M200,-100 Q400,150 600,100 T900,300 T1200,500" stroke="white" strokeWidth="3.5" fill="none" opacity="0.05"/>
        </svg>

        {/* Content directly on background */}
        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-5xl font-medium">Welcome Back!</h1>
          <p className="text-lg text-white/95 font-medium">
            Login to continue accessing your account and track your media presence.
          </p>
          <div className="pt-6">
            <img
              src="/socialDark.png"
              alt="Social Light"
              className="w-full max-w-[280px]"
            />
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <img src="/social.png" alt="Social Light" className="w-32 h-32 mx-auto mb-4 rounded-full" />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Organization Selection Dialog */}
      <Dialog open={showOrgSelect} onOpenChange={setShowOrgSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Your Organization</DialogTitle>
            <DialogDescription>
              Choose which organization you'd like to view
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org._id} value={org._id}>
                    {org.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleOrgContinue} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
