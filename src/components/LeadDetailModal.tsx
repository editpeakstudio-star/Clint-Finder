import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Trash2, Calendar, Target, Hash } from 'lucide-react';
import { Lead } from '../types';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onDelete
}) => {
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lead.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const isHot = lead.score >= 70;
  const isWarm = lead.score >= 45 && lead.score < 70;

  const matchedList = lead.matched_keywords
    ? lead.matched_keywords.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0B101D] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-[#070B14]/40">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isHot ? 'bg-rose-500 animate-pulse' : isWarm ? 'bg-amber-400' : 'bg-slate-400'}`} />
              {lead.source}
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">
              ID #{lead.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#070B14]/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 block mb-1">Lead Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold font-mono ${isHot ? 'text-rose-400' : isWarm ? 'text-amber-400' : 'text-slate-300'}`}>
                  {lead.score}
                </span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#070B14]/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 block mb-1">Classification</span>
              <span className="text-sm font-semibold text-white block">
                {lead.category}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#070B14]/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 block mb-1">Discovered</span>
              <span className="text-xs text-slate-300 font-mono block truncate">
                {new Date(lead.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#070B14]/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 block mb-1">Telegram Msg ID</span>
              <span className="text-xs text-slate-300 font-mono block">
                #{lead.message_id || 'Direct'}
              </span>
            </div>
          </div>

          {/* Matched Keywords */}
          {matchedList.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Detected Signals & Keywords ({matchedList.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedList.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Message Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Original Message Text
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-indigo-500/10"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {lead.text}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070B14]/40 flex items-center justify-between">
          <div>
            {lead.link ? (
              <a
                href={lead.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Open in Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-500 italic">No direct public URL</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete(lead.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Lead</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
