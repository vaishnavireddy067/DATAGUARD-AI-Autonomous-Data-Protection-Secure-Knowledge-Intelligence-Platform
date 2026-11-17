'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AuditLog } from '@/types';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  User as UserIcon
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs({
        action: selectedAction || undefined,
        result: selectedResult || undefined,
        search: search || undefined,
        limit: 100
      });
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction, selectedResult]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getResultBadge = (result: string) => {
    switch (result.toUpperCase()) {
      case 'SUCCESS':
      case 'ALLOWED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'DENIED':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'FAILED':
        return 'bg-red-950/80 text-red-300 border-red-800';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-950 border border-indigo-800 text-indigo-400">
              Action Ledger
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Sequential action trail: <span className="text-zinc-300 font-mono">User → Action → Resource → Time → Result</span>
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, resource (filename), or details..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option>
            <option value="VIEW_DOCUMENT">VIEW_DOCUMENT</option>
            <option value="ANALYZE_DOCUMENT">ANALYZE_DOCUMENT</option>
            <option value="APPLY_MASK">APPLY_MASK</option>
            <option value="APPLY_REDACT">APPLY_REDACT</option>
            <option value="APPLY_RESTRICT_ACCESS">APPLY_RESTRICT_ACCESS</option>
            <option value="LOGIN">LOGIN</option>
            <option value="REGISTER">REGISTER</option>
            <option value="DELETE_DOCUMENT">DELETE_DOCUMENT</option>
          </select>

          {/* Result Filter */}
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="ALLOWED">Allowed</option>
            <option value="DENIED">Denied</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Reading immutable audit records from database...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-3">
          <FileText className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No Audit Events Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No events matched the applied filters or your current role permission scope.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">
                          {log.user ? log.user.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">
                            {log.user ? log.user.name : 'System Service'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {log.user ? log.user.role : 'Core'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-mono font-medium text-cyan-300">
                      {log.action}
                    </td>

                    {/* Resource */}
                    <td className="py-3 px-4 font-mono text-zinc-300 max-w-xs truncate">
                      {log.resource}
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    {/* Result */}
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border uppercase ${getResultBadge(log.result)}`}>
                        {log.result}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-zinc-400 text-[11px] max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

