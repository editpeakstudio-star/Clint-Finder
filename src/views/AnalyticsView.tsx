import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Flame,
  Download,
  Calendar,
  Layers,
  Award,
  Hash,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { Stats } from '../types';

interface AnalyticsViewProps {
  stats: Stats | null;
  loading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, loading }) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-44 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  // Calculate Overall Average Lead Score
  const allScores = stats.source_stats.map(s => s.avg_score);
  const avgOverallScore = allScores.length > 0
    ? Math.round(allScores.reduce((acc, curr) => acc + curr, 0) / allScores.length)
    : 65;

  const maxTimelineCount = Math.max(1, ...stats.leads_timeline.map(t => t.count));
  const maxKwCount = Math.max(1, ...(stats.top_keywords || []).map(k => k.count));

  // Export Analytics Summary Report
  const handleExportReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      overview: {
        total_leads: stats.total_leads,
        today_leads: stats.today_leads,
        hot_leads: stats.hot_leads,
        warm_leads: stats.warm_leads,
        low_leads: stats.low_leads,
        average_score: avgOverallScore,
        active_sources: stats.active_sources,
        active_keywords: stats.active_keywords,
        monitored_groups: stats.monitored_groups
      },
      sources: stats.source_stats,
      top_keywords: stats.top_keywords,
      timeline: stats.leads_timeline
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `editpeak_intelligence_analytics_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner and Export */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Lead Intelligence Analytics Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical lead velocity, keyword hit frequencies and source yield metrics
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportReport}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0B101D] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Average Lead Score</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-white font-mono">{avgOverallScore}</span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">High client qualification</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B101D] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">HOT Conversion Ratio</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">
              {stats.total_leads ? Math.round((stats.hot_leads / stats.total_leads) * 100) : 0}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{stats.hot_leads} direct client hiring leads</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B101D] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Monitored Channels</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">{stats.active_sources}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across {stats.monitored_groups} Telegram groups</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B101D] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Active Signal Matrix</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-indigo-400 font-mono">{stats.active_keywords}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Real-time keyword triggers</span>
        </div>
      </div>

      {/* Leads Velocity Chart */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Lead Discovery Velocity</h3>
            <p className="text-xs text-slate-400">Total volume and high-intent opportunities over time</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#070B14] border border-slate-800 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-semibold capitalize rounded-lg transition-colors cursor-pointer ${
                  timeframe === tf ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Chart */}
        <div className="h-48 flex items-end gap-3 pt-6 px-2 border-b border-slate-800/60">
          {stats.leads_timeline.map((item, idx) => {
            const height = Math.round((item.count / maxTimelineCount) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-600/30 to-indigo-500/80 border border-indigo-400/40 transition-all group-hover:scale-y-105" style={{ height: `${Math.max(15, height)}%` }} />
                <span className="text-[10px] text-slate-400 font-mono mt-2 truncate">
                  {item.day.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source-wise vs Keyword Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source-wise Performance */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Source Ingestion Ranking
            </h3>
            <span className="text-xs text-slate-500">Volume & Quality</span>
          </div>

          <div className="space-y-3">
            {stats.source_stats.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#070B14]/70 border border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white font-mono">{s.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-mono font-bold">{s.count} leads</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-mono">Avg {s.avg_score} pts</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, (s.count / Math.max(1, stats.total_leads)) * 100 * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyword-wise Performance */}
        <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-400" />
              Top Triggered Keywords
            </h3>
            <span className="text-xs text-slate-500">Signal Frequency</span>
          </div>

          <div className="space-y-3">
            {(stats.top_keywords || []).map((k, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#070B14]/70 border border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-300 font-medium">{k.keyword}</span>
                  <span className="font-mono text-slate-300 font-bold">{k.count} matches</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.round((k.count / maxKwCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
