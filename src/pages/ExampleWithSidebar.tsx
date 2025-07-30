import React from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ThemeProvider } from '@/components/ThemeContext';

const ExampleWithSidebar = () => {
  return (
    <ThemeProvider>
      <SidebarLayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Your Dashboard Content</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Card 1</h2>
              <p className="text-muted-foreground">This is how your content looks with the new sidebar.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Card 2</h2>
              <p className="text-muted-foreground">The sidebar is fully responsive and collapses on mobile.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Card 3</h2>
              <p className="text-muted-foreground">Dark and light themes work seamlessly.</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ThemeProvider>
  );
};

export default ExampleWithSidebar;