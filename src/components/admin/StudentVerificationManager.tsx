import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Search, RefreshCw, Eye, FileText } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { Modal } from '../ui/Modal.tsx';

export const StudentVerificationManager: React.FC = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'VERIFIED' | 'REJECTED' | 'CORRECTION_REQUESTED'>('VERIFIED');
  const [rejectReason, setRejectReason] = useState('');

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.request<any[]>('/api/v1/verification/admin/pending');
      if (res.success && res.data) setVerifications(res.data);
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVerifications(); }, []);

  const openDetails = (app: any) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  const openDecision = (type: 'VERIFIED' | 'REJECTED' | 'CORRECTION_REQUESTED') => {
    setDecisionType(type);
    setRejectReason(type === 'VERIFIED' ? 'Approved by Administrator' : '');
    setDecisionModalOpen(true);
  };

  const handleDecision = async () => {
    if ((decisionType === 'REJECTED' || decisionType === 'CORRECTION_REQUESTED') && rejectReason.trim().length < 5) {
      alert('A detailed reason (at least 5 characters) is required for rejections or correction requests.');
      return;
    }

    setActionLoading(selectedApp.id);
    try {
      const res = await ApiClient.request(`/api/v1/verification/admin/${selectedApp.id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: decisionType,
          reviewNotes: decisionType === 'VERIFIED' ? 'Approved by Administrator' : rejectReason
        })
      });

      if (res.success) {
        setDecisionModalOpen(false);
        setDetailsOpen(false);
        setSelectedApp(null);
        setRejectReason('');
        await fetchVerifications(); // Refresh the list immediately
        alert(`Application successfully ${decisionType.toLowerCase().replace('_', ' ')}!`);
      } else {
        alert(res.error?.message || 'Action failed.');
      }
    } catch (error) {
      console.error('Decision error:', error);
      alert('An error occurred while processing the decision.');
    }
    setActionLoading(null);
  };

  const filtered = verifications.filter(v =>
    v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    (v.user_email && v.user_email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingState message="Loading verification applications..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1C1A17]">Student Verification Management</h2>
          <p className="text-xs text-[#726B62]">Review and approve Tubman University student applications.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchVerifications} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39B91]" />
        <input
          type="text"
          placeholder="Search by name, student ID, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="inbox" title="No pending applications" description="All student verification applications have been processed." />
      ) : (
        <div className="bg-white rounded-xl border border-[#DDD8CF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EDE9E2]">
                <tr>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Student Name</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">TU Student ID</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Email</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">College / Dept</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Status</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9E2]">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1C1A17]">{v.full_name}</td>
                    <td className="px-4 py-3 font-mono text-[#8A3E12]">{v.student_id}</td>
                    <td className="px-4 py-3 text-[#726B62]">{v.user_email}</td>
                    <td className="px-4 py-3 text-[#726B62]">{v.college}<br/><span className="text-[10px]">{v.department}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.verification_status === 'PENDING' ? 'bg-[#FFF3CD] text-[#C2691D]' :
                        v.verification_status === 'CORRECTION_REQUESTED' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#E8F5E9] text-[#2D6A4F]'
                      }`}>
                        {v.verification_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => openDetails(v)} leftIcon={<Eye className="w-3 h-3" />}>
                        Review Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Verification Application Details" maxWidth="md">
        {selectedApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#726B62]">Full Name</p>
                <p className="font-semibold text-[#1C1A17]">{selectedApp.full_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#726B62]">TU Student ID</p>
                <p className="font-mono font-semibold text-[#8A3E12]">{selectedApp.student_id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#726B62]">Email</p>
                <p className="text-[#1C1A17]">{selectedApp.user_email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#726B62]">Academic Status</p>
                <p className="text-[#1C1A17]">{selectedApp.academic_status || selectedApp.academic_level}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase text-[#726B62]">College & Department</p>
                <p className="text-[#1C1A17]">{selectedApp.college} — {selectedApp.department}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase text-[#726B62]">Academic Programme</p>
                <p className="text-[#1C1A17]">{selectedApp.academic_programme}</p>
              </div>
              {selectedApp.document_path && (
                <div className="col-span-2 p-3 bg-[#FAF8F5] rounded-lg border border-[#EDE9E2] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8A3E12]" />
                  <div>
                    <p className="text-xs font-bold text-[#1C1A17]">Supporting Document Uploaded</p>
                    <p className="text-[11px] text-[#726B62]">Type: {selectedApp.document_type?.replace('_', ' ')} | Path: {selectedApp.document_path}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDE9E2]">
              <Button variant="outline" size="md" onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button variant="outline" size="md" className="!text-[#B91C1C] !border-[#B91C1C]" onClick={() => openDecision('REJECTED')}>
                Reject
              </Button>
              <Button variant="outline" size="md" className="!text-[#C2691D] !border-[#C2691D]" onClick={() => openDecision('CORRECTION_REQUESTED')}>
                Request Correction
              </Button>
              <Button variant="clayFill" size="md" className="!bg-[#2D6A4F] hover:!bg-[#1E4D35] !text-white" onClick={() => openDecision('VERIFIED')}>
                Approve Application
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DECISION CONFIRMATION MODAL */}
      <Modal isOpen={decisionModalOpen} onClose={() => setDecisionModalOpen(false)} title={`Confirm ${decisionType.replace('_', ' ')}`} maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#4A463F]">
            {decisionType === 'VERIFIED'
              ? 'Are you sure you want to approve this application? The student will immediately gain access to all protected features.'
              : 'Please provide a clear reason. This will be sent to the student and they will be able to resubmit.'}
          </p>

          {decisionType !== 'VERIFIED' && (
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Student ID does not match university records..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none resize-none"
            />
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="md" onClick={() => setDecisionModalOpen(false)}>Cancel</Button>
            <Button
              variant="clayFill"
              size="md"
              className={decisionType === 'VERIFIED' ? '!bg-[#2D6A4F] hover:!bg-[#1E4D35] !text-white' : '!bg-[#B91C1C] hover:!bg-[#991B1B] !text-white'}
              isLoading={actionLoading === selectedApp?.id}
              onClick={handleDecision}
            >
              Confirm {decisionType.replace('_', ' ')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
