/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Academic Document Library View
 * Main document exploration hub with multi-category filtering, peer review queue, and quick uploads.
 * Smart Discovery: Recently Verified highlight + Course-based discovery.
 */

import { BookOpen, CheckCircle2, Clock, Search, Sparkles, Upload } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { AcademicDocument } from '../../types/index.ts';
import { AppLogoIcon } from '../common/AppLogo.tsx';
import { Button } from '../ui/Button.tsx';
import { EmptyState, LoadingSkeleton } from '../ui/EmptyState.tsx';
import { Input } from '../ui/Input.tsx';
import { DocumentCard } from './DocumentCard.tsx';
import { DocumentDetailModal } from './DocumentDetailModal.tsx';
import { DocumentViewerModal } from './DocumentViewerModal.tsx';
import { ReportModal } from './ReportModal.tsx';
import { ReviewModal } from './ReviewModal.tsx';
import { UploadDocumentModal } from './UploadDocumentModal.tsx';

interface DocumentLibraryViewProps {
  initialCourseFilter?: string | null;
  onNavigateToVerify: (token: string) => void;
  onOpenAuthModal: () => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  initialCourseFilter,
  onNavigateToVerify,
  onOpenAuthModal
}) => {
  const { user, role } = useAuth();
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('ALL');
  const [libraryTab, setLibraryTab] = useState<'all' | 'mine' | 'pending'>('all');

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<AcademicDocument | null>(null);
  const [viewDoc, setViewDoc] = useState<AcademicDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    let url = '/api/v1/documents';
    const params = new URLSearchParams();
    if (initialCourseFilter) params.append('courseId', initialCourseFilter);
    if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
    const res = await ApiClient.request<AcademicDocument[]>(fullUrl);

    if (res.success && res.data) {
      setDocuments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
    // Reset course selection when the category (server-side filter) changes so
    // the dropdown never points at a course that no longer exists in the result set.
    setSelectedCourseCode('ALL');
  }, [initialCourseFilter, selectedCategory]);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Resources' },
    { id: 'LECTURE_NOTE', label: 'Lecture Notes' },
    { id: 'PAST_QUESTION', label: 'Past Exam Papers' },
    { id: 'STUDY_GUIDE', label: 'Study Guides' },
    { id: 'LAB_MANUAL', label: 'Lab Manuals' },
    { id: 'SYLLABUS', label: 'Course Syllabi' },
  ];

  // Unique course codes available in the currently fetched set (stable, sorted).
  const uniqueCourseCodes = useMemo(() => {
    const codes = new Set(documents.map(d => d.courseCode).filter(Boolean));
    return Array.from(codes).sort();
  }, [documents]);

  // Genuine approval ordering: prefer verifiedAt, safely fall back to createdAt.
  const byApprovalTime = (a: AcademicDocument, b: AcademicDocument): number => {
    const aTime = a.verifiedAt ? new Date(a.verifiedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b.verifiedAt ? new Date(b.verifiedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return bTime - aTime;
  };

  // ---- Filtering pipeline ----
  let filteredDocs = [...documents];

  if (libraryTab === 'mine' && user) {
    filteredDocs = filteredDocs.filter(d => d.uploaderId === user.id);
  } else if (libraryTab === 'pending') {
    filteredDocs = filteredDocs.filter(d => d.status === 'PENDING');
  } else {
    // Standard library shows approved
    filteredDocs = filteredDocs.filter(d => d.status === 'APPROVED');
  }

  // Client-side course discovery (composes with server-side category filter).
  if (selectedCourseCode !== 'ALL') {
    filteredDocs = filteredDocs.filter(d => d.courseCode === selectedCourseCode);
  }

  // Client search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredDocs = filteredDocs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.courseCode.toLowerCase().includes(q) ||
      d.courseTitle.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.verificationToken.toLowerCase().includes(q)
    );
  }

  // Recently Verified highlight: only on the public "all" tab, top 3 by approval time.
  const recentlyVerified = libraryTab === 'all'
    ? [...filteredDocs].sort(byApprovalTime).slice(0, 3)
    : [];
  const recentlyVerifiedIds = new Set(recentlyVerified.map(d => d.id));

  // Main grid excludes the highlighted cards so nothing is duplicated.
  const displayedDocs = filteredDocs.filter(d => !recentlyVerifiedIds.has(d.id));

  const handleOpenUpload = () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    setUploadModalOpen(true);
  };

  const handleViewDetails = (doc: AcademicDocument) => {
    setSelectedDoc(doc);
    setDetailModalOpen(true);
  };

  const handleViewDocument = (doc: AcademicDocument) => {
    setViewDoc(doc);
    setViewerModalOpen(true);
  };

  const handleOpenReview = (doc: AcademicDocument) => {
    setSelectedDoc(doc);
    setReviewModalOpen(true);
  };

  const handleOpenReport = (doc: AcademicDocument) => {
    setSelectedDoc(doc);
    setReportModalOpen(true);
  };

  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const isPrivileged = ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(role);
  // Compute related documents for the detail modal (same course, approved, max 3)
  const relatedDocuments = useMemo(() => {
    if (!selectedDoc) return [];
    return documents.filter(d =>
      d.id !== selectedDoc.id &&
      d.courseCode === selectedDoc.courseCode &&
      d.status === 'APPROVED'
    ).slice(0, 3);
  }, [selectedDoc, documents]);

  return (
    <div className="space-y-6">

      {/* Hero Welcome / Library Mission Banner */}
      <div className="bg-gradient-to-r from-[#EDE9E2] via-[#F7F5F1] to-[#FBF1E6] rounded-2xl p-6 sm:p-8 border border-[#DDD8CF] shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E4D0] text-[#8A3E12] text-xs font-bold tracking-wide uppercase mb-3 border border-[#D98A3D]/40">
            <Sparkles className="w-3.5 h-3.5 text-[#C2691D]" />
            <span>Academic Library & Document Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1A17] mb-2">
            Discover, Study & Verify Course Materials
          </h1>
          <p className="text-sm text-[#4A463F] leading-relaxed mb-5">
            Access curriculum-aligned lecture notes, lab guides, and verified past questions vetted by university educators.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenUpload}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload Material
            </Button>
            <span className="text-xs text-[#726B62]">
              Verified tokens attached to every approved resource.
            </span>
          </div>
        </div>
        <AppLogoIcon size={140} className="hidden lg:block absolute right-6 -bottom-6 opacity-15 pointer-events-none select-none" />
      </div>

      {/* Control Bar: Search & Sub-tabs */}
      <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#DDD8CF] shadow-[0_1px_3px_rgba(28,26,23,0.04)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Search Input */}
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search by course code (e.g. CSC 201), title, or token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setLibraryTab('all')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors select-none ${
                libraryTab === 'all'
                  ? 'bg-[#8A3E12] text-white shadow-xs'
                  : 'bg-[#EDE9E2] text-[#4A463F] hover:bg-[#DDD8CF]'
              }`}
            >
              Verified Library
            </button>

            {user && (
              <button
                onClick={() => setLibraryTab('mine')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors select-none ${
                  libraryTab === 'mine'
                    ? 'bg-[#8A3E12] text-white shadow-xs'
                    : 'bg-[#EDE9E2] text-[#4A463F] hover:bg-[#DDD8CF]'
                }`}
              >
                My Submissions
              </button>
            )}

            {isPrivileged && (
              <button
                onClick={() => setLibraryTab('pending')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 select-none ${
                  libraryTab === 'pending'
                    ? 'bg-[#8A3E12] text-white shadow-xs'
                    : 'bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Review Queue</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#B45309] text-white text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Course discovery + Category Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#EDE9E2]">
          <div className="relative shrink-0">
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              aria-label="Filter by course"
              className="min-h-[36px] pl-3 pr-8 rounded-full text-xs font-medium bg-[#EDE9E2] text-[#4A463F] border border-[#DDD8CF] hover:bg-[#DDD8CF] focus:outline-none focus:ring-1 focus:ring-[#8A3E12] cursor-pointer appearance-none"
            >
              <option value="ALL">All Courses</option>
              {uniqueCourseCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#726B62]">▾</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#C2691D] text-white shadow-xs' // Rule 3: Clay 500 fill
                      : 'bg-[#EDE9E2] text-[#4A463F] hover:bg-[#DDD8CF]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title={searchQuery || selectedCourseCode !== 'ALL' ? 'No documents match your query' : 'No documents in this view'}
          description="Be the first student or educator to contribute curriculum materials for this course."
          actionLabel="Submit Document"
          onAction={handleOpenUpload}
        />
      ) : (
        <div className="space-y-6">

          {/* Recently Verified Materials highlight */}
          {recentlyVerified.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Recently Verified Materials</span>
                </h2>
                <span className="text-[11px] text-[#726B62] font-semibold">Newest approved resources</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {recentlyVerified.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onViewDetails={handleViewDetails}
                    onViewDocument={handleViewDocument}
                    onReview={handleOpenReview}
                    onReport={handleOpenReport}
                    onOpenAuthModal={onOpenAuthModal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Main Document Grid */}
          {displayedDocs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayedDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onViewDetails={handleViewDetails}
                  onViewDocument={handleViewDocument}
                  onReview={handleOpenReview}
                  onReport={handleOpenReport}
                  onOpenAuthModal={onOpenAuthModal}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      <DocumentViewerModal
        document={viewDoc}
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
      />

      <DocumentDetailModal
        document={selectedDoc}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onNavigateToVerify={onNavigateToVerify}
        onViewDocument={handleViewDocument}
        relatedDocuments={relatedDocuments}
      />

      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploaded={fetchDocuments}
      />

      <ReviewModal
        document={selectedDoc}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onReviewed={fetchDocuments}
      />

      <ReportModal
        document={selectedDoc}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

    </div>
  );
};
