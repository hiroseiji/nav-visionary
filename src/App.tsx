import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ModernDashboard from "./pages/ModernDashboard";
import { Navigate } from "react-router-dom";

const DashboardRedirect = () => {
  const selectedOrg = localStorage.getItem('selectedOrgId') || localStorage.getItem('selectedOrg');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const orgId = user.role === 'super_admin' ? selectedOrg : user.organizationId;
  
  if (!orgId) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={`/dashboard/${orgId}`} replace />;
};
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Analytics from "./pages/Analytics";
import Competitors from "./pages/Competitors";
import Reports from "./pages/Reports";
import ReportResults from "./pages/ReportResults";
import Alerts from "./pages/Alerts";
import BroadcastMedia from "./pages/BroadcastMedia";
import OnlineMedia from "./pages/OnlineMedia";
import PrintMedia from "./pages/PrintMedia";
import SocialMedia from "./pages/SocialMedia";
import MediaSources from "./pages/MediaSources";
import Users from "./pages/Users";
import Organizations from "./pages/Organizations";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/app">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/dashboard/:orgId" element={<ProtectedRoute><ModernDashboard /></ProtectedRoute>} />
            <Route path="/analytics/:orgId" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/competitors/:orgId" element={<ProtectedRoute><Competitors /></ProtectedRoute>} />
            <Route path="/reports/:orgId" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/report-results/:orgId/:reportId" element={<ProtectedRoute><ReportResults /></ProtectedRoute>} />
            <Route path="/alerts/:orgId" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/media/broadcast/:orgId" element={<ProtectedRoute><BroadcastMedia /></ProtectedRoute>} />
            <Route path="/media/online/:orgId" element={<ProtectedRoute><OnlineMedia /></ProtectedRoute>} />
            <Route path="/media/print/:orgId" element={<ProtectedRoute><PrintMedia /></ProtectedRoute>} />
            <Route path="/media/social/:orgId" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>} />
            <Route path="/media/sources/:orgId" element={<ProtectedRoute><MediaSources /></ProtectedRoute>} />
            <Route path="/users/:orgId" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/organizations/:orgId" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
            <Route path="/settings/:orgId" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
