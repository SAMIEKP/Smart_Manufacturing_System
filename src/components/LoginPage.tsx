import React, { useState } from 'react';
import { Lock, ChevronRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      onLogin(username.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/80 bg-slate-950/95 shadow-2xl p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-[#1e293b] p-4 rounded-3xl shadow-inner shadow-slate-900/40">
            <Lock className="w-8 h-8 text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Lilongwe Plant Portal</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to access the operational dashboard and plant controls.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <label className="block text-sm font-semibold text-slate-300">
            Email
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-sky-500"
              placeholder="name@plant.lilongwe"
              autoComplete="username"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-sky-500"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] shadow-lg shadow-cyan-500/20 transition hover:bg-[#38bdf8]"
          >
            Sign In
          </button>

          <div className="mt-4 text-center text-xs text-slate-500">
            <span>Protected plant control access for authorized Lilongwe operations personnel.</span>
          </div>
        </form>

        <div className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Authentication is required before loading the command dashboard.</span>
        </div>
      </div>
    </div>
  );
}
