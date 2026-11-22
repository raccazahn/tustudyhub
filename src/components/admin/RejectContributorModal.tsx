import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';
import { ApiClient } from '../../lib/api.ts';

interface RejectContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId?: string;
  userName?: string;
  candidate?: any;
  onConfirmReject?: (candidateId: string, reason: string) => Promise<void>;
}

export const RejectContributorModal: React.FC<RejectContributorModalProps> = ({ isOpen, onClose, onSuccess, userId, userName, candidate, onConfirmReject }) => {
  const actualUserId = userId || candidate?.id;
  const actualUserName = userName || candidate?.fullName;
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A rejection reason is required for audit purposes.');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await ApiClient.request(`/api/v1/admin/contributors/${actualUserId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() })
    });

    setIsLoading(false);

    if (res.success) {
      if (onConfirmReject) {
        await onConfirmReject(actualUserId, reason.trim());
      } else {
        onSuccess?.();
      }
      onClose();
    } else {
      setError(res.error?.message || 'Failed to reject contributor.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Contributor Application" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412] text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Rejecting application for: <span className="font-bold">{actualUserName}</span></p>
            <p className="text-xs opacity-90 mt-1">This action will update the user's status to REJECTED. The reason provided will be logged in the audit trail and may be visible to the user.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#4A463F] uppercase tracking-wider">Rejection Reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#1C1A17] focus:outline-none focus:ring-2 focus:ring-[#8A3E12]/20 focus:border-[#8A3E12] resize-none"
            placeholder="e.g., Submitted materials did not meet academic standards or lacked proper citations."
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[#EDE9E2]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
