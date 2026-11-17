'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DocumentItem, DocumentAnalyzeResponse } from '@/types';
import {
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileSearch,
  Shield,
  FileCheck,
  AlertTriangle,
  Play
} from 'lucide-react';

interface AgentWorkflowViewProps {
  onNavigate: (view: string, docId?: number) => void;
}

export const AgentWorkflowView: React.FC<AgentWorkflowViewProps> = ({ onNavigate }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningWorkflow, setRunningWorkflow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 5 Canonical Agents
  const agentDefs = [
    {
      id: 'document_intelligence',
      name: 'Agent 1: Document Intelligence Agent',
      desc: 'Parses native format (PDF, DOCX, TXT, CSV, XLSX), extracts plain text, calculates word/line counts, validates integrity.',
      icon: FileSearch,
      stage: 'analyzing'
    },
    {
      id: 'sensitive_detection',
      name: 'Agent 2: Sensitive Data Detection Agent',
      desc: 'Executes regex patterns for emails, phone numbers, PAN cards, synthetic Aadhaar demo, bank accounts, and sensitive column headers.',
      icon: Shield,
      stage: 'detecting'
    },
    {
      id: 'risk_assessment',
      name: 'Agent 3: Risk Assessment Agent',
      desc: 'Evaluates entity diversity and concentration to compute transparent mathematical risk score (0-100) and rationale.',
      icon: AlertTriangle,
      stage: 'assessing_risk'
    },
    {
      id: 'protection_engine',
      name: 'Agent 4: Protection Agent',
      desc: 'Analyzes calculated threat score to recommend or execute security protections (MASK, REDACT, RESTRICT_ACCESS).',
      icon: Cpu,
      stage: 'protecting'
    },
    {
      id: 'compliance_audit',
      name: 'Agent 5: Compliance & Audit Agent',
      desc: 'Synthesizes immutable audit trail entries (User -> Action -> Resource -> Time -> Result) and commits to ledger.',
      icon: FileCheck,
      stage: 'completed'
    }
  ];

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDocId(docs[0].id);
        runOrLoadAnalysis(docs[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runOrLoadAnalysis = async (docId: number) => {
    setRunningWorkflow(true);
    setError(null);
    try {
      const res = await api.analyzeDocument(docId);
      setAnalysisResult(res);
    } catch (err: any) {
      setError(err.message || 'Workflow execution error');
    } finally {
      setRunningWorkflow(false);
    }
  };

  const handleDocChange = (docId: number) => {
    setSelectedDocId(docId);
    runOrLoadAnalysis(docId);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">LangGraph Multi-Agent Workflow</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-950 border border-purple-800 text-purple-300">
              StateGraph Architecture
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real typed state (`DocumentWorkflowState`) transferred across 5 autonomous specialized agents.
          </p>
        </div>

        {selectedDocId && (
          <button
            onClick={() => runOrLoadAnalysis(selectedDocId)}
            disabled={runningWorkflow}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-cyan-950/40 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Play className={`w-3.5 h-3.5 ${runningWorkflow ? 'animate-spin' : ''}`} />
            {runningWorkflow ? 'Running Workflow...' : 'Execute LangGraph Run'}
          </button>
        )}
      </div>

      {/* Document Selector */}
      {documents.length > 0 && (
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-zinc-300">Selected Target Document:</span>
          </div>
          <select
            value={selectedDocId || ''}
            onChange={(e) => handleDocChange(Number(e.target.value))}
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename} ({d.file_type.toUpperCase()} | Risk: {d.risk_level})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* StateGraph Flow Diagram */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            LangGraph Execution Pipeline & Agent Nodes
          </h2>
          <span className="text-[11px] text-zinc-400 font-mono">
            Status:{' '}
            <span className="text-emerald-400 font-bold uppercase">
              {runningWorkflow ? 'ANALYZING' : analysisResult ? 'COMPLETED' : 'IDLE'}
            </span>
          </span>
        </div>

        {/* 5 Sequential Nodes */}
        <div className="space-y-4">
          {agentDefs.map((agent, idx) => {
            const Icon = agent.icon;
            const matchingStep = analysisResult?.workflow_steps?.find(
              (s) => s.stage === agent.stage || s.agent.includes(agent.name.split(':')[1]?.trim() || '')
            );
            const isCompleted = !!matchingStep || (!runningWorkflow && analysisResult);

            return (
              <div
                key={agent.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'border-cyan-800/60 bg-cyan-950/20'
                    : runningWorkflow
                    ? 'border-zinc-700 bg-zinc-900/40 animate-pulse'
                    : 'border-zinc-800/80 bg-zinc-950/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{agent.name}</span>
                        {isCompleted && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Done
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{agent.desc}</p>
                    </div>
                  </div>

                  {matchingStep && (
                    <div className="text-right shrink-0 font-mono text-[10px] text-zinc-400">
                      <div>Execution: {new Date(matchingStep.timestamp).toLocaleTimeString()}</div>
                      <div className="text-cyan-300 font-medium max-w-xs truncate text-right">
                        {matchingStep.summary}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real State Payload Output */}
      {analysisResult && (
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">LangGraph Output State</h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Risk Score: {analysisResult.risk_score}/100 ({analysisResult.risk_level})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
              <span className="text-[10px] text-zinc-400 block uppercase">Recommended Protection Actions</span>
              {analysisResult.recommended_actions?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {analysisResult.recommended_actions.map((act) => (
                    <span key={act} className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      {act}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-zinc-500">None required (Low risk)</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
              <span className="text-[10px] text-zinc-400 block uppercase">Sensitive Entities Detected</span>
              <span className="text-white font-bold">{analysisResult.findings_count} entities identified</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300">
            <span className="text-[10px] text-zinc-400 block uppercase mb-1">Risk Assessment Rationale</span>
            {analysisResult.risk_explanation}
          </div>
        </div>
      )}
    </div>
  );
};

