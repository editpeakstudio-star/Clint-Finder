import React from 'react';
import {
  LayoutDashboard,
  Search,
  Users2,
  KeyRound,
  Radio,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Zap
} from 'lucide-react';
import { User } from '../types';

export type NavPage =
  | 'overview'
  | 'lead_finder'
  | 'group_manager'
  | 'keyword_manager'
  | 'sources'
  | 'analytics'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  unreadNotifications: number;
  user: User | null;
  onLogout: () => void;
  onOpenTestModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  unreadNotifications,
  user,
  onLogout,
  onOpenTestModal
}) => {
  const navItems: { id: NavPage; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'lead_finder', label: 'Lead Finder', icon: Search },
    { id: 'group_manager', label: 'Group Manager', icon: Users2 },
    { id: 'keyword_manager', label: 'Keyword Manager', icon: KeyRound },
    { id: 'sources', label: 'Sources', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (page: NavPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-[#0A0E1A] border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand / Logo Section */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-sm font-bold text-white tracking-tight block leading-tight">
                  CLIENT FINDER
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400">
                  EditPeak V2 Private
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Test Trigger Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onOpenTestModal}
            className={`w-full py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Inspect message signals or simulate incoming lead"
          >
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            {!collapsed && <span className="truncate">Live Lead Tester</span>}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-500 shadow-sm shadow-indigo-500" />
                )}

                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />

                {!collapsed && (
                  <span className="truncate text-left flex-1 font-semibold">
                    {item.label}
                  </span>
                )}

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    } ${collapsed ? 'absolute -top-1 -right-1' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070B14]/40">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 font-bold text-xs uppercase">
                {user?.username ? user.username[0] : 'H'}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <span className="text-xs font-semibold text-white block truncate">
                    {user?.username || 'Hacker'}
                  </span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-mono">
                    {user?.role || 'Operator'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Logout Operator Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
