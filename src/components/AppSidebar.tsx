import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import axios from "axios";
import { 
  Home, 
  BarChart3, 
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
  LogOut,
  Menu,
  X
} from 'lucide-react';

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
const navigationItems = [
  { title: "Dashboard", icon: Home, url: "/dashboard" },
  { title: "Analytics", icon: BarChart3, url: "/analytics" },
  { title: "Competitors", icon: Users, url: "/competitors" },
];

const mediaItems = [
  { title: "Broadcast Media", icon: Radio, url: "/media/broadcast" },
  { title: "Online Media", icon: Globe, url: "/media/online" },
  { title: "Print Media", icon: Newspaper, url: "/media/print" },
  { title: "Social Media", icon: MessageCircle, url: "/media/social" },
];

const userItems = [
  { title: "Users", icon: User, url: "/users" },
  { title: "Organizations", icon: Building2, url: "/organization" },
  { title: "Settings", icon: Settings, url: "/settings" },
];

interface AppSidebarProps {
  theme?: string;
  toggleTheme?: () => void;
}

export function AppSidebar({ theme, toggleTheme }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgId } = useParams();
  const { open } = useSidebar();
  const collapsed = !open;
  
  const [selectedOrgName, setSelectedOrgName] = useState('');
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Logo paths
  const logoLight = process.env.PUBLIC_URL + '/social.jpg';
  const logoDark = process.env.PUBLIC_URL + '/socialDark.png';

  const isActive = (path: string) => location.pathname.includes(path);

  const getNavClassName = (url: string) => {
    const active = isActive(url);
    return cn(
      "w-full justify-start transition-all duration-200",
      active 
        ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
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
    <Sidebar className="border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          {!collapsed && (
            <img
              src={theme === "light" ? logoLight : logoDark}
              alt="logo"
              className="h-8 w-auto object-contain"
            />
          )}
        </div>
        {selectedOrgName && !collapsed && (
          <div className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-accent/50 rounded-md">
            {selectedOrgName}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={`${item.url}/${orgId}`}
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
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
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
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          mediaMenuOpen && "rotate-180"
                        )} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {mediaItems.map((item) => (
                      <SidebarMenuItem key={item.title} className="ml-4">
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={`${item.url}/${orgId}`}
                            className={getNavClassName(item.url)}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span className="text-sm">{item.title}</span>}
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
        {user.role === 'super_admin' && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={`/alerts/${orgId}`}
                      className={getNavClassName('/alerts')}
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
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={`${item.url}/${orgId}`}
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

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          {/* Theme Toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme}
              className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              {!collapsed && (
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              )}
            </SidebarMenuButton>
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