import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Clock,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Source } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface SourcesViewProps {
  onRefreshStats: () => void;
  listenerStatus: 'streaming' | 'standby';
}

export const SourcesView: React.FC<SourcesViewProps> = ({ onRefreshStats, listenerStatus }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Source State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState('Telegram Channel');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete State
  const [sourceToDelete, setSourceToDelete] = useState<number | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleToggleSource = async (id: number) => {
    try {
      const res = await apiFetch(`/api/sources/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        fetchSources();
        onRefreshStats();
      }
    } catch {
      //
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    setAdding(true);
    setAddError(null);

    try {
      const res = await apiFetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSourceName.trim(),
          type: newSourceType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add source');
      }

      setNewSourceName('');
      setShowAddModal(false);
      fetchSources();
      onRefreshStats();
    } catch (err: any) {
      setAddError(err.message || 'Error creating source');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!sourceToDelete) return;
    try {
      const res = await apiFetch(`/api/sources/${sourceToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSources();
        onRefreshStats();
      }
    } catch {
      //
    } finally {
      setSourceToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            Configured Ingestion Sources
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitored channels, groups and communities feeding the lead extraction pipeline
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Channel Source</span>
        </button>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs text-slate-400">Loading sources...</span>
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Radio className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Sources Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add a Telegram source to begin stream extraction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => {
            const isMonitoringActive = src.enabled === 1 && listenerStatus === 'streaming';
            return (
              <div
                key={src.id}
                className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-white truncate font-mono">
                          {src.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 block">
                          {src.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#070B14]/70 border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Ingestion State</span>
                      <span className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                        isMonitoringActive
                          ? 'text-emerald-400'
                          : src.enabled === 1
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isMonitoringActive
                            ? 'bg-emerald-400 animate-pulse'
                            : src.enabled === 1
                            ? 'bg-amber-400'
                            : 'bg-slate-600'
                        }`} />
                        {src.enabled === 0 ? 'Muted' : isMonitoringActive ? 'Streaming' : 'Ready (Listener Standby)'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Leads</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {src.lead_count}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <a
                    href={`https://t.me/${src.name.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    <span>View Channel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleSource(src.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        src.enabled === 1
                          ? 'bg-slate-800 text-slate-300 hover:text-white'
                          : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                      }`}
                    >
                      {src.enabled === 1 ? 'Mute' : 'Enable'}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setSourceToDelete(src.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Remove source"
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

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0B101D] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Telegram Channel Source</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a monitored channel or chat handle to the ingestion stream
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Telegram Source Handle *
                </label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g. video_editors_hub or @channel_handle"
                  required
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Source Type
                </label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="Telegram Channel">Telegram Channel</option>
                  <option value="Telegram Community">Telegram Community</option>
                  <option value="Telegram Supergroup">Telegram Supergroup</option>
                </select>
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
                  {adding ? 'Adding...' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={sourceToDelete !== null}
        title="Remove Telegram Source"
        message="Are you sure you want to remove this source from your configured channels? All historical leads from this source will remain in SQLite."
        confirmText="Remove Source"
        onConfirm={handleDeleteConfirm}
        onClose={() => setSourceToDelete(null)}
      />
    </div>
  );
};
