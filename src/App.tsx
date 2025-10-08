import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ModernDashboard from "./pages/ModernDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Analytics from "./pages/Analytics";
import Competitors from "./pages/Competitors";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import BroadcastMedia from "./pages/BroadcastMedia";
import OnlineMedia from "./pages/OnlineMedia";
import PrintMedia from "./pages/PrintMedia";
import SocialMedia from "./pages/SocialMedia";
import MediaSources from "./pages/MediaSources";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard/:orgId" element={<ModernDashboard />} />
          <Route path="/analytics/:orgId" element={<Analytics />} />
          <Route path="/competitors/:orgId" element={<Competitors />} />
          <Route path="/reports/:orgId" element={<Reports />} />
          <Route path="/alerts/:orgId" element={<Alerts />} />
          <Route path="/media/broadcast/:orgId" element={<BroadcastMedia />} />
          <Route path="/media/online/:orgId" element={<OnlineMedia />} />
          <Route path="/media/print/:orgId" element={<PrintMedia />} />
          <Route path="/media/social/:orgId" element={<SocialMedia />} />
          <Route path="/media/sources/:orgId" element={<MediaSources />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
