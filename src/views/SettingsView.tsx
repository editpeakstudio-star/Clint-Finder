import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Bell,
  Database,
  Radio,
  LogOut,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { User, DashboardSettings } from '../types';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => void;
  listenerStatus: 'streaming' | 'standby';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout, listenerStatus }) => {
  const [settings, setSettings] = useState<DashboardSettings>({
    min_score: '45',
    refresh_interval: '15',
    notification_sound: 'true',
    hot_alerts: 'true',
    warm_alerts: 'true',
    theme: 'navy-dark'
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Termux command copy states
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedRun, setCopiedRun] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
          }
        }
      } catch {
        //
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const termuxInstallCmd = `pkg update && pkg install -y git python sqlite libffi openssl
git clone https://github.com/editpeakstudio-star/editpeak-finder.git
cd editpeak-finder
pip install -r requirements.txt`;

  const termuxRunCmd = `# Step 1: Run SQLite DB and Telegram Lead Finder
python main.py

# Step 2: (Optional) Run the local Flask Dashboard server
python dashboard.py`;

  const copyText = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      //
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            System Configuration & Session Controls
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational thresholds, notifications, database diagnostics and Termux environment
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Operator</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System settings updated and saved to SQLite persistence layer!</span>
        </div>
      )}

      {/* Operator Session Info */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Authenticated Operator Session
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Username</span>
            <span className="font-mono text-sm font-semibold text-white mt-1 block">
              {user?.username || 'Hacker'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Access Role</span>
            <span className="font-mono text-sm font-semibold text-emerald-400 mt-1 block uppercase">
              {user?.role || 'Administrator'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Session Protection</span>
            <span className="font-mono text-sm font-semibold text-indigo-400 mt-1 block">
              HttpOnly / SameSite
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Lead Filtering & Score Thresholds
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-medium text-slate-300">
                Minimum Lead Qualification Score
              </label>
              <span className="font-mono text-indigo-400 font-bold text-sm">
                {settings.min_score} / 100
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={settings.min_score}
              onChange={(e) => setSettings({ ...settings, min_score: e.target.value })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Messages scoring below this threshold are ignored by default to reduce noise.
            </p>
          </div>

          <div className="pt-2">
            <label className="font-medium text-slate-300 block mb-1.5">
              Dashboard Auto-Refresh Interval
            </label>
            <select
              value={settings.refresh_interval}
              onChange={(e) => setSettings({ ...settings, refresh_interval: e.target.value })}
              className="w-full sm:w-64 py-2 px-3 bg-[#070B14] border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="10">Every 10 Seconds (High Frequency)</option>
              <option value="15">Every 15 Seconds (Recommended)</option>
              <option value="30">Every 30 Seconds</option>
              <option value="60">Every 60 Seconds</option>
              <option value="0">Manual Refresh Only</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-800/60 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              Notification Sound & Triggers
            </h4>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hot_alerts === 'true'}
                onChange={(e) => setSettings({ ...settings, hot_alerts: e.target.checked ? 'true' : 'false' })}
                className="w-4 h-4 rounded accent-indigo-500 bg-[#070B14] border-slate-800"
              />
              <span>Generate urgent desktop notification for 🔥 HOT Leads (Score 70+)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.warm_alerts === 'true'}
                onChange={(e) => setSettings({ ...settings, warm_alerts: e.target.checked ? 'true' : 'false' })}
                className="w-4 h-4 rounded accent-indigo-500 bg-[#070B14] border-slate-800"
              />
              <span>Track notifications for 🟡 WARM Leads (Score 45+)</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Telegram Live Connection & Session Setup */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              Telegram Connection & Session Guide (TELEGRAM_SESSION_B64)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure setup instructions to generate your private Telethon session locally
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${
              listenerStatus === 'streaming'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`} />
            <span className={listenerStatus === 'streaming' ? 'text-emerald-400' : 'text-amber-400'}>
              {listenerStatus === 'streaming' ? 'Online / Streaming' : 'Safe Standby Mode'}
            </span>
          </div>
        </div>

        {/* Informative Explanation */}
        <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>How TELEGRAM_SESSION_B64 Works</span>
          </div>
          <p>
            Telethon stores your authorized session in a binary SQLite file named <code className="text-indigo-300 font-mono">editpeak_session.session</code>. 
            In automated, containerized, or headless environments (like Termux background tasks or cloud servers), the app cannot interactively prompt you for SMS verification codes.
          </p>
          <p>
            <code className="text-indigo-300 font-mono">TELEGRAM_SESSION_B64</code> is simply the base64-encoded string of your local session file. On startup, the app automatically decodes it back into <code className="text-indigo-300 font-mono">editpeak_session.session</code> so Telethon reconnects seamlessly without login prompts.
          </p>
        </div>

        {/* Security Warning Callout */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-amber-300">
            ⚠️ Security Invariant: Never commit your session string
          </span>
          <p>
            Your Telegram session grants authorized access to your Telegram account. Never hardcode, commit, or log your session string. 
            Session files (<code className="text-amber-100 font-mono">*.session</code>) and <code className="text-amber-100 font-mono">.env</code> are automatically excluded in your <code className="text-amber-100 font-mono">.gitignore</code>.
          </p>
        </div>

        {/* Step-by-Step Generation Guide */}
        <div className="space-y-3 pt-1 text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Step-by-Step Local Generation
          </h4>
          <ol className="space-y-2 text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              <strong className="text-white">Get Telegram API Credentials:</strong> Log into <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">my.telegram.org</a>, navigate to "API development tools", and obtain your <code className="text-indigo-300 font-mono">API_ID</code> and <code className="text-indigo-300 font-mono">API_HASH</code>.
            </li>
            <li>
              <strong className="text-white">Run Generator Locally:</strong> In your local terminal or Termux, run:
              <pre className="mt-1 p-2 bg-[#070B14] border border-slate-800 rounded-lg font-mono text-emerald-300 select-all">
                python generate_session.py
              </pre>
            </li>
            <li>
              <strong className="text-white">Authenticate Once:</strong> Enter your phone number and the Telegram login code sent to your official Telegram app.
            </li>
            <li>
              <strong className="text-white">Copy the Output:</strong> The script outputs your base64 string. Save it securely in your private environment:
              <pre className="mt-1 p-2 bg-[#070B14] border border-slate-800 rounded-lg font-mono text-indigo-200 select-all">
                TELEGRAM_SESSION_B64="eyJ..."
              </pre>
            </li>
          </ol>
        </div>
      </div>

      {/* Database Diagnostic Details */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          SQLite Database Engine Diagnostics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Database File</span>
            <span className="font-mono text-xs text-slate-300 mt-1 block truncate">
              data/leads.db
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Concurrency Mode</span>
            <span className="font-mono text-xs text-emerald-400 mt-1 block">
              WAL Mode (Write-Ahead Logging)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Integrity State</span>
            <span className="font-mono text-xs text-indigo-400 mt-1 block">
              Verified & Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* Termux Deployment & Run Instructions */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          Termux Android Installation & Run Instructions
        </h3>
        <p className="text-xs text-slate-400">
          You can run the entire Telegram autonomous listener and Flask dashboard natively on Android via Termux:
        </p>

        {/* Installation Command Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">1. Termux Installation Commands:</span>
            <button
              type="button"
              onClick={() => copyText(termuxInstallCmd, setCopiedInstall)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedInstall ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInstall ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#070B14] border border-slate-800 rounded-xl text-xs font-mono text-indigo-200 overflow-x-auto select-all">
            {termuxInstallCmd}
          </pre>
        </div>

        {/* Execution Command Box */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">2. Termux Run Commands:</span>
            <button
              type="button"
              onClick={() => copyText(termuxRunCmd, setCopiedRun)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedRun ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRun ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#070B14] border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto select-all">
            {termuxRunCmd}
          </pre>
        </div>
      </div>
    </div>
  );
};
