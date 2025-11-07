import { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ThemeContext } from "@/components/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Organization } from "@/types/auth";

const API_BASE = "https://sociallightbw-backend-34f7586fa57c.herokuapp.com";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const token = new URLSearchParams(location.search).get('token');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordsMatchError, setPasswordsMatchError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Org selector state (for super_admin)
  const [showOrgSelect, setShowOrgSelect] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Validate token from invite link
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('No invitation token found');
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/users/validate-token/${token}`);
        setFormData(prev => ({ ...prev, email: res.data.email }));
        setTokenValid(true);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 410) {
          navigate(`/expired-link?token=${token}`);
        } else {
          toast.error('This invitation link is invalid or expired.');
          navigate('/login');
        }
      }
    };
    validateToken();
  }, [token, navigate]);

  const validatePassword = (password: string) => {
    setPasswordError(password.length < 8 ? 'Password must be at least 8 characters long.' : '');
  };

  const validatePasswordsMatch = (password: string, confirmPassword: string) => {
    setPasswordsMatchError(confirmPassword && password !== confirmPassword ? 'Passwords do not match.' : '');
  };

  const handleChange = (field: 'password' | 'confirmPassword', value: string) => {
    setFormData({ ...formData, [field]: value });

    if (field === 'password') {
      validatePassword(value);
      if (formData.confirmPassword) {
        validatePasswordsMatch(value, formData.confirmPassword);
      }
    }
    if (field === 'confirmPassword') {
      validatePasswordsMatch(formData.password, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordError || passwordsMatchError) {
      toast.error('Please correct the errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Complete registration with backend
      await axios.post(`${API_BASE}/api/auth/complete-registration`, {
        token,
        password: formData.password
      });

      // 2️⃣ Log in automatically after registration
      const loginResponse = await axios.post(`${API_BASE}/login`, {
        email: formData.email,
        password: formData.password
      });

      const { token: userToken, user } = loginResponse.data;
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(user));

      // 3️⃣ Role-based navigation
      if (user.role === 'org_admin') {
        const orgId =
          user.organizationId ||
          user.organizations?.[0]?.id ||
          user.organizationIds?.[0] || null;

        if (!orgId) {
          toast.error('No organization found for this user.');
          return;
        }

        localStorage.setItem('organizationId', orgId);
        localStorage.setItem('selectedOrg', orgId);
        navigate(`/dashboard/${orgId}`);
      } else if (user.role === 'super_admin') {
        try {
          // Fetch orgs for modal selector
          const orgResponse = await axios.get(`${API_BASE}/organizations`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          if (orgResponse.data?.length) {
            setOrganizations(orgResponse.data);
            setShowOrgSelect(true);
          } else {
            toast.error('No organizations found');
          }
        } catch (err) {
          console.error('Error loading organizations:', err);
          toast.error('Error loading organizations. Please try again later.');
        }
      } else {
        navigate(`/dashboard`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
        ? error.response.data.error 
        : 'An error occurred. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgContinue = async () => {
    if (!selectedOrg) {
      toast.error('Please select an organization');
      return;
    }
    localStorage.setItem('organizationId', selectedOrg);
    localStorage.setItem('selectedOrg', selectedOrg);
    setShowOrgSelect(false);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    navigate(`/dashboard/${selectedOrg}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Welcome section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-12 flex-col justify-center items-center text-primary-foreground">
        <div className="max-w-md space-y-6">
          <h1 className="text-5xl font-bold">Join Us Today!</h1>
          <p className="text-xl text-primary-foreground/90">
            Create your account and start tracking your media presence across
            all platforms.
          </p>
          <div className="pt-8">
            <img
              src={theme === "dark" ? "/socialDark.png" : "/social.png"}
              alt="Social Light"
              className="w-28 h-28 mx-auto mb-6 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <img
              src={theme === "dark" ? "/socialDark.png" : "/social.png"}
              alt="Social Light"
              className="w-32 h-32 mx-auto mb-4 rounded-full"
            />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              Complete Registration
            </h2>
            <p className="text-muted-foreground">Set your password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  disabled={loading || !tokenValid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                  disabled={loading || !tokenValid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordsMatchError && <p className="text-sm text-destructive">{passwordsMatchError}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !tokenValid}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing registration...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Super admin org selector dialog */}
      <Dialog open={showOrgSelect} onOpenChange={setShowOrgSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Your Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org._id} value={org._id}>
                    {org.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleOrgContinue} className="w-full" disabled={!selectedOrg}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
