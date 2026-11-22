import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Archive, Eye, CheckCircle, Trash2 } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';

export const QuizManagement: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.request<any[]>('/api/v1/quizzes');
      if (res.success) setQuizzes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
    setLoading(false);
  };

  const handleQuizAction = async (quizId: string, action: 'PUBLISHED' | 'ARCHIVED' | 'DELETED') => {
    if (action === 'DELETED' && !window.confirm('Are you sure you want to permanently delete this quiz? This cannot be undone.')) return;

    setActionLoading(quizId);
    try {
      console.log(`🔍 Attempting to ${action} quiz ID: ${quizId}`);

      let res;
      if (action === 'DELETED') {
        res = await ApiClient.request(`/api/v1/quizzes/${quizId}`, {
          method: 'DELETE'
        });
      } else {
        res = await ApiClient.request(`/api/v1/quizzes/${quizId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: action })
        });
      }

      console.log(`✅ ${action} response:`, res);

      if (res.success) {
        console.log(`✓ Successfully ${action.toLowerCase()} quiz`);
        await fetchQuizzes(); // Refresh the list
      } else {
        console.error(`❌ Failed to ${action.toLowerCase()}:`, res.error);
        alert(res.error?.message || `Failed to ${action.toLowerCase()} quiz.`);
      }
    } catch (error: any) {
      console.error(`❌ Error in ${action.toLowerCase()}:`, error);
      alert(`Failed to ${action.toLowerCase()} quiz. Check console for details.`);
    }
    setActionLoading(null);
  };

  const handleInspect = (quiz: any) => {
    alert(`Inspecting Quiz:\nTitle: ${quiz.title}\nCourse: ${quiz.courseCode}\nQuestions: ${quiz.totalQuestions || 'N/A'}`);
  };

  const filtered = quizzes.filter(q => q.title?.toLowerCase().includes(search.toLowerCase()) || q.courseCode?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingState message="Loading quizzes..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1C1A17]">Quiz Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39B91]" />
          <input type="text" placeholder="Search quizzes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="No quizzes found" description="No quizzes match your search criteria." />
      ) : (
        <div className="bg-white rounded-xl border border-[#DDD8CF] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EDE9E2]">
              <tr>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Quiz Title</th>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Course</th>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Creator</th>
                <th className="px-4 py-3 font-bold text-[#4A463F]">Status</th>
                <th className="px-4 py-3 font-bold text-[#4A463F] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9E2]">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-[#FAF8F5]">
                  <td className="px-4 py-3 font-semibold text-[#1C1A17]">{q.title}</td>
                  <td className="px-4 py-3 text-[#726B62]">{q.courseCode}</td>
                  <td className="px-4 py-3 text-[#726B62]">{q.creatorName || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      q.status === 'PUBLISHED' ? 'bg-[#E8F5E9] text-[#2D6A4F]' :
                      q.status === 'ARCHIVED' ? 'bg-[#F7F5F1] text-[#726B62]' : 'bg-[#FFF3CD] text-[#C2691D]'
                    }`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleInspect(q)} leftIcon={<Eye className="w-3 h-3" />}>Inspect</Button>
                      {q.status !== 'PUBLISHED' && (
                        <Button variant="outline" size="sm" className="!text-[#2D6A4F] !border-[#2D6A4F]" isLoading={actionLoading === q.id} onClick={() => handleQuizAction(q.id, 'PUBLISHED')} leftIcon={<CheckCircle className="w-3 h-3" />}>Approve</Button>
                      )}
                      {q.status !== 'ARCHIVED' && (
                        <Button variant="outline" size="sm" className="!text-[#C2691D]" isLoading={actionLoading === q.id} onClick={() => handleQuizAction(q.id, 'ARCHIVED')} leftIcon={<Archive className="w-3 h-3" />}>Archive</Button>
                      )}
                      <Button variant="outline" size="sm" className="!text-[#B91C1C] !border-[#B91C1C]" isLoading={actionLoading === q.id} onClick={() => handleQuizAction(q.id, 'DELETED')} leftIcon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
