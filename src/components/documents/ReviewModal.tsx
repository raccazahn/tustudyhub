/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Lecturer Document Review Modal
 * Strictly enforces self-review prohibition and mandatory feedback for rejections.
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { AcademicDocument } from '../../types/index.ts';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ReviewModalProps {
  document: AcademicDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onReviewed
}) => {
  const { user } = useAuth();
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [feedbackReason, setFeedbackReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!document) return null;

  // Strict Rule: Author cannot review their own submission
  const isAuthor = user?.id === document.uploaderId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthor) {
      setError('Academic Integrity Violation: You cannot review or approve your own submission.');
      return;
    }

    if (decision === 'REJECTED' && (!feedbackReason || feedbackReason.trim().length < 5)) {
      setError('Please provide a constructive academic explanation when rejecting a document.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await ApiClient.request(`/api/v1/documents/${document.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        feedbackReason: feedbackReason.trim()
      })
    });

    setIsLoading(false);
    if (res.success) {
      onReviewed();
      onClose();
    } else {
      setError(res.error?.message || 'Failed to submit review decision.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Peer Review Submission"
      subtitle={`${document.courseCode}: ${document.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isAuthor && (
          <div className="p-3.5 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Self-Review Prohibited</p>
              <p>You uploaded this document. An independent course lecturer or administrator must review it.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C]">
            {error}
          </div>
        )}

        <div className="p-3 rounded-lg bg-[#F7F5F1] border border-[#DDD8CF] text-xs text-[#4A463F] space-y-1">
          <p><strong>Uploader:</strong> {document.uploaderName} ({document.uploaderRole})</p>
          <p><strong>Category:</strong> {document.category} • {document.academicYear}</p>
          <p><strong>File:</strong> {document.fileName} ({(document.fileSize / (1024 * 1024)).toFixed(2)} MB)</p>
        </div>

        {/* Decision Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1.5">
            Review Verdict
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isAuthor}
              onClick={() => { setDecision('APPROVED'); setError(null); }}
              className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                decision === 'APPROVED'
                  ? 'bg-[#E8F5E9] text-[#2D6A4F] border-[#2D6A4F] shadow-xs'
                  : 'bg-white text-[#4A463F] border-[#DDD8CF] hover:bg-[#F7F5F1]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Verify</span>
            </button>

            <button
              type="button"
              disabled={isAuthor}
              onClick={() => { setDecision('REJECTED'); setError(null); }}
              className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                decision === 'REJECTED'
                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C] shadow-xs'
                  : 'bg-white text-[#4A463F] border-[#DDD8CF] hover:bg-[#F7F5F1]'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Submission</span>
            </button>
          </div>
        </div>

        <Textarea
          label={decision === 'REJECTED' ? 'Mandatory Rejection Feedback' : 'Optional Review Comments'}
          placeholder={decision === 'REJECTED' ? 'Explain what needs correction or why content was rejected...' : 'Approve for official curriculum notes...'}
          rows={3}
          value={feedbackReason}
          onChange={(e) => setFeedbackReason(e.target.value)}
          required={decision === 'REJECTED'}
          disabled={isAuthor}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={decision === 'APPROVED' ? 'primary' : 'danger'}
            size="md"
            type="submit"
            isLoading={isLoading}
            disabled={isAuthor}
          >
            {decision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
