import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  ArrowUpDown,
  Loader2,
  Sparkles,
  Edit2
} from 'lucide-react';
import { Keyword } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface KeywordManagerViewProps {
  onRefreshStats: () => void;
}

export const KeywordManagerView: React.FC<KeywordManagerViewProps> = ({ onRefreshStats }) => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [enabledCount, setEnabledCount] = useState(0);
  const [disabledCount, setDisabledCount] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'enabled' | 'disabled'>('ALL');
  const [sort, setSort] = useState<'alpha' | 'priority' | 'newest'>('alpha');

  // Add Keyword Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('General editor');
  const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete State
  const [keywordToDelete, setKeywordToDelete] = useState<number | null>(null);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sort
      });
      const res = await apiFetch(`/api/keywords?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKeywords(data.keywords || []);
        setTotal(data.total || 0);
        setEnabledCount(data.enabled || 0);
        setDisabledCount(data.disabled || 0);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [statusFilter, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeywords();
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    setAdding(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          category: newCategory,
          priority: newPriority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add keyword');
      }

      setNewKeyword('');
      setShowAddModal(false);
      setSuccessMsg(`Keyword "${data.keyword.keyword}" added and active!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchKeywords();
      onRefreshStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating keyword');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleKeyword = async (id: number, currentEnabled: number) => {
    try {
      const res = await apiFetch(`/api/keywords/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: currentEnabled === 1 ? 0 : 1 })
      });
      if (res.ok) {
        fetchKeywords();
        onRefreshStats();
      }
    } catch {
      //
    }
  };

  const handlePriorityChange = async (id: number, priority: 'low' | 'normal' | 'high') => {
    try {
      const res = await apiFetch(`/api/keywords/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      if (res.ok) {
        fetchKeywords();
      }
    } catch {
      //
    }
  };

  const handleDeleteConfirm = async () => {
    if (!keywordToDelete) return;
    try {
      const res = await apiFetch(`/api/keywords/${keywordToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeywords();
        onRefreshStats();
      }
    } catch {
      //
    } finally {
      setKeywordToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner and Summary Badges */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Dynamic Lead Detection Signals
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Preserving original 80 production rules with dynamic weighting in SQLite
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Keyword</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#0B101D] border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Database Signals</span>
          <span className="text-2xl font-bold font-mono text-white">{total}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B101D] border border-slate-800 text-center">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider block">Active & Filtering</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{enabledCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B101D] border border-slate-800 text-center">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Muted / Disabled</span>
          <span className="text-2xl font-bold font-mono text-slate-400">{disabledCount}</span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all 80+ keywords by phrase or category..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B101D] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#0B101D] border border-slate-800 rounded-xl">
            {(['ALL', 'enabled', 'disabled'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All Signals' : st === 'enabled' ? 'Active' : 'Disabled'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="py-1.5 px-3 bg-[#0B101D] border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500"
          >
            <option value="alpha">Alphabetical (A-Z)</option>
            <option value="priority">Priority First (High → Low)</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Keywords Grid / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs text-slate-400">Loading SQLite keywords...</span>
        </div>
      ) : keywords.length === 0 ? (
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Tag className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Keywords Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search or add a new keyword phrase.
          </p>
        </div>
      ) : (
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070B14]/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Keyword Phrase</th>
                  <th className="py-3 px-4">Niche Category</th>
                  <th className="py-3 px-4">Weight Priority</th>
                  <th className="py-3 px-4">Monitoring Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {kw.keyword}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {kw.category || 'Custom'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={kw.priority}
                        onChange={(e) => handlePriorityChange(kw.id, e.target.value as any)}
                        className={`py-0.5 px-2 rounded text-[11px] font-semibold border outline-none bg-[#070B14] ${
                          kw.priority === 'high'
                            ? 'text-rose-400 border-rose-500/30'
                            : kw.priority === 'normal'
                            ? 'text-indigo-300 border-indigo-500/30'
                            : 'text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="high">High (+10)</option>
                        <option value="normal">Normal (+5)</option>
                        <option value="low">Low (+2)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleKeyword(kw.id, kw.enabled)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                          kw.enabled === 1
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${kw.enabled === 1 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{kw.enabled === 1 ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setKeywordToDelete(kw.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete keyword"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Keyword Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0B101D] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Dynamic Detection Keyword</h3>
            <p className="text-xs text-slate-400 mb-4">
              New keywords instantly propagate to the live Telegram analyzer engine
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Keyword or Target Phrase *
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g. cinema 4d editor, visual effects, blender"
                  required
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category Niche
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="General editor">General editor</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Shorts / Reels">Shorts / Reels</option>
                  <option value="Social media">Social media</option>
                  <option value="Real estate">Real estate</option>
                  <option value="Other niches">Other niches (Podcast, Gaming, UGC)</option>
                  <option value="Software / skills">Software / skills</option>
                  <option value="Hiring / payment">Hiring / payment</option>
                  <option value="Custom">Custom Niche</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Score Weight Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'normal', 'high'] as const).map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setNewPriority(prio)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        newPriority === prio
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-[#070B14] text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
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
                  {adding ? 'Adding...' : 'Add Keyword'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={keywordToDelete !== null}
        title="Delete Signal Keyword"
        message="Are you sure you want to delete this keyword from SQLite? It will no longer contribute points to future Telegram messages."
        confirmText="Delete Keyword"
        onConfirm={handleDeleteConfirm}
        onClose={() => setKeywordToDelete(null)}
      />
    </div>
  );
};
