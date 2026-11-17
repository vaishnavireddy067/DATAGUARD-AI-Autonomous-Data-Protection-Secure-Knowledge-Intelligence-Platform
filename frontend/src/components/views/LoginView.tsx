'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/types';

interface LoginViewProps {
  onNavigate: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || `Failed to sign in as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-[1.5px] mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to DataGuard AI</h2>
        <p className="text-xs text-zinc-400 mt-1">Autonomous data protection & secure intelligence</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Login Form */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@dataguard.ai"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-cyan-400 hover:underline font-medium cursor-pointer"
          >
            Register new account
          </button>
        </div>
      </div>

      {/* Quick Testing Credentials */}
      <div className="mt-8 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
        <div className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          Quick Demo Credentials (1-Click Test Sign In)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin')}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-purple-950/60 hover:border-purple-600/50 border border-zinc-700/60 text-left transition-all cursor-pointer"
          >
            <div className="text-[11px] font-bold text-purple-300">Admin</div>
            <div className="text-[9px] text-zinc-400 font-mono truncate">admin@...</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('manager')}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-blue-950/60 hover:border-blue-600/50 border border-zinc-700/60 text-left transition-all cursor-pointer"
          >
            <div className="text-[11px] font-bold text-blue-300">Manager</div>
            <div className="text-[9px] text-zinc-400 font-mono truncate">manager@...</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('employee')}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-emerald-950/60 hover:border-emerald-600/50 border border-zinc-700/60 text-left transition-all cursor-pointer"
          >
            <div className="text-[11px] font-bold text-emerald-300">Employee</div>
            <div className="text-[9px] text-zinc-400 font-mono truncate">employee@...</div>
          </button>
        </div>
      </div>
    </div>
  );
};

