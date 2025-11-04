import React, { useContext, useState, useEffect } from 'react';
import { ArrowDownUp, Search } from 'lucide-react';
import { AiOutlineUserSwitch } from 'react-icons/ai';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeContext } from "./ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [showOrgSelect, setShowOrgSelect] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ _id: string; organizationName: string }>>([]);
  
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User";
  const userEmail = user.email || "";
  const userInitials = userName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'super_admin') {
      axios.get('https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations')
        .then(res => setOrganizations(res.data))
        .catch(err => {
          console.error('Error fetching organizations:', err);
          toast.error('Error fetching organizations');
        });
    }
  }, [user?.role]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background p-6 overflow-hidden">
        <div className="flex w-full gap-3 items-start">
          <AppSidebar theme={theme} toggleTheme={toggleTheme} />

          <div className="flex-1 flex flex-col gap-3">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-muted rounded-3xl overflow-hidden">
              <div className="flex h-20 items-center px-8 gap-6">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />

                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search for articles"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-card text-foreground border border-border rounded-full font-light"
                    />
                  </div>
                </div>

                <div className="flex-1" />

                {/* Organization Switcher */}
                {user?.role === "super_admin" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOrgSelect(true)}
                      title="Switch organizations"
                    >
                      <ArrowDownUp className="h-7 w-7" /> Switch Organisations
                    </Button>

                    <Dialog
                      open={showOrgSelect}
                      onOpenChange={setShowOrgSelect}
                    >
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Switch Organization</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select
                            value={selectedOrg}
                            onValueChange={setSelectedOrg}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizations.map((org) => (
                                <SelectItem key={org._id} value={org._id}>
                                  {org.organizationName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => {
                              if (!selectedOrg) {
                                toast.error("Please select an organization");
                                return;
                              }
                              localStorage.setItem("selectedOrg", selectedOrg);
                              localStorage.setItem(
                                "selectedOrgId",
                                selectedOrg
                              );
                              setShowOrgSelect(false);
                              navigate(`/dashboard/${selectedOrg}`);
                              toast.success(
                                "Organization switched successfully"
                              );
                            }}
                            className="w-full"
                          >
                            Continue
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

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
                    <span className="text-xs text-muted-foreground font-light">
                      {userEmail}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main content - with visual separation */}
            <main className="flex-1 bg-muted rounded-3xl p-6 overflow-hidden h-[calc(100vh-8rem)]">
              <div className="overflow-y-auto overflow-x-hidden h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}