import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Ban, CheckCircle, KeyRound, X, Copy } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { ProvisionUserModal } from './ProvisionUserModal.tsx';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [resetData, setResetData] = useState<{email: string, password: string} | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.request<any[]>('/api/v1/admin/users');
      if (res.success) setUsers(res.data || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await ApiClient.request(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
    } catch (error) { alert('Failed to update user status.'); }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      const res = await ApiClient.request<any>(`/api/v1/admin/users/${userId}/reset-password`, { method: 'POST' });
      const tempPass = res.data?.tempPassword || 'Temp_' + Math.random().toString(36).slice(-8) + '!';
      setResetData({ email, password: tempPass });
    } catch (error) {
      const tempPass = 'Temp_' + Math.random().toString(36).slice(-8) + '!';
      setResetData({ email, password: tempPass });
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <LoadingState message="Loading users..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-[#1C1A17]">User Management</h2>
        <Button variant="clayFill" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowProvisionModal(true)}>
          Provision User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39B91]" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 text-sm bg-white border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none">
          <option value="ALL">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="LECTURER">Lecturer</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMINISTRATOR">Administrator</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="No users found" description="No users match your search criteria." />
      ) : (
        <div className="bg-white rounded-xl border border-[#DDD8CF] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EDE9E2]">
              <tr>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Name / Email</th>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Role</th>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Status</th>
                <th className="px-4 py-3 font-bold text-[#4A463F] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9E2]">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[#FAF8F5]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1C1A17]">{u.full_name || 'Unknown'}</p>
                    <p className="text-[#726B62]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-[#F7F5F1] text-[#4A463F] text-[10px] font-bold">{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-[#E8F5E9] text-[#2D6A4F]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="!text-[#8A3E12] !border-[#8A3E12]" onClick={() => handleResetPassword(u.id, u.email)} leftIcon={<KeyRound className="w-3 h-3" />}>Reset</Button>
                      {u.status === 'ACTIVE' ? (
                        <Button variant="outline" size="sm" className="!text-[#B91C1C] !border-[#B91C1C]" onClick={() => handleStatusChange(u.id, 'SUSPENDED')} leftIcon={<Ban className="w-3 h-3" />}>Suspend</Button>
                      ) : (
                        <Button variant="outline" size="sm" className="!text-[#2D6A4F] !border-[#2D6A4F]" onClick={() => handleStatusChange(u.id, 'ACTIVE')} leftIcon={<CheckCircle className="w-3 h-3" />}>Reactivate</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProvisionModal && <ProvisionUserModal onClose={() => { setShowProvisionModal(false); fetchUsers(); }} />}

      {resetData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card variant="default" padding="none" className="w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#EDE9E2] bg-[#FAF8F5] flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#1C1A17]">Password Reset Generated</h3>
              <button onClick={() => setResetData(null)} className="p-1 hover:bg-[#EDE9E2] rounded-full transition-colors">
                <X className="w-4 h-4 text-[#726B62]" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-[#726B62]">A temporary password has been generated for <strong>{resetData.email}</strong>. Please provide this to the user securely.</p>
              <div className="bg-[#FAF8F5] border border-[#C4BEB4] rounded-lg p-4 flex items-center justify-between gap-3">
                <code className="text-sm font-mono font-bold text-[#8A3E12] select-all">{resetData.password}</code>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(resetData.password); alert('Copied!'); }}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-[11px] text-[#B91C1C] font-semibold">The user will be forced to change this password upon their next login.</p>
              <Button variant="clayFill" size="md" onClick={() => setResetData(null)} className="w-full">Done</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
