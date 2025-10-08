import React, { useContext, useState } from 'react';
import { Search } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeContext } from "./ThemeContext";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User";
  const userEmail = user.email || "";
  const userInitials = userName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background p-6">
        <div className="flex w-full gap-6 items-start">
          <div className="py-6">
            <AppSidebar theme={theme} toggleTheme={toggleTheme} />
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
          {/* Header */}
          <header className="bg-card rounded-3xl overflow-hidden">
            <div className="flex h-20 items-center px-8 gap-6">
              <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
              
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search task"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-0 rounded-full font-light"
                  />
                </div>
              </div>

              <div className="flex-1" />

              {/* Organization Switcher */}
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px] bg-transparent border-0 font-light">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="media-org">Media Organization</SelectItem>
                  <SelectItem value="tech-corp">Tech Corporation</SelectItem>
                  <SelectItem value="startup-inc">Startup Inc</SelectItem>
                  <SelectItem value="agency-co">Agency Co</SelectItem>
                </SelectContent>
              </Select>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-normal">{userName}</span>
                  <span className="text-xs text-muted-foreground font-light">{userEmail}</span>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main content - with visual separation */}
          <main className="flex-1 overflow-auto bg-background rounded-3xl p-6">
            {children}
          </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}