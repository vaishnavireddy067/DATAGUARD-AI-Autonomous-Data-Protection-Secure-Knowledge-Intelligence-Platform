'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { Shield, ShieldAlert, User, LogOut, ArrowRightLeft, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout, quickLogin } = useAuth();

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/60 text-purple-300 border-purple-500/50';
      case 'manager':
        return 'bg-blue-900/60 text-blue-300 border-blue-500/50';
      case 'employee':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              DATAGUARD AI
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              LangGraph MVP
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            Autonomous Data Protection & Secure Intelligence
          </p>
        </div>
      </div>

      {/* User / Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Quick Role Switcher for Testing & Evaluation (Demo Mode Only) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900/90 border border-amber-800/40 rounded-lg p-1 text-xs">
              <span className="text-amber-400 px-2 flex items-center gap-1 font-mono text-[10px] uppercase font-bold">
                <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                Demo Mode:
              </span>
              {(['admin', 'manager', 'employee'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => quickLogin(r)}
                  className={`px-2 py-0.5 rounded capitalize font-medium transition-all text-xs cursor-pointer ${
                    user.role === r
                      ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-cyan-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={`[Dev / Demo Mode Only] Switch to pre-seeded ${r} account`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* User Profile Pill */}
            <div
              onClick={() => onNavigate('users')}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  {user.name}
                  <span className={`text-[10px] px-1.5 py-0.2 border rounded capitalize ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[140px]">{user.email}</div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-900/30"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

