import React, { useState, useEffect, useCallback } from 'react';
import { LoginPage } from './components/LoginPage';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './views/OverviewView';
import { LeadFinderView } from './views/LeadFinderView';
import { GroupManagerView } from './views/GroupManagerView';
import { KeywordManagerView } from './views/KeywordManagerView';
import { SourcesView } from './views/SourcesView';
import { AnalyticsView } from './views/AnalyticsView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { TestLeadModal } from './components/TestLeadModal';
import { User, Stats, Lead } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global Intelligence Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Modals
  const [inspectLead, setInspectLead] = useState<Lead | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Check Session on Mount
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setStatsLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else if (res.status === 401) {
        setUser(null);
      }
    } catch {
      //
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchNotificationsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.unread_count || 0);
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchNotificationsCount();

      // Background telemetry sync every 15 seconds
      const interval = setInterval(() => {
        fetchStats(true);
        fetchNotificationsCount();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [user, fetchStats, fetchNotificationsCount]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      //
    } finally {
      setUser(null);
      setCurrentPage('overview');
    }
  };

  // Auth checking skeleton loader
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Verifying Security Invariants...
        </span>
      </div>
    );
  }

  // Mandatory Private Login Screen
  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
        unreadNotifications={unreadNotifications}
        user={user}
        onLogout={handleLogout}
        onOpenTestModal={() => setTestModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <Header
          currentPage={currentPage}
          onOpenMobileNav={() => setMobileDrawerOpen(true)}
          onRefresh={() => {
            fetchStats();
            fetchNotificationsCount();
          }}
          refreshing={refreshing}
          listenerStatus={stats?.telegram_listener_status || 'standby'}
          telegramStatus={stats?.telegram_status}
          lastSync={stats?.last_sync || new Date().toISOString()}
          unreadCount={unreadNotifications}
          onNavigateToNotifications={() => setCurrentPage('notifications')}
          onNavigateToSettings={() => setCurrentPage('settings')}
          onOpenTestModal={() => setTestModalOpen(true)}
        />

        {/* View Switcher Container */}
        <main className="flex-1 pb-16">
          {currentPage === 'overview' && (
            <OverviewView
              stats={stats}
              loading={statsLoading}
              onNavigateToLeads={() => setCurrentPage('lead_finder')}
              onSelectLead={(lead) => setInspectLead(lead)}
              onOpenTestModal={() => setTestModalOpen(true)}
            />
          )}

          {currentPage === 'lead_finder' && (
            <LeadFinderView
              onRefreshStats={() => {
                fetchStats(true);
                fetchNotificationsCount();
              }}
            />
          )}

          {currentPage === 'group_manager' && (
            <GroupManagerView
              onRefreshStats={() => {
                fetchStats(true);
              }}
            />
          )}

          {currentPage === 'keyword_manager' && (
            <KeywordManagerView
              onRefreshStats={() => {
                fetchStats(true);
              }}
            />
          )}

          {currentPage === 'sources' && (
            <SourcesView
              onRefreshStats={() => {
                fetchStats(true);
              }}
              listenerStatus={stats?.telegram_listener_status || 'standby'}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsView
              stats={stats}
              loading={statsLoading}
            />
          )}

          {currentPage === 'notifications' && (
            <NotificationsView
              onRefreshStats={() => {
                fetchStats(true);
                fetchNotificationsCount();
              }}
              onNavigateToLeads={() => setCurrentPage('lead_finder')}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsView
              user={user}
              onLogout={handleLogout}
              listenerStatus={stats?.telegram_listener_status || 'standby'}
            />
          )}
        </main>
      </div>

      {/* Global Quick Inspect Lead Modal */}
      <LeadDetailModal
        lead={inspectLead}
        onClose={() => setInspectLead(null)}
        onDelete={async (id) => {
          try {
            await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            setInspectLead(null);
            fetchStats(true);
          } catch {
            //
          }
        }}
      />

      {/* Global Live Lead Analyzer Test Modal */}
      <TestLeadModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        onLeadCreated={() => {
          fetchStats(true);
          fetchNotificationsCount();
        }}
      />
    </div>
  );
}
