import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Lead } from '../types';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface LeadFinderViewProps {
  onRefreshStats: () => void;
}

export const LeadFinderView: React.FC<LeadFinderViewProps> = ({ onRefreshStats }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | 'HOT' | 'WARM' | 'LOW'>('ALL');
  const [source, setSource] = useState('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'score_desc' | 'score_asc'>('newest');

  // Available sources list for dropdown
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals state
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category,
        source,
        sort,
        page: page.toString(),
        limit: limit.toString()
      });
      if (minScore > 0) {
        params.append('min_score', minScore.toString());
      }

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setAvailableSources((data.sources || []).map((s: any) => s.name));
      }
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, limit, category, source, minScore, sort]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCopyLead = async (id: number, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      //
    }
  };

  // Toggle lead selection for bulk actions
  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  // Delete Individual Lead
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      const res = await fetch(`/api/leads/${leadToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedIds(prev => prev.filter(id => id !== leadToDelete));
        fetchLeads();
        onRefreshStats();
      }
    } catch {
      //
    } finally {
      setLeadToDelete(null);
    }
  };

  // Bulk Delete Leads
  const handleBulkDeleteConfirm = async () => {
    if (!selectedIds.length) return;
    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchLeads();
        onRefreshStats();
      }
    } catch {
      //
    } finally {
      setShowBulkDeleteConfirm(false);
    }
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = ['ID', 'Source', 'Message ID', 'Score', 'Category', 'Matched Signals', 'Message Text', 'Telegram Link', 'Timestamp'];
    const rows = leads.map(l => [
      l.id,
      `"${l.source.replace(/"/g, '""')}"`,
      l.message_id || '',
      l.score,
      `"${l.category.replace(/"/g, '""')}"`,
      `"${(l.matched_keywords || '').replace(/"/g, '""')}"`,
      `"${l.text.replace(/"/g, '""')}"`,
      `"${l.link || ''}"`,
      `"${l.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `client_finder_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Search & Actions Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by keywords, requirements, skills, or source..."
              className="w-full pl-10 pr-24 py-2.5 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Badges & Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
          {/* Segmented Category Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#070B14] border border-slate-800 rounded-xl">
            {(['ALL', 'HOT', 'WARM', 'LOW'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'HOT' && '🔥 '}
                {cat === 'WARM' && '🟡 '}
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Source Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Source:</span>
              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2.5 bg-[#070B14] border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Sources</option>
                {availableSources.map((src, i) => (
                  <option key={i} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Min Score Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Min Score:</span>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={minScore}
                onChange={(e) => {
                  setMinScore(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="w-20 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-indigo-400 font-bold min-w-[20px]">{minScore}</span>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any);
                  setPage(1);
                }}
                className="py-1 px-2.5 bg-[#070B14] border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table Header & Selection Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {selectedIds.length > 0 && selectedIds.length === leads.length ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-600" />
            )}
            <span>Select Page ({leads.length})</span>
          </button>
        </div>

        <div>
          Showing <strong className="text-white">{leads.length}</strong> of <strong className="text-white">{total}</strong> leads
        </div>
      </div>

      {/* Leads Cards Grid / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs text-slate-400">Querying qualified intelligence records...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Leads Matched Your Filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, lowering the minimum score, or selecting "All Categories".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('ALL');
              setSource('ALL');
              setMinScore(0);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer inline-block mt-2"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const isSelected = selectedIds.includes(lead.id);
            const isHot = lead.score >= 70;
            const isWarm = lead.score >= 45 && lead.score < 70;
            const keywords = lead.matched_keywords
              ? lead.matched_keywords.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={lead.id}
                onClick={() => setActiveLead(lead)}
                className={`p-4 sm:p-5 rounded-2xl bg-[#0B101D] border transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-start justify-between gap-4 ${
                  isSelected
                    ? 'border-indigo-500/70 bg-indigo-950/15'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Checkbox + Content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(lead.id, e)}
                    className="mt-1 text-slate-500 hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-white">
                        {lead.source}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(lead.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {lead.message_id ? (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-[11px] font-mono text-slate-500">#{lead.message_id}</span>
                        </>
                      ) : null}
                    </div>

                    {/* Lead text */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans line-clamp-3 select-text">
                      {lead.text}
                    </p>

                    {/* Matched Keywords */}
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Score, Category and Quick Action Buttons */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                  <div className="flex lg:flex-col items-center lg:items-end gap-2 lg:gap-1">
                    <span className={`text-base font-extrabold font-mono ${
                      isHot ? 'text-rose-400' : isWarm ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {lead.score}/100
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {lead.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyLead(lead.id, lead.text, e)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Copy lead message"
                    >
                      {copiedId === lead.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Open Link */}
                    {lead.link && (
                      <a
                        href={lead.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="View post on Telegram"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Delete Lead */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLeadToDelete(lead.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete lead"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-500">
            Page <strong className="text-slate-300">{page}</strong> of <strong className="text-slate-300">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={activeLead}
        onClose={() => setActiveLead(null)}
        onDelete={(id) => {
          setLeadToDelete(id);
        }}
      />

      {/* Single Delete Confirm Modal */}
      <ConfirmModal
        isOpen={leadToDelete !== null}
        title="Delete Lead"
        message="Are you sure you want to permanently remove this lead from the SQLite database? This action cannot be undone."
        confirmText="Delete Lead"
        onConfirm={handleDeleteConfirm}
        onClose={() => setLeadToDelete(null)}
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        title={`Delete ${selectedIds.length} Selected Leads`}
        message={`Are you sure you want to delete all ${selectedIds.length} selected leads permanently from the database?`}
        confirmText="Delete Selected"
        onConfirm={handleBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
};
