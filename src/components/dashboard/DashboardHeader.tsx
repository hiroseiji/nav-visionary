import React, { useEffect, useState } from 'react';
import { Bell, Plus, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useReportGeneration } from '@/contexts/ReportGenerationContext';
import axios from 'axios';

interface DashboardHeaderProps {
  organizationName: string;
  userName?: string;
  userEmail?: string;
  onAddProject?: () => void;
  onImportData?: () => void;
  onSearch?: (query: string) => void;
}

export function DashboardHeader({
  organizationName,
  userName = "Totok Michael",
  userEmail = "tm2kela2@gmail.com",
  onAddProject,
  onImportData,
  onSearch
}: DashboardHeaderProps) {
  const [orgAlias, setOrgAlias] = useState<string>('');
  const { isGenerating, progress } = useReportGeneration();

  useEffect(() => {
    const selectedOrgId = localStorage.getItem('selectedOrg') || localStorage.getItem('selectedOrgId');
    const fetchOrganizationAlias = async () => {
      if (selectedOrgId) {
        try {
          const response = await axios.get(
            `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations/${selectedOrgId}`
          );
          setOrgAlias(response.data.alias || response.data.organizationName || '');
        } catch (error) {
          console.error('Error fetching organization alias:', error);
        }
      }
    };
    fetchOrganizationAlias();
  }, []);

  const userInitials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        {/* Organization Alias */}
        <div className="flex-1 flex items-center">
          <h1 className="text-2xl font-bold tracking-wide uppercase text-foreground">
            {orgAlias}
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* Action Buttons */}
          <Button onClick={onAddProject} size="sm" className="hidden sm:flex">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
          
          <Button onClick={onImportData} variant="outline" size="sm" className="hidden sm:flex">
            <FileText className="mr-2 h-4 w-4" />
            Import Data
          </Button>

          {/* Report Generation Loader */}
          {isGenerating && (
            <div className="flex items-center gap-2">
              <div className="spinner w-8 h-8" />
              <span className="text-sm text-muted-foreground hidden lg:inline">
                {progress}%
              </span>
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}