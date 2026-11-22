/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Document Verification View
 * Public verification registry with live QR validation, cryptographic integrity hash,
 * and authorized administrative revocation.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Ban,
  Hash,
  QrCode,
  Calendar,
  Building2,
  BookOpen,
  Share2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Input, Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { Modal } from '../ui/Modal.tsx';
import { StatusBadge, CategoryBadge } from '../ui/Badge.tsx';
import { AppLogoIcon } from '../common/AppLogo.tsx';
import { ApiClient } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { PublicVerificationResult } from '../../types/index.ts';

interface VerificationViewProps {
  initialToken?: string | null;
  onSelectCourse?: (courseCode: string) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  initialToken,
  onSelectCourse
}) => {
  const { user, role } = useAuth();
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revocation Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);

  const performLookup = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setLoading(true);
    setError(null);

    const cleanToken = tokenToVerify.trim().toUpperCase();
    const res = await ApiClient.request<PublicVerificationResult>(`/api/v1/verify/${cleanToken}`);

    setLoading(false);
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setResult(null);
      setError(res.error?.message || 'Verification token not found in the institutional registry.');
    }
  };

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      performLookup(initialToken);
    } else {
      // Default lookup with first seeded verified token for instant user feedback
      performLookup('TSH-CSC201-8F4A21C9');
    }
  }, [initialToken]);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setRevokeLoading(true);

    const res = await ApiClient.request(`/api/v1/verify/${result.verificationToken}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason: revocationReason })
    });

    setRevokeLoading(false);
    if (res.success) {
      setRevokeModalOpen(false);
      setRevocationReason('');
      performLookup(result.verificationToken);
    } else {
      alert(res.error?.message || 'Failed to revoke verification.');
    }
  };

  const sampleTokens = [
    { token: 'TSH-CSC201-8F4A21C9', label: 'AVL Trees (Verified)' },
    { token: 'TSH-CSC201-4D9E73A1', label: 'Exam Past Questions (Verified)' },
    { token: 'TSH-CSC301-6B18D377', label: 'Linux Lab Manual (Pending)' },
    { token: 'TSH-LAW204-9C78E41F', label: 'Case Digest (Verified)' },
  ];

  const canRevoke = (role === 'ADMINISTRATOR' || role === 'MODERATOR') && result?.status === 'VERIFIED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header Banner */}
      <div className="text-center space-y-2 py-4">
        <AppLogoIcon size={56} className="mx-auto mb-1 rounded-2xl shadow-sm" />
        <h1 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight">
          Public Document Verification Registry
        </h1>
        <p className="text-xs sm:text-sm text-[#726B62] max-w-lg mx-auto">
          Scan QR codes or enter unique verification tokens to validate document integrity, course alignment, and peer review authenticity.
        </p>
      </div>

      {/* Verification Lookup Input Card */}
      <Card variant="default" padding="md" className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            performLookup(tokenInput);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="flex-1">
            <Input
              placeholder="Enter token (e.g. TSH-CSC201-8F4A21C9)..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="sm:w-auto w-full font-bold"
          >
            Verify Authenticity
          </Button>
        </form>

        {/* Quick Sample Chips for Test Evaluation */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#EDE9E2]">
          <span className="text-xs text-[#726B62] font-semibold mr-1">Sample Tokens:</span>
          {sampleTokens.map((item) => (
            <button
              key={item.token}
              type="button"
              onClick={() => {
                setTokenInput(item.token);
                performLookup(item.token);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-[#EDE9E2] hover:bg-[#F7E4D0] hover:text-[#8A3E12] text-[#4A463F] font-mono transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Official Certificate Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">

          <div className={`rounded-2xl border-2 p-6 sm:p-8 bg-white shadow-[0_4px_20px_rgba(28,26,23,0.08)] relative overflow-hidden ${
            result.status === 'VERIFIED'
              ? 'border-[#2D6A4F]'
              : result.status === 'PENDING'
              ? 'border-[#B45309]'
              : result.status === 'REJECTED'
              ? 'border-[#B91C1C]'
              : 'border-[#374151]'
          }`}>

            {/* Seal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DDD8CF]">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  result.status === 'VERIFIED'
                    ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                    : result.status === 'PENDING'
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : result.status === 'REJECTED'
                    ? 'bg-[#FEE2E2] text-[#B91C1C]'
                    : 'bg-[#F3F4F6] text-[#374151]'
                }`}>
                  {result.status === 'VERIFIED' && <CheckCircle2 className="w-8 h-8" />}
                  {result.status === 'PENDING' && <Clock className="w-8 h-8" />}
                  {result.status === 'REJECTED' && <AlertOctagon className="w-8 h-8" />}
                  {result.status === 'REVOKED' && <Ban className="w-8 h-8" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#726B62]">
                      Institutional Certificate of Verification
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#1C1A17]">
                    {result.status === 'VERIFIED' && 'Verified Academic Material'}
                    {result.status === 'PENDING' && 'Pending Academic Review'}
                    {result.status === 'REJECTED' && 'Submission Not Approved'}
                    {result.status === 'REVOKED' && 'Verification Officially Revoked'}
                  </h2>
                  <p className="text-xs font-mono font-bold text-[#8A3E12] mt-0.5">
                    Token: {result.verificationToken}
                  </p>
                </div>
              </div>

              <StatusBadge status={result.status} size="md" />
            </div>

            {/* Certificate Body & QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-[#DDD8CF]">

              {/* Document Metadata (Permitted public fields only) */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="text-xs text-[#726B62] font-semibold uppercase tracking-wider block mb-1">
                    Document Title & Course
                  </span>
                  <h3 className="text-lg font-bold text-[#1C1A17]">{result.title}</h3>
                  <p className="text-sm font-semibold text-[#8A3E12] mt-0.5">
                    {result.courseCode} — {result.courseTitle}
                  </p>
                  <p className="text-xs text-[#4A463F]">{result.departmentName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F7F5F1] p-3 rounded-xl border border-[#EDE9E2]">
                  <div>
                    <span className="text-[#726B62] block">Category:</span>
                    <span className="font-semibold text-[#1C1A17]">{result.category}</span>
                  </div>
                  <div>
                    <span className="text-[#726B62] block">Academic Term:</span>
                    <span className="font-semibold text-[#1C1A17]">{result.academicYear}</span>
                  </div>
                  <div>
                    <span className="text-[#726B62] block">Review Authority:</span>
                    <span className="font-semibold text-[#1C1A17]">{result.verifiedByTitle}</span>
                  </div>
                  <div>
                    <span className="text-[#726B62] block">Verified Timestamp:</span>
                    <span className="font-semibold text-[#1C1A17]">
                      {result.verifiedAt ? new Date(result.verifiedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {result.revocationReason && (
                  <div className="p-3 bg-[#FEE2E2] rounded-xl border border-[#FECACA] text-xs text-[#B91C1C]">
                    <strong>Revocation Rationale:</strong> {result.revocationReason}
                    {result.revokedAt && (
                      <span className="block mt-0.5 text-[11px] text-[#991B1B]">
                        Revoked on {new Date(result.revokedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* SHA-256 File Hash */}
                <div className="text-xs">
                  <span className="text-[#726B62] font-semibold block mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#8A3E12]" />
                    Cryptographic Integrity Checksum (SHA-256)
                  </span>
                  <p className="font-mono text-[11px] text-[#4A463F] bg-[#EDE9E2] p-2 rounded-lg break-all select-all">
                    {result.fileHash}
                  </p>
                </div>
              </div>

              {/* Dynamic QR Code & Stamp */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#FBF1E6] rounded-xl border border-[#F7E4D0] text-center">
                <span className="text-xs font-bold text-[#8A3E12] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  Scan to Verify
                </span>
                {result.qrCodeUrl ? (
                  <img
                    src={result.qrCodeUrl}
                    alt={`QR Code for ${result.verificationToken}`}
                    className="w-36 h-36 bg-white p-2 rounded-lg border border-[#DDD8CF] shadow-xs"
                  />
                ) : (
                  <div className="w-36 h-36 bg-white flex items-center justify-center border border-[#DDD8CF] rounded-lg">
                    <QrCode className="w-12 h-12 text-[#726B62]" />
                  </div>
                )}
                <p className="text-[10px] text-[#726B62] mt-2 font-mono">
                  {result.verificationToken}
                </p>
              </div>

            </div>

            {/* Certificate Footer / Actions */}
            <div className="flex items-center justify-between pt-4 flex-wrap gap-2">
              <p className="text-[11px] text-[#726B62]">
                Official institutional verification under the TuStudyHub academic integrity framework.
              </p>

              {canRevoke && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRevokeModalOpen(true)}
                  leftIcon={<Ban className="w-3.5 h-3.5" />}
                >
                  Revoke Verification
                </Button>
              )}
            </div>

          </div>

          {/* Privacy & SRS Scope Compliance Card */}
          <div className="p-4 rounded-xl bg-[#EDE9E2] border border-[#DDD8CF] text-xs text-[#4A463F] space-y-1">
            <p className="font-bold text-[#1C1A17]">Public Verification Privacy Safeguards</p>
            <p>
              In compliance with TuStudyHub privacy specifications, public verification displays curriculum metadata and tamper-evident hashes only. Student uploader personally identifiable information (PII) and restricted document binaries are never exposed through public verification lookups.
            </p>
          </div>

        </div>
      )}

      {/* Revocation Modal */}
      <Modal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke Document Verification"
        subtitle={`Token: ${result?.verificationToken}`}
        maxWidth="md"
      >
        <form onSubmit={handleRevokeSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C]">
            <strong>Warning:</strong> Revoking verification will immediately flag the document as RESTRICTED and invalidate its public verification seal.
          </div>

          <Textarea
            label="Mandatory Reason for Revocation"
            placeholder="Document superseded by newer syllabus, reported inaccuracy, copyright infringement..."
            rows={3}
            value={revocationReason}
            onChange={(e) => setRevocationReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
            <Button variant="secondary" size="md" type="button" onClick={() => setRevokeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              type="submit"
              isLoading={revokeLoading}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Confirm Official Revocation
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
