'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DocumentItem, RiskLevel, AccessLevel } from '@/types';
import {
  Files,
  Search,
  Filter,
  Shield,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Upload,
  Lock,
  FileText
} from 'lucide-react';

interface DocumentsViewProps {
  onNavigate: (view: string, docId?: number) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('');
  const [selectedAccess, setSelectedAccess] = useState<string>('');

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listDocuments({
        search: search || undefined,
        risk_level: selectedRisk || undefined,
        access_level: selectedAccess || undefined
      });
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedRisk, selectedAccess]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleDelete = async (docId: number, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete '${filename}'?`)) return;
    try {
      await api.deleteDocument(docId);
      await fetchDocs();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-800';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800';
      case 'LOW':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getAccessBadge = (access: AccessLevel) => {
    switch (access) {
      case 'restricted':
        return 'bg-red-950/60 text-red-300 border-red-800/80';
      case 'confidential':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/80';
      case 'internal':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/80';
      case 'public':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Documents Vault</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
              Role: {user?.role.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Documents authorized for your account based on enterprise Role-Based Access Control (RBAC).
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-cyan-950/40 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document filename..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Access Level Filter */}
          <select
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">All Access Levels</option>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="confidential">Confidential</option>
            <option value="restricted">Restricted</option>
          </select>

          <button
            onClick={fetchDocs}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer shrink-0"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Documents Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Filtering authorized document records...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-3">
          <Files className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-200">No Authorized Documents Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search || selectedRisk || selectedAccess
              ? 'No documents matched the applied filters.'
              : 'No documents uploaded yet, or your role lacks permission to view existing files.'}
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Document / File</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4">Risk Assessment</th>
                  <th className="py-3 px-4">Uploader</th>
                  <th className="py-3 px-4">Uploaded Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-[10px] text-zinc-300 uppercase shrink-0">
                          {doc.file_type}
                        </div>
                        <div>
                          <div
                            onClick={() => onNavigate('document-detail', doc.id)}
                            className="font-medium text-zinc-200 hover:text-cyan-400 cursor-pointer"
                          >
                            {doc.filename}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {(doc.file_size_bytes / 1024).toFixed(1)} KB | Status: {doc.status}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border uppercase ${getAccessBadge(doc.access_level)}`}>
                        {doc.access_level}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getRiskBadge(doc.risk_level)}`}>
                          {doc.risk_level}
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">
                          ({doc.risk_score}/100)
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-zinc-300">
                      <div>{doc.uploader ? doc.uploader.name : `User #${doc.uploaded_by}`}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{doc.uploader?.role}</div>
                    </td>

                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(doc.upload_time).toLocaleDateString()} {new Date(doc.upload_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('document-detail', doc.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect Analysis & Protection"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          Inspect
                        </button>

                        {(user?.role === 'admin' || user?.id === doc.uploaded_by) && (
                          <button
                            onClick={() => handleDelete(doc.id, doc.filename)}
                            className="p-1 rounded-lg hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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

