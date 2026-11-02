import React from 'react';
import {
  Flame,
  Zap,
  TrendingUp,
  Radio,
  KeyRound,
  Users2,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Activity,
  Layers
} from 'lucide-react';
import { Stats, Lead } from '../types';

interface OverviewViewProps {
  stats: Stats | null;
  loading: boolean;
  onNavigateToLeads: () => void;
  onSelectLead: (lead: Lead) => void;
  onOpenTestModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  loading,
  onNavigateToLeads,
  onSelectLead,
  onOpenTestModal
}) => {
  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-900/60 rounded-2xl border border-slate-800/60" />
          <div className="h-72 bg-slate-900/60 rounded-2xl border border-slate-800/60" />
        </div>
      </div>
    );
  }

  // Max value for timeline chart scaling
  const maxDayCount = Math.max(1, ...stats.leads_timeline.map(t => t.count));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {stats.total_leads}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Recorded</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span>Today:</span>
            <span className="text-slate-300 font-mono font-semibold">+{stats.today_leads} new</span>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">HOT Leads</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
              {stats.hot_leads}
            </span>
            <span className="text-xs text-rose-400/80 font-medium font-mono">Score ≥ 70</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            High direct client hiring intent
          </div>
        </div>

        {/* Warm Leads */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">WARM Leads</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {stats.warm_leads}
            </span>
            <span className="text-xs text-amber-400/80 font-medium font-mono">Score ≥ 45</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Prospective video gigs & budgets
          </div>
        </div>

        {/* Monitored Assets */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Telemetry Coverage</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {stats.active_sources}
            </span>
            <span className="text-xs text-slate-400 font-medium">Sources</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
            <span>{stats.monitored_groups} Groups</span>
            <span>·</span>
            <span className="text-indigo-300 font-mono font-medium">{stats.active_keywords} Keywords</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Collected Chart */}
        <div className="lg:col-span-2 bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Leads Collected Over Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated Telegram stream volume timeline</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Total Leads
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Hot Leads
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-slate-800/60">
            {stats.leads_timeline.map((item, idx) => {
              const heightPct = Math.round((item.count / maxDayCount) * 100);
              const hotHeightPct = item.count > 0 ? Math.round((item.hot_count / item.count) * 100) : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-[11px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    <span className="font-semibold text-white">{item.day}:</span> {item.count} leads ({item.hot_count} HOT)
                  </div>

                  <div className="w-full max-w-[32px] rounded-t-lg bg-indigo-500/20 border border-indigo-500/30 overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-125" style={{ height: `${Math.max(12, heightPct)}%` }}>
                    <div className="w-full bg-rose-500/80 transition-all" style={{ height: `${hotHeightPct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 truncate max-w-full">
                    {item.day.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
            <span>Automated ingestion cycle</span>
            <span>Real SQLite timeline</span>
          </div>
        </div>

        {/* Lead Category Distribution */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Category Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Intent score grading distribution</p>
          </div>

          <div className="my-6 space-y-4">
            {/* Hot Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> 🔥 HOT (Score 70+)
                </span>
                <span className="font-mono text-white">
                  {stats.hot_leads} ({stats.total_leads ? Math.round((stats.hot_leads / stats.total_leads) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total_leads ? (stats.hot_leads / stats.total_leads) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Warm Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> 🟡 WARM (Score 45-69)
                </span>
                <span className="font-mono text-white">
                  {stats.warm_leads} ({stats.total_leads ? Math.round((stats.warm_leads / stats.total_leads) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total_leads ? (stats.warm_leads / stats.total_leads) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-400 flex items-center gap-1.5">
                  ⚪ LOW (Score &lt; 45)
                </span>
                <span className="font-mono text-white">
                  {stats.low_leads} ({stats.total_leads ? Math.round((stats.low_leads / stats.total_leads) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total_leads ? (stats.low_leads / stats.total_leads) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Minimum Filter Threshold:</span>
            <span className="font-mono text-indigo-300 font-bold">45 Points</span>
          </div>
        </div>
      </div>

      {/* Source Performance & Recent Leads Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Source Channel Velocity</h2>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-3">
            {stats.source_stats.map((src, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#070B14]/80 border border-slate-800/60 flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="text-xs font-semibold text-white block truncate">
                    {src.source}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Avg Score: {src.avg_score}/100
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                  {src.count} leads
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Qualified Leads Stream */}
        <div className="lg:col-span-2 bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recent High-Intent Leads</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest opportunities streaming from monitored channels</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLeads}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.recent_leads.map((lead) => {
              const isHot = lead.score >= 70;
              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-3.5 rounded-xl bg-[#070B14]/70 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white truncate">
                        {lead.source}
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                      {lead.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className={`text-xs font-bold font-mono ${isHot ? 'text-rose-400' : 'text-amber-400'}`}>
                        {lead.score}/100
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {lead.category.replace(/[^a-zA-Z]/g, '')}
                      </span>
                    </div>
                    {lead.link && (
                      <a
                        href={lead.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Open Telegram Message"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Last sync: {new Date(stats.last_sync).toLocaleTimeString()}</span>
            <button
              type="button"
              onClick={onOpenTestModal}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Simulate Live Telegram Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
