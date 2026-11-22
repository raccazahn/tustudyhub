import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';

interface ForumViewProps {
  courseId?: string;
}

export const ForumView: React.FC<ForumViewProps> = ({ courseId }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const url = courseId ? `/api/v1/forum/questions?courseId=${courseId}` : '/api/v1/forum/questions';
      const res = await ApiClient.request<any[]>(url);
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
    setLoading(false);
  };

  const createQuestion = async () => {
    if (!newTitle || !newBody || !courseId) return;
    try {
      const res = await ApiClient.request('/api/v1/forum/questions', {
        method: 'POST',
        body: JSON.stringify({ courseId, title: newTitle, body: newBody })
      });
      if (res.success) {
        setNewTitle('');
        setNewBody('');
        setShowCreateForm(false);
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  if (loading) {
    return <LoadingState message="Loading forum discussions..." variant="skeleton" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#8A3E12]" />
          <span>Course Q&A Forum</span>
        </h2>
        {courseId && (
          <Button
            variant="clayFill"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Ask Question
          </Button>
        )}
      </div>

      {showCreateForm && courseId && (
        <Card variant="default" padding="md" className="space-y-3 bg-[#FAF8F5]">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Question title..."
            className="w-full px-3 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12] focus:outline-none"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Describe your question in detail..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12] focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <Button variant="clayFill" size="sm" onClick={createQuestion}>
              Submit Question
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {questions.length === 0 ? (
          <EmptyState
            icon="search"
            title="No questions yet"
            description={courseId ? "Be the first to ask a question about this course!" : "Select a course to see relevant discussions."}
          />
        ) : (
          questions.map(q => (
            <Card key={q.id} variant="interactive" padding="md">
              <div className="flex items-start gap-3">
                {q.is_solved ? (
                  <CheckCircle className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#C2691D] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1C1A17]">{q.title}</h3>
                  <p className="text-xs text-[#726B62] mt-1 line-clamp-2">{q.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#A39B91]">
                    <span>Asked by {q.authorname || q.authorName}</span>
                    <span>•</span>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
