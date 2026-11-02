import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, Key, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Both username and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error('Server returned an invalid response. Check the backend.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        throw new Error('Unexpected response from security server.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error communicating with authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-[420px] z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/20 border border-indigo-500/30 mb-4 shadow-xl shadow-indigo-500/10">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            CLIENT FINDER <span className="text-indigo-400 font-extrabold text-sm ml-1 px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10">V2</span>
          </h1>
          <p className="text-xs text-slate-400 tracking-wide uppercase font-semibold">
            EditPeak Private Intelligence Portal
          </p>
        </div>

        {/* Security Box */}
        <div className="bg-[#0B101D]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Encrypted Session Gateway
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Argon2 / bcrypt</span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#070B14]/80 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-sm text-white placeholder-slate-600 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Access Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  {showPassword ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret key"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#070B14]/80 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-sm text-white placeholder-slate-600 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate Operator</span>
                    <ArrowRight className="w-4 h-4 text-indigo-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick initial setup hint for the authorized operator */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              Private system: Authorized access only <code className="text-slate-300 font-mono">Hacker</code> / <code className="text-slate-300 font-mono">Hackerx</code>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-600 mt-6 tracking-wide">
          Strictly private server-authoritative system. Unauthorized access attempts are monitored and rate-limited.
        </p>
      </div>
    </div>
  );
};
