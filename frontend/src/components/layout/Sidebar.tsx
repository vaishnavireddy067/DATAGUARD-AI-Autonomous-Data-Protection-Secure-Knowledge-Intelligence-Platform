'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  UploadCloud,
  Files,
  Cpu,
  ShieldCheck,
  FileText,
  Users,
  Compass
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      description: 'Platform overview & metrics'
    },
    {
      id: 'upload',
      label: 'Upload & Analyze',
      icon: UploadCloud,
      description: 'Extract & detect sensitive data'
    },
    {
      id: 'documents',
      label: 'Documents Vault',
      icon: Files,
      description: 'Role-filtered file records'
    },
    {
      id: 'workflow',
      label: 'LangGraph Agents',
      icon: Cpu,
      description: 'Multi-agent state pipeline'
    },
    {
      id: 'risk-security',
      label: 'Risk & Threat Center',
      icon: ShieldCheck,
      description: 'Transparent risk analytics'
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: FileText,
      description: 'Sequential action ledger'
    },
    {
      id: 'users',
      label: 'Access Control (RBAC)',
      icon: Users,
      description: user?.role === 'admin' ? 'User management & permissions' : 'My profile & role status'
    },
    {
      id: 'landing',
      label: 'Product Architecture',
      icon: Compass,
      description: 'Platform specs & workflow'
    }
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2 font-mono">
            Platform Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/50 text-cyan-300 border border-cyan-800/50 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                  <div>
                    <div className="text-xs font-medium leading-none mb-1">{item.label}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Security Status Box */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-zinc-300 font-mono">Security Engine Active</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Autonomous pattern detection & RBAC enforcement active. 0 simulated results.
        </p>
      </div>
    </aside>
  );
};
