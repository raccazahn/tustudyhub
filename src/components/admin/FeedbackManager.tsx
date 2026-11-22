/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Feedback & User Voice Manager
 * Allows administrators to review user submissions, update status, and add internal notes.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, CheckCircle2, Clock, AlertCircle, Check, X, Filter, Search, Tag, Shield } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { Feedback, FeedbackStatus, FeedbackCategory } from '../../types/index.ts';

export const FeedbackManager: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    let url = '/api/v1/feedback?';
    if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
    if (categoryFilter !== 'ALL') url += `category=${categoryFilter}&`;
    if (searchQuery.trim()) url += `q=${encodeURIComponent(searchQuery.trim())}&`;

    const res = await ApiClient.request<Feedback[]>(url);
    if (res.success && res.data) {
      setFeedbackList(res.data);
      if (selectedItem) {
        const refreshed = res.data.find(f => f.id === selectedItem.id);
        if (refreshed) {
          setSelectedItem(refreshed);
          setAdminNotes(refreshed.adminNotes || '');
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedback();
  };

  const handleSelectFeedback = (item: Feedback) => {
    setSelectedItem(item);
    setAdminNotes(item.adminNotes || '');
    setSuccessMsg(null);
  };

  const handleUpdateStatus = async (item: Feedback, newStatus: FeedbackStatus) => {
    setUpdatingStatus(item.id);
    const res = await ApiClient.request(`/api/v1/feedback/${item.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: newStatus,
        adminNotes: adminNotes.trim() || item.adminNotes
      })
    });

    setUpdatingStatus(null);
    if (res.success) {
      setSuccessMsg(`Status updated to ${newStatus}.`);
      fetchFeedback();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleSaveNotesOnly = async (item: Feedback) => {
    const res = await ApiClient.request(`/api/v1/feedback/${item.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: item.status,
        adminNotes: adminNotes.trim()
      })
    });

    if (res.success) {
      setSuccessMsg('Internal administrative notes saved.');
      fetchFeedback();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const statusColors: Record<FeedbackStatus, { bg: string; text: string; border: string }> = {
    NEW: { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
    UNDER_REVIEW: { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]' },
    PLANNED: { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]', border: 'border-[#DDD6FE]' },
    RESOLVED: { bg: 'bg-[#E8F5E9]', text: 'text-[#2D6A4F]', border: 'border-[#A3D9B5]' },
    REJECTED: { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', border: 'border-[#FECACA]' }
  };

  return (
    <div className="space-y-6">

      {/* Header and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#DDD8CF] pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#8A3E12]" />
            <span>User Feedback & Support Triage</span>
          </h2>
          <p className="text-xs text-[#726B62] mt-0.5">
            Institutional review queue for user suggestions, past paper requests, and platform bug reports.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'NEW', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? 'bg-[#8A3E12] text-white shadow-xs'
                  : 'bg-white border border-[#DDD8CF] text-[#726B62] hover:border-[#8A3E12]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Feedback Items List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Feedback List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#726B62] bg-white rounded-xl border border-[#DDD8CF]">
              Loading feedback entries...
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#726B62] bg-white rounded-xl border border-dashed border-[#DDD8CF]">
              No feedback items found matching filter criteria.
            </div>
          ) : (
            feedbackList.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const color = statusColors[item.status];
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectFeedback(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FBF1E6] border-[#8A3E12] ring-1 ring-[#8A3E12] shadow-xs'
                      : 'bg-white border-[#DDD8CF] hover:border-[#8A3E12]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-[#8A3E12] uppercase tracking-wider">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>

                    {item.rating && (
                      <div className="flex items-center gap-0.5 text-[#D97706]">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#D97706]" />
                        ))}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-[#1C1A17] mb-1">{item.title}</h3>
                  <p className="text-[11px] text-[#726B62] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#726B62] pt-2 mt-2 border-t border-[#EDE9E2]">
                    <span>From: <strong>{item.userName || 'Anonymous'}</strong> ({item.userRole || 'VISITOR'})</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Feedback Detail & Admin Actions (5 cols) */}
        <div className="lg:col-span-5">
          {selectedItem ? (
            <Card variant="default" padding="md" className="space-y-4 sticky top-24 border-[#8A3E12]/30 shadow-sm">
              <div className="space-y-2 border-b border-[#EDE9E2] pb-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[selectedItem.status].bg} ${statusColors[selectedItem.status].text}`}>
                    {selectedItem.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#726B62]">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1C1A17] leading-tight">
                  {selectedItem.title}
                </h3>
                <div className="text-[11px] text-[#726B62]">
                  Submitted by <strong className="text-[#1C1A17]">{selectedItem.userName}</strong>
                  {selectedItem.userEmail && <span> ({selectedItem.userEmail})</span>}
                </div>
              </div>

              {/* Full Description */}
              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EDE9E2] text-xs text-[#4A463F] leading-relaxed">
                {selectedItem.description}
              </div>

              {/* Internal Notes Editor */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A463F] flex items-center justify-between">
                  <span>Internal Administrative Notes</span>
                  {selectedItem.reviewedByName && (
                    <span className="text-[10px] text-[#726B62] font-normal">
                      Last edited by {selectedItem.reviewedByName}
                    </span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record internal resolution steps, staff assignments, or student follow-up notes..."
                  className="w-full text-xs p-2.5 rounded-lg bg-white border border-[#DDD8CF] text-[#1C1A17] focus:outline-none focus:ring-1 focus:ring-[#8A3E12]"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => handleSaveNotesOnly(selectedItem)}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-2 pt-2 border-t border-[#EDE9E2]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4A463F] block">
                  Update Triage Status:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-[10px] font-bold"
                    onClick={() => handleUpdateStatus(selectedItem, 'UNDER_REVIEW')}
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-[10px] font-bold"
                    onClick={() => handleUpdateStatus(selectedItem, 'PLANNED')}
                  >
                    Mark Planned
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="text-[10px] font-bold bg-[#2D6A4F] hover:bg-[#1B4332]"
                    onClick={() => handleUpdateStatus(selectedItem, 'RESOLVED')}
                  >
                    Resolve Feedback
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-[10px] font-bold text-[#B91C1C] border-[#FECACA] hover:bg-[#FEE2E2]"
                    onClick={() => handleUpdateStatus(selectedItem, 'REJECTED')}
                  >
                    Decline / Reject
                  </Button>
                </div>
              </div>

              {successMsg && (
                <div className="p-2 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-[11px] text-[#2D6A4F] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{successMsg}</span>
                </div>
              )}
            </Card>
          ) : (
            <Card variant="default" padding="lg" className="text-center text-xs text-[#726B62] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#C4BEB4] mx-auto" />
              <p className="font-bold text-[#1C1A17]">No Feedback Selected</p>
              <p>Select any submission from the triage list on the left to review details, record staff notes, or update resolution status.</p>
            </Card>
          )}
        </div>

      </div>

    </div>
  );
};
