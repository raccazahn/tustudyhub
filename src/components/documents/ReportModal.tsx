/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Content Flagging & Reporting Modal
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { AcademicDocument, ReportCategory } from '../../types/index.ts';
import { Flag, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  document: AcademicDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ document, isOpen, onClose }) => {
  const [reasonCategory, setReasonCategory] = useState<ReportCategory>('INACCURATE');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await ApiClient.request(`/api/v1/documents/${document.id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reasonCategory, details })
    });

    setIsLoading(false);
    if (res.success) {
      setSuccess('Content flag submitted. Academic integrity moderators have been notified.');
      setTimeout(() => {
        setSuccess(null);
        setDetails('');
        onClose();
      }, 1800);
    } else {
      setError(res.error?.message || 'Failed to submit report.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Content to Moderators"
      subtitle={`Flagging: ${document.title} (${document.courseCode})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1.5">
            Reason for Report
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value as ReportCategory)}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12]"
            required
          >
            <option value="INACCURATE">Inaccurate Academic Information / Errors</option>
            <option value="COPYRIGHT">Copyright / Intellectual Property Violation</option>
            <option value="INAPPROPRIATE">Inappropriate or Offensive Material</option>
            <option value="DUPLICATE">Duplicate Submission</option>
            <option value="LOW_QUALITY">Low Quality / Illegible Scan</option>
          </select>
        </div>

        <Textarea
          label="Detailed Explanation"
          placeholder="Please explain the academic inaccuracy, page numbers, or policy issue..."
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            type="submit"
            isLoading={isLoading}
            leftIcon={<Flag className="w-4 h-4" />}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
