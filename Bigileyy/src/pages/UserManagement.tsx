import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Eye,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { UserProfile, UserRole } from '../types';

export const UserManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Staff');
  const [formDepartment, setFormDepartment] = useState('Zone 1 Sanitation');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEmail.trim() || !formName.trim()) {
      setFormError('Email and Name are required.');
      return;
    }

    setIsSaving(true);
    try {
      await api.createUser({
        email: formEmail.trim(),
        name: formName.trim(),
        role: formRole,
        department: formDepartment.trim(),
        phone: formPhone.trim()
      });
      setIsAddOpen(false);
      setFormEmail('');
      setFormName('');
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove user account '${email}'?`)) return;
    try {
      await api.deleteUser(userId);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Municipal User Access & Role-Based Authorization
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage administrative personnel, field collection operators, and environmental auditors.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Municipal User</span>
          </button>
        )}
      </div>

      {/* Permissions Matrix Overview */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3">Role-Based Access Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin (Director / Head of Sanitation)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Full authorization to create/delete dustbins, bind physical IoT nodes, modify alert thresholds, and manage personnel.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <UserCheck className="w-4 h-4" />
              <span>Municipal Staff (Fleet / Route Operator)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Can view all telemetry, dispatch compactor collection trucks, acknowledge active overflow alerts, and record landfill collections.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Eye className="w-4 h-4" />
              <span>Viewer (Environmental Auditor / Public)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Strictly read-only access to view segregation dashboards and audit reports. Modification attempts are rejected.
            </p>
          </div>
        </div>
      </div>

      {/* Users Roster Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Registered Municipal Personnel</h3>
          <span className="text-xs text-slate-500 font-mono">({users.length} accounts)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.map((u) => {
                const isUserAdmin = u.role === 'Admin';
                const isUserStaff = u.role === 'Staff';

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-400">
                      {u.id}
                    </td>

                    <td className="px-4 py-3 font-semibold text-white">
                      {u.name}
                    </td>

                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {u.email}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isUserAdmin ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        isUserStaff ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {u.department || 'Municipal Operations'}
                    </td>

                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {u.phone || '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isAdmin && u.email !== 'admin@municipal.gov.in' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          title="Remove user"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Register Municipal Staff Account
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sundaram"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. priya.s@municipal.gov.in"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Staff">Municipal Staff</option>
                    <option value="Admin">Administrator</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department / Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Solid Waste Cell - Zone 2"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
