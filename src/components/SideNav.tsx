import React, { useState } from 'react';

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Database,
  GitBranch,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Users} from 'lucide-react';
import { useLocation,useNavigate } from 'react-router-dom';

import BSLogo from '../assets/darkmode_logo.png';
import { useAppContext } from '../context/AppContext';
import { Theme, useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider,TooltipTrigger } from './ui/tooltip';

interface SideNavProps {
  theme: Theme;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({ theme, collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAppData } = useAppContext();
  const { toggleTheme } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const getActiveKey = () => {
    const parts = location.pathname.split('/');
    if (parts.length >= 3 && parts[2]) {
      // Handle sub-menu paths like compliance-screener/client-overview
      if (parts.length >= 4 && parts[3]) {
        return `${parts[2]}/${parts[3]}`;
      }
      return parts[2];
    }
    return 'block-explorer';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/home/${key}`);
  };

  const toggleSubMenu = (key: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
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
      subItems: [
        {
          key: 'compliance-screener/client-overview',
          icon: <Users />,
          label: 'Client Overview',
        },
        {
          key: 'compliance-screener/addresses',
          icon: <Database />,
          label: 'Monitored Addresses',
        },
      ],
    },
    // {
    //   key: 'compliance-dashboard',
    //   icon: <BarChart3 />,
    //   label: 'Compliance Dashboard',
    // },
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
      key: 'flow-trace',
      icon: <GitBranch />,
      label: 'FlowTrace',
    },
    {
      key: 'vasp-explorer',
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
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.has(item.key);
              
              return (
                <div key={item.key}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (hasSubItems) {
                              // For compliance-screener, navigate to main page
                              if (item.key === 'compliance-screener') {
                                handleMenuClick({ key: item.key });
                              } else {
                                toggleSubMenu(item.key);
                              }
                            } else {
                              handleMenuClick({ key: item.key });
                            }
                          }}
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
                    <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (hasSubItems) {
                              // For compliance-screener, navigate to main page
                              if (item.key === 'compliance-screener') {
                                handleMenuClick({ key: item.key });
                              } else {
                                toggleSubMenu(item.key);
                              }
                            } else {
                              handleMenuClick({ key: item.key });
                            }
                          }}
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
                        {hasSubItems && (
                          <div 
                            className="ml-auto cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubMenu(item.key);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </Button>
                      
                      {/* Sub-menu items */}
                      {hasSubItems && isExpanded && !collapsed && (
                        <div className="ml-4 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const isSubActive = getActiveKey() === subItem.key;
                            return (
                              <Button
                                key={subItem.key}
                                variant="ghost"
                                onClick={() => handleMenuClick({ key: subItem.key })}
                                className={cn(
                                  "w-full justify-start gap-3 h-9 px-3 font-['Inter'] text-sm",
                                  isSubActive
                                    ? theme === 'light'
                                      ? "bg-orange-50 text-orange-600"
                                      : "bg-orange-900/20 text-orange-400"
                                    : theme === 'light'
                                      ? "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
                                      : "text-gray-400 hover:bg-gray-800 hover:text-orange-400"
                                )}
                              >
                                <div className="h-4 w-4">
                                  {subItem.icon}
                                </div>
                                <span className="font-medium">{subItem.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Theme Toggle */}
        <div className="px-4 pb-4">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={cn(
                    "w-10 h-10 mx-auto flex items-center justify-center",
                    theme === 'light'
                      ? "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
                      : "text-gray-400 hover:bg-gray-800 hover:text-orange-400"
                  )}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3",
                theme === 'light'
                  ? "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
                  : "text-gray-400 hover:bg-gray-800 hover:text-orange-400"
              )}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </Button>
          )}
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
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {user?.email.includes('@blockscout.ai') && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleUserMenuClick('admin')}
                    className="cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-white focus:bg-orange-50 dark:focus:bg-gray-700 focus:text-orange-600 dark:focus:text-white font-['Inter']"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleUserMenuClick('settings')}
                className="cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-white focus:bg-orange-50 dark:focus:bg-gray-700 focus:text-orange-600 dark:focus:text-white font-['Inter']"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem
                onClick={() => handleUserMenuClick('logout')}
                className="cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-white focus:bg-orange-50 dark:focus:bg-gray-700 focus:text-orange-600 dark:focus:text-white font-['Inter']"
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