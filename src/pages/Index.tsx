import React from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';

const Index = () => {
  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground mb-8">Your improved sidebar is now live with modern design and responsiveness!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary">Modern Design</h2>
              <p className="text-muted-foreground">Clean, modern UI using shadcn components and design tokens.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary">Responsive</h2>
              <p className="text-muted-foreground">Fully responsive with collapsible behavior on mobile devices.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary">Theme Support</h2>
              <p className="text-muted-foreground">Seamless light and dark theme switching.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary">Navigation</h2>
              <p className="text-muted-foreground">Active states, hover effects, and smooth transitions.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary">Collapsible Groups</h2>
              <p className="text-muted-foreground">Organized media section with expandable groups.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary">Icons</h2>
              <p className="text-muted-foreground">Beautiful Lucide React icons throughout.</p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Index;
