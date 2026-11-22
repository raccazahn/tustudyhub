/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Core TypeScript Definitions
 * Tagline: Learn • Share • Verify
 */

export type UserRole = 'VISITOR' | 'STUDENT' | 'LECTURER' | 'MODERATOR' | 'ADMINISTRATOR';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  must_change_password?: boolean;
  requestedRole?: UserRole;
  departmentId?: string;
  departmentName?: string;
  contributorBio?: string;
  assignedCourseCodes?: string[];
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface College {
  id: string;
  code: string; // e.g. "CST"
  name: string; // e.g. "College of Science and Technology"
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  departmentCount?: number;
  courseCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  collegeId?: string;
  collegeName?: string;
  code: string;
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
  courseCount?: number;
  documentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type Semester = 'FIRST' | 'SECOND';

export interface Course {
  id: string;
  collegeId?: string;
  collegeName?: string;
  departmentId: string;
  departmentName?: string;
  code: string; // e.g. "CSC 201"
  title: string; // e.g. "Data Structures and Algorithms"
  level: number; // e.g. 200
  semester: Semester;
  description: string;
  status?: 'ACTIVE' | 'INACTIVE';
  documentCount: number;
  quizCount: number;
  assignedLecturers?: Array<{ id: string; fullName: string; email: string }>;
  createdAt: string;
  updatedAt?: string;
}

export type DocumentCategory =
  | 'LECTURE_NOTE'
  | 'PAST_QUESTION'
  | 'STUDY_GUIDE'
  | 'LAB_MANUAL'
  | 'SYLLABUS'
  | 'OTHER';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESTRICTED';

export type AccessLevel = 'PUBLIC' | 'STUDENT_ONLY';

export interface AcademicDocument {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  departmentName: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  title: string;
  description: string;
  category: DocumentCategory;
  academicYear: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string; // SHA-256 integrity hash
  status: DocumentStatus;
  accessLevel: AccessLevel;
  downloadCount: number;
  verificationToken: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'REVOKED';

export interface DocumentVerification {
  id: string;
  documentId: string;
  verificationToken: string;
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  revocationReason?: string;
  revokedBy?: string;
  revokedByName?: string;
  revokedAt?: string;
}

export interface PublicVerificationResult {
  isAuthentic: boolean;
  verificationToken: string;
  documentId: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  departmentName: string;
  category: string;
  academicYear: string;
  fileHash: string;
  stampedFileHash?: string;
  status: VerificationStatus;
  verifiedAt?: string;
  verifiedByTitle?: string;
  revocationReason?: string;
  revokedAt?: string;
  qrCodeUrl?: string;
}

export interface DocumentReview {
  id: string;
  documentId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  decision: 'APPROVED' | 'REJECTED';
  feedbackReason: string;
  createdAt: string;
}

export type ReportCategory = 'COPYRIGHT' | 'INACCURATE' | 'INAPPROPRIATE' | 'DUPLICATE' | 'LOW_QUALITY';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ContentReport {
  id: string;
  documentId: string;
  documentTitle: string;
  courseCode: string;
  reporterId?: string;
  reporterName?: string;
  reasonCategory: ReportCategory;
  details: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type QuizStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK' | 'ESSAY';

export interface QuizChoice {
  id: string;
  text: string;
  isCorrect?: boolean; // Hidden during active quiz taking!
}

export interface QuizQuestion {
  marks?: number;
  acceptedAnswers?: string[];
  markingInstructions?: string;
  id: string;
  questionText: string;
  questionType: QuestionType;
  orderIndex: number;
  explanation: string;
  choices: QuizChoice[];
}

export interface Quiz {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  timeLimitMinutes: number; // e.g. 15 mins
  passPercentage: number; // e.g. 70%
  status: QuizStatus;
  currentVersion: number;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizVersionSnapshot {
  id: string;
  quizId: string;
  versionNumber: number;
  title: string;
  courseCode: string;
  courseTitle: string;
  timeLimitMinutes: number;
  passPercentage: number;
  questions: QuizQuestion[];
  publishedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizVersionId: string;
  quizVersionNumber: number;
  quizTitle: string;
  courseCode: string;
  userId: string;
  userName: string;
  scorePercentage: number;
  totalQuestions: number;
  correctAnswersCount: number;
  passed: boolean;
  completedAt: string;
  timeSpentSeconds: number;
  userAnswers: Record<string, string[]>; // questionId -> selected choiceIds
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export type FeedbackCategory = 'PLATFORM' | 'COURSE_CONTENT' | 'VERIFICATION' | 'BUG' | 'FEATURE_REQUEST' | 'OTHER';
export type FeedbackStatus = 'NEW' | 'UNDER_REVIEW' | 'PLANNED' | 'RESOLVED' | 'REJECTED';

export interface Feedback {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
  category: FeedbackCategory;
  title: string;
  description: string;
  rating?: number; // 1 to 5
  status: FeedbackStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AiQuizValidationReport {
  isValid: boolean;
  totalGenerated: number;
  validQuestionsCount: number;
  errors: string[];
  warnings: string[];
  courseCode: string;
  topic: string;
  difficulty: 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED';
}

// ============================================================================
// Stage 7: Notification System Types
// ============================================================================

export type NotificationType =
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'QUIZ_PUBLISHED'
  | 'QUIZ_RESULT_AVAILABLE'
  | 'CONTRIBUTOR_APPROVED'
  | 'CONTRIBUTOR_REJECTED'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId?: string; // Undefined for global announcements
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface TuCollege {
  id: string;
  name: string;
}

export interface TuDepartment {
  id: string;
  name: string;
  collegeId: string;
}

export type AcademicStatus = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
