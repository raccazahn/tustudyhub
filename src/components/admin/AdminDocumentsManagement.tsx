import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import { StatusBadge } from '../ui/Badge.tsx';
import type { AcademicDocument } from '../../types/index.ts';

export const AdminDocumentsManagement: React.FC = () => {
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.request<any>('/api/v1/documents');
      if (res.success && res.data) setDocuments(res.data);
    } catch {
      setAlert({ text: 'Failed to load documents.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleReview = async (docId: string, decision: 'APPROVED' | 'REJECTED') => {
    let feedbackReason = '';
    if (decision === 'REJECTED') {
      feedbackReason = window.prompt('Please provide a reason for rejection (min 5 characters):') || '';
      if (!feedbackReason || feedbackReason.trim().length < 5) {
        setAlert({ text: 'Rejection requires a valid reason (min 5 characters).', type: 'error' });
        return;
      }
    }

    setActionId(docId);
    try {
      const res = await ApiClient.request(`/api/v1/documents/${docId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, feedbackReason: feedbackReason || 'Approved by Administrator.' })
      });

      if (res.success) {
        setAlert({ text: `Document successfully ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`, type: 'success' });
        fetchDocuments();
      } else {
        setAlert({ text: res.error?.message || 'Action failed.', type: 'error' });
      }
    } catch {
      setAlert({ text: 'An error occurred.', type: 'error' });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Permanently delete '${title}'? This cannot be undone.`)) return;
    setActionId(docId);
    try {
      const res = await ApiClient.request(`/api/v1/documents/${docId}`, { method: 'DELETE' });
      if (res.success) {
        setAlert({ text: 'Document permanently deleted.', type: 'success' });
        fetchDocuments();
      } else {
        setAlert({ text: res.error?.message || 'Delete failed.', type: 'error' });
      }
    } catch {
      setAlert({ text: 'An error occurred.', type: 'error' });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {alert && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
          alert.type === 'success' ? 'bg-[#E8F5E9] border-[#A3D9B5] text-[#2D6A4F]' : 'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]'
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="font-bold text-xs p-1">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#DDD8CF] shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#1C1A17]">Document Registry & Review</h3>
          <p className="text-xs text-[#726B62]">Manage, approve, or remove academic materials across the platform.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDocuments} leftIcon={<Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-xs text-[#726B62] bg-white rounded-xl border border-[#DDD8CF]">
          <Loader2 className="w-5 h-5 animate-spin text-[#8A3E12] mr-2" />
          <span>Loading registry...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#726B62] bg-white rounded-xl border border-dashed border-[#DDD8CF]">
          <FileText className="w-8 h-8 text-[#726B62] mx-auto mb-2 opacity-50" />
          <p className="font-bold text-[#1C1A17]">No documents in the system</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DDD8CF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#726B62] uppercase font-bold border-b border-[#DDD8CF]">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Course & Uploader</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9E2]">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#8A3E12] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-[#1C1A17] truncate max-w-[200px] sm:max-w-xs" title={doc.title}>{doc.title}</div>
                          <div className="text-[11px] text-[#726B62] font-mono truncate">{doc.fileName} • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1C1A17]">{doc.courseCode}</div>
                      <div className="text-[11px] text-[#726B62]">By {doc.uploaderName} ({doc.uploaderRole})</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleReview(doc.id, 'APPROVED')} disabled={actionId === doc.id} className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-[#2D6A4F] hover:bg-[#E8F5E9] transition-colors" title="Approve">
                              {actionId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleReview(doc.id, 'REJECTED')} disabled={actionId === doc.id} className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-[#B45309] hover:bg-[#FEF3C7] transition-colors" title="Reject">
                              {actionId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(doc.id, doc.title)} disabled={actionId === doc.id} className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-[#726B62] hover:text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors" title="Delete">
                          {actionId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
