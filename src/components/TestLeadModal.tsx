import React, { useState } from 'react';
import { X, Play, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Send } from 'lucide-react';

interface TestLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export const TestLeadModal: React.FC<TestLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated
}) => {
  const [text, setText] = useState(
    'Urgent: We need a video editor for high-retention YouTube documentary videos. Experience with Premiere Pro, After Effects, and sound design required. Long-term contract with budget ₹35,000/month or $25/video.'
  );
  const [source, setSource] = useState('Editpeakstudio');
  const [analyzing, setAnalyzing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    category: string;
    matched: string[];
  } | null>(null);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setSimulatedSuccess(false);
    try {
      const res = await fetch('/api/test-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      //
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSimulateSave = async () => {
    if (!text.trim()) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/simulate-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source })
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedSuccess(true);
        onLeadCreated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      //
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-[#0B101D] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-[#070B14]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Lead Analyzer Live Inspector</h3>
              <p className="text-[11px] text-slate-400">Evaluate Telegram messages against active keyword rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Simulated Telegram Source Channel
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full py-2 px-3 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="Editpeakstudio">Editpeakstudio</option>
              <option value="Freelancing_Video_Editing">Freelancing_Video_Editing</option>
              <option value="redgs">redgs</option>
              <option value="editing_material7">editing_material7</option>
              <option value="@letsgrow10">@letsgrow10</option>
              <option value="@NOXXCUT">@NOXXCUT</option>
              <option value="@techjailbreakofficial">@techjailbreakofficial</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Message Text to Analyze
              </label>
              <button
                type="button"
                onClick={() => setText('Looking for an editor to create daily TikTok/Reels edits. Paying $20 per short. DM with portfolio.')}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Insert Sample 2
              </button>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste raw telegram text here..."
              className="w-full p-3 bg-[#070B14] border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-600 outline-none font-sans leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Analyze Signals</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateSave}
              disabled={simulating || !text.trim()}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {simulating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-indigo-200" />
              )}
              <span>Simulate Real Lead</span>
            </button>
          </div>

          {simulatedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Lead successfully processed, saved into SQLite, and pushed to notifications!</span>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Score & Classification</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold font-mono ${
                    result.score >= 70 ? 'text-rose-400' : result.score >= 45 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {result.score}/100
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {result.category}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Matched Keywords & Modifiers</span>
                {result.matched.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {result.matched.map((m, i) => (
                      <span key={i} className="text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-300">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">No registered signals detected in message.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
