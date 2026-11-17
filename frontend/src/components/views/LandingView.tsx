'use client';

import React from 'react';
import {
  Shield,
  FileSearch,
  Lock,
  EyeOff,
  Cpu,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  FileCheck,
  Server,
  Layers
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const workflowSteps = [
    { step: 1, title: 'User Upload', desc: 'Secure upload of PDF, DOCX, TXT, CSV, or XLSX datasets.' },
    { step: 2, title: 'Document Intelligence', desc: 'Real text extraction, sheet analysis, and structural metadata.' },
    { step: 3, title: 'Sensitive Data Detection', desc: 'Pattern-based scanning for emails, phones, PAN, bank accounts, and sensitive headers.' },
    { step: 4, title: 'Risk Assessment', desc: 'Transparent rule-based scoring (0-100) and rationale generation.' },
    { step: 5, title: 'Protection Decision', desc: 'Automated recommendations for masking, redaction, or access restrictions.' },
    { step: 6, title: 'Protection Action', desc: 'Execution of data masking, redaction [REDACTED], or access downgrades.' },
    { step: 7, title: 'Secure Storage', desc: 'Metadata, findings, and protected content persisted in relational database.' },
    { step: 8, title: 'Audit Logging', desc: 'Action trail: User -> Action -> Resource -> Time -> Result.' }
  ];

  const roles = [
    {
      role: 'Admin',
      badge: 'bg-purple-900/60 text-purple-300 border-purple-500/50',
      perms: [
        'View and manage all enterprise documents',
        'Assign and manage user RBAC roles',
        'Inspect organization-wide audit logs',
        'Execute all protection actions (Mask, Redact, Restrict)'
      ]
    },
    {
      role: 'Manager',
      badge: 'bg-blue-900/60 text-blue-300 border-blue-500/50',
      perms: [
        'Upload and trigger multi-agent analysis',
        'View authorized documents (Public, Internal, Confidential)',
        'Apply permitted protection actions (Mask, Redact, Restrict)',
        'View departmental audit records'
      ]
    },
    {
      role: 'Employee',
      badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50',
      perms: [
        'Upload documents within authorized scope',
        'View only authorized documents (Public, Internal)',
        'Strictly blocked from restricted/confidential files',
        'Inspect personal activity logs'
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 p-8 sm:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono mb-6">
          <Shield className="w-3.5 h-3.5" />
          Autonomous Data Protection & Secure Knowledge Intelligence
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Enterprise Data Security Grounded in{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Real Content & Multi-Agent State
          </span>
        </h1>
        
        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          DATAGUARD AI extracts, detects sensitive identifiers, computes transparent risk scores, applies verifiable protection (masking, redaction, RBAC), and logs every action in an audit ledger.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('upload')}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <FileSearch className="w-4 h-4" />
            Upload & Analyze Document
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium text-sm transition-all cursor-pointer"
          >
            Explore Live Dashboard
          </button>
        </div>
      </div>

      {/* Core Workflow (As specified in prompt) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              End-to-End Autonomous Pipeline
            </h2>
            <p className="text-xs text-zinc-400">The 8 sequential stages executed across LangGraph agents and storage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 relative hover:border-cyan-800/50 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-400 text-xs font-mono flex items-center justify-center font-bold mb-3">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{item.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role-Based Access Control Architecture */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Role-Based Access Control (RBAC)
            </h2>
            <p className="text-xs text-zinc-400">Strict permission boundaries enforced at the API and database levels</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div key={r.role} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{r.role} Role</span>
                <span className={`text-[11px] px-2 py-0.5 rounded border uppercase font-mono font-medium ${r.badge}`}>
                  {r.role}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                {r.perms.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Files & Security Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Supported File Formats</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Content is extracted via native parsing libraries without third-party external leaks:
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {['PDF (.pdf)', 'Word (.docx)', 'Text (.txt)', 'CSV (.csv)', 'Excel (.xlsx)'].map((ext) => (
              <div key={ext} className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 text-center">
                {ext}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">Auditing & Protection Guarantees</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every protection action creates an immutable database record and modifies the document's protected representation:
          </p>
          <div className="space-y-2 text-xs text-zinc-300">
            <div className="p-2 rounded bg-zinc-800/40 border border-zinc-700/50 flex items-center justify-between">
              <span className="font-semibold text-cyan-300">MASK Action:</span>
              <span className="font-mono text-zinc-400">vaishnavi@gmail.com → vai***@gmail.com</span>
            </div>
            <div className="p-2 rounded bg-zinc-800/40 border border-zinc-700/50 flex items-center justify-between">
              <span className="font-semibold text-amber-300">REDACT Action:</span>
              <span className="font-mono text-zinc-400">Phone: +91 9876543210 → [REDACTED]</span>
            </div>
            <div className="p-2 rounded bg-zinc-800/40 border border-zinc-700/50 flex items-center justify-between">
              <span className="font-semibold text-purple-300">RESTRICT Action:</span>
              <span className="font-mono text-zinc-400">Access → Confidential / Restricted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

