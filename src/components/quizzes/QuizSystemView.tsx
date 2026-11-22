/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Quiz Assessment System View
 * Course-linked multiple-choice quizzes, version tracking, and automated scoring.
 */

import {
    ArrowRight,
    CheckCircle2,
    GraduationCap,
    HardDrive,
    History,
    Plus,
    Sparkles,
    UserPlus
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
    getAnonymousLearningStats,
    getStorageDiagnostics
} from '../../lib/anonymousStorage.ts';
import { ApiClient } from '../../lib/api.ts';
import type { Quiz, QuizAttempt } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { EmptyState, LoadingSkeleton } from '../ui/EmptyState.tsx';
import { Modal } from '../ui/Modal.tsx';
import { QuizCreatorModal } from './QuizCreatorModal.tsx';
import { QuizTakerModal } from './QuizTakerModal.tsx';

interface QuizSystemViewProps {
  initialCourseFilter?: string | null;
  onOpenAuthModal: () => void;
}

export const QuizSystemView: React.FC<QuizSystemViewProps> = ({
  initialCourseFilter,
  onOpenAuthModal
}) => {
  const { user, role } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [takerOpen, setTakerOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);

  // History Modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [historyQuiz, setHistoryQuiz] = useState<Quiz | null>(null);
  const [isViewingLocalHistory, setIsViewingLocalHistory] = useState(false);

  // Anonymous Local Stats
  const [anonymousStats, setAnonymousStats] = useState<{
    totalAttempts: number;
    passedCount: number;
    avgScore: number;
    distinctCourses: string[];
    lastPracticedAt: string | null;
  } | null>(null);
  const [storageEngine, setStorageEngine] = useState<string>('IndexedDB');

  const fetchQuizzes = async () => {
    setLoading(true);
    let url = '/api/v1/quizzes';
    if (initialCourseFilter) url += `?courseId=${initialCourseFilter}`;

    const res = await ApiClient.request<Quiz[]>(url);
    if (res.success && res.data) {
      setQuizzes(res.data);
    }
    setLoading(false);
  };

  const loadLocalStats = async () => {
    if (!user) {
      const stats = await getAnonymousLearningStats();
      setAnonymousStats(stats);
      const diag = await getStorageDiagnostics();
      setStorageEngine(diag.engine);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [initialCourseFilter, user]);

  const handleStartQuiz = (quiz: Quiz) => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    setActiveQuiz(quiz);
    setTakerOpen(true);
  };

  const handleOpenHistory = async (quiz?: Quiz) => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    setHistoryQuiz(quiz || null);

    setIsViewingLocalHistory(false);
    const url = quiz ? `/api/v1/quizzes/${quiz.id}/attempts` : `/api/v1/quizzes/attempts/me`;
    const res = await ApiClient.request<QuizAttempt[]>(url);
    if (res.success && res.data) {
      setAttempts(res.data);
    } else {
      setAttempts([]);
    }
    setHistoryOpen(true);
  };

  const canCreateQuiz = role === 'LECTURER' || role === 'ADMINISTRATOR';

  return (
    <div className="space-y-6">

      {/* Quiz Hero Banner */}
      <div className="bg-gradient-to-r from-[#EDE9E2] via-[#F7F5F1] to-[#FBF1E6] rounded-2xl p-6 sm:p-8 border border-[#DDD8CF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E4D0] text-[#8A3E12] text-xs font-bold tracking-wide uppercase mb-3 border border-[#D98A3D]/40">
            <Sparkles className="w-3.5 h-3.5 text-[#C2691D]" />
            <span>Course Assessments & Knowledge Testing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight mb-2">
            Practice Multiple-Choice Quizzes
          </h1>
          <p className="text-sm text-[#4A463F] leading-relaxed">
            Test syllabus comprehension, practice exam question patterns, and review verified academic explanations.
          </p>
        </div>

        {canCreateQuiz && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreatorOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0 font-bold"
          >
            Create Course Quiz
          </Button>
        )}
      </div>

      {/* Anonymous Local Learning Progress Banner (When practiced locally on device) */}
      {!user && anonymousStats && anonymousStats.totalAttempts > 0 && (
        <Card variant="default" padding="md" className="bg-[#FAF9F5] border-[#DDD8CF] space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBF1E6] border border-[#F7E4D0] flex items-center justify-center text-[#8A3E12] shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1C1A17]">Anonymous Device Progress</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE9E2] text-[#8A3E12] border border-[#DDD8CF]">
                    {storageEngine}
                  </span>
                </div>
                <p className="text-xs text-[#726B62] leading-relaxed">
                  Saved on this device only. Not synchronized across devices. Clearing browser data will delete this history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenHistory()}
                className="text-xs font-bold"
                leftIcon={<History className="w-3.5 h-3.5" />}
              >
                View Local History ({anonymousStats.totalAttempts})
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAuthModal}
                className="text-xs font-bold"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Save to Account
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDE9E2] text-center text-xs">
            <div className="p-2 rounded-lg bg-white border border-[#EDE9E2]">
              <span className="text-[10px] font-bold uppercase text-[#726B62] block">Attempts</span>
              <span className="font-black text-sm text-[#1C1A17]">{anonymousStats.totalAttempts}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-[#EDE9E2]">
              <span className="text-[10px] font-bold uppercase text-[#726B62] block">Success Rate</span>
              <span className="font-black text-sm text-[#2D6A4F]">
                {Math.round((anonymousStats.passedCount / anonymousStats.totalAttempts) * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-[#EDE9E2]">
              <span className="text-[10px] font-bold uppercase text-[#726B62] block">Avg Proficiency</span>
              <span className="font-black text-sm text-[#8A3E12]">{anonymousStats.avgScore}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Quizzes List */}
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="No quizzes available for this course"
          description="Course lecturers publish multiple-choice assessments for exam practice."
          actionLabel={canCreateQuiz ? 'Create Assessment Quiz' : undefined}
          onAction={() => setCreatorOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-[#EDE9E2] text-[#8A3E12] border border-[#DDD8CF]">
                    {quiz.courseCode}
                  </span>
                  <span className="text-xs text-[#726B62] font-semibold">
                    Version {quiz.currentVersion}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#1C1A17] mb-1.5">{quiz.title}</h3>
                <p className="text-xs text-[#726B62] line-clamp-2 mb-4">
                  {quiz.description || 'Comprehensive multiple-choice assessment designed for student self-study.'}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#F7F5F1] border border-[#EDE9E2] mb-4 text-xs">
                  <div>
                    <span className="text-[#726B62] block text-[10px] uppercase font-bold">Questions</span>
                    <span className="font-bold text-[#1C1A17]">{quiz.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-[#726B62] block text-[10px] uppercase font-bold">Time Limit</span>
                    <span className="font-bold text-[#1C1A17]">{quiz.timeLimitMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-[#726B62] block text-[10px] uppercase font-bold">Pass Mark</span>
                    <span className="font-bold text-[#2D6A4F]">{quiz.passPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EDE9E2] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenHistory(quiz)}
                  className="text-xs text-[#8A3E12] hover:underline font-semibold flex items-center gap-1 min-h-[44px] cursor-pointer"
                  title={user ? 'View your account attempt history' : 'Sign in to view quiz results'}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{user ? 'My Attempts' : 'Sign In for Results'}</span>
                </button>

                {user ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleStartQuiz(quiz)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="font-bold"
                  >
                    Take Quiz
                  </Button>
                ) : (
                  <Button variant="primary" size="md" onClick={onOpenAuthModal} className="font-bold">
                    Sign In to Take Quiz
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Taker Modal */}
      <QuizTakerModal
        quiz={activeQuiz}
        isOpen={takerOpen}
        onClose={() => setTakerOpen(false)}
        onAttemptCompleted={() => {
          fetchQuizzes();
          loadLocalStats();
        }}
      />

      {/* Creator Modal */}
      <QuizCreatorModal
        isOpen={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onQuizCreated={fetchQuizzes}
      />

      {/* Past Attempts History Modal */}
      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Assessment Attempt History"
        subtitle={
          historyQuiz
            ? `${historyQuiz.courseCode} — ${historyQuiz.title}`
            : 'All Course Assessments'
        }
        maxWidth="md"
      >
        <div className="space-y-4">

          {/* Storage Context Banner */}
          {isViewingLocalHistory ? (
            <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HardDrive className="w-4 h-4 text-[#B45309]" />
                <span>Local Anonymous Storage ({storageEngine})</span>
              </div>
              <p className="text-[11px] text-[#78350F] leading-relaxed">
                These attempts are saved only on this device. They are <strong>not synchronized</strong> across devices. Clearing your browser cache or switching devices will remove this local history.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Official Institutional Progress • Synchronized with Student Account</span>
            </div>
          )}

          {/* Attempts List */}
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#726B62] bg-[#FAF9F5] rounded-xl border border-dashed border-[#DDD8CF] p-4">
              {isViewingLocalHistory
                ? 'No local practice attempts recorded on this device yet. Click "Take Quiz" to begin practicing.'
                : 'You have not recorded any attempts for this quiz yet.'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    att.passed ? 'bg-[#E8F5E9]/60 border-[#A3D9B5]' : 'bg-[#FEE2E2]/60 border-[#FECACA]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-sm text-[#1C1A17]">
                        {att.scorePercentage}%
                      </span>
                      <span className={`text-xs font-bold ${att.passed ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                        {att.passed ? 'Passed' : 'Failed'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/80 border border-[#DDD8CF] text-[#8A3E12]">
                        {att.courseCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#726B62]">
                      {new Date(att.completedAt).toLocaleDateString()} • Version {att.quizVersionNumber} • {att.correctAnswersCount}/{att.totalQuestions} correct
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-[#726B62]">
                    <div>{Math.round(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s</div>
                    <span className="text-[9px] uppercase font-bold text-[#8A3E12]">
                      {isViewingLocalHistory ? 'Local Only' : 'Synced'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Account Transfer Call to Action for Visitors */}
          {isViewingLocalHistory && (
            <div className="p-3.5 rounded-xl bg-[#FBF1E6] border border-[#F7E4D0] space-y-2 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A3E12]">
                <UserPlus className="w-4 h-4" />
                <span>Want to keep your scores across all your devices?</span>
              </div>
              <p className="text-[11px] text-[#78350F] leading-relaxed">
                Sign in or register a free account. You can safely transfer these local practice scores directly into your student learning dashboard.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setHistoryOpen(false);
                    onOpenAuthModal();
                  }}
                  className="text-xs font-bold"
                >
                  Sign In or Register
                </Button>
              </div>
            </div>
          )}

        </div>
      </Modal>

    </div>
  );
};
