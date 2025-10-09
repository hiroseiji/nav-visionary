import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import axios from "axios";
import {
  Home,
  ChartNoAxesColumn,
  FileChartLine,
  Users,
  Bell,
  User,
  Settings,
  Radio,
  Globe,
  Newspaper,
  MessageCircle,
  Building2,
  ChevronDown,
  Moon,
  Sun,
  Paperclip,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Define navigation items
const mediaItems = [
  { title: "Broadcast Media", icon: Radio, url: "/media/broadcast" },
  { title: "Online Media", icon: Globe, url: "/media/online" },
  { title: "Print Media", icon: Newspaper, url: "/media/print" },
  { title: "Social Media", icon: MessageCircle, url: "/media/social" },
  { title: "Media Sources", icon: Paperclip, url: "/media/sources" },
];

const userItems = [
  { title: "Users", icon: User, url: "/users" },
  { title: "Organizations", icon: Building2, url: "/organizations" },
  { title: "Settings", icon: Settings, url: "/settings" },
];

interface AppSidebarProps {
  theme?: string;
  toggleTheme?: () => void;
}

export function AppSidebar({ theme, toggleTheme }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const storedOrgId = localStorage.getItem("selectedOrgId");
  const orgId = storedOrgId && storedOrgId !== "null" ? storedOrgId : null;
  const { open } = useSidebar();
  const collapsed = !open;
  
  const [selectedOrgName, setSelectedOrgName] = useState('');
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Logo paths - Vite uses direct public folder access
  const logoLight = '/social.png';
  const logoDark = '/socialDark.png';

  // Navigation items with dynamic orgId
  const navigationItems = [
    { title: "Dashboard", icon: Home, url: "/dashboard" },
    { title: "Analytics", icon: ChartNoAxesColumn, url: "/analytics" },
    { title: "Competitors", icon: Users, url: "/competitors" },
    { title: "Reports", icon: FileChartLine, url: "/reports" },
  ];

  const isActive = (path: string) => location.pathname.includes(path);

  const getNavClassName = (url: string) => {
    const active = isActive(url);
    return cn(
      "w-full justify-start transition-all duration-200 relative",
      active 
        ? "text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:rounded-r-full before:bg-gradient-to-b before:from-[hsl(217,91%,35%)] before:to-[hsl(217,91%,60%)]" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );
  };

  // Fetch organization name
  useEffect(() => {
    const selectedOrgId = localStorage.getItem('selectedOrg');
    const fetchOrganizationName = async () => {
      if (selectedOrgId) {
        try {
          const response = await axios.get(
            `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrgId}`
          );
          setSelectedOrgName(response.data.organizationName);
        } catch (error) {
          console.error('Error fetching organization name:', error);
        }
      }
    };
    fetchOrganizationName();
  }, []);

  // Logout function
  const handleLogout = () => {
    const savedTheme = localStorage.getItem("theme");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizationId");
    localStorage.removeItem("selectedOrg");
    localStorage.setItem("theme", savedTheme || "light");
    navigate('/login');
  };

  return (
    <Sidebar
      className={cn(
        "bg-background border-b border-border",
        "ml-4 my-4 w-auto max-w-[280px] min-w-[260px]",
        "h-[calc(100vh-2rem)]",
        "rounded-[24px]",
        "overflow-hidden flex flex-col"
      )}
    >
      <SidebarHeader className="border-0 p-6">
        <div className="flex items-center justify-center gap-3 w-full">
          {!collapsed && (
            <img
              src={theme === "light" ? logoLight : logoDark}
              alt="logo"
              className="h-20 w-auto object-contain"
            />
          )}
        </div>
        {selectedOrgName && !collapsed && (
          <div className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-accent/50 rounded-md font-light text-center w-full">
            {selectedOrgName}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground/70 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={orgId ? `${item.url}/${orgId}` : "/"}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Media Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground/70 uppercase tracking-wider">
            Media
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={mediaMenuOpen} onOpenChange={setMediaMenuOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {!collapsed && <span>Media Channels</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            mediaMenuOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {mediaItems.map((item) => (
                      <SidebarMenuItem key={item.title} className="ml-4">
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={orgId ? `${item.url}/${orgId}` : "/"}
                            className={getNavClassName(item.url)}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && (
                              <span className="text-sm">{item.title}</span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Alerts for super_admin */}
        {user.role === "super_admin" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/alerts/${orgId}`}
                      className={getNavClassName("/alerts")}
                    >
                      <Bell className="h-4 w-4" />
                      {!collapsed && <span>Alerts</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground/70 uppercase tracking-wider">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={orgId ? `${item.url}/${orgId}` : "/"}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-0 p-6">
        <SidebarMenu>
          {/* Theme Toggle */}
          <SidebarMenuItem>
            {!collapsed ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {theme === "light" ? "Light" : "Dark"}
                </span>
                <button
                  onClick={toggleTheme}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-muted"
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-primary transition-transform",
                      theme === "dark" ? "translate-x-6" : "translate-x-1"
                    )}
                  >
                    {theme === "light" ? (
                      <Sun className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Moon className="h-4 w-4 text-primary-foreground" />
                    )}
                  </span>
                </button>
              </div>
            ) : (
              <SidebarMenuButton
                onClick={toggleTheme}
                className="w-full justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}