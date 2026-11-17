'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Shield, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { UserRole } from '@/types';

interface RegisterViewProps {
  onNavigate: (view: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Create DataGuard Account</h2>
        <p className="text-xs text-zinc-400 mt-1">Autonomous data protection & secure intelligence</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vaishnavi Anugu"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vaishnavi@company.com"
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
                placeholder="At least 6 characters"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Requested Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['employee', 'manager', 'admin'] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-lg border text-xs capitalize font-medium transition-all cursor-pointer ${
                    role === r
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-zinc-400">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-cyan-400 hover:underline font-medium cursor-pointer"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

