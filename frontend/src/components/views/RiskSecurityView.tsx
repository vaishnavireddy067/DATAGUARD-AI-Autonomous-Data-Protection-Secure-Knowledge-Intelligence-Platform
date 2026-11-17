'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStats, DocumentItem } from '@/types';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Lock,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface RiskSecurityViewProps {
  onNavigate: (view: string, docId?: number) => void;
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
};

export const RiskSecurityView: React.FC<RiskSecurityViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [highRiskDocs, setHighRiskDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      // Fetch high and critical risk documents
      const docs = await api.listDocuments();
      setHighRiskDocs(docs.filter((d) => d.risk_level === 'HIGH' || d.risk_level === 'CRITICAL'));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">Aggregating enterprise threat posture & risk scores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk & Threat Center</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-red-950 border border-red-800 text-red-400">
            Threat Mitigation
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          In-depth posture assessment: sensitive entity exposure, critical asset concentration, and protection actions.
        </p>
      </div>

      {/* Threat Posture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-red-900/60 bg-red-950/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-300">Critical Threat Exposure</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{stats?.critical_documents ?? 0} files</div>
          <p className="text-[11px] text-zinc-400">Synthetic IDs or severe multi-PII concentration</p>
        </div>

        <div className="p-5 rounded-2xl border border-orange-900/60 bg-orange-950/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-300">High Threat Exposure</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{stats?.high_risk_documents ?? 0} files</div>
          <p className="text-[11px] text-zinc-400">Financial records, tax PAN, or bank accounts</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Clean / Low-Risk Files</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{stats?.clean_documents ?? 0} files</div>
          <p className="text-[11px] text-zinc-400">Zero sensitive identifiers detected</p>
        </div>
      </div>

      {/* Charts Breakdown */}
      {stats && stats.total_documents > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">Risk Severity Exposure</h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.risk_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="level" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.risk_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.level] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">Detected Sensitive Categories</h3>
            {stats.sensitive_categories.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-zinc-400">
                No sensitive categories detected.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.sensitive_categories} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="category" type="category" stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Critical Documents List */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          High-Risk & Critical Documents Requiring Review ({highRiskDocs.length})
        </h3>

        {highRiskDocs.length === 0 ? (
          <p className="text-xs text-zinc-400">No high-risk or critical documents detected in the system.</p>
        ) : (
          <div className="space-y-2">
            {highRiskDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-zinc-200">{doc.filename}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Score: {doc.risk_score}/100 | Format: {doc.file_type.toUpperCase()} | Classification:{' '}
                    <span className="capitalize">{doc.access_level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                      doc.risk_level === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-orange-950 text-orange-400 border-orange-800'
                    }`}
                  >
                    {doc.risk_level}
                  </span>
                  <button
                    onClick={() => onNavigate('document-detail', doc.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    Inspect & Protect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

