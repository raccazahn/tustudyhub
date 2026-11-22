/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Responsive Academic Document Viewer Modal
 * Supports PDF, PNG, JPEG, and DOCX viewing across Android phones,
 * desktop browsers, and PWA standalone windows.
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  ShieldCheck,
  Lock,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { CategoryBadge, StatusBadge } from '../ui/Badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getDocumentViewUrl, downloadDocumentFile } from '../../utils/documentAccess.ts';
import type { AcademicDocument } from '../../types/index.ts';

interface DocumentViewerModalProps {
  document: AcademicDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  isOpen,
  onClose
}) => {
  const { user, token } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen || !doc) return null;

  const viewUrl = getDocumentViewUrl(doc.id, token);
  const isPdf = doc.mimeType === 'application/pdf' || doc.fileName.toLowerCase().endsWith('.pdf');
  const isImage = doc.mimeType.startsWith('image/') || /\.(png|jpe?g)$/i.test(doc.fileName);
  const isDocx = doc.mimeType.includes('wordprocessingml') || doc.fileName.toLowerCase().endsWith('.docx');

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadStatus('Preparing download...');

    const res = await downloadDocumentFile(doc, token, (msg) => setDownloadStatus(msg));
    setIsDownloading(false);

    if (!res.success) {
      setDownloadError(res.error || 'Failed to download document.');
      setDownloadStatus(null);
    } else {
      setDownloadStatus('Download initiated successfully!');
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">

      {/* Viewer Container */}
      <div
        className={`bg-white rounded-2xl border border-[#DDD8CF] shadow-2xl flex flex-col w-full transition-all ${
          isFullScreen
            ? 'fixed inset-2 sm:inset-4 max-w-none max-h-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]'
            : 'max-w-5xl h-[88vh] sm:h-[84vh]'
        }`}
      >

        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#DDD8CF] bg-[#F7F5F1] rounded-t-2xl flex items-center justify-between gap-3 shrink-0">

          {/* Document Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-xs px-2 py-0.5 rounded bg-[#EDE9E2] text-[#8A3E12] border border-[#DDD8CF]">
                {doc.courseCode}
              </span>
              <CategoryBadge category={doc.category} size="sm" />
              {doc.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3D9B5]">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Verified Document</span>
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#1C1A17] truncate" title={doc.title}>
              {doc.title}
            </h2>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Open in external tab (Essential for Android PDF viewers) */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#C4BEB4] bg-white hover:bg-[#FBF1E6] hover:text-[#8A3E12] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              title="Open document in a dedicated browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open in Tab</span>
            </button>

            {/* Direct Download Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              isLoading={isDownloading}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              <span className="hidden sm:inline">Download</span>
            </Button>

            {/* Fullscreen toggle on desktop */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="min-h-[36px] min-w-[36px] hidden sm:flex items-center justify-center rounded-lg border border-[#DDD8CF] bg-white hover:bg-[#EDE9E2] text-[#4A463F] transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit full screen' : 'Expand full screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#DDD8CF] bg-white hover:bg-[#FEE2E2] hover:text-[#B91C1C] text-[#4A463F] transition-colors cursor-pointer"
              aria-label="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Status / Error Toast notification banner */}
        {(downloadStatus || downloadError) && (
          <div className={`px-4 py-2 text-xs font-medium border-b flex items-center justify-between ${
            downloadError
              ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
              : 'bg-[#E8F5E9] text-[#2D6A4F] border-[#A3D9B5]'
          }`}>
            <span>{downloadError || downloadStatus}</span>
            {downloadError && (
              <button
                onClick={() => setDownloadError(null)}
                className="underline ml-2 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Document Display Canvas */}
        <div className="flex-1 bg-[#2B303A] relative overflow-hidden flex flex-col justify-center items-center">

          {/* Format 1: PDF Viewer */}
          {isPdf && (
            <div className="w-full h-full flex flex-col">

              {/* Mobile guidance bar */}
              <div className="bg-[#1C1A17] text-[#EDE9E2] text-[11px] px-3 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 md:hidden">
                <span className="flex items-center gap-1.5 truncate">
                  <Smartphone className="w-3.5 h-3.5 text-[#C2691D] shrink-0" />
                  <span>Mobile PDF Preview</span>
                </span>
                <button
                  onClick={handleOpenInNewTab}
                  className="text-[#F7E4D0] font-bold underline shrink-0 hover:text-white"
                >
                  Open in New Tab →
                </button>
              </div>

              {/* PDF Frame */}
              <iframe
                src={`${viewUrl}#view=FitH&toolbar=1`}
                className="w-full flex-1 bg-white border-0"
                title={`PDF Preview: ${doc.title}`}
              />
            </div>
          )}

          {/* Format 2: Image Viewer (PNG / JPEG) */}
          {isImage && (
            <div className="w-full h-full relative overflow-auto flex items-center justify-center p-4">
              <img
                src={viewUrl}
                alt={doc.title}
                style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                className="max-w-full max-h-full object-contain transition-transform duration-200 select-none shadow-lg rounded"
              />

              {/* Floating Image Zoom Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1C1A17]/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-lg z-10">
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1 hover:text-[#C2691D] transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono w-12 text-center">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1 hover:text-[#C2691D] transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom(1)}
                  className="p-1 hover:text-[#C2691D] transition-colors cursor-pointer ml-1 border-l border-white/20 pl-2"
                  title="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Format 3: DOCX / Office Document */}
          {isDocx && (
            <div className="max-w-md w-full mx-auto p-6 bg-white rounded-2xl border border-[#DDD8CF] shadow-xl text-center space-y-4 m-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2B579A]/10 text-[#2B579A] flex items-center justify-center mx-auto border border-[#2B579A]/20">
                <FileText className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#2B579A] tracking-wider">
                  Microsoft Word Document (.docx)
                </span>
                <h3 className="text-base font-bold text-[#1C1A17] mt-1">
                  {doc.fileName}
                </h3>
                <p className="text-xs text-[#726B62] mt-2 leading-relaxed">
                  Word documents are formatted for offline editing and study. Download the file to open it in your device's Office or Docs app.
                </p>
              </div>

              <div className="p-3 bg-[#F7F5F1] rounded-xl border border-[#EDE9E2] text-xs text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#726B62]">File Size:</span>
                  <span className="font-semibold text-[#1C1A17]">{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#726B62]">Integrity Hash:</span>
                  <span className="font-mono text-[10px] text-[#726B62] truncate max-w-[180px]">{doc.fileHash}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleDownload}
                isLoading={isDownloading}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full font-bold"
              >
                Download and Open Word Document
              </Button>
            </div>
          )}

        </div>

        {/* Footer Info Strip */}
        <div className="px-4 py-2.5 sm:px-6 bg-[#F7F5F1] border-t border-[#DDD8CF] rounded-b-2xl flex items-center justify-between text-xs text-[#726B62] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[#1C1A17]">{doc.fileName}</span>
            <span>•</span>
            <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Verification Token: <strong className="font-mono text-[#8A3E12]">{doc.verificationToken}</strong></span>
            <span className="text-[#1C1A17] font-medium">{doc.downloadCount} downloads</span>
          </div>
        </div>

      </div>

    </div>
  );
};
