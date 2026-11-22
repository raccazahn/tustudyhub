/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Multi-Channel Status Badge & Category Indicators
 * Enforces Rule 5: Status colours supported by text labels & shapes, not colour alone.
 */

import React from 'react';
import { CheckCircle2, Clock, AlertOctagon, Ban, FileText, HelpCircle, Bookmark, ShieldCheck } from 'lucide-react';
import type { VerificationStatus, DocumentCategory, DocumentStatus } from '../../types/index.ts';

export interface StatusBadgeProps {
  status: VerificationStatus | DocumentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs sm:text-sm px-2.5 py-1 gap-1.5';

  switch (status) {
    case 'VERIFIED':
    case 'APPROVED':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-[#E8F5E9] text-[#2D6A4F] border border-[#A3D9B5] ${sizeClasses}`}
          title="Institutional Verification Passed"
        >
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>Verified</span>
        </span>
      );

    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] ${sizeClasses}`}
          title="Under Lecturer Review"
        >
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>Pending Review</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] ${sizeClasses}`}
          title="Submission Rejected"
        >
          <AlertOctagon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>Rejected</span>
        </span>
      );

    case 'REVOKED':
    case 'RESTRICTED':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] ${sizeClasses}`}
          title="Verification Revoked"
        >
          <Ban className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>Revoked</span>
        </span>
      );

    default:
      return null;
  }
};

export const CategoryBadge: React.FC<{ category: DocumentCategory; size?: 'sm' | 'md' }> = ({
  category,
  size = 'md'
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  const categoryLabels: Record<DocumentCategory, { label: string; icon: React.ReactNode }> = {
    LECTURE_NOTE: { label: 'Lecture Notes', icon: <FileText className="w-3 h-3" /> },
    PAST_QUESTION: { label: 'Past Questions', icon: <HelpCircle className="w-3 h-3" /> },
    STUDY_GUIDE: { label: 'Study Guide', icon: <Bookmark className="w-3 h-3" /> },
    LAB_MANUAL: { label: 'Lab Manual', icon: <ShieldCheck className="w-3 h-3" /> },
    SYLLABUS: { label: 'Syllabus', icon: <FileText className="w-3 h-3" /> },
    OTHER: { label: 'Academic Doc', icon: <FileText className="w-3 h-3" /> }
  };

  const item = categoryLabels[category] || categoryLabels.OTHER;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md bg-[#EDE9E2] text-[#4A463F] border border-[#DDD8CF] ${sizeClasses}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};
