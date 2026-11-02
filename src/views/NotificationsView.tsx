import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Flame,
  TrendingUp,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { NotificationItem } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface NotificationsViewProps {
  onRefreshStats: () => void;
  onNavigateToLeads: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onRefreshStats, onNavigateToLeads }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
        onRefreshStats();
      }
    } catch {
      //
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (res.ok) {
        fetchNotifications();
        onRefreshStats();
      }
    } catch {
      //
    } finally {
      setShowClearConfirm(false);
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lead_hot':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'lead_warm':
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'telegram_error':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Top Banner and Actions */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Intelligence Alerts & Notifications
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time triggers for HOT/WARM leads and autonomous listener health
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-indigo-400" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs text-slate-400">Loading notification stream...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">All Clear — No Notifications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When new qualified video editing leads are detected by the Telegram analyzer, alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = n.read === 0;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isUnread
                    ? 'bg-[#0B101D] border-indigo-500/40 shadow-sm shadow-indigo-500/5'
                    : 'bg-[#0B101D]/60 border-slate-800/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'lead_hot'
                    ? 'bg-rose-500/10 border border-rose-500/20'
                    : n.type === 'lead_warm'
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'bg-indigo-500/10 border border-indigo-500/20'
                }`}>
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-white truncate flex items-center gap-2">
                      {n.title}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {n.message}
                  </p>

                  {(n.type === 'lead_hot' || n.type === 'lead_warm') && (
                    <button
                      type="button"
                      onClick={onNavigateToLeads}
                      className="mt-2 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View in Lead Finder</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Notifications"
        message="Are you sure you want to clear your entire notifications history? Qualified leads in your database will not be affected."
        confirmText="Clear Feed"
        onConfirm={handleClearAll}
        onClose={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
