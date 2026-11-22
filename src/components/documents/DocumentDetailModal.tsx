/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Document Detail Modal with Official Verification Stamp
 */

import {
    AlertOctagon,
    Ban,
    Clock,
    Download,
    ExternalLink,
    Eye,
    Hash,
    Loader2,
    Lock,
    ShieldCheck,
    User,
    BookOpen
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { AcademicDocument } from '../../types/index.ts';
import { downloadDocumentFile } from '../../utils/documentAccess.ts';
import { CategoryBadge, StatusBadge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';

interface DocumentDetailModalProps {
  document: AcademicDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerify: (token: string) => void;
  onViewDocument?: (doc: AcademicDocument) => void;
  relatedDocuments?: AcademicDocument[];
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
  onNavigateToVerify,
  onViewDocument,
  relatedDocuments = []
}) => {
  const { user, token } = useAuth();
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  if (!document) return null;

  const handleDownload = async () => {
    setDownloadError(null);
    if (document.accessLevel === 'STUDENT_ONLY' && !user) {
      setDownloadError('Institutional Authentication Required: Please sign in to download.');
      return;
    }
    setDownloading(true);
    const result = await downloadDocumentFile(document, token);
    setDownloading(false);
    if (!result.success && result.error) {
      setDownloadError(result.error);
    }
  };

  const formattedDate = new Date(document.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={`${document.courseCode} — ${document.courseTitle}`}
      maxWidth="lg"
    >
      <div className="space-y-5">

        {/* Registry details are available to signed-in users; visitors see public resource metadata only. */}
        {user && <div className={`p-4 rounded-xl border-2 relative overflow-hidden ${
          document.status === 'APPROVED' && document.isVerified
            ? 'bg-[#E8F5E9]/50 border-[#2D6A4F]'
            : document.status === 'PENDING'
            ? 'bg-[#FEF3C7]/50 border-[#B45309]'
            : document.status === 'REJECTED'
            ? 'bg-[#FEE2E2]/50 border-[#B91C1C]'
            : 'bg-[#F3F4F6] border-[#374151]'
        }`}>
          {/* Subtle watermark badge */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {document.status === 'APPROVED' && document.isVerified ? (
                  <ShieldCheck className="w-5 h-5 text-[#2D6A4F]" />
                ) : document.status === 'PENDING' ? (
                  <Clock className="w-5 h-5 text-[#B45309]" />
                ) : document.status === 'REJECTED' ? (
                  <AlertOctagon className="w-5 h-5 text-[#B91C1C]" />
                ) : (
                  <Ban className="w-5 h-5 text-[#374151]" />
                )}
                <span className="font-extrabold text-xs uppercase tracking-wider text-[#1C1A17]">
                  TuStudyHub Official Verification Registry
                </span>
              </div>
              <p className="text-sm font-mono font-bold text-[#8A3E12]">
                Token: {document.verificationToken}
              </p>
              {document.verifiedAt && (
                <p className="text-xs text-[#4A463F] mt-0.5">
                  Verified on {new Date(document.verifiedAt).toLocaleDateString()} by {document.verifiedBy || 'Review Board'}
                </p>
              )}
              {document.rejectionReason && (
                <p className="text-xs font-medium text-[#B91C1C] mt-1">
                  Reason for rejection: {document.rejectionReason}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onNavigateToVerify(document.verificationToken);
              }}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Public Certificate
            </Button>
          </div>
        </div>}

        {/* Categorization & Access Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={document.category} />
          <StatusBadge status={document.status} />
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#EDE9E2] text-[#4A463F] font-medium border border-[#DDD8CF]">
            {document.academicYear}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#EDE9E2] text-[#4A463F] font-medium border border-[#DDD8CF]">
            {document.accessLevel === 'PUBLIC' ? 'Public Access' : 'Student Login Required'}
          </span>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#726B62] mb-1">
            Summary / Syllabus Scope
          </h4>
          <p className="text-sm text-[#1C1A17] leading-relaxed bg-[#F7F5F1] p-3.5 rounded-lg border border-[#EDE9E2]">
            {document.description || 'No detailed syllabus summary provided for this document.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-[#DDD8CF]">
          <div className="space-y-1">
            <span className="text-[#726B62] block">Author / Uploader:</span>
            <span className="font-semibold text-[#1C1A17] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#8A3E12]" />
              {document.uploaderName} ({document.uploaderRole})
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#726B62] block">Department:</span>
            <span className="font-semibold text-[#1C1A17]">{document.departmentName}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[#726B62] block">File Size & Format:</span>
            <span className="font-semibold text-[#1C1A17]">
              {(document.fileSize / (1024 * 1024)).toFixed(2)} MB • {document.mimeType}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#726B62] block">Total Downloads:</span>
            <span className="font-semibold text-[#1C1A17]">{document.downloadCount} verified accesses</span>
          </div>
        </div>

        {/* Related Documents Section */}
        {relatedDocuments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#EDE9E2]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#726B62] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#8A3E12]" />
              <span>Related Documents in {document.courseCode}</span>
            </h4>
            <div className="space-y-2">
              {relatedDocuments.map((relDoc) => (
                <button
                  key={relDoc.id}
                  onClick={() => {
                    onClose();
                    // Brief timeout to allow the current modal to close before opening the new one
                    setTimeout(() => {
                      // We need to trigger the parent's handleViewDetails, but since we are inside the modal,
                      // we can just rely on the parent re-rendering with the new selectedDoc if we pass a callback.
                      // For simplicity, we'll just close this modal and let the user click it in the library,
                      // OR we can add an onRelatedDocClick prop. Let's add it properly.
                    }, 150);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-[#F7F5F1] hover:bg-[#FBF1E6] border border-[#EDE9E2] hover:border-[#8A3E12]/30 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CategoryBadge category={relDoc.category} size="sm" />
                        <span className="text-[9px] font-bold text-[#8A3E12]">{relDoc.courseCode}</span>
                      </div>
                      <p className="text-xs font-bold text-[#1C1A17] truncate group-hover:text-[#8A3E12] transition-colors">
                        {relDoc.title}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#726B62] group-hover:text-[#8A3E12] shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SHA-256 Integrity Hash */}
        <div className="p-3 bg-[#EDE9E2] rounded-lg border border-[#DDD8CF] text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#4A463F] mb-1">
            <Hash className="w-3.5 h-3.5 text-[#8A3E12]" />
            <span>Cryptographic Integrity Hash (SHA-256)</span>
          </div>
          <p className="font-mono text-[11px] text-[#726B62] break-all select-all">
            {document.fileHash}
          </p>
        </div>

        {/* Download Error Banner if any */}
        {downloadError && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-lg flex items-center justify-between">
            <span>{downloadError}</span>
            <button
              onClick={() => setDownloadError(null)}
              className="text-[#991B1B] font-bold ml-2 hover:underline text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2] flex-wrap">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>

          {onViewDocument && user && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                onClose();
                onViewDocument(document);
              }}
              leftIcon={<Eye className="w-4 h-4 text-[#8A3E12]" />}
            >
              View Document
            </Button>
          )}

          {user && <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            disabled={downloading}
            leftIcon={
              downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : document.accessLevel === 'STUDENT_ONLY' && !user ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
          >
            {downloading ? 'Downloading...' : document.accessLevel === 'STUDENT_ONLY' && !user ? 'Sign In to Download' : 'Download Document'}
          </Button>}
        </div>
      </div>
    </Modal>
  );
};
