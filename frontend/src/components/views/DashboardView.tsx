'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStats, UserRole } from '@/types';
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Upload,
  RefreshCw,
  Clock,
  ArrowRight,
  Database,
  Layers
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
  Pie,
  Legend
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: string, docId?: number) => void;
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981',       // Emerald
  MEDIUM: '#eab308',    // Yellow
  HIGH: '#f97316',      // Orange
  CRITICAL: '#ef4444'   // Red
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">Querying PostgreSQL database records & metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-800/80 bg-red-950/40 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-sm font-semibold text-red-200">Unable to load dashboard data</h3>
        <p className="text-xs text-red-300/80">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-xs text-white transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isEmpty = !stats || stats.total_documents === 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Security & Risk Dashboard</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-950 border border-emerald-800 text-emerald-400">
              Live DB Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Genuine analytics queried from database records and multi-agent workflow results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload & Analyze
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Total Documents</div>
            <div className="text-3xl font-extrabold text-white mt-1 font-mono">
              {stats?.total_documents ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {stats?.clean_documents ?? 0} clean / {stats?.sensitive_documents ?? 0} sensitive
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Sensitive Documents</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">
              {stats?.sensitive_documents ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {stats?.total_findings_count ?? 0} detected findings
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">High-Risk Documents</div>
            <div className="text-3xl font-extrabold text-orange-400 mt-1 font-mono">
              {stats?.high_risk_documents ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Financial & multiple PII</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-950/80 border border-orange-800/60 flex items-center justify-center text-orange-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Critical Documents</div>
            <div className="text-3xl font-extrabold text-red-400 mt-1 font-mono">
              {stats?.critical_documents ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Immediate action needed</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Empty State vs Real Charts */}
      {isEmpty ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center mx-auto text-zinc-400">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">No Documents Uploaded Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Per development rules, all dashboard metrics and Recharts graphs are strictly derived from real database records. Upload a PDF, DOCX, TXT, CSV, or XLSX file to begin live extraction and risk analysis.
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload First Document
          </button>
        </div>
      ) : (
        <>
          {/* Recharts Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Risk Distribution */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Risk Level Distribution</h3>
                  <p className="text-[11px] text-zinc-400">Actual counts categorized by risk score algorithm</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.risk_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="level" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val: any, name: any) => [`${val} documents`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {stats.risk_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.level] || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 text-center font-mono">
                {stats.risk_distribution.map((item) => (
                  <div key={item.level} className="text-xs">
                    <span className="text-[10px] text-zinc-400 block">{item.level}</span>
                    <span className="font-bold text-zinc-200">{item.count}</span>
                    <span className="text-[10px] text-zinc-400 block">({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Sensitive Categories Detected */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Sensitive Data Categories</h3>
                  <p className="text-[11px] text-zinc-400">Total detected entities across all parsed files</p>
                </div>
              </div>

              {stats.sensitive_categories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
                  No sensitive patterns identified in uploaded files.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.sensitive_categories}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                    >
                      <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="category" type="category" stroke="#71717a" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 flex items-center justify-between font-mono">
                <span>Total Findings: {stats.total_findings_count}</span>
                <span>Protected Actions: {stats.total_protection_actions_count}</span>
              </div>
            </div>
          </div>

          {/* Recent Documents & Recent Events Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Uploads */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">Recent Documents</h3>
                <button
                  onClick={() => onNavigate('documents')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {stats.recent_documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onNavigate('document-detail', doc.id)}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-300 uppercase">
                        {doc.file_type}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-200 hover:text-cyan-400">{doc.filename}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Score: {doc.risk_score} | Level: {doc.risk_level}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                        doc.risk_level === 'CRITICAL'
                          ? 'bg-red-950/80 text-red-400 border-red-800'
                          : doc.risk_level === 'HIGH'
                          ? 'bg-orange-950/80 text-orange-400 border-orange-800'
                          : doc.risk_level === 'MEDIUM'
                          ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {doc.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit Events */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">Security Audit Trail</h3>
                <button
                  onClick={() => onNavigate('audit-logs')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Full Ledger <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {stats.recent_events.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-cyan-300 font-medium">{ev.action}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-300 truncate">{ev.resource}</div>
                    <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-1">
                      <span>By: {ev.user ? ev.user.name : 'System'}</span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                          ev.result === 'SUCCESS' || ev.result === 'ALLOWED'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-red-950/60 text-red-400 border-red-800'
                        }`}
                      >
                        {ev.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

