import React, { useState, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, Plus, Trash2, Check } from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { QuizQuestion } from '../../types/index.ts';

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: () => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  onQuizCreated
}) => {
  const [courses, setCourses] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [error, setError] = useState('');

  // NEW: State for question limits
  const [mcqCount, setMcqCount] = useState(10);
  const [tfCount, setTfCount] = useState(5);
  const [fitbCount, setFitbCount] = useState(3);
  const [essayCount, setEssayCount] = useState(2);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      resetState();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const res = await ApiClient.request<Array<{ id: string; code: string; title: string }>>('/api/v1/courses');
      if (res.success && res.data) setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const resetState = () => {
    setSelectedCourse('');
    setUploadedFile(null);
    setQuestions([]);
    setStep('upload');
    setError('');
    setMcqCount(10);
    setTfCount(5);
    setFitbCount(3);
    setEssayCount(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setUploadedFile(file);
    setError('');
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await ApiClient.request<any>('/api/v1/quizzes/parse-document', {
        method: 'POST',
        body: formData,
        isFormData: true
      } as any);

      if (res.success && res.data) {
        console.log('✅ Total parsed questions:', res.data.length);

        // NEW: Filter questions based on user-selected limits
        const counts = { SINGLE_CHOICE: 0, TRUE_FALSE: 0, FILL_IN_THE_BLANK: 0, ESSAY: 0 };
        const limits = {
          SINGLE_CHOICE: mcqCount,
          TRUE_FALSE: tfCount,
          FILL_IN_THE_BLANK: fitbCount,
          ESSAY: essayCount
        };

        const selectedQuestions: QuizQuestion[] = [];
        for (const q of res.data) {
          const qType = q.questionType as keyof typeof counts;
          if (counts[qType] < limits[qType]) {
            selectedQuestions.push(q);
            counts[qType]++;
          }
        }

        if (selectedQuestions.length === 0) {
          setError('No questions matched your selected limits. Please adjust the counts or upload another document.');
        } else {
          console.log('✅ Questions selected for review:', selectedQuestions.length);
          setQuestions(selectedQuestions);
          setStep('review');
        }
      } else {
        setError(res.error?.message || 'Failed to parse document.');
      }
    } catch (error) {
      console.error('Parsing failed:', error);
      setError('Failed to parse document. Ensure it contains recognizable question patterns.');
    }
    setIsParsing(false);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const updateChoice = (qIndex: number, cIndex: number, field: 'text' | 'isCorrect', value: any) => {
    const newQuestions = [...questions];
    const choices = [...(newQuestions[qIndex].choices || [])];

    if (field === 'isCorrect' && value === true) {
      choices.forEach((c, i) => {
        c.isCorrect = i === cIndex;
      });
    } else {
      choices[cIndex] = { ...choices[cIndex], [field]: value };
    }

    newQuestions[qIndex] = { ...newQuestions[qIndex], choices };
    setQuestions(newQuestions);
  };

  const addChoice = (qIndex: number) => {
    const newQuestions = [...questions];
    const choices = [...(newQuestions[qIndex].choices || [])];
    choices.push({ id: `c-${Date.now()}`, text: '', isCorrect: false });
    newQuestions[qIndex] = { ...newQuestions[qIndex], choices };
    setQuestions(newQuestions);
  };

  const removeChoice = (qIndex: number, cIndex: number) => {
    const newQuestions = [...questions];
    const choices = [...(newQuestions[qIndex].choices || [])];
    choices.splice(cIndex, 1);
    newQuestions[qIndex] = { ...newQuestions[qIndex], choices };
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async () => {
    // IMPROVED: Specific error messages
    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }
    if (questions.length === 0) {
      setError('No questions were selected. Please adjust the question limits or upload another document.');
      return;
    }

    // Validate questions
    const invalidQ = questions.find(q => {
      if (q.questionType === 'SINGLE_CHOICE' && (!q.choices || q.choices.filter(c => c.isCorrect).length !== 1)) return true;
      if (q.questionType === 'TRUE_FALSE' && (!q.choices || q.choices.filter(c => c.isCorrect).length !== 1)) return true;
      if (q.questionType === 'FILL_IN_THE_BLANK' && (!q.acceptedAnswers || q.acceptedAnswers.filter(a => a.trim() !== '').length === 0)) return true;
      return false;
    });

    if (invalidQ) {
      setError('Please ensure all questions have valid correct answers configured.');
      return;
    }

    try {
      const res = await ApiClient.request('/api/v1/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          courseId: selectedCourse,
          title: 'Document-Based Assessment',
          description: 'Assessment generated from uploaded document',
          timeLimitMinutes: Math.max(10, questions.length * 2),
          passPercentage: 70,
          questions: questions
        })
      });

      if (res.success) {
        onQuizCreated();
        onClose();
      } else {
        setError(res.error?.message || 'Failed to save quiz.');
      }
    } catch (error) {
      console.error('Save failed:', error);
      setError('Failed to save quiz.');
    }
  };

  const totalLimit = mcqCount + tfCount + fitbCount + essayCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'upload' ? 'Create Course Assessment Quiz' : 'Review & Edit Questions'}
      subtitle={step === 'upload' ? 'Upload a document to parse questions' : `${questions.length} questions extracted. Review and edit before saving.`}
      maxWidth="xl"
    >
      {step === 'upload' ? (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#4A463F] mb-2">Course *</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none bg-white"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.code} - {course.title}</option>
              ))}
            </select>
          </div>

          {/* NEW: Question Limits Section */}
          <div>
            <label className="block text-xs font-bold text-[#4A463F] mb-2">Question Limits (Max to extract)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#726B62]">Multiple Choice</label>
                <input
                  type="number" min="0" max="50"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#726B62]">True / False</label>
                <input
                  type="number" min="0" max="50"
                  value={tfCount}
                  onChange={(e) => setTfCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#726B62]">Fill in the Blank</label>
                <input
                  type="number" min="0" max="50"
                  value={fitbCount}
                  onChange={(e) => setFitbCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#726B62]">Essay</label>
                <input
                  type="number" min="0" max="50"
                  value={essayCount}
                  onChange={(e) => setEssayCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#8A3E12] font-bold mt-1">Total selected: {totalLimit} questions</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A463F] mb-2">Upload Document *</label>
            <div className="border-2 border-dashed border-[#DDD8CF] rounded-xl p-6 text-center hover:border-[#8A3E12] transition-colors bg-[#FAF8F5]">
              {uploadedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#8A3E12]" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#1C1A17]">{uploadedFile.name}</p>
                      <p className="text-xs text-[#726B62]">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setUploadedFile(null); setQuestions([]); }} className="p-2 hover:bg-[#FEE2E2] rounded-full transition-colors">
                    <X className="w-4 h-4 text-[#B91C1C]" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 text-[#A39B91] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1C1A17] mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#726B62]">PDF, DOCX, or TXT (max 5MB)</p>
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
            {isParsing && (
              <div className="mt-3 p-3 bg-[#FBF1E6] border border-[#F7E4D0] rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#8A3E12] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-[#8A3E12]">Parsing document structure...</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
              <p className="text-xs text-[#991B1B]">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {questions.map((q, idx) => (
              <Card key={idx} variant="default" padding="md" className="border-l-4 border-l-[#8A3E12]">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-[#8A3E12] shrink-0">Q{idx + 1}</span>
                  <select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(idx, { questionType: e.target.value as any })}
                    className="text-xs border border-[#C4BEB4] rounded px-2 py-1 bg-white"
                  >
                    <option value="SINGLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="FILL_IN_THE_BLANK">Fill in the Blank</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>

                <textarea
                  value={q.questionText}
                  onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                  className="w-full text-sm font-semibold text-[#1C1A17] border border-[#C4BEB4] rounded-lg p-2 mb-3 focus:border-[#8A3E12] focus:outline-none resize-none"
                  rows={2}
                />

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#4A463F]">Marks:</label>
                    <input
                      type="number"
                      min="1"
                      value={q.marks || 1}
                      onChange={(e) => updateQuestion(idx, { marks: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-1 text-xs border border-[#C4BEB4] rounded focus:border-[#8A3E12] focus:outline-none"
                    />
                  </div>
                </div>

                {q.questionType === 'SINGLE_CHOICE' && (
                  <div className="space-y-2 ml-2">
                    {(q.choices || []).map((c, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${idx}-correct`}
                          checked={c.isCorrect}
                          onChange={() => updateChoice(idx, cIdx, 'isCorrect', true)}
                          className="accent-[#8A3E12]"
                        />
                        <input
                          type="text"
                          value={c.text}
                          onChange={(e) => updateChoice(idx, cIdx, 'text', e.target.value)}
                          className="flex-1 text-xs border border-[#C4BEB4] rounded px-2 py-1.5 focus:border-[#8A3E12] focus:outline-none"
                          placeholder={`Option ${cIdx + 1}`}
                        />
                        <button onClick={() => removeChoice(idx, cIdx)} className="p-1 text-[#B91C1C] hover:bg-[#FEE2E2] rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {c.isCorrect && <Check className="w-4 h-4 text-[#2D6A4F]" />}
                      </div>
                    ))}
                    <button onClick={() => addChoice(idx)} className="flex items-center gap-1 text-xs font-bold text-[#8A3E12] hover:underline mt-1">
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                )}

                {q.questionType === 'TRUE_FALSE' && (
                  <div className="flex gap-4 ml-2">
                    {['True', 'False'].map((opt, cIdx) => (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${idx}-tf`}
                          checked={(q.choices?.[cIdx]?.isCorrect) || false}
                          onChange={() => {
                            const newChoices = [{ id: 'tf-true', text: 'True', isCorrect: cIdx === 0 }, { id: 'tf-false', text: 'False', isCorrect: cIdx === 1 }];
                            updateQuestion(idx, { choices: newChoices });
                          }}
                          className="accent-[#8A3E12]"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.questionType === 'FILL_IN_THE_BLANK' && (
                  <div className="ml-2 space-y-1">
                    <label className="text-xs font-bold text-[#4A463F]">Accepted Answers (comma separated):</label>
                    <input
                      type="text"
                      value={(q.acceptedAnswers || []).join(', ')}
                      onChange={(e) => updateQuestion(idx, { acceptedAnswers: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full text-xs border border-[#C4BEB4] rounded px-2 py-1.5 focus:border-[#8A3E12] focus:outline-none"
                      placeholder="e.g., 42, forty-two, 42.0"
                    />
                  </div>
                )}

                {q.questionType === 'ESSAY' && (
                  <div className="ml-2 space-y-1">
                    <label className="text-xs font-bold text-[#4A463F]">Marking Instructions for Lecturers:</label>
                    <textarea
                      value={q.markingInstructions || ''}
                      onChange={(e) => updateQuestion(idx, { markingInstructions: e.target.value })}
                      className="w-full text-xs border border-[#C4BEB4] rounded px-2 py-1.5 focus:border-[#8A3E12] focus:outline-none resize-none"
                      rows={3}
                      placeholder="e.g., Award 2 marks for mentioning 'photosynthesis', 1 mark for correct grammar."
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
              <p className="text-xs text-[#991B1B]">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#EDE9E2]">
            <Button variant="outline" size="md" onClick={() => setStep('upload')}>
              Cancel & Upload New
            </Button>
            <Button variant="clayFill" size="md" onClick={handleSaveQuiz}>
              Save Quiz to Database
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
