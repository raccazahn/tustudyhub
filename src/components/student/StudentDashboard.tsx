/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Student Personal Dashboard
 * Features learning overview, quiz attempts, progress tracking, and relevant academic materials.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
  BarChart3,
  ArrowRight,
  FileText,
  Sparkles,
  Calendar,
  History,
  HardDrive,
  Download,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { AppLogoIcon } from '../common/AppLogo.tsx';
import { ForumView } from '../forum/ForumView.tsx';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getAnonymousQuizAttempts, clearAllAnonymousQuizAttempts } from '../../lib/anonymousStorage.ts';
import type { QuizAttempt, AcademicDocument } from '../../types/index.ts';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedDocs, setRecommendedDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await ApiClient.request<any[]>('/api/v1/documents/recommended');
        if (res.success && res.data) setRecommendedDocs(res.data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    fetchRecommendations();
  }, []);

  // Local anonymous attempts detection & transfer
  const [pendingLocalAttempts, setPendingLocalAttempts] = useState<QuizAttempt[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  // Attempt detail modal
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  const fetchStudentData = async () => {
    setLoading(true);
    const [attemptsRes, materialsRes] = await Promise.all([
      ApiClient.request<QuizAttempt[]>('/api/v1/quizzes/attempts/me'),
      ApiClient.request<AcademicDocument[]>('/api/v1/documents?limit=10')
    ]);

    if (attemptsRes.success && attemptsRes.data) setAttempts(attemptsRes.data);

    if (materialsRes.success && materialsRes.data) {
      let docs = materialsRes.data;
      if (user?.assignedCourseCodes && user.assignedCourseCodes.length > 0) {
        const assignedDocs = docs.filter(d => user.assignedCourseCodes!.includes(d.courseCode));
        if (assignedDocs.length >= 5) {
          setRecentMaterials(assignedDocs.slice(0, 5));
        } else {
          const otherDocs = docs.filter(d => !user.assignedCourseCodes!.includes(d.courseCode));
          setRecentMaterials([...assignedDocs, ...otherDocs].slice(0, 5));
        }
      } else {
        setRecentMaterials(docs.slice(0, 5));
      }
    }
    setLoading(false);
  };

  const checkLocalAnonymousAttempts = async () => {
    const locals = await getAnonymousQuizAttempts();
    setPendingLocalAttempts(locals);
  };

  useEffect(() => {
    fetchStudentData();
    checkLocalAnonymousAttempts();
  }, []);

  const handleTransferLocalAttempts = async () => {
    if (pendingLocalAttempts.length === 0) return;
    setIsTransferring(true);
    setTransferMessage(null);

    const res = await ApiClient.request<{ transferredCount: number }>('/api/v1/quizzes/attempts/transfer', {
      method: 'POST',
      body: JSON.stringify({ attempts: pendingLocalAttempts })
    });

    setIsTransferring(false);
    if (res.success && res.data) {
      await clearAllAnonymousQuizAttempts();
      setPendingLocalAttempts([]);
      setTransferMessage(`Successfully imported ${res.data.transferredCount} practice attempt(s) into your account.`);
      fetchStudentData();
    } else {
      alert(res.error?.message || 'Failed to transfer local attempts.');
    }
  };

  const handleDismissLocalAttempts = () => {
    setPendingLocalAttempts([]);
  };

  const stats = {
    totalQuizzes: attempts.length,
    passedQuizzes: attempts.filter(a => a.passed).length,
    avgScore: attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.scorePercentage, 0) / attempts.length)
      : 0,
    materialsViewed: recentMaterials.length
  };

  const coursePerformance: Record<string, { total: number; passed: number; avgScore: number; scores: number[] }> = {};
  for (const att of attempts) {
    if (!coursePerformance[att.courseCode]) {
      coursePerformance[att.courseCode] = { total: 0, passed: 0, avgScore: 0, scores: [] };
    }
    const entry = coursePerformance[att.courseCode];
    entry.total += 1;
    if (att.passed) entry.passed += 1;
    entry.scores.push(att.scorePercentage);
  }
  for (const key of Object.keys(coursePerformance)) {
    const entry = coursePerformance[key];
    entry.avgScore = Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length);
  }

  return (
    <div className="space-y-6">

      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#DDD8CF]">
        <div className="flex items-center gap-3">
          <AppLogoIcon size={48} className="rounded-xl shadow-xs hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight">
              Learning Progress & Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#726B62] mt-0.5">
              Track your course assessments, verified materials, and academic achievements.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-bold border border-[#A3D9B5]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Institutional Student Verified</span>
        </div>
      </div>

      {/* Local Anonymous Progress Transfer Notification */}
      {pendingLocalAttempts.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FBF1E6] border border-[#F7E4D0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#F7E4D0] flex items-center justify-center text-[#8A3E12] shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#1C1A17]">
                Transfer Local Practice Attempts ({pendingLocalAttempts.length})
              </h3>
              <p className="text-xs text-[#726B62] leading-relaxed">
                We detected {pendingLocalAttempts.length} quiz attempt(s) completed on this browser prior to signing in. Would you like to transfer them into your verified student account?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="primary"
              size="sm"
              isLoading={isTransferring}
              onClick={handleTransferLocalAttempts}
              className="text-xs font-bold"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Transfer to Account
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDismissLocalAttempts}
              className="text-xs font-bold"
            >
              Keep Local Only
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Success Notice */}
      {transferMessage && (
        <div className="p-3.5 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{transferMessage}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Quizzes Taken</span>
          <p className="text-2xl font-black text-[#1C1A17]">{stats.totalQuizzes}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#2D6A4F]">
            <Trophy className="w-3 h-3" />
            <span>{stats.passedQuizzes} Successes</span>
          </div>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Average Score</span>
          <p className="text-2xl font-black text-[#8A3E12]">{stats.avgScore}%</p>
          <span className="text-[10px] text-[#726B62]">Overall proficiency</span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Recent Resources</span>
          <p className="text-2xl font-black text-[#C2691D]">{stats.materialsViewed}</p>
          <span className="text-[10px] text-[#726B62]">Viewed this term</span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Study Streak</span>
          <p className="text-2xl font-black text-[#1C1A17]">0 Days</p>
          <span className="text-[10px] text-[#726B62]">Keep it up!</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Quiz Attempts */}
        <div className="lg:col-span-2 space-y-6">

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
                <History className="w-4 h-4 text-[#8A3E12]" />
                <span>Recent Assessment Attempts</span>
              </h2>
              <span className="text-xs text-[#726B62] font-semibold">{attempts.length} total recorded</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2].map(i => <Card key={i} className="h-20 animate-pulse bg-[#EDE9E2]" />)
              ) : attempts.length === 0 ? (
                <Card variant="default" padding="lg" className="text-center bg-white border-dashed">
                  <p className="text-xs text-[#726B62]">No quiz attempts recorded yet. Start practicing to see your progress!</p>
                </Card>
              ) : (
                attempts.map(attempt => (
                  <Card
                    key={attempt.id}
                    variant="interactive"
                    padding="md"
                    onClick={() => setSelectedAttempt(attempt)}
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#EDE9E2] text-[#8A3E12] border border-[#DDD8CF]">
                          {attempt.courseCode}
                        </span>
                        <span className="text-[10px] text-[#726B62]">{new Date(attempt.completedAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-[#726B62] hidden sm:inline">Version {attempt.quizVersionNumber}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C1A17] truncate">{attempt.quizTitle}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-black ${attempt.passed ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                        {attempt.scorePercentage}%
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${attempt.passed ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                        {attempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Course-Related Proficiency Breakdown */}
          {Object.keys(coursePerformance).length > 0 && (
            <Card variant="default" padding="md" className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#8A3E12]" />
                <span>Course Assessment Mastery</span>
              </h3>
              <div className="space-y-3 pt-1">
                {Object.entries(coursePerformance).map(([code, data]) => (
                  <div key={code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#1C1A17]">{code}</span>
                      <span className="text-[#8A3E12]">{data.avgScore}% Avg ({data.passed}/{data.total} Passed)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EDE9E2] overflow-hidden">
                      <div
                        className={`h-full ${data.avgScore >= 70 ? 'bg-[#2D6A4F]' : 'bg-[#C2691D]'}`}
                        style={{ width: `${Math.min(100, data.avgScore)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* Right Column: Recommendations & Forum */}
        <div className="space-y-6">

          {/* SMART DISCOVERY SECTION */}
          <div className="bg-white p-5 rounded-xl border border-[#DDD8CF] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EDE9E2] pb-3">
              <h3 className="text-sm font-bold text-[#1C1A17] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8A3E12]" />
                <span>Recommended for You</span>
              </h3>
            </div>
            {recommendedDocs.length === 0 ? (
              <p className="text-xs text-[#726B62]">View documents or complete quizzes to get personalized recommendations.</p>
            ) : (
              <div className="space-y-2">
                {recommendedDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#EDE9E2] text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1C1A17] truncate">{doc.title}</p>
                      <p className="text-[11px] text-[#726B62]">{doc.courseCode} • Score: {doc.score.toFixed(1)}</p>
                    </div>
                    <BookOpen className="w-4 h-4 text-[#8A3E12] shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Q&A FORUM SECTION */}
          <div className="bg-white p-5 rounded-xl border border-[#DDD8CF] shadow-xs">
            <ForumView courseId={undefined} />
          </div>

          {/* Suggested / Recent Materials (Fallback) */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#4A463F] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8A3E12]" />
              <span>Recent Resources</span>
            </h2>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-[#EDE9E2] animate-pulse" />)
              ) : recentMaterials.length === 0 ? (
                <p className="text-xs text-[#726B62] italic">Complete course registrations to see recommendations.</p>
              ) : (
                recentMaterials.map(doc => (
                  <div key={doc.id} className="p-3 bg-white border border-[#DDD8CF] rounded-xl hover:border-[#8A3E12]/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold px-1 py-0.25 rounded bg-[#F7F5F1] text-[#726B62] border border-[#EDE9E2]">
                        {doc.category}
                      </span>
                      <span className="text-[9px] font-bold text-[#8A3E12]">{doc.courseCode}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#1C1A17] truncate group-hover:text-[#8A3E12]">{doc.title}</h4>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => {
                window.location.hash = '#library';
              }}
            >
              Explore All Documents
            </Button>
          </div>

        </div>
      </div>

      {/* Attempt Inspection Modal */}
      {selectedAttempt && (
        <Modal
          isOpen={Boolean(selectedAttempt)}
          onClose={() => setSelectedAttempt(null)}
          title="Assessment Attempt Record"
          subtitle={`${selectedAttempt.courseCode} — ${selectedAttempt.quizTitle}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border text-center ${
              selectedAttempt.passed ? 'bg-[#E8F5E9] border-[#2D6A4F] text-[#2D6A4F]' : 'bg-[#FEE2E2] border-[#B91C1C] text-[#B91C1C]'
            }`}>
              <div className="text-3xl font-mono font-black">{selectedAttempt.scorePercentage}%</div>
              <div className="text-xs font-bold uppercase mt-1">
                {selectedAttempt.passed ? 'Official Pass' : 'Did Not Pass'}
              </div>
              <p className="text-xs mt-1 text-[#4A463F]">
                {selectedAttempt.correctAnswersCount} of {selectedAttempt.totalQuestions} questions correct
              </p>
            </div>

            <div className="space-y-2 text-xs bg-[#FAF9F5] p-3 rounded-xl border border-[#EDE9E2]">
              <div className="flex justify-between py-1 border-b border-[#EDE9E2]">
                <span className="text-[#726B62]">Quiz Version Snapshot:</span>
                <span className="font-bold text-[#1C1A17]">Version {selectedAttempt.quizVersionNumber} (Immutable)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EDE9E2]">
                <span className="text-[#726B62]">Completed On:</span>
                <span className="font-bold text-[#1C1A17]">{new Date(selectedAttempt.completedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EDE9E2]">
                <span className="text-[#726B62]">Time Spent:</span>
                <span className="font-bold text-[#1C1A17]">{Math.round(selectedAttempt.timeSpentSeconds / 60)} min {selectedAttempt.timeSpentSeconds % 60} sec</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#726B62]">Status in Student Transcript:</span>
                <span className="font-bold text-[#2D6A4F]">Verified & Synchronized</span>
              </div>
            </div>

            <div className="p-3 bg-[#FBF1E6] rounded-xl border border-[#F7E4D0] text-[11px] text-[#78350F] leading-relaxed">
              <strong>Quiz Version Integrity:</strong> This attempt remains linked to the exact published quiz version that you completed. Editing or updating the quiz will never alter your historical score or original question context.
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedAttempt(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
