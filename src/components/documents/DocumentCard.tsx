/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Document Card Component
 * Conforms to Clay & Kaolin design rules with clear multi-channel status indicators.
 */

import { CheckSquare, Download, Eye, Flag, Info, Loader2, Lock, User } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { AcademicDocument } from '../../types/index.ts';
import { downloadDocumentFile } from '../../utils/documentAccess.ts';
import { CategoryBadge, StatusBadge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';

interface DocumentCardProps {
  document: AcademicDocument;
  onViewDetails: (doc: AcademicDocument) => void;
  onViewDocument: (doc: AcademicDocument) => void;
  onReview: (doc: AcademicDocument) => void;
  onReport: (doc: AcademicDocument) => void;
  onOpenAuthModal: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onViewDetails,
  onViewDocument,
  onReview,
  onReport,
  onOpenAuthModal
}) => {
  const { user, token, role } = useAuth();
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const isAssignedLecturer = role === 'LECTURER' && (user?.assignedCourseCodes || []).includes(document.courseCode);
  const isAdminOrMod = role === 'ADMINISTRATOR' || role === 'MODERATOR';
  // Strict rule: Authors cannot approve their own submission
  const canReview = (isAssignedLecturer || role === 'ADMINISTRATOR') &&
                    document.status === 'PENDING' &&
                    document.uploaderId !== user?.id;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadError(null);

    // If document is STUDENT_ONLY and user is a visitor, inform them
    if (document.accessLevel === 'STUDENT_ONLY' && !user) {
      setDownloadError('Student sign-in required to download this resource.');
      return;
    }

    setDownloading(true);
    const result = await downloadDocumentFile(document, token);
    setDownloading(false);

    if (!result.success && result.error) {
      setDownloadError(result.error);
    }
  };

  const formattedSize = (document.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <Card variant="interactive" padding="md" className="flex flex-col justify-between h-full group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs px-2 py-0.5 rounded bg-[#EDE9E2] text-[#8A3E12] border border-[#DDD8CF]">
              {document.courseCode}
            </span>
            <CategoryBadge category={document.category} size="sm" />
          </div>
          <StatusBadge status={document.status} size="sm" />
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(document)}
          className="text-base font-bold text-[#1C1A17] group-hover:text-[#8A3E12] transition-colors line-clamp-2 cursor-pointer mb-1.5"
        >
          {document.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-[#726B62] line-clamp-2 mb-3">
          {document.description || 'Verified academic syllabus material for examination preparation.'}
        </p>

        {/* Metadata info */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4A463F] py-2 border-t border-[#EDE9E2] mb-3">
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-[#726B62] shrink-0" />
            <span className="truncate">{document.uploaderName}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[#726B62]">
            <span>{document.academicYear}</span>
            <span>•</span>
            <span>{formattedSize} MB</span>
          </div>
        </div>
      </div>

      {/* Download Error Banner if any */}
      {downloadError && (
        <div className="mt-2 p-2 bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-md flex items-center justify-between">
          <span className="truncate">{downloadError}</span>
          <button
            onClick={() => setDownloadError(null)}
            className="text-[#991B1B] font-bold ml-1 hover:underline text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Footers */}
      <div className="pt-2 border-t border-[#EDE9E2] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Primary View Document Action */}
          {user ? (
            <Button
              variant="clayFill"
              size="sm"
              onClick={() => onViewDocument(document)}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              title="Open Document Viewer"
            >
              View
            </Button>
          ) : (
            <Button variant="clayFill" size="sm" onClick={onOpenAuthModal} leftIcon={<Lock className="w-3.5 h-3.5" />}>
              Sign In to View
            </Button>
          )}

          {/* Details & Verification Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(document)}
            leftIcon={<Info className="w-3.5 h-3.5" />}
            title="View Details & Registry Stamp"
          >
            Details
          </Button>

          {canReview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReview(document)}
              leftIcon={<CheckSquare className="w-3.5 h-3.5 text-[#2D6A4F]" />}
            >
              Review
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Download Document Action */}
          {user && <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            leftIcon={
              downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8A3E12]" />
              ) : document.accessLevel === 'STUDENT_ONLY' && !user ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )
            }
            title={document.accessLevel === 'STUDENT_ONLY' && !user ? 'Student Login Required' : 'Download Document'}
          >
            {downloading ? '...' : (document.downloadCount || 0)}
          </Button>}

          {user ? (
            <button
              onClick={() => onReport(document)}
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#726B62] hover:text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
              title="Report inaccurate or infringing material"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="min-h-[38px] px-2 inline-flex items-center justify-center gap-1 rounded-lg text-xs font-semibold text-[#726B62] hover:bg-[#EDE9E2]"
              title="Sign in to report material"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
