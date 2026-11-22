import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, User } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';

export const ApprovalsManager: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, docsRes] = await Promise.all([
        ApiClient.request<any[]>('/api/v1/admin/users'),
        ApiClient.request<any[]>('/api/v1/documents')
      ]);
      if (usersRes.success) setPendingUsers(usersRes.data?.filter((u: any) => u.status === 'PENDING_APPROVAL') || []);
      if (docsRes.success) setPendingDocs(docsRes.data?.filter((d: any) => d.status === 'PENDING') || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleUserDecision = async (userId: string, status: 'ACTIVE' | 'REJECTED') => {
    setActionLoading(userId);
    try {
      await ApiClient.request(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      alert(`User ${status === 'ACTIVE' ? 'approved' : 'rejected'} successfully.`);
      fetchData();
    } catch (error) {
      alert(`Failed to update user.`);
    }
    setActionLoading(null);
  };

  const handleDocDecision = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
      let feedbackReason: string = '';
   if (status === 'REJECTED') {
     feedbackReason = prompt('Please provide a reason for rejection (required):') || '';
      if (!feedbackReason || feedbackReason.trim().length < 3) {
        alert('A valid reason is required to reject a document.');
        return;
      }
    }

    setActionLoading(docId);
    try {
      await ApiClient.request(`/api/v1/documents/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, feedbackReason: feedbackReason || undefined })
      });
      alert(`Document ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
      fetchData();
    } catch (error) {
      alert(`Failed to update document.`);
    }
    setActionLoading(null);
  };

  if (loading) return <LoadingState message="Loading approvals..." />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-[#1C1A17]">Centralized Approvals</h2>

      <Card variant="clayTint" padding="md">
        <h3 className="text-sm font-bold text-[#4A463F] mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Pending User Applications ({pendingUsers.length})</h3>
        {pendingUsers.length === 0 ? <p className="text-xs text-[#726B62]">No pending user applications.</p> : (
          <div className="space-y-2">
            {pendingUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#EDE9E2]">
                <div>
                  <p className="text-xs font-bold text-[#1C1A17]">{u.full_name || 'Unknown'}</p>
                  <p className="text-[11px] text-[#726B62]">{u.email} • Applied as {u.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="clayFill" size="sm" className="!bg-[#2D6A4F] hover:!bg-[#1E4D35]" isLoading={actionLoading === u.id} onClick={() => handleUserDecision(u.id, 'ACTIVE')}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" className="!text-[#B91C1C] !border-[#B91C1C]" isLoading={actionLoading === u.id} onClick={() => handleUserDecision(u.id, 'REJECTED')}>
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card variant="clayTint" padding="md">
        <h3 className="text-sm font-bold text-[#4A463F] mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Pending Document Submissions ({pendingDocs.length})</h3>
        {pendingDocs.length === 0 ? <p className="text-xs text-[#726B62]">No pending documents.</p> : (
          <div className="space-y-2">
            {pendingDocs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#EDE9E2]">
                <div>
                  <p className="text-xs font-bold text-[#1C1A17]">{d.title}</p>
                  <p className="text-[11px] text-[#726B62]">{d.courseCode} • Uploaded by {d.uploaderName || 'Unknown'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="clayFill" size="sm" className="!bg-[#2D6A4F] hover:!bg-[#1E4D35]" isLoading={actionLoading === d.id} onClick={() => handleDocDecision(d.id, 'APPROVED')}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" className="!text-[#B91C1C] !border-[#B91C1C]" isLoading={actionLoading === d.id} onClick={() => handleDocDecision(d.id, 'REJECTED')}>
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
