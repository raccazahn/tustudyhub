import React, { useState, useEffect } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';

export const AuditReports: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Adjust endpoint to your actual audit log endpoint
        const res = await ApiClient.request<any[]>('/api/v1/admin/audit-logs');
        if (res.success) setLogs(res.data || []);
      } catch (error) {
        console.error('Audit logs endpoint may not be fully implemented yet:', error);
        // Fallback mock for demonstration if endpoint is missing
        setLogs([]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <LoadingState message="Loading audit records..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1C1A17]">Audit Reports</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39B91]" />
          <input type="text" placeholder="Search actions or actors..." className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none" />
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon="clipboardList" title="No audit records found" description="Administrative actions will be logged here." />
      ) : (
        <Card variant="clayTint" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EDE9E2]">
                <tr>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Timestamp</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Actor</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Action</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Resource</th>
                  <th className="px-4 py-3 font-bold text-[#4A463F]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9E2]">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]">
                    <td className="px-4 py-3 text-[#726B62]">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-[#1C1A17]">{log.actorName || 'System'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-[#F7F5F1] text-[#4A463F] text-[10px] font-bold">{log.action}</span></td>
                    <td className="px-4 py-3 text-[#726B62]">{log.entityType} #{log.entityId?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[#726B62] truncate max-w-xs">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
