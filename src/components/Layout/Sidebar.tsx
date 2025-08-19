import React, { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Archive,
  ShoppingCart,
  Megaphone,
  ChevronDown,
  ChevronRight,
  X,
  Tag,
  Menu,
  Settings,
  Users,
  BarChart3,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCondensed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isCondensed = false }) => {
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();

  const toggleProducts = useCallback(() => {
    setIsProductsOpen(prev => !prev);
  }, []);

  const toggleMarketing = useCallback(() => {
    setIsMarketingOpen(prev => !prev);
  }, []);

  const toggleReports = useCallback(() => {
    setIsReportsOpen(prev => !prev);
  }, []);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(prev => !prev);
  }, []);
  const handleNavClick = useCallback(() => {
    // Close sidebar on mobile when nav item is clicked
    if (window.innerWidth < 1024) {
      onToggle();
    }
  }, [onToggle]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/inventory', icon: Archive, label: 'Inventory' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
  ];

  const productSubItems = [
    { path: '/categories', label: 'Categories' },
    { path: '/brands', label: 'Brands' }
  ];
  const marketingSubItems = [
    { path: '/marketing/coupons', label: 'Coupons' },
  ];
  const reportSubItems = [
    { path: '/reports/sales', label: 'Sales Report' },
    { path: '/reports/inventory', label: 'Inventory Report' },
  ];
  const settingsSubItems = [
    { path: '/settings/general', label: 'General' },
    { path: '/settings/users', label: 'Users' },
  ];

  // Check if current path matches any product setup routes
  const isProductSetupActive = ['/categories', '/brands'].some(path => 
    location.pathname.startsWith(path)
  );

  // Check if current path matches any marketing routes
  const isMarketingActive = ['/marketing'].some(path => 
    location.pathname.startsWith(path)
  );

  // Check if current path matches any reports routes
  const isReportsActive = ['/reports'].some(path => 
    location.pathname.startsWith(path)
  );

  // Check if current path matches any settings routes
  const isSettingsActive = ['/settings'].some(path => 
    location.pathname.startsWith(path)
  );
  // Auto-expand sections based on current route
  React.useEffect(() => {
    if (isProductSetupActive) {
      setIsProductsOpen(true);
    }
    if (isMarketingActive) {
      setIsMarketingOpen(true);
    }
    if (isReportsActive) {
      setIsReportsOpen(true);
    }
    if (isSettingsActive) {
      setIsSettingsOpen(true);
    }
  }, [isProductSetupActive, isMarketingActive, isReportsActive, isSettingsActive]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          ${isCondensed ? 'w-16' : 'w-64'}
          shadow-lg lg:shadow-none
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 ${isCondensed ? 'px-2' : ''}`}>
          <div className={`space-x-2 ${isCondensed ? 'hidden' : ''}`}>
            {!isCondensed && (
              <img
                src="/vels-logo.png"
                alt="logo"
                className="w-32 h-auto sm:w-40 md:w-48 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          {isCondensed && (
            <div className="w-full flex justify-center">
              <Menu className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <button
            onClick={onToggle}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${isCondensed ? 'lg:block' : 'lg:hidden'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`p-4 space-y-2 ${isCondensed ? 'px-2' : ''} overflow-y-auto flex-1`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:scale-105 ${isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
                } ${isCondensed ? 'justify-center px-2' : ''}`
              }
              title={isCondensed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 ${isCondensed ? '' : 'mr-3'}`} />
              {!isCondensed && item.label}
              {isCondensed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}

          {/* Products with submenu */}
          <div>
            <button
              onClick={toggleProducts}
              className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ${
                isProductSetupActive ? 'bg-blue-50 text-blue-700' : ''
              } ${isCondensed ? 'justify-center px-2' : ''}`}
              title={isCondensed ? 'Product Setup' : ''}
            >
              <div className={`flex items-center ${isCondensed ? 'justify-center' : ''}`}>
                <Tag className={`w-5 h-5 ${isCondensed ? '' : 'mr-3'}`} />
                {!isCondensed && 'Product Setup'}
              </div>
              {!isCondensed && (
                <>
                  {isProductsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </>
              )}
              {isCondensed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0">
                  Product Setup
                </div>
              )}
            </button>

            {isProductsOpen && !isCondensed && (
              <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {productSubItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:translate-x-1 ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          {/* Marketing with submenu */}
          <div>
            <button
              onClick={toggleMarketing}
              className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ${
                isMarketingActive ? 'bg-blue-50 text-blue-700' : ''
              } ${isCondensed ? 'justify-center px-2' : ''}`}
              title={isCondensed ? 'Marketing' : ''}
            >
              <div className={`flex items-center ${isCondensed ? 'justify-center' : ''}`}>
                <Megaphone className={`w-5 h-5 ${isCondensed ? '' : 'mr-3'}`} />
                {!isCondensed && 'Marketing'}
              </div>
              {!isCondensed && (
                <>
                  {isMarketingOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </>
              )}
              {isCondensed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0">
                  Marketing
                </div>
              )}
            </button>

            {isMarketingOpen && !isCondensed && (
              <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {marketingSubItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:translate-x-1 ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Reports with submenu */}
          <div>
            <button
              onClick={toggleReports}
              className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ${
                isReportsActive ? 'bg-blue-50 text-blue-700' : ''
              } ${isCondensed ? 'justify-center px-2' : ''}`}
              title={isCondensed ? 'Reports' : ''}
            >
              <div className={`flex items-center ${isCondensed ? 'justify-center' : ''}`}>
                <BarChart3 className={`w-5 h-5 ${isCondensed ? '' : 'mr-3'}`} />
                {!isCondensed && 'Reports'}
              </div>
              {!isCondensed && (
                <>
                  {isReportsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </>
              )}
              {isCondensed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0">
                  Reports
                </div>
              )}
            </button>

            {isReportsOpen && !isCondensed && (
              <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {reportSubItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:translate-x-1 ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Settings with submenu */}
          <div>
            <button
              onClick={toggleSettings}
              className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ${
                isSettingsActive ? 'bg-blue-50 text-blue-700' : ''
              } ${isCondensed ? 'justify-center px-2' : ''}`}
              title={isCondensed ? 'Settings' : ''}
            >
              <div className={`flex items-center ${isCondensed ? 'justify-center' : ''}`}>
                <Settings className={`w-5 h-5 ${isCondensed ? '' : 'mr-3'}`} />
                {!isCondensed && 'Settings'}
              </div>
              {!isCondensed && (
                <>
                  {isSettingsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </>
              )}
              {isCondensed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0">
                  Settings
                </div>
              )}
            </button>

            {isSettingsOpen && !isCondensed && (
              <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {settingsSubItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:translate-x-1 ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;