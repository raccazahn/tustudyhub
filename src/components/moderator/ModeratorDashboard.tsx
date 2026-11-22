/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Moderator Dashboard
 * Oversees content reports, integrity flags, and moderation history.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  History,
  Flag,
  AlertTriangle,
  Clock,
  Filter,
  ArrowRight,
  Ban
} from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { ContentReport } from '../../types/index.ts';

export const ModeratorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED' | 'ALL'>('PENDING');

  const fetchReports = async () => {
    setLoading(true);
    const res = await ApiClient.request<ContentReport[]>('/api/v1/admin/reports');
    if (res.success && res.data) {
      setReports(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolveReport = async (reportId: string, resolution: 'RESOLVED' | 'DISMISSED', restrictDoc: boolean) => {
    const res = await ApiClient.request(`/api/v1/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, restrictDocument: restrictDoc })
    });
    if (res.success) {
      fetchReports();
    }
  };

  const filteredReports = reports.filter(r => activeFilter === 'ALL' || r.status === activeFilter);
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;

  // Recent Actions: Last 4 resolved or dismissed reports, sorted by resolution date (or creation date as fallback)
  const recentActions = reports
    .filter(r => r.status === 'RESOLVED' || r.status === 'DISMISSED')
    .sort((a, b) => {
      const dateA = a.resolvedAt ? new Date(a.resolvedAt).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.resolvedAt ? new Date(b.resolvedAt).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div className="space-y-6">

      {/* Moderator Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#DDD8CF]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight">
            Moderation Oversight
          </h1>
          <p className="text-xs sm:text-sm text-[#726B62] mt-0.5">
            Resolve community integrity reports and manage content verification flags.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-bold border border-[#FDE68A]">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Active Content Moderator</span>
        </div>
      </div>

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="default" padding="sm" className="bg-[#B91C1C]/5 border-[#B91C1C]/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">Pending Flags</span>
          <p className="text-2xl font-black text-[#B91C1C]">{pendingCount}</p>
          <span className="text-[10px] text-[#726B62]">Requires investigation</span>
        </Card>

        <Card variant="default" padding="sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Resolved This Week</span>
          <p className="text-2xl font-black text-[#1C1A17]">{reports.filter(r => r.status === 'RESOLVED').length}</p>
        </Card>

        <Card variant="default" padding="sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Dismissed Flags</span>
          <p className="text-2xl font-black text-[#726B62]">{reports.filter(r => r.status === 'DISMISSED').length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content: Reports Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#B91C1C]" />
              <span>Community Report Queue</span>
            </h2>

            <div className="flex rounded-lg bg-[#EDE9E2] p-1 border border-[#DDD8CF]">
              {(['PENDING', 'RESOLVED', 'DISMISSED', 'ALL'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeFilter === f ? 'bg-white text-[#1C1A17] shadow-xs' : 'text-[#726B62] hover:text-[#1C1A17]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <Card className="h-32 animate-pulse bg-[#EDE9E2]" />
            ) : filteredReports.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center bg-white border-dashed">
                <CheckCircle2 className="w-8 h-8 text-[#2D6A4F] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#726B62]">No reports found for the selected filter.</p>
              </Card>
            ) : (
              filteredReports.map(rep => (
                <Card key={rep.id} variant="default" padding="md" className="space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[9px] px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                          {rep.reasonCategory}
                        </span>
                        <span className="text-[10px] font-bold text-[#8A3E12]">{rep.courseCode}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C1A17] truncate">{rep.documentTitle}</h3>
                      <p className="text-[10px] text-[#726B62]">
                        Reported by {rep.reporterName} • {new Date(rep.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        rep.status === 'PENDING'
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                          : rep.status === 'RESOLVED'
                          ? 'bg-[#E8F5E9] text-[#2D6A4F] border-[#A3D9B5]'
                          : 'bg-[#F7F5F1] text-[#726B62] border-[#EDE9E2]'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#EDE9E2] text-xs text-[#4A463F] leading-relaxed">
                    <strong className="text-[#1C1A17]">Incident Detail:</strong> {rep.details}
                  </div>

                  {rep.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[10px] font-bold"
                        onClick={() => handleResolveReport(rep.id, 'DISMISSED', false)}
                      >
                        Dismiss Report
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-[10px] font-bold"
                        onClick={() => handleResolveReport(rep.id, 'RESOLVED', true)}
                      >
                        Restrict Content & Resolve
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Recent Moderation Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
            <History className="w-4 h-4 text-[#8A3E12]" />
            <span>Recent Actions</span>
          </h2>

          {recentActions.length === 0 ? (
            <Card variant="default" padding="md" className="text-center bg-[#F7F5F1] border-dashed">
              <p className="text-xs text-[#726B62]">No recent moderation actions recorded.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentActions.map(action => (
                <Card key={action.id} variant="default" padding="sm" className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    action.status === 'RESOLVED' ? 'bg-[#E8F5E9] text-[#2D6A4F]' : 'bg-[#F7F5F1] text-[#726B62]'
                  }`}>
                    {action.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${
                        action.status === 'RESOLVED' ? 'bg-[#E8F5E9] text-[#2D6A4F]' : 'bg-[#F7F5F1] text-[#726B62]'
                      }`}>
                        {action.status}
                      </span>
                      <span className="text-[9px] text-[#726B62]">
                        {action.resolvedAt ? new Date(action.resolvedAt).toLocaleDateString() : new Date(action.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#1C1A17] truncate">{action.documentTitle}</h4>
                    <p className="text-[10px] text-[#726B62] truncate">{action.courseCode} • {action.reasonCategory}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Context Card */}
          <div className="p-4 bg-[#FBF1E6] rounded-2xl border border-[#F7E4D0] space-y-3">
            <div className="flex items-center gap-2 text-[#8A3E12]">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">Moderator Note</h3>
            </div>
            <p className="text-[11px] text-[#4A463F] leading-relaxed">
              Resolving a report as "Resolved" will automatically restrict the document from public view. Dismissed reports leave the document accessible.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
