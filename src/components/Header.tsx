import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
import { AiOutlineUserSwitch } from 'react-icons/ai';
import { Player } from '@lottiefiles/react-lottie-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReportGeneration } from '@/contexts/ReportGenerationContext';
import axios from 'axios';
import { toast } from 'sonner';
import loadingAnimation from '@/assets/loadingAnimation.json';

interface HeaderProps {
  userName: string;
  userRole: string;
  onSearch: (query: string) => void;
}

interface Organization {
  _id: string;
  organizationName: string;
}

const Header: React.FC<HeaderProps> = ({ userName, userRole, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrgSelect, setShowOrgSelect] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { isGenerating, progress } = useReportGeneration();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgResponse = await axios.get('https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations');
        setOrganizations(orgResponse.data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error("Error fetching organizations");
      }
    };
    if (userRole === 'super_admin') {
      fetchOrganizations();
    }
  }, [userRole]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const toggleOrgSelect = () => {
    setShowOrgSelect(prev => !prev);
  };

  const handleContinue = () => {
    if (!selectedOrg) {
      toast.error("Please select an organization");
      return;
    }
    localStorage.setItem('selectedOrg', selectedOrg);
    localStorage.setItem('selectedOrgId', selectedOrg);
    setShowOrgSelect(false);
    navigate(`/dashboard/${selectedOrg}`);
    toast.success("Organization switched successfully");
  };

  return (
    <>
      <header className="bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 w-64 bg-white dark:bg-card"
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
            </form>

            {isGenerating && (
              <div className="flex items-center gap-2">
                <Player
                  autoplay
                  loop
                  src={loadingAnimation}
                  style={{ height: '40px', width: '40px' }}
                />
                <span className="text-sm text-muted-foreground">
                  Generating report... {progress}%
                </span>
              </div>
            )}

            {userRole === 'super_admin' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleOrgSelect}
                title="Switch organizations"
              >
                <AiOutlineUserSwitch className="h-7 w-7" />
              </Button>
            )}
            
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-muted-foreground">({userRole})</span>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showOrgSelect} onOpenChange={setShowOrgSelect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org._id} value={org._id}>
                    {org.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleContinue} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;