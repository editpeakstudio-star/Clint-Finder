import React from 'react';
import { Menu, Bell, RefreshCw, Radio, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { NavPage } from './Sidebar';
import { TelegramConnectionStatus } from '../types';

interface HeaderProps {
  currentPage: NavPage;
  onOpenMobileNav: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  listenerStatus: 'streaming' | 'standby';
  telegramStatus?: TelegramConnectionStatus;
  lastSync: string;
  unreadCount: number;
  onNavigateToNotifications: () => void;
  onNavigateToSettings: () => void;
  onOpenTestModal: () => void;
}

const PAGE_METADATA: Record<NavPage, { title: string; subtitle: string }> = {
  overview: {
    title: 'Intelligence Overview',
    subtitle: 'System telemetry, KPI distributions and real-time activity'
  },
  lead_finder: {
    title: 'Lead Finder Engine',
    subtitle: 'Filter, search, inspect and export qualified video editing opportunities'
  },
  group_manager: {
    title: 'Group Manager',
    subtitle: 'Public channels, private authorized hubs and status monitoring'
  },
  keyword_manager: {
    title: 'Dynamic Keyword Manager',
    subtitle: '80 core preserved signals and custom weighted detection phrases'
  },
  sources: {
    title: 'Configured Sources',
    subtitle: 'Active stream feeds and Telegram community listeners'
  },
  analytics: {
    title: 'Deep Analytics',
    subtitle: 'Historical lead velocity, keyword efficiency and conversion metrics'
  },
  notifications: {
    title: 'Alerts & Notifications',
    subtitle: 'High-priority HOT leads and autonomous system alerts'
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Session configuration, score thresholds and Termux deployment'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileNav,
  onRefresh,
  refreshing,
  listenerStatus,
  telegramStatus,
  lastSync,
  unreadCount,
  onNavigateToNotifications,
  onNavigateToSettings,
  onOpenTestModal
}) => {
  const currentMeta = PAGE_METADATA[currentPage];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu + Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>EditPeak Finder</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-indigo-400 font-semibold capitalize">{currentPage.replace('_', ' ')}</span>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Listener Status & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Telegram Listener Status Badge */}
        <button
          type="button"
          onClick={onNavigateToSettings}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-[11px] font-mono cursor-pointer transition-colors"
          title={telegramStatus?.message || "Telegram listener status. Click to view configuration guide."}
        >
          <span className={`w-2 h-2 rounded-full ${
            telegramStatus?.status === 'connected'
              ? 'bg-emerald-400 animate-pulse'
              : telegramStatus?.status === 'session_required'
              ? 'bg-amber-400'
              : 'bg-indigo-400'
          }`} />
          <span className="text-slate-300 font-sans">
            Telegram: <strong className={
              telegramStatus?.status === 'connected'
                ? 'text-emerald-400'
                : telegramStatus?.status === 'session_required'
                ? 'text-amber-400'
                : 'text-indigo-400'
            }>
              {telegramStatus?.status === 'connected'
                ? 'Streaming'
                : telegramStatus?.status === 'session_required'
                ? 'Session Required'
                : 'Safe Standby'}
            </strong>
          </span>
        </button>

        {/* Live Test Trigger */}
        <button
          type="button"
          onClick={onOpenTestModal}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-semibold text-indigo-300 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Test Signals</span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Refresh database records"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Notifications Icon Button */}
        <button
          type="button"
          onClick={onNavigateToNotifications}
          className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#070B14]" />
          )}
        </button>
      </div>
    </header>
  );
};
