import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, Bell, Settings, ChevronDown, Sidebar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  onCondensedToggle?: () => void;
  isSidebarCondensed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  onCondensedToggle,
  isSidebarCondensed = false 
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  // 👇 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Desktop sidebar toggle */}
          {onCondensedToggle && (
            <button
              onClick={onCondensedToggle}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
              title={isSidebarCondensed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Sidebar className="w-5 h-5" />
            </button>
          )}
          
          <div className="ml-2 lg:ml-0">
            <h2 className="text-lg font-semibold text-gray-900">Ecommerce Admin</h2>
            <p className="text-xs text-gray-500 hidden sm:block">Manage your online store</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4 relative">
          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-900">
                {user?.name || 'Admin'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
            </button>

            {/* Animated Responsive Dropdown */}
            <div
              className={`absolute right-0 mt-2 w-60 sm:w-55 bg-white border rounded-xl shadow-lg z-50 transform transition-all duration-200 origin-top 
              ${dropdownOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2 pointer-events-none'}
              /* Mobile-friendly: full width */ sm:right-2 sm:mt-2 sm:rounded-xl max-h-[80vh] overflow-y-auto`}
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b bg-gray-50 sm:bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">Administrator</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 mr-3 text-gray-500" />
                  Profile
                </button>

                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 mr-3 text-gray-500" />
                  Settings
                </button>
              </div>

              {/* Logout Section */}
              <div className="border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-500" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;