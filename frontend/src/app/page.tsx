'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

import { LandingView } from '@/components/views/LandingView';
import { LoginView } from '@/components/views/LoginView';
import { RegisterView } from '@/components/views/RegisterView';
import { DashboardView } from '@/components/views/DashboardView';
import { UploadAnalyzeView } from '@/components/views/UploadAnalyzeView';
import { DocumentsView } from '@/components/views/DocumentsView';
import { DocumentDetailView } from '@/components/views/DocumentDetailView';
import { AgentWorkflowView } from '@/components/views/AgentWorkflowView';
import { RiskSecurityView } from '@/components/views/RiskSecurityView';
import { AuditLogsView } from '@/components/views/AuditLogsView';
import { UserManagementView } from '@/components/views/UserManagementView';

export default function Home() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>(undefined);

  const handleNavigate = (view: string, docId?: number) => {
    setCurrentView(view);
    if (docId !== undefined) {
      setSelectedDocId(docId);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 space-y-3 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <span>Initializing DataGuard AI session...</span>
      </div>
    );
  }

  // If user is not authenticated and viewing login or register or landing
  if (!user && (currentView === 'login' || currentView === 'register')) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
        <div className="flex-1 flex items-center justify-center">
          {currentView === 'login' ? (
            <LoginView onNavigate={handleNavigate} />
          ) : (
            <RegisterView onNavigate={handleNavigate} />
          )}
        </div>
      </main>
    );
  }

  // If unauthenticated and on any other page, allow landing or login
  if (!user && currentView !== 'landing') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
        <div className="flex-1 flex items-center justify-center">
          <LoginView onNavigate={handleNavigate} />
        </div>
      </main>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'upload':
        return <UploadAnalyzeView onNavigate={handleNavigate} />;
      case 'documents':
        return <DocumentsView onNavigate={handleNavigate} />;
      case 'document-detail':
        return selectedDocId ? (
          <DocumentDetailView documentId={selectedDocId} onNavigate={handleNavigate} />
        ) : (
          <DocumentsView onNavigate={handleNavigate} />
        );
      case 'workflow':
        return <AgentWorkflowView onNavigate={handleNavigate} />;
      case 'risk-security':
        return <RiskSecurityView onNavigate={handleNavigate} />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'users':
        return <UserManagementView />;
      case 'login':
        return <LoginView onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterView onNavigate={handleNavigate} />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto">{renderView()}</div>
        </main>
      </div>
    </div>
  );
}
