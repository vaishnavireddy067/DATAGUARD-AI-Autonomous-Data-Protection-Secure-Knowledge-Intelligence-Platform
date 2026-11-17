'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { User, UserRole } from '@/types';
import {
  Users,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  ArrowRightLeft
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { user, quickLogin, refreshUser } = useAuth();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listUsers();
      setUserList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setError(null);
    setStatusMessage(null);
    try {
      await api.updateUserRole(userId, newRole);
      setStatusMessage(`User #${userId} role updated to ${newRole}`);
      await loadUsers();
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/60 text-purple-300 border-purple-500/50';
      case 'manager':
        return 'bg-blue-900/60 text-blue-300 border-blue-500/50';
      case 'employee':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Identity & Access Control (RBAC)</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
            Current: {user?.role.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Enforce and inspect least-privilege security roles across users and document vaults.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          Your Active Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono block">Name</span>
            <span className="text-sm font-semibold text-white">{user?.name}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono block">Email</span>
            <span className="text-sm font-mono text-cyan-300">{user?.email}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono block">Assigned RBAC Role</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold border capitalize ${getRoleBadge(user?.role || 'employee')}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Role Permissions Matrix for Current User */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 space-y-2">
          <div className="text-xs font-semibold text-zinc-300">Active Permissions for {user?.role.toUpperCase()}:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {user?.role === 'admin'
                  ? 'Access to ALL documents (including Restricted)'
                  : user?.role === 'manager'
                  ? 'Access to Public, Internal, and Confidential documents'
                  : 'Access to Public and Internal documents only'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {user?.role === 'admin'
                  ? 'Full protection action authority (Mask, Redact, Restrict)'
                  : user?.role === 'manager'
                  ? 'Apply Mask, Redact, and Restrict'
                  : 'Apply Mask / Redact on personal documents'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {user?.role === 'admin'
                  ? 'Organization-wide immutable audit log inspection'
                  : user?.role === 'manager'
                  ? 'Departmental audit log records'
                  : 'Personal activity audit records'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {user?.role === 'admin'
                  ? 'User management and role re-assignment'
                  : 'Profile inspection & self-management'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Role Switcher for Testing (Demo Mode Only) */}
      <div className="p-5 rounded-2xl border border-amber-800/40 bg-zinc-900/40 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Demo Mode: Switch Test Account</h3>
          <span className="text-[10px] px-2 py-0.2 rounded font-mono bg-amber-950/80 border border-amber-700/60 text-amber-300 font-bold uppercase">
            Development Only
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          This switcher is provided strictly for development/demo testing of pre-seeded accounts. In production environments, users cannot self-promote; role changes must be authorized by an Admin via the User Directory below and are logged in the audit ledger.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => quickLogin('admin')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              user?.role === 'admin'
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="text-xs font-bold">Admin Account</div>
            <div className="text-[10px] font-mono mt-0.5 text-zinc-400">admin@dataguard.ai</div>
          </button>

          <button
            onClick={() => quickLogin('manager')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              user?.role === 'manager'
                ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="text-xs font-bold">Manager Account</div>
            <div className="text-[10px] font-mono mt-0.5 text-zinc-400">manager@dataguard.ai</div>
          </button>

          <button
            onClick={() => quickLogin('employee')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              user?.role === 'employee'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="text-xs font-bold">Employee Account</div>
            <div className="text-[10px] font-mono mt-0.5 text-zinc-400">employee@dataguard.ai</div>
          </button>
        </div>
      </div>

      {/* Admin User Management Table */}
      {isAdmin && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Enterprise User Directory (Admin Only)
              </h2>
              <p className="text-xs text-zinc-400">Manage user roles and assign access tiers in real-time</p>
            </div>

            <button
              onClick={loadUsers}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Refresh Users"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Current Role</th>
                  <th className="py-2.5 px-4">Created Date</th>
                  <th className="py-2.5 px-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40">
                    <td className="py-2.5 px-4 font-medium text-white">{u.name}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300">{u.email}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border capitalize ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 capitalize font-mono cursor-pointer focus:outline-none focus:border-cyan-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                      </select>
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

