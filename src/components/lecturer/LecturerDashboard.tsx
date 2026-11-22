import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import type { AcademicDocument } from '../../types/index.ts';

export const LecturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLecturerData();
  }, []);

  const fetchLecturerData = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.request<AcademicDocument[]>('/api/v1/documents?limit=20');
      if (res.success && res.data) {
        const myDocs = res.data.filter(d => d.uploaderId === user?.id);
        setDocuments(myDocs);
      }
    } catch (error) {
      console.error('Failed to fetch lecturer data:', error);
    }
    setLoading(false);
  };

  const stats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'APPROVED').length,
    pending: documents.filter(d => d.status === 'PENDING').length,
    rejected: documents.filter(d => d.status === 'REJECTED').length
  };

  if (loading) {
    return <LoadingState message="Loading your contribution overview..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#DDD8CF]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight">
            Lecturer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#726B62] mt-0.5">
            Manage your academic contributions and track approval status.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-bold border border-[#A3D9B5]">
          <Award className="w-3.5 h-3.5" />
          <span>Verified Contributor</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Total Submissions</span>
          <p className="text-2xl font-black text-[#1C1A17]">{stats.total}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#726B62]">
            <FileText className="w-3 h-3" />
            <span>All documents</span>
          </div>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Approved</span>
          <p className="text-2xl font-black text-[#2D6A4F]">{stats.approved}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#2D6A4F]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Live to students</span>
          </div>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Pending Review</span>
          <p className="text-2xl font-black text-[#C2691D]">{stats.pending}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#C2691D]">
            <Clock className="w-3 h-3" />
            <span>Awaiting moderation</span>
          </div>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Rejected</span>
          <p className="text-2xl font-black text-[#B91C1C]">{stats.rejected}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#B91C1C]">
            <AlertCircle className="w-3 h-3" />
            <span>Requires revision</span>
          </div>
        </Card>
      </div>

      {/* Recent Submissions */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#8A3E12]" />
          <span>Recent Submissions</span>
        </h2>

        {documents.length === 0 ? (
          <EmptyState
            icon="document"
            title="No submissions yet"
            description="Start contributing academic materials to your assigned courses."
          />
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 5).map(doc => (
              <Card key={doc.id} variant="interactive" padding="md" className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'APPROVED' ? 'bg-[#E8F5E9] text-[#2D6A4F]' :
                      doc.status === 'PENDING' ? 'bg-[#FFF3CD] text-[#C2691D]' :
                      'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}>
                      {doc.status}
                    </span>
                    <span className="text-[10px] text-[#726B62]">{doc.courseCode}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1C1A17] truncate">{doc.title}</h3>
                  <p className="text-[11px] text-[#726B62] mt-0.5">
                    {doc.category} • {new Date(doc.createdAt || doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <FileText className="w-5 h-5 text-[#8A3E12] shrink-0" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
