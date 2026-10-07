import React, { useState, useEffect } from 'react';
import { userService, getErrorMessage } from '../services/api.js';
import { RoleBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Users, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';

export const TeamRoles = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (targetUserId, newRoleName) => {
    try {
      setUpdatingId(targetUserId);
      setSuccessMessage(null);
      setError(null);
      await userService.updateUserRole(targetUserId, newRoleName);
      setSuccessMessage(`User role successfully changed to ${newRoleName}.`);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Team & Role Management
            </h1>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              Admin Only
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage permissions across your organization. Only Administrators can assign Project Leader and Member roles.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs sm:text-sm text-indigo-900">
        <Shield className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Role Hierarchy & Access Rules:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs text-indigo-800">
            <li><strong>Admin</strong>: Complete system visibility and sole authority to assign roles.</li>
            <li><strong>Project Leader</strong>: Can create projects, manage them, and assign tasks to members.</li>
            <li><strong>Member</strong>: Default role for all accounts. Strictly sees only projects and tasks assigned to them.</li>
          </ul>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadUsers()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* User Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const currentRoleName = u.role?.name || 'MEMBER';
                const isSelf = u.id === currentUser?.id;
                const isBusy = updatingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">ID: {u.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">{u.email}</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        ) : (
                          <select
                            value={currentRoleName}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isBusy}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                          >
                            <option value="MEMBER">Member (Default)</option>
                            <option value="PROJECT_LEADER">Project Leader</option>
                            <option value="ADMIN">Administrator</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

