'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DocumentDetail, ActionType, AccessLevel, RiskLevel } from '@/types';
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Sliders,
  FileCheck,
  History,
  Layers
} from 'lucide-react';

interface DocumentDetailViewProps {
  documentId: number;
  onNavigate: (view: string, docId?: number) => void;
}

export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ documentId, onNavigate }) => {
  const { user } = useAuth();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Content viewer mode
  const [viewMode, setViewMode] = useState<'extracted' | 'protected'>('extracted');
  const [newAccessLevel, setNewAccessLevel] = useState<AccessLevel>('restricted');

  const fetchDoc = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDocument(documentId);
      setDoc(data);
      if (data.protected_text) {
        setViewMode('protected');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve document details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDoc();
    }
  }, [documentId]);

  const handleApplyProtection = async (actionType: ActionType, accessLvl?: AccessLevel) => {
    setActionLoading(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const updated = await api.protectDocument(documentId, actionType, accessLvl);
      setDoc(updated);
      setSuccessMessage(`Applied protection action: ${actionType} successfully!`);
      if (actionType === 'MASK' || actionType === 'REDACT') {
        setViewMode('protected');
      }
    } catch (err: any) {
      setError(err.message || `Failed to apply ${actionType}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.analyzeDocument(documentId);
      await fetchDoc();
      setSuccessMessage('Document re-analyzed via LangGraph multi-agent workflow!');
    } catch (err: any) {
      setError(err.message || 'Failed to run analysis');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">Fetching document intelligence & findings from database...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-8 rounded-2xl border border-red-800 bg-red-950/40 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Access Denied or Not Found</h3>
        <p className="text-xs text-red-300/90 leading-relaxed">
          {error || 'This document either does not exist or your role lacks permission to view it.'}
        </p>
        <button
          onClick={() => onNavigate('documents')}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition-all cursor-pointer"
        >
          Return to Documents Vault
        </button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('documents')}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title="Back to Vault"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{doc.filename}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getRiskBadge(doc.risk_level)}`}>
                {doc.risk_level} ({doc.risk_score}/100)
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Document ID #{doc.id} | Classification:{' '}
              <span className="capitalize font-semibold text-zinc-300">{doc.access_level}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyze}
            disabled={actionLoading}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            Re-run Analysis
          </button>
          <button
            onClick={() => onNavigate('workflow')}
            className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Inspect Agents
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Document Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-[10px] text-zinc-400 font-mono block">Format & Size</span>
          <span className="text-sm font-semibold text-zinc-200 uppercase font-mono">{doc.file_type}</span>
          <span className="text-xs text-zinc-400 block font-mono">{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-[10px] text-zinc-400 font-mono block">Uploaded By</span>
          <span className="text-sm font-semibold text-zinc-200">{doc.uploader?.name || `User #${doc.uploaded_by}`}</span>
          <span className="text-xs text-zinc-400 block font-mono capitalize">{doc.uploader?.role || 'Staff'}</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-[10px] text-zinc-400 font-mono block">Upload Timestamp</span>
          <span className="text-sm font-semibold text-zinc-200 font-mono">
            {new Date(doc.upload_time).toLocaleDateString()}
          </span>
          <span className="text-xs text-zinc-400 block font-mono">
            {new Date(doc.upload_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-[10px] text-zinc-400 font-mono block">Current Protection State</span>
          <span className="text-sm font-semibold text-cyan-400 font-mono">
            {doc.protected_text ? 'PROTECTED' : 'ORIGINAL'}
          </span>
          <span className="text-xs text-zinc-400 block font-mono">
            {doc.actions?.length ?? 0} actions recorded
          </span>
        </div>
      </div>

      {/* Risk Score & Transparent Rationale Box */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Risk Score & Assessment Rationale</h3>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-300">
            Score: <span className="text-cyan-400">{doc.risk_score}</span> / 100
          </span>
        </div>

        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
          <div
            className={`h-full ${
              doc.risk_level === 'CRITICAL'
                ? 'bg-red-500'
                : doc.risk_level === 'HIGH'
                ? 'bg-orange-500'
                : doc.risk_level === 'MEDIUM'
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(doc.risk_score, 5)}%` }}
          />
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 font-mono">
          {doc.risk_explanation || 'No security explanation generated.'}
        </p>
      </div>

      {/* Protection Action Engine Buttons (Feature 7) */}
      <div className="p-5 rounded-2xl border border-indigo-900/60 bg-indigo-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Protection Action Engine
            </h3>
            <p className="text-xs text-zinc-400">
              Apply irreversible data masking, redaction, or assign strict access levels.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Authorized: {user?.role.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: MASK */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                <EyeOff className="w-3.5 h-3.5" />
                1. Apply Data Masking
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Transforms identifiers into safe masked tokens (e.g. vai***@gmail.com, +91 98765*****).
              </p>
            </div>
            <button
              onClick={() => handleApplyProtection('MASK')}
              disabled={actionLoading}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-medium transition-all cursor-pointer"
            >
              Apply MASK
            </button>
          </div>

          {/* Action 2: REDACT */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                2. Apply Full Redaction
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Completely scrubs detected sensitive data, replacing with [REDACTED] tokens.
              </p>
            </div>
            <button
              onClick={() => handleApplyProtection('REDACT')}
              disabled={actionLoading}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-xs font-medium transition-all cursor-pointer"
            >
              Apply REDACT
            </button>
          </div>

          {/* Action 3: RESTRICT ACCESS */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                <Lock className="w-3.5 h-3.5" />
                3. Restrict Access Level
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Reclassify document to Confidential or Restricted to block standard Employee access.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <select
                value={newAccessLevel}
                onChange={(e) => setNewAccessLevel(e.target.value as AccessLevel)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none flex-1 font-mono capitalize"
              >
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </select>
              <button
                onClick={() => handleApplyProtection('RESTRICT_ACCESS', newAccessLevel)}
                disabled={actionLoading || user?.role === 'employee'}
                className="py-1.5 px-3 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-300 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
              >
                Restrict
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitive Findings Table */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Detected Sensitive Entities ({doc.findings?.length ?? 0} Categories)
            </h3>
            <p className="text-xs text-zinc-400">
              Pattern detections identified during document parsing. Raw values masked for security.
            </p>
          </div>
        </div>

        {doc.findings.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center text-xs text-zinc-400">
            No sensitive data patterns (emails, phones, PAN, bank accounts) detected in this file.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono">
                <tr>
                  <th className="py-2.5 px-4">Entity Type</th>
                  <th className="py-2.5 px-4">Detected Count</th>
                  <th className="py-2.5 px-4">Masked Sample</th>
                  <th className="py-2.5 px-4">Entity Risk</th>
                  <th className="py-2.5 px-4">Context Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {doc.findings.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-900/40">
                    <td className="py-2.5 px-4 font-mono font-medium text-cyan-300">{f.data_type}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-white">{f.count}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300 bg-zinc-900/40">{f.detected_value_masked}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getRiskBadge(f.risk_level)}`}>
                        {f.risk_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{f.details || 'Detected by regex pattern match'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extracted Content Viewer with Original vs Protected Toggle */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Document Content Inspector
            </h3>
            <p className="text-xs text-zinc-400">Actual text extracted from the document file on disk</p>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('extracted')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'extracted'
                  ? 'bg-zinc-800 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Extracted Raw Text
            </button>
            <button
              onClick={() => setViewMode('protected')}
              disabled={!doc.protected_text}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'protected'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-medium'
                  : doc.protected_text
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
            >
              Protected View {doc.protected_text ? '✓' : '(Not applied)'}
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {viewMode === 'protected' ? doc.protected_text || 'No protected text version created yet. Click "Apply MASK" or "Apply REDACT" above.' : doc.extracted_text || 'No text extracted from document.'}
          </pre>
        </div>
      </div>

      {/* Protection Action History */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          Protection Actions History ({doc.actions?.length ?? 0} Recorded)
        </h3>

        {doc.actions?.length === 0 ? (
          <p className="text-xs text-zinc-400">No protection actions applied yet.</p>
        ) : (
          <div className="space-y-2">
            {doc.actions.map((act) => (
              <div key={act.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-cyan-300 mr-2">{act.action_type}</span>
                  <span className="text-zinc-400">{act.details}</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono shrink-0">
                  {new Date(act.performed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

