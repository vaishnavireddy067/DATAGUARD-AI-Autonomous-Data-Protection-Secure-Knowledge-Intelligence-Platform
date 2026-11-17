'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AccessLevel, DocumentDetail } from '@/types';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Shield,
  Layers,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';

interface UploadAnalyzeViewProps {
  onNavigate: (view: string, docId?: number) => void;
}

const SAMPLE_PAYROLL_CSV = `Employee ID,Full Name,Corporate Email,Mobile Number,Tax PAN,Monthly Salary,Bank Account Number
DG-101,Vaishnavi Anugu,vaishnavi@company.com,+91 9876543210,ABCDE1234F,$14500,Account Number 12345678901234
DG-102,David Miller,david.m@company.com,+91 9123456780,BNZPK5432G,$12000,Account Number 98765432109876
DG-103,Priya Sharma,priya.s@company.com,+91 9988776655,XYZPK9876Q,$13500,Account Number 45678901234567`;

const SAMPLE_MEDICAL_TXT = `CONFIDENTIAL PATIENT CLINICAL & BILLING SUMMARY
Healthcare Center: DataGuard Health Institute
Date: 2026-11-15

PATIENT DETAILS:
Patient: Sarah Jenkins
Email: sarah.jenkins@gmail.com, alternative: patient.billing@outlook.com
Primary Phone: +91 9440123456
Emergency Phone: +91 9848011223

BILLING & REGULATORY DATA:
National ID Synthetic Demo: 3456 7890 1234
Income Tax PAN Reference: PQRTV1234M
Hospital Payment Account: Account Number 87654321098712
Total Outstanding: $4,250.00`;

const SAMPLE_CLEAN_TXT = `ANNUAL GENERAL MEETING OVERVIEW & PUBLIC DISCLOSURES
Organization: DataGuard Autonomous Platform
Status: Public Executive Summary

HIGHLIGHTS:
The enterprise architecture has operated with 99.98% reliability over the past 4 quarters.
Key developments include autonomous multi-agent state machines, verifiable role-based access control,
and local deterministic content parsing for PDF, DOCX, TXT, CSV, and XLSX payloads.
No personally identifiable data or payment channels are contained in this release.`;

export const UploadAnalyzeView: React.FC<UploadAnalyzeViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('internal');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedResult, setUploadedResult] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExts = ['pdf', 'docx', 'txt', 'csv', 'xlsx'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExts.includes(ext)) {
      setError(`Unsupported file format (.${ext}). Allowed: PDF, DOCX, TXT, CSV, XLSX.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadedResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress('Validating file payload and initializing storage...');

    try {
      // Real upload and multi-agent execution
      setUploadProgress('Extracting actual content & running LangGraph multi-agent workflow...');
      const result = await api.uploadDocument(selectedFile, accessLevel);
      setUploadedResult(result);
      setUploadProgress('Workflow completed successfully!');
    } catch (err: any) {
      setError(err.message || 'File processing failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to load synthetic demo datasets
  const loadDemoFile = (name: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    validateAndSetFile(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Upload & Analyze Document</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 border border-cyan-800 text-cyan-400">
            5 Supported Formats
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Upload real files to trigger text extraction, sensitive data detection, risk scoring, and protection recommendations via LangGraph.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-cyan-500 bg-cyan-950/20'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.csv,.xlsx"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <UploadCloud className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  {selectedFile.name}
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB | Format: {selectedFile.name.split('.').pop()?.toUpperCase()}
                </p>
                <p className="text-[11px] text-cyan-400 pt-2">Click to replace file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">
                  Drop your file here, or <span className="text-cyan-400">browse disk</span>
                </p>
                <p className="text-xs text-zinc-400">
                  Accepts PDF, DOCX, TXT, CSV, and XLSX documents
                </p>
              </div>
            )}
          </div>

          {/* Access Level Selector */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
            <label className="text-xs font-semibold text-zinc-300 block">
              Document Access Level (RBAC Classification)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['public', 'internal', 'confidential', 'restricted'] as AccessLevel[]).map((lvl) => {
                const isRestrictedAdminOnly = lvl === 'restricted' && user?.role !== 'admin';
                return (
                  <button
                    type="button"
                    key={lvl}
                    disabled={isRestrictedAdminOnly}
                    onClick={() => setAccessLevel(lvl)}
                    className={`py-2 px-3 rounded-xl border text-xs capitalize font-medium transition-all text-left ${
                      accessLevel === lvl
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : isRestrictedAdminOnly
                        ? 'bg-zinc-900/40 border-zinc-900 text-zinc-600 cursor-not-allowed'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer'
                    }`}
                  >
                    <div className="font-bold">{lvl}</div>
                    <div className="text-[9px] text-zinc-400">
                      {lvl === 'restricted'
                        ? 'Admin Only'
                        : lvl === 'confidential'
                        ? 'Mgr & Admin'
                        : lvl === 'internal'
                        ? 'Staff & Up'
                        : 'Everyone'}
                    </div>
                  </button>
                );
              })}
            </div>
            {accessLevel === 'restricted' && user?.role !== 'admin' && (
              <p className="text-[11px] text-amber-400 font-mono">
                Only Administrators can assign &apos;Restricted&apos; classification.
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-white" />
                <span>Running 5 LangGraph Agents...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Start Security Workflow</span>
              </>
            )}
          </button>

          {isUploading && (
            <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/30 text-xs text-cyan-300 space-y-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{uploadProgress}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Sample Datasets Sidebar for Fast Testing */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Sample Datasets (1-Click Test)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Load synthetic test documents with genuine PII and financial patterns:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loadDemoFile('payroll_export.csv', SAMPLE_PAYROLL_CSV, 'text/csv')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                  Payroll Export (CSV)
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Contains Emails, PAN, Bank Accounts, Salary
                </div>
              </button>

              <button
                type="button"
                onClick={() => loadDemoFile('medical_billing.txt', SAMPLE_MEDICAL_TXT, 'text/plain')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  Medical Record (TXT)
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Contains National ID demo, Phone, Bank A/C
                </div>
              </button>

              <button
                type="button"
                onClick={() => loadDemoFile('agm_minutes_public.txt', SAMPLE_CLEAN_TXT, 'text/plain')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Clean Public Report (TXT)
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Zero sensitive data (Benchmark control)
                </div>
              </button>
            </div>
          </div>

          {/* Workflow Stage Map */}
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-xs space-y-2">
            <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              LangGraph Stages
            </div>
            <div className="space-y-1 text-[11px] text-zinc-400 font-mono">
              <div>1. Pending Storage</div>
              <div>2. Document Intelligence</div>
              <div>3. Sensitive Detection</div>
              <div>4. Risk Assessment</div>
              <div>5. Protection Recommendations</div>
              <div>6. Immutable Audit Log</div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Card on Successful Processing */}
      {uploadedResult && (
        <div className="p-6 rounded-2xl border border-cyan-800 bg-cyan-950/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Analysis & Extraction Complete!</h3>
                <p className="text-xs text-zinc-300 font-mono">{uploadedResult.filename}</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('document-detail', uploadedResult.id)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-cyan-900/40 transition-all cursor-pointer"
            >
              <span>View Full Analysis & Protection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-cyan-800/60 font-mono text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block">Risk Score:</span>
              <span className="text-lg font-bold text-white">{uploadedResult.risk_score}/100</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Risk Classification:</span>
              <span
                className={`font-bold ${
                  uploadedResult.risk_level === 'CRITICAL'
                    ? 'text-red-400'
                    : uploadedResult.risk_level === 'HIGH'
                    ? 'text-orange-400'
                    : uploadedResult.risk_level === 'MEDIUM'
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`}
              >
                {uploadedResult.risk_level}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Sensitive Findings:</span>
              <span className="text-lg font-bold text-white">{uploadedResult.findings.length} categories</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Assigned Access:</span>
              <span className="text-lg font-bold text-cyan-300 capitalize">{uploadedResult.access_level}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

