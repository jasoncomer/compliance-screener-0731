import React from 'react';
import { 
  User, 
  LogOut, 
  Settings, 
  Users,
  Menu,
  Search,
  BarChart3,
  Globe,
  Database
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Theme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import BSLogo from '../assets/darkmode_logo.png';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

interface SideNavProps {
  theme: Theme;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({ theme, collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAppData } = useAppContext();

  const getActiveKey = () => {
    const parts = location.pathname.split('/');
    if (parts.length >= 3 && parts[2]) {
      return parts[2];
    }
    return 'compliance-screener';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/home/${key}`);
  };

  const handleLogout = () => {
    clearAppData();
    navigate('/login');
  };

  const handleUserMenuClick = (action: string) => {
    if (action === 'admin') {
      navigate('/home/admin');
    } else if (action === 'settings') {
      navigate('/home/settings');
    } else if (action === 'logout') {
      handleLogout();
    }
  };

  const navigationItems = [
    {
      key: 'compliance-screener',
      icon: <Search />,
      label: 'Compliance Screener',
    },
    {
      key: 'compliance-dashboard',
      icon: <BarChart3 />,
      label: 'Compliance Dashboard',
    },
    {
      key: 'block-explorer',
      icon: <Globe />,
      label: 'Block Explorer',
    },
    {
      key: 'risk-dashboard',
      icon: <BarChart3 />,
      label: 'Risk Dashboard',
    },
    {
      key: 'blockham',
      icon: <Database />,
      label: 'VASP Entity Explorer',
    },
  ];

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-screen transition-all duration-300 flex flex-col font-['Inter'] flex-shrink-0",
          collapsed ? "w-14" : "w-60",
          theme === 'light' ? "bg-white border-r border-gray-200" : "bg-gray-900 border-r border-gray-700"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center p-4 border-b",
          collapsed ? "justify-center" : "justify-between",
          theme === 'light' ? "border-gray-200" : "border-gray-700"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img 
                src={BSLogo}
                alt="Logo"
                className="h-8 w-auto"
              />
              <span className={cn(
                "font-semibold text-lg font-['Inter']",
                theme === 'light' ? "text-gray-900" : "text-white"
              )}>
                BlockScout
              </span>
            </div>
          )}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCollapse(!collapsed)}
                  className={cn(
                    "h-12 w-12",
                    theme === 'light' ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-white"
                  )}
                >
                  <img src={BSLogo} alt="Logo" className="h-8 w-auto" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand Menu</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapse(!collapsed)}
              className={cn(
                "h-8 w-8",
                theme === 'light' ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-white"
              )}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const isActive = getActiveKey() === item.key;
              return (
                <div key={item.key}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMenuClick({ key: item.key })}
                          className={cn(
                            "w-10 h-10 mx-auto flex items-center justify-center font-['Inter']",
                            isActive
                              ? theme === 'light'
                                ? "bg-orange-50 text-orange-600"
                                : "bg-orange-900/20 text-orange-400"
                              : theme === 'light'
                                ? "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
                                : "text-gray-400 hover:bg-gray-800 hover:text-orange-400"
                          )}
                        >
                          <div className="h-5 w-5">
                            {item.icon}
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => handleMenuClick({ key: item.key })}
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3 font-['Inter']",
                        isActive
                          ? theme === 'light'
                            ? "bg-orange-50 text-orange-600"
                            : "bg-orange-900/20 text-orange-400"
                          : theme === 'light'
                            ? "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
                            : "text-gray-400 hover:bg-gray-800 hover:text-orange-400"
                      )}
                    >
                      <div className="h-5 w-5">
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Menu */}
        <div className={cn(
          "p-4 border-t",
          theme === 'light' ? "border-gray-200" : "border-gray-700"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-auto p-2 font-['Inter']",
                  collapsed && "justify-center",
                  theme === 'light' 
                    ? "hover:bg-gray-100 hover:text-orange-600 text-gray-700" 
                    : "hover:bg-gray-800 hover:text-orange-400 text-gray-300"
                )}
              >
                <User className="h-5 w-5" />
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className={cn(
                      "font-medium truncate text-sm font-['Inter']",
                      theme === 'light' ? "text-gray-900" : "text-white"
                    )}>
                      {user?.name || 'User'}
                    </div>
                    <div className={cn(
                      "text-xs truncate font-['Inter']",
                      theme === 'light' ? "text-gray-500" : "text-gray-400"
                    )}>
                      {user?.email}
                    </div>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user?.email.includes('@blockscout.ai') && (
                <>
                  <DropdownMenuItem 
                    onClick={() => handleUserMenuClick('admin')}
                    className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 font-['Inter']"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={() => handleUserMenuClick('settings')}
                className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 font-['Inter']"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleUserMenuClick('logout')}
                className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 font-['Inter']"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SideNav; 