/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Quiz Taker & Automated Marking Modal
 * Enforces immutable version snapshots, timer countdown, and detailed review breakdown.
 * Supports: SINGLE_CHOICE, TRUE_FALSE, FILL_IN_THE_BLANK, ESSAY
 */

import React, { useState, useEffect } from 'react';
import {
  Timer, CheckCircle2, XCircle, Award, AlertCircle, Check, HardDrive, UserPlus, Info
} from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { saveAnonymousQuizAttempt } from '../../lib/anonymousStorage.ts';
import type { Quiz, QuizVersionSnapshot, QuizAttempt } from '../../types/index.ts';

interface QuizTakerModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onAttemptCompleted?: () => void;
}

export const QuizTakerModal: React.FC<QuizTakerModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onAttemptCompleted
}) => {
  const { user } = useAuth();
  const [version, setVersion] = useState<QuizVersionSnapshot | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymousAttempt, setIsAnonymousAttempt] = useState(false);
  const [storageEngineName, setStorageEngineName] = useState<string>('IndexedDB');
  const [invitationDismissed, setInvitationDismissed] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen && quiz) {
      setReviewResult(null);
      setCurrentQuestionIndex(0);
      setUserAnswers({});

      ApiClient.request<{ quiz: Quiz; versionSnapshot: QuizVersionSnapshot }>(`/api/v1/quizzes/${quiz.id}`)
        .then((res) => {
          if (res.success && res.data) {
            setVersion(res.data.versionSnapshot);
            setTimeLeftSeconds((res.data.versionSnapshot.timeLimitMinutes || 10) * 60);
          }
        });
    }
  }, [isOpen, quiz]);

  useEffect(() => {
    if (!isOpen || reviewResult || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, reviewResult, timeLeftSeconds]);

  const handleAnswer = (questionId: string, value: string | string[]) => {
    if (reviewResult) return; // Read-only during review
    setUserAnswers((prev) => {
      const normalizedValue = Array.isArray(value) ? value : [value];
      return { ...prev, [questionId]: normalizedValue };
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !version || isSubmitting) return;
    setIsSubmitting(true);

    const totalTimeSpent = (version.timeLimitMinutes * 60) - timeLeftSeconds;

    const res = await ApiClient.request<{
      attempt: QuizAttempt;
      isAnonymous?: boolean;
      review: typeof reviewResult;
    }>(`/api/v1/quizzes/${quiz.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        versionId: version.id,
        answers: userAnswers,
        timeSpentSeconds: Math.max(15, totalTimeSpent)
      })
    });

    setIsSubmitting(false);
    if (res.success && res.data) {
      setReviewResult(res.data.review);
      const isAnon = Boolean(res.data.isAnonymous || !user);
      setIsAnonymousAttempt(isAnon);
      setInvitationDismissed(false);

      if (isAnon && res.data.attempt) {
        const storageResult = await saveAnonymousQuizAttempt(res.data.attempt);
        setStorageEngineName(storageResult.engine);
      }

      if (onAttemptCompleted) onAttemptCompleted();
    } else {
      alert(res.error?.message || 'Failed to submit quiz attempt.');
    }
  };

  if (!quiz) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNavigateAuth = (target: 'login' | 'register') => {
    onClose();
    window.location.hash = `#${target}`;
  };

  const currentQ = version?.questions[currentQuestionIndex];
  const totalQ = version?.questions.length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quiz.title}
      subtitle={`${quiz.courseCode} • Version ${quiz.currentVersion}`}
      maxWidth="xl"
    >
      <div className="space-y-5">

        {/* Active Quiz Header / Timer */}
        {!reviewResult && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F5F1] border border-[#DDD8CF]">
            <div className="text-xs font-bold text-[#4A463F]">
              Question {currentQuestionIndex + 1} of {totalQ}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
              timeLeftSeconds < 120 ? 'bg-[#FEE2E2] text-[#B91C1C] animate-pulse' : 'bg-[#EDE9E2] text-[#8A3E12]'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>
        )}

        {/* REVIEW RESULTS VIEW */}
        {reviewResult ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className={`p-6 rounded-2xl border-2 text-center ${
              reviewResult.passed ? 'bg-[#E8F5E9] border-[#2D6A4F] text-[#2D6A4F]' : 'bg-[#FEE2E2] border-[#B91C1C] text-[#B91C1C]'
            }`}>
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-white shadow-xs mb-3">
                {reviewResult.passed ? <Award className="w-8 h-8 text-[#2D6A4F]" /> : <AlertCircle className="w-8 h-8 text-[#B91C1C]" />}
              </div>
              <h3 className="text-2xl font-black">{reviewResult.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}</h3>
              <p className="text-3xl font-black my-1 font-mono">{reviewResult.scorePercentage}%</p>
              <p className="text-xs font-semibold">
                {reviewResult.correctCount} of {reviewResult.totalQuestions} questions answered correctly (Required: {reviewResult.passPercentage}%)
              </p>
            </div>

            {isAnonymousAttempt ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5">
                  <div className="flex items-start gap-2">
                    <HardDrive className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Anonymous Progress Stored Locally ({storageEngineName})</span>
                      <p className="text-[11px] text-[#78350F] leading-relaxed">
                        This attempt is saved locally. Clearing browser data will make this history unavailable.
                      </p>
                    </div>
                  </div>
                </div>
                {!invitationDismissed && (
                  <div className="p-4 rounded-xl bg-[#FBF1E6] border border-[#F7E4D0] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A3E12]">
                          <UserPlus className="w-4 h-4" />
                          <span>Track Your Progress Across Devices</span>
                        </div>
                        <p className="text-xs text-[#4A463F] leading-relaxed">
                          Create a free TuStudyHub account or sign in to save your results.
                        </p>
                      </div>
                      <button type="button" onClick={() => setInvitationDismissed(true)} className="text-xs text-[#726B62] hover:text-[#1C1A17] p-1 font-bold">×</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button variant="primary" size="sm" onClick={() => handleNavigateAuth('register')} className="text-xs font-bold">Create Free Account</Button>
                      <Button variant="secondary" size="sm" onClick={() => handleNavigateAuth('login')} className="text-xs font-bold">Sign In</Button>
                      <button type="button" onClick={() => setInvitationDismissed(true)} className="text-xs text-[#726B62] hover:underline px-2 py-1">Dismiss</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">Institutional Account Attempt Recorded • Cloud Synced</span>
              </div>
            )}

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#726B62]">Detailed Answers & Academic Explanations</h4>

              {reviewResult.questionBreakdown.map((q: any, idx: number) => (
                <div key={q.questionId} className={`p-4 rounded-xl border ${q.isCorrect ? 'bg-white border-[#A3D9B5]' : 'bg-[#FFF8F8] border-[#FECACA]'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-[#8A3E12]">Question {idx + 1}</span>
                    <span className={`text-xs font-bold flex items-center gap-1 ${q.isCorrect ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                      {q.isCorrect ? <><CheckCircle2 className="w-4 h-4" /> Correct</> : <><XCircle className="w-4 h-4" /> Incorrect</>}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#1C1A17] mb-3">{q.questionText}</p>

                  {/* Render Choices for SC/TF, or Text for FITB/Essay */}
                  {q.choices && q.choices.length > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      {q.choices.map((c: any) => {
                        const isUserChoice = q.userSelected.includes(c.id);
                        const isCorrectChoice = q.correctChoices.includes(c.id);
                        let choiceClass = 'bg-[#F7F5F1] text-[#4A463F] border-[#DDD8CF]';
                        if (isCorrectChoice) choiceClass = 'bg-[#E8F5E9] text-[#2D6A4F] border-[#2D6A4F] font-semibold';
                        else if (isUserChoice && !isCorrectChoice) choiceClass = 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C] font-semibold';

                        return (
                          <div key={c.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${choiceClass}`}>
                            <span>{c.text}</span>
                            {isCorrectChoice && <Check className="w-4 h-4 text-[#2D6A4F]" />}
                            {isUserChoice && !isCorrectChoice && <XCircle className="w-4 h-4 text-[#B91C1C]" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2 mb-3">
                      <div className="p-3 rounded-lg border bg-[#F7F5F1] border-[#DDD8CF]">
                        <span className="text-[10px] font-bold uppercase text-[#726B62]">Your Answer:</span>
                        <p className="text-sm text-[#1C1A17] mt-1 whitespace-pre-wrap">{q.userSelected[0] || 'No answer provided'}</p>
                      </div>
                      {q.correctChoices && q.correctChoices.length > 0 && (
                        <div className="p-3 rounded-lg border bg-[#E8F5E9] border-[#A3D9B5]">
                          <span className="text-[10px] font-bold uppercase text-[#2D6A4F]">Accepted Answer(s):</span>
                          <p className="text-sm text-[#2D6A4F] mt-1">{q.correctChoices.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-[#EDE9E2] rounded-lg text-xs text-[#4A463F]">
                    <strong>Curriculum Explanation:</strong> {q.explanation || 'Manual grading required for this question type.'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
              <Button variant="primary" size="md" onClick={onClose}>Finish Review</Button>
            </div>
          </div>
        ) : currentQ ? (
          /* ACTIVE TAKING VIEW */
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-[#8A3E12] uppercase tracking-wider block mb-1">
                {currentQ.questionType === 'SINGLE_CHOICE' ? 'Select the single best answer' :
                 currentQ.questionType === 'TRUE_FALSE' ? 'Select True or False' :
                 currentQ.questionType === 'FILL_IN_THE_BLANK' ? 'Type your answer in the blank' :
                 'Write your essay response below'}
              </span>
              <p className="text-base font-bold text-[#1C1A17] leading-snug">{currentQ.questionText}</p>
            </div>

            {/* SINGLE CHOICE */}
            {currentQ.questionType === 'SINGLE_CHOICE' && (
              <div className="space-y-2.5">
                {currentQ.choices?.map((choice: any) => {
                  const selected = (userAnswers[currentQ.id] || []).includes(choice.id);
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleAnswer(currentQ.id, choice.id)}
                      className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer min-h-[48px] ${
                        selected ? 'bg-[#FBF1E6] border-[#8A3E12] text-[#8A3E12] shadow-xs' : 'bg-white border-[#DDD8CF] hover:border-[#C4BEB4] hover:bg-[#F7F5F1] text-[#1C1A17]'
                      }`}
                    >
                      <span>{choice.text}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ml-2 ${
                        selected ? 'bg-[#8A3E12] border-[#8A3E12] text-white' : 'border-[#C4BEB4]'
                      }`}>
                        {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TRUE / FALSE */}
            {currentQ.questionType === 'TRUE_FALSE' && (
              <div className="flex gap-4">
                {['True', 'False'].map((opt) => {
                  const val = opt.toLowerCase();
                  const selected = (userAnswers[currentQ.id] || []).includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAnswer(currentQ.id, val)}
                      className={`flex-1 p-3.5 rounded-xl border text-center text-sm font-medium transition-all cursor-pointer min-h-[48px] ${
                        selected ? 'bg-[#FBF1E6] border-[#8A3E12] text-[#8A3E12] shadow-xs' : 'bg-white border-[#DDD8CF] hover:border-[#C4BEB4] hover:bg-[#F7F5F1] text-[#1C1A17]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* FILL IN THE BLANK */}
            {currentQ.questionType === 'FILL_IN_THE_BLANK' && (
              <input
                type="text"
                value={(userAnswers[currentQ.id] || [''])[0]}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[#DDD8CF] text-sm focus:border-[#8A3E12] focus:outline-none bg-white"
                placeholder="Type your answer here..."
              />
            )}

            {/* ESSAY */}
            {currentQ.questionType === 'ESSAY' && (
              <textarea
                value={(userAnswers[currentQ.id] || [''])[0]}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[#DDD8CF] text-sm focus:border-[#8A3E12] focus:outline-none resize-none bg-white"
                rows={6}
                placeholder="Write your essay response here..."
              />
            )}

            {/* Question Stepper Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#EDE9E2]">
              <Button
                variant="secondary"
                size="md"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              >
                Previous
              </Button>

              {currentQuestionIndex < totalQ - 1 ? (
                <Button variant="primary" size="md" onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
                  Next Question
                </Button>
              ) : (
                <Button variant="clayFill" size="md" onClick={handleSubmitQuiz} isLoading={isSubmitting}>
                  Submit & Score Attempt
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
