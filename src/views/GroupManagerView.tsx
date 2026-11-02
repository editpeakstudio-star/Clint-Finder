import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Search,
  Pause,
  Play,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Globe,
  ExternalLink,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Group } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface GroupManagerViewProps {
  onRefreshStats: () => void;
}

export const GroupManagerView: React.FC<GroupManagerViewProps> = ({ onRefreshStats }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add Group Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete State
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/groups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups();
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) {
      setAddError('Telegram group link or username cannot be empty.');
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: targetInput.trim(),
          title: titleInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add group');
      }

      setTargetInput('');
      setTitleInput('');
      setShowAddModal(false);
      fetchGroups();
      onRefreshStats();
    } catch (err: any) {
      setAddError(err.message || 'Validation failed');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/groups/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        fetchGroups();
        onRefreshStats();
      }
    } catch {
      //
    }
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    try {
      const res = await fetch(`/api/groups/${groupToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGroups();
        onRefreshStats();
      }
    } catch {
      //
    } finally {
      setGroupToDelete(null);
    }
  };

  const getStatusBadge = (status: Group['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Paused
          </span>
        );
      case 'pending_validation':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            Pending Validation
          </span>
        );
      case 'join_required':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400">
            <Lock className="w-3.5 h-3.5" />
            Join Required
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Error
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner and Actions */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-400" />
            Telegram Community & Group Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage public community feeds and authorized private channels for lead extraction
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monitored Group</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups by handle, title..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B101D] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-1 p-1 bg-[#0B101D] border border-slate-800 rounded-xl overflow-x-auto">
          {['ALL', 'ACTIVE', 'PAUSED', 'PENDING_VALIDATION'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs text-slate-400">Loading Telegram group configurations...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Users2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Groups Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Add Monitored Group" to connect a public Telegram handle or private authorized invite link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((grp) => {
            const isPublic = grp.type === 'public';
            return (
              <div
                key={grp.id}
                className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isPublic ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-white truncate">{grp.title}</h3>
                        <span className="text-xs text-slate-400 font-mono block truncate">
                          {grp.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Counts */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Status</span>
                      {getStatusBadge(grp.status)}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Leads Found</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {grp.lead_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  {/* Public Link if applicable */}
                  {isPublic ? (
                    <a
                      href={`https://t.me/${grp.username.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Private Hub
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {/* Pause / Resume */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(grp.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={grp.status === 'active' ? 'Pause monitoring' : 'Resume monitoring'}
                    >
                      {grp.status === 'active' ? (
                        <Pause className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setGroupToDelete(grp.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0B101D] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Telegram Monitored Group</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter public Telegram username or private invite link
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Telegram Username or Invite URL *
                </label>
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="@groupname or https://t.me/groupname or t.me/+invite"
                  required
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Public handles start with @. Private invite links start with t.me/+.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Friendly Title (Optional)
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Video Creators Network"
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Authorized Telethon Compliance</span>
                </div>
                <p>
                  For private groups, your connected Telegram user session must already be an authorized member. The bot will not spam or violate channel joining rules.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {adding ? 'Validating...' : 'Register Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={groupToDelete !== null}
        title="Remove Telegram Group"
        message="Are you sure you want to remove this group from monitoring? Leads collected previously will remain preserved in your archive."
        confirmText="Remove Group"
        onConfirm={handleDeleteConfirm}
        onClose={() => setGroupToDelete(null)}
      />
    </div>
  );
};
