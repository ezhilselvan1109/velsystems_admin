import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCondensed, setIsSidebarCondensed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleSidebarCondensed = useCallback(() => {
    setIsSidebarCondensed(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
        isCondensed={isSidebarCondensed}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 `}>
        <Header 
          onMenuToggle={toggleSidebar}
          onCondensedToggle={toggleSidebarCondensed}
          isSidebarCondensed={isSidebarCondensed}
        />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;