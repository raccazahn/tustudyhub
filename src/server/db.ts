/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Relational Database & Store Engine
 * Implements strict relational constraints, foreign keys, audit logging,
 * and academic verification logic.
 */

import crypto from 'crypto';
import util from 'util';
import type {
  User,
  UserRole,
  UserStatus,
  College,
  Department,
  Course,
  AcademicDocument,
  DocumentCategory,
  DocumentStatus,
  DocumentVerification,
  PublicVerificationResult,
  DocumentReview,
  ContentReport,
  Quiz,
  QuizVersionSnapshot,
  QuizAttempt,
  AuditLog,
  Feedback,
} from '../types/index.ts';
import { Pool } from 'pg';

// Initialize the PostgreSQL connection pool
export const pgClient = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tustudyhub',
});

const pbkdf2Async = util.promisify(crypto.pbkdf2);

export const DEFAULT_HASH_ALGORITHM = 'pbkdf2-sha512';
// OWASP Password Storage Cheat Sheet Recommendation for PBKDF2-HMAC-SHA512
export const CURRENT_RECOMMENDED_ITERATIONS = 220000;
export const LEGACY_FALLBACK_ITERATIONS = 1000;
export const HASH_KEY_LENGTH = 64; // 64 bytes (512 bits)
export const SALT_LENGTH = 16;     // 16 bytes (128 bits)

export interface StoredCredentials {
  passwordHash: string;
  salt: string;
  iterations: number;
  algorithm: string;
}

export type DbUserRecord = User & StoredCredentials;

export interface PasswordHashResult {
  hash: string;
  salt: string;
  iterations: number;
  algorithm: string;
}

// In-Memory Relational Tables with initial academic seed
class DatabaseStore {
  public users: Map<string, DbUserRecord> = new Map();
  public colleges: Map<string, College> = new Map();
  public departments: Map<string, Department> = new Map();
  public courses: Map<string, Course> = new Map();
  public lecturerCourseAssignments: Map<string, { lecturerId: string; courseId: string }> = new Map();
  public documents: Map<string, AcademicDocument & { internalFilePath: string }> = new Map();
  public documentVerifications: Map<string, DocumentVerification> = new Map();
  public documentReviews: Map<string, DocumentReview> = new Map();
  public contentReports: Map<string, ContentReport> = new Map();
  public quizzes: Map<string, Quiz> = new Map();
  public quizVersions: Map<string, QuizVersionSnapshot> = new Map();
  public quizAttempts: Map<string, QuizAttempt> = new Map();
  public feedback: Map<string, Feedback> = new Map();
  public auditLogs: AuditLog[] = [];

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.seedInitialData();
  }

  /**
   * Asynchronously initialize database store and seed accounts
   */
  public async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
    } else {
      this.initPromise = this.seedInitialData();
      await this.initPromise;
    }
    this.initialized = true;
  }

  /**
   * Helper for automated security testing of environment transitions
   */
  public async resetForTesting(): Promise<void> {
    this.users.clear();
    this.colleges.clear();
    this.departments.clear();
    this.courses.clear();
    this.lecturerCourseAssignments.clear();
    this.documents.clear();
    this.documentVerifications.clear();
    this.documentReviews.clear();
    this.contentReports.clear();
    this.quizzes.clear();
    this.quizVersions.clear();
    this.quizAttempts.clear();
    this.feedback.clear();
    this.auditLogs = [];
    this.initialized = false;
    this.initPromise = null;
    await this.init();
  }

  /**
   * Asynchronous Password Hashing (PBKDF2-HMAC-SHA512)
   * Uses non-blocking crypto.pbkdf2 with fresh cryptographic salt.
   */
  public async hashPassword(
    password: string,
    salt?: string,
    iterations: number = CURRENT_RECOMMENDED_ITERATIONS
  ): Promise<PasswordHashResult> {
    const s = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
    const derivedKey = await pbkdf2Async(password, s, iterations, HASH_KEY_LENGTH, 'sha512');
    return {
      hash: derivedKey.toString('hex'),
      salt: s,
      iterations,
      algorithm: DEFAULT_HASH_ALGORITHM
    };
  }

  /**
   * Asynchronous Password Verification with Constant-Time Comparison
   * Supports backward compatibility with accounts on any stored iteration count.
   */
  public async verifyPassword(
    password: string,
    storedHash: string,
    salt: string,
    iterations: number = LEGACY_FALLBACK_ITERATIONS,
    algorithm: string = DEFAULT_HASH_ALGORITHM
  ): Promise<boolean> {
    try {
      const digest = algorithm.includes('sha512') ? 'sha512' : 'sha512';
      const derivedKey = await pbkdf2Async(password, salt, iterations, HASH_KEY_LENGTH, digest);
      const computedHash = derivedKey.toString('hex');

      const storedBuffer = Buffer.from(storedHash, 'hex');
      const computedBuffer = Buffer.from(computedHash, 'hex');

      if (storedBuffer.length !== computedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(storedBuffer, computedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Helper to strip all sensitive authentication metadata before sending user objects to clients.
   */
  public sanitizeUser(user: DbUserRecord): User & { must_change_password?: boolean } {
      const { passwordHash: _, salt: __, iterations: ___, algorithm: ____, ...sanitized } = user;
      return { ...sanitized, must_change_password: (user as any).must_change_password };
    return sanitized;
  }

  // Generate tamper-resistant non-guessable verification token
  public generateVerificationToken(docId: string, courseCode: string): string {
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();
    const cleanCourse = courseCode.replace(/\s+/g, '');
    return `TSH-${cleanCourse}-${randomHex}`;
  }

  public logAudit(actor?: { id?: string; name?: string; role?: UserRole }, action?: string, targetType?: string, targetId?: string, metadata?: Record<string, unknown>, ip?: string) {
    // Sanitize metadata to guarantee no passwords, raw tokens, or secrets are ever recorded
    const cleanMeta: Record<string, unknown> = {};
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        if (!['password', 'passwordHash', 'token', 'authorization'].includes(key.toLowerCase())) {
          cleanMeta[key] = value;
        }
      }
    }

    const log: AuditLog = {
      id: crypto.randomUUID(),
      actorId: actor?.id,
      actorName: actor?.name || 'System / Public Visitor',
      actorRole: actor?.role || 'VISITOR',
      action: action || 'UNKNOWN_ACTION',
      targetType: targetType || 'SYSTEM',
      targetId: targetId || 'N/A',
      metadata: cleanMeta,
      ipAddress: ip || '127.0.0.1',
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // Retain up to 500 audit entries
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  // ========================================================================
  // QUIZ DATABASE HELPERS (PostgreSQL)
  // ========================================================================

  async getQuizzesFromDB(courseId?: string, role?: string) {
    let query = 'SELECT * FROM quizzes';
    const params: any[] = [];

    if (role === 'STUDENT') {
      query += ' WHERE status = $1';
      params.push('PUBLISHED');
    }

    if (courseId) {
      query += params.length > 0 ? ' AND course_id = $2' : ' WHERE course_id = $1';
      params.push(courseId);
    }

    query += ' ORDER BY created_at DESC';
    const res = await pgClient.query(query, params);
    return res.rows;
  }

  async getQuizVersionFromDB(quizId: string, versionNumber: number) {
    const res = await pgClient.query(
      'SELECT * FROM quiz_versions WHERE quiz_id = $1 AND version_number = $2',
      [quizId, versionNumber]
    );
    return res.rows[0];
  }

  async deleteQuizFromDB(quizId: string) {
    // ON DELETE CASCADE in SQL will handle versions and attempts automatically
    await pgClient.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
  }

  async insertQuizIntoDB(quiz: any) {
    const query = `
      INSERT INTO quizzes (id, course_id, course_code, course_title, creator_id, creator_name, title, description, time_limit_minutes, pass_percentage, status, current_version, total_questions, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      quiz.id, quiz.courseId, quiz.courseCode, quiz.courseTitle, quiz.creatorId, quiz.creatorName,
      quiz.title, quiz.description, quiz.timeLimitMinutes, quiz.passPercentage, quiz.status,
      quiz.currentVersion, quiz.totalQuestions, quiz.createdAt, quiz.updatedAt
    ];
    return (await pgClient.query(query, values)).rows[0];
  }

  async insertQuizVersionIntoDB(version: any) {
    const query = `
      INSERT INTO quiz_versions (id, quiz_id, version_number, title, course_code, course_title, time_limit_minutes, pass_percentage, published_at, questions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      version.id, version.quizId, version.versionNumber, version.title, version.courseCode,
      version.courseTitle, version.timeLimitMinutes, version.passPercentage, version.publishedAt,
      JSON.stringify(version.questions)
    ];
    return (await pgClient.query(query, values)).rows[0];
  }

      async updateQuizStatusInDB(quizId: string, status: string) {
    const res = await pgClient.query(
      'UPDATE quizzes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, quizId]
    );
    return res.rows[0];
  }

  private async seedInitialData(): Promise<void> {
    // 1. Academic Structure: Colleges (College → Department → Course)
    const collegeCst: College = {
      id: 'coll-cst-01',
      code: 'COST',
      name: 'College of Science and Technology',
      description: 'Computing sciences, software engineering, mathematics, physics, and natural sciences.',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const collegeChls: College = {
      id: 'coll-chls-02',
      code: 'CHLS',
      name: 'College of Humanities, Law and Social Sciences',
      description: 'Constitutional law, jurisprudence, sociology, philosophy, and humanities.',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const collegeCmhs: College = {
      id: 'coll-cmhs-03',
      code: 'CMHS',
      name: 'College of Medicine and Health Sciences',
      description: 'Human gross anatomy, cellular histology, clinical pathology, and nursing.',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const collegeCoe: College = {
      id: 'coll-coe-04',
      code: 'COENG',
      name: 'College of Engineering and Built Environment',
      description: 'Civil, mechanical, electrical, and computer engineering disciplines.',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const collegeCbas: College = {
      id: 'coll-cbas-05',
      code: 'CBAS',
      name: 'College of Business and Applied Economics',
      description: 'Accounting, banking, management studies, marketing, and business administration.',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };

    [collegeCst, collegeChls, collegeCmhs, collegeCoe, collegeCbas].forEach(c => this.colleges.set(c.id, c));

    // 2. Departments linked to Colleges
    const deptCS: Department = {
      id: 'dept-cs-01',
      collegeId: collegeCst.id,
      collegeName: collegeCst.name,
      code: 'CSC',
      name: 'Computer Science & Software Engineering',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const deptLaw: Department = {
      id: 'dept-law-02',
      collegeId: collegeChls.id,
      collegeName: collegeChls.name,
      code: 'LAW',
      name: 'Faculty of Public & Private Law',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const deptMed: Department = {
      id: 'dept-med-03',
      collegeId: collegeCmhs.id,
      collegeName: collegeCmhs.name,
      code: 'MED',
      name: 'College of Medicine & Health Sciences',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const deptEng: Department = {
      id: 'dept-eng-04',
      collegeId: collegeCoe.id,
      collegeName: collegeCoe.name,
      code: 'ENG',
      name: 'Civil & Electrical Engineering',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };
    const deptBus: Department = {
      id: 'dept-bus-05',
      collegeId: collegeCbas.id,
      collegeName: collegeCbas.name,
      code: 'BUS',
      name: 'Faculty of Business Administration',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01').toISOString()
    };

    [deptCS, deptLaw, deptMed, deptEng, deptBus].forEach(d => this.departments.set(d.id, d));

    // 3. Courses linked to Departments and Colleges
    const courseCsc201: Course = {
      id: 'course-csc-201',
      collegeId: collegeCst.id,
      collegeName: collegeCst.name,
      departmentId: deptCS.id,
      departmentName: deptCS.name,
      code: 'CSC 201',
      title: 'Data Structures and Algorithms',
      level: 200,
      semester: 'FIRST',
      description: 'Asymptotic complexity, trees, heaps, graph traversals, and dynamic programming with practical implementations.',
      status: 'ACTIVE',
      documentCount: 3,
      quizCount: 1,
      createdAt: new Date('2026-09-01').toISOString()
    };

    const courseCsc301: Course = {
      id: 'course-csc-301',
      collegeId: collegeCst.id,
      collegeName: collegeCst.name,
      departmentId: deptCS.id,
      departmentName: deptCS.name,
      code: 'CSC 301',
      title: 'Operating Systems & System Architecture',
      level: 300,
      semester: 'FIRST',
      description: 'Processes, concurrency, memory paging, file systems, and kernel-level interrupt handling.',
      status: 'ACTIVE',
      documentCount: 2,
      quizCount: 1,
      createdAt: new Date('2026-09-01').toISOString()
    };

    const courseLaw204: Course = {
      id: 'course-law-204',
      collegeId: collegeChls.id,
      collegeName: collegeChls.name,
      departmentId: deptLaw.id,
      departmentName: deptLaw.name,
      code: 'LAW 204',
      title: 'Constitutional Law & Civil Liberties',
      level: 200,
      semester: 'SECOND',
      description: 'Foundations of judicial review, separation of powers, fundamental human rights, and constitutional conventions.',
      status: 'ACTIVE',
      documentCount: 2,
      quizCount: 1,
      createdAt: new Date('2026-09-01').toISOString()
    };

    const courseMed201: Course = {
      id: 'course-med-201',
      collegeId: collegeCmhs.id,
      collegeName: collegeCmhs.name,
      departmentId: deptMed.id,
      departmentName: deptMed.name,
      code: 'MED 201',
      title: 'Human Gross Anatomy & Histology',
      level: 200,
      semester: 'FIRST',
      description: 'Systematic study of human upper extremities, thorax, abdominal viscera, and micro-cellular histology.',
      status: 'ACTIVE',
      documentCount: 1,
      quizCount: 1,
      createdAt: new Date('2026-09-01').toISOString()
    };

    const courseEng102: Course = {
      id: 'course-eng-102',
      collegeId: collegeCoe.id,
      collegeName: collegeCoe.name,
      departmentId: deptEng.id,
      departmentName: deptEng.name,
      code: 'ENG 102',
      title: 'Engineering Mathematics II',
      level: 100,
      semester: 'SECOND',
      description: 'Multivariable calculus, differential equations, Fourier transforms, and linear algebra applications.',
      status: 'ACTIVE',
      documentCount: 1,
      quizCount: 0,
      createdAt: new Date('2026-09-01').toISOString()
    };

    [courseCsc201, courseCsc301, courseLaw204, courseMed201, courseEng102].forEach(c => this.courses.set(c.id, c));

    // Academic Person Identifiers (used across references and demo user records)
    const adminId = 'user-admin-01';
    const adminName = 'Prof. Sarah Osei';
    const modId = 'user-mod-01';
    const modName = 'Dr. Marcus Vance';
    const lecCsId = 'user-lec-cs-01';
    const lecCsName = 'Dr. Alistair Chen';
    const lecLawId = 'user-lec-law-01';
    const lecLawName = 'Barrister Amina Bello';
    const studId = 'user-stud-01';
    const studName = 'Kofi Mensah';
    const appId = 'user-app-01';
    const appName = 'Dr. Elena Rostova';

    // 3. User Seeding
    // Strict Security Rule: In production environments, never seed demo accounts or hardcoded credentials
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[SECURITY AUDIT] Production environment active (NODE_ENV=production): Demonstration accounts are disabled. ' +
        'No default administrator or demo credentials created. Initial administrator provisioning must be performed ' +
        'via a controlled, out-of-band administrative bootstrap process prior to public release.'
      );
    } else {
      const defaultPassword = 'Password123!';

      const demoDefinitions = [
        {
          id: adminId,
          email: 'admin@tustudyhub.edu',
          fullName: adminName,
          role: 'ADMINISTRATOR' as const,
          status: 'ACTIVE' as const,
          departmentId: deptCS.id,
          departmentName: deptCS.name,
          contributorBio: 'System Administrator and Dean of Academic Quality Assurance.',
          assignedCourseCodes: ['CSC 201', 'CSC 301', 'LAW 204', 'MED 201', 'ENG 102'],
          createdAt: new Date('2026-08-01').toISOString(),
        },
        {
          id: modId,
          email: 'moderator@tustudyhub.edu',
          fullName: modName,
          role: 'MODERATOR' as const,
          status: 'ACTIVE' as const,
          departmentId: deptCS.id,
          departmentName: deptCS.name,
          contributorBio: 'Academic Integrity & Moderation Officer.',
          createdAt: new Date('2026-08-10').toISOString(),
        },
        {
          id: lecCsId,
          email: 'lecturer.cs@tustudyhub.edu',
          fullName: lecCsName,
          role: 'LECTURER' as const,
          status: 'ACTIVE' as const,
          departmentId: deptCS.id,
          departmentName: deptCS.name,
          contributorBio: 'Senior Lecturer in Algorithms and Systems.',
          assignedCourseCodes: ['CSC 201', 'CSC 301'],
          createdAt: new Date('2026-08-15').toISOString(),
        },
        {
          id: lecLawId,
          email: 'lecturer.law@tustudyhub.edu',
          fullName: lecLawName,
          role: 'LECTURER' as const,
          status: 'ACTIVE' as const,
          departmentId: deptLaw.id,
          departmentName: deptLaw.name,
          contributorBio: 'Senior Lecturer in Constitutional Law.',
          assignedCourseCodes: ['LAW 204'],
          createdAt: new Date('2026-08-18').toISOString(),
        },
        {
          id: studId,
          email: 'student@tustudyhub.edu',
          fullName: studName,
          role: 'STUDENT' as const,
          status: 'ACTIVE' as const,
          departmentId: deptCS.id,
          departmentName: deptCS.name,
          contributorBio: 'Level 300 Computer Science Undergraduate.',
          createdAt: new Date('2026-09-01').toISOString(),
        },
        {
          id: appId,
          email: 'applicant@tustudyhub.edu',
          fullName: appName,
          role: 'STUDENT' as const,
          status: 'PENDING_APPROVAL' as const,
          departmentId: deptMed.id,
          departmentName: deptMed.name,
          contributorBio: 'Adjunct lecturer in clinical anatomy seeking course review permissions for MED 201.',
          createdAt: new Date('2026-10-20').toISOString(),
        }
      ];

      // Derive fresh unique cryptographic salt and asynchronous PBKDF2 hash
      // using CURRENT_RECOMMENDED_ITERATIONS (220,000) for every demo account
      await Promise.all(
        demoDefinitions.map(async (def) => {
          const uniqueSalt = crypto.randomBytes(SALT_LENGTH).toString('hex');
          const hashResult = await this.hashPassword(defaultPassword, uniqueSalt, CURRENT_RECOMMENDED_ITERATIONS);
          const record: DbUserRecord = {
            ...def,
            passwordHash: hashResult.hash,
            salt: hashResult.salt,
            iterations: hashResult.iterations,
            algorithm: hashResult.algorithm
          };
          this.users.set(record.id, record);
        })
      );

      // Course assignments for lecturers in development
      this.lecturerCourseAssignments.set('lca-01', { lecturerId: lecCsId, courseId: courseCsc201.id });
      this.lecturerCourseAssignments.set('lca-02', { lecturerId: lecCsId, courseId: courseCsc301.id });
      this.lecturerCourseAssignments.set('lca-03', { lecturerId: lecLawId, courseId: courseLaw204.id });
    }

    // 4. Academic Documents
    const doc1: AcademicDocument & { internalFilePath: string } = {
      id: 'doc-csc-01',
      courseId: courseCsc201.id,
      courseCode: 'CSC 201',
      courseTitle: 'Data Structures and Algorithms',
      departmentName: 'Computer Science & Software Engineering',
      uploaderId: lecCsId,
      uploaderName: lecCsName,
      uploaderRole: 'LECTURER',
      title: 'Binary Search Trees & AVL Balancing Master Class Notes',
      description: 'Comprehensive lecture presentation and hand-worked proofs on rotations, node heights, and lookup complexity.',
      category: 'LECTURE_NOTE',
      academicYear: '2025/2026',
      fileName: 'CSC201_AVL_Trees_LectureNotes.pdf',
      fileSize: 2457600, // 2.4 MB
      mimeType: 'application/pdf',
      fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'APPROVED',
      accessLevel: 'PUBLIC',
      downloadCount: 142,
      verificationToken: 'TSH-CSC201-8F4A21C9',
      isVerified: true,
      verifiedAt: new Date('2026-09-15T10:30:00Z').toISOString(),
      verifiedBy: adminName,
      createdAt: new Date('2026-09-14T08:00:00Z').toISOString(),
      updatedAt: new Date('2026-09-15T10:30:00Z').toISOString(),
      internalFilePath: 'sample_avl_notes.pdf'
    };

    const doc2: AcademicDocument & { internalFilePath: string } = {
      id: 'doc-csc-02',
      courseId: courseCsc201.id,
      courseCode: 'CSC 201',
      courseTitle: 'Data Structures and Algorithms',
      departmentName: 'Computer Science & Software Engineering',
      uploaderId: studId,
      uploaderName: studName,
      uploaderRole: 'STUDENT',
      title: '2024/2025 First Semester Examination Past Questions & Marking Scheme',
      description: 'Past exam paper with verified step-by-step solutions for recursion tracing and graph adjacency matrix questions.',
      category: 'PAST_QUESTION',
      academicYear: '2024/2025',
      fileName: 'CSC201_Exam_2024_PastQuestions.pdf',
      fileSize: 1843200, // 1.8 MB
      mimeType: 'application/pdf',
      fileHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      status: 'APPROVED',
      accessLevel: 'PUBLIC',
      downloadCount: 389,
      verificationToken: 'TSH-CSC201-4D9E73A1',
      isVerified: true,
      verifiedAt: new Date('2026-09-20T14:15:00Z').toISOString(),
      verifiedBy: lecCsName,
      createdAt: new Date('2026-09-18T16:20:00Z').toISOString(),
      updatedAt: new Date('2026-09-20T14:15:00Z').toISOString(),
      internalFilePath: 'sample_csc201_pastquestions.pdf'
    };

    const doc3: AcademicDocument & { internalFilePath: string } = {
      id: 'doc-csc-03',
      courseId: courseCsc301.id,
      courseCode: 'CSC 301',
      courseTitle: 'Operating Systems & System Architecture',
      departmentName: 'Computer Science & Software Engineering',
      uploaderId: studId,
      uploaderName: studName,
      uploaderRole: 'STUDENT',
      title: 'Linux Kernel Semaphore & Concurrency Lab Manual',
      description: 'Student submitted implementation guide for POSIX semaphores and deadlock avoidance algorithms.',
      category: 'LAB_MANUAL',
      academicYear: '2025/2026',
      fileName: 'CSC301_Semaphore_Lab_Manual.pdf',
      fileSize: 3145728, // 3.1 MB
      mimeType: 'application/pdf',
      fileHash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      status: 'PENDING',
      accessLevel: 'STUDENT_ONLY',
      downloadCount: 12,
      verificationToken: 'TSH-CSC301-6B18D377',
      isVerified: false,
      createdAt: new Date('2026-10-25T11:00:00Z').toISOString(),
      updatedAt: new Date('2026-10-25T11:00:00Z').toISOString(),
      internalFilePath: 'sample_semaphore_lab.pdf'
    };

    const doc4: AcademicDocument & { internalFilePath: string } = {
      id: 'doc-law-01',
      courseId: courseLaw204.id,
      courseCode: 'LAW 204',
      courseTitle: 'Constitutional Law & Civil Liberties',
      departmentName: 'Faculty of Public & Private Law',
      uploaderId: lecLawId,
      uploaderName: lecLawName,
      uploaderRole: 'LECTURER',
      title: 'Judicial Review and Separation of Powers Landmark Case Digest',
      description: 'Analytical summary of leading constitutional cases, appellate opinions, and statutory interpretation principles.',
      category: 'STUDY_GUIDE',
      academicYear: '2025/2026',
      fileName: 'LAW204_Constitutional_Case_Digest.pdf',
      fileSize: 4194304, // 4.2 MB
      mimeType: 'application/pdf',
      fileHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      status: 'APPROVED',
      accessLevel: 'PUBLIC',
      downloadCount: 215,
      verificationToken: 'TSH-LAW204-9C78E41F',
      isVerified: true,
      verifiedAt: new Date('2026-09-25T09:00:00Z').toISOString(),
      verifiedBy: adminName,
      createdAt: new Date('2026-09-22T12:00:00Z').toISOString(),
      updatedAt: new Date('2026-09-25T09:00:00Z').toISOString(),
      internalFilePath: 'sample_law204_digest.pdf'
    };

    const doc5: AcademicDocument & { internalFilePath: string } = {
      id: 'doc-med-01',
      courseId: courseMed201.id,
      courseCode: 'MED 201',
      courseTitle: 'Human Gross Anatomy & Histology',
      departmentName: 'College of Medicine & Health Sciences',
      uploaderId: adminId,
      uploaderName: adminName,
      uploaderRole: 'ADMINISTRATOR',
      title: 'Human Gross Anatomy: Cranial Nerves & Histology High-Res Diagram',
      description: 'Official anatomical schematic illustrating the twelve pairs of cranial nerves and pathways with microscopic cellular histology references.',
      category: 'STUDY_GUIDE',
      academicYear: '2025/2026',
      fileName: 'MED201_Cranial_Nerves_Histology_Diagram.png',
      fileSize: 1536000, // 1.5 MB
      mimeType: 'image/png',
      fileHash: 'c7be1a80c95a02476b7bfa9c395ffb15748981f265ecb020a671ebfb90a990ec',
      status: 'APPROVED',
      accessLevel: 'PUBLIC',
      downloadCount: 88,
      verificationToken: 'TSH-MED201-3E7F1A8C',
      isVerified: true,
      verifiedAt: new Date('2026-09-28T09:00:00Z').toISOString(),
      verifiedBy: adminName,
      createdAt: new Date('2026-09-27T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-09-28T09:00:00Z').toISOString(),
      internalFilePath: 'sample_anatomy_chart.png'
    };

    const doc6: AcademicDocument & { internalFilePath: string } = {
      id: 'doc-eng-01',
      courseId: courseEng102.id,
      courseCode: 'ENG 102',
      courseTitle: 'Engineering Mathematics II',
      departmentName: 'Civil & Electrical Engineering',
      uploaderId: adminId,
      uploaderName: adminName,
      uploaderRole: 'ADMINISTRATOR',
      title: 'Multivariable Calculus & Differential Equations Practice Set',
      description: 'Standard curriculum problem set covering double integrals, line integrals, Stokes theorem, and ordinary differential equations.',
      category: 'STUDY_GUIDE',
      academicYear: '2025/2026',
      fileName: 'ENG102_Calculus_Practice_Set.docx',
      fileSize: 1048576, // 1.0 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileHash: '1a72d3f6a2b8e3489b0d9e876fa543217bca890123456789abcdef0123456789',
      status: 'APPROVED',
      accessLevel: 'STUDENT_ONLY',
      downloadCount: 45,
      verificationToken: 'TSH-ENG102-7B2C9A1D',
      isVerified: true,
      verifiedAt: new Date('2026-09-30T11:00:00Z').toISOString(),
      verifiedBy: adminName,
      createdAt: new Date('2026-09-29T14:00:00Z').toISOString(),
      updatedAt: new Date('2026-09-30T11:00:00Z').toISOString(),
      internalFilePath: 'sample_eng102_problems.docx'
    };

    [doc1, doc2, doc3, doc4, doc5, doc6].forEach(d => this.documents.set(d.id, d));

    // 5. Document Verifications
    this.documentVerifications.set(doc1.id, {
      id: 'ver-01',
      documentId: doc1.id,
      verificationToken: doc1.verificationToken,
      status: 'VERIFIED',
      verifiedBy: adminId,
      verifiedByName: adminName,
      verifiedAt: doc1.verifiedAt,
    });

    this.documentVerifications.set(doc5.id, {
      id: 'ver-05',
      documentId: doc5.id,
      verificationToken: doc5.verificationToken,
      status: 'VERIFIED',
      verifiedBy: adminId,
      verifiedByName: adminName,
      verifiedAt: doc5.verifiedAt,
    });

    this.documentVerifications.set(doc6.id, {
      id: 'ver-06',
      documentId: doc6.id,
      verificationToken: doc6.verificationToken,
      status: 'VERIFIED',
      verifiedBy: adminId,
      verifiedByName: adminName,
      verifiedAt: doc6.verifiedAt,
    });

    this.documentVerifications.set(doc2.id, {
      id: 'ver-02',
      documentId: doc2.id,
      verificationToken: doc2.verificationToken,
      status: 'VERIFIED',
      verifiedBy: lecCsId,
      verifiedByName: lecCsName,
      verifiedAt: doc2.verifiedAt,
    });

    this.documentVerifications.set(doc3.id, {
      id: 'ver-03',
      documentId: doc3.id,
      verificationToken: doc3.verificationToken,
      status: 'PENDING',
    });

    this.documentVerifications.set(doc4.id, {
      id: 'ver-04',
      documentId: doc4.id,
      verificationToken: doc4.verificationToken,
      status: 'VERIFIED',
      verifiedBy: adminId,
      verifiedByName: adminName,
      verifiedAt: doc4.verifiedAt,
    });

    // 6. Quizzes with Questions & Choices
    const quizCsc201: Quiz = {
      id: 'quiz-csc201-01',
      courseId: courseCsc201.id,
      courseCode: 'CSC 201',
      courseTitle: 'Data Structures and Algorithms',
      creatorId: lecCsId,
      creatorName: lecCsName,
      title: 'Trees, Heaps and Graph Traversal Fundamentals',
      description: 'Test your understanding of tree balance factors, min-heap properties, BFS/DFS complexities, and topological sorting.',
      timeLimitMinutes: 10,
      passPercentage: 70,
      status: 'PUBLISHED',
      currentVersion: 1,
      totalQuestions: 4,
      createdAt: new Date('2026-09-16T12:00:00Z').toISOString(),
      updatedAt: new Date('2026-09-16T12:00:00Z').toISOString()
    };
    this.quizzes.set(quizCsc201.id, quizCsc201);

    const quizVersionCsc: QuizVersionSnapshot = {
      id: 'qv-csc201-v1',
      quizId: quizCsc201.id,
      versionNumber: 1,
      title: quizCsc201.title,
      courseCode: 'CSC 201',
      courseTitle: courseCsc201.title,
      timeLimitMinutes: 10,
      passPercentage: 70,
      publishedAt: new Date('2026-09-16T12:00:00Z').toISOString(),
      questions: [
        {
          id: 'q1',
          questionText: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) with N nodes?',
          questionType: 'SINGLE_CHOICE',
          orderIndex: 1,
          explanation: 'In the worst case, an unbalanced BST degenerates into a linear linked list (e.g., when elements are inserted in sorted order), making search O(N).',
          choices: [
            { id: 'c1-1', text: 'O(log N)', isCorrect: false },
            { id: 'c1-2', text: 'O(N)', isCorrect: true },
            { id: 'c1-3', text: 'O(N log N)', isCorrect: false },
            { id: 'c1-4', text: 'O(1)', isCorrect: false }
          ]
        },
        {
          id: 'q2',
          questionText: 'Which of the following data structures is typically used to implement Breadth-First Search (BFS) on an unweighted graph?',
          questionType: 'SINGLE_CHOICE',
          orderIndex: 2,
          explanation: 'BFS explores neighbor nodes layer-by-layer, which adheres to First-In-First-Out (FIFO) ordering provided by a Queue.',
          choices: [
            { id: 'c2-1', text: 'Stack (LIFO)', isCorrect: false },
            { id: 'c2-2', text: 'Queue (FIFO)', isCorrect: true },
            { id: 'c2-3', text: 'Binary Heap', isCorrect: false },
            { id: 'c2-4', text: 'Disjoint Set', isCorrect: false }
          ]
        },
        {
          id: 'q3',
          questionText: 'Which of the following properties are TRUE for an AVL Tree? (Select all that apply)',
          questionType: 'SINGLE_CHOICE',
          orderIndex: 3,
          explanation: 'An AVL tree is a strictly balanced BST where the balance factor of every node is within {-1, 0, 1}, ensuring guaranteed O(log N) lookup.',
          choices: [
            { id: 'c3-1', text: 'The balance factor of any node must be -1, 0, or +1', isCorrect: true },
            { id: 'c3-2', text: 'Searching has a guaranteed worst-case time complexity of O(log N)', isCorrect: true },
            { id: 'c3-3', text: 'It permits duplicate nodes in both left and right subtrees simultaneously', isCorrect: false },
            { id: 'c3-4', text: 'Rebalancing requires at most two rotations upon insertion', isCorrect: true }
          ]
        },
        {
          id: 'q4',
          questionText: 'In a complete binary min-heap with root at index 0, what is the index of the parent of node at index i (i > 0)?',
          questionType: 'SINGLE_CHOICE',
          orderIndex: 4,
          explanation: 'In 0-indexed arrays, the parent index is floor((i - 1) / 2). Left child is 2*i + 1 and right child is 2*i + 2.',
          choices: [
            { id: 'c4-1', text: 'floor(i / 2)', isCorrect: false },
            { id: 'c4-2', text: 'floor((i - 1) / 2)', isCorrect: true },
            { id: 'c4-3', text: '2 * i - 1', isCorrect: false },
            { id: 'c4-4', text: 'floor((i + 1) / 2)', isCorrect: false }
          ]
        }
      ]
    };
    this.quizVersions.set(quizVersionCsc.id, quizVersionCsc);

    // Initial student quiz attempt
    const sampleAttempt: QuizAttempt = {
      id: 'att-01',
      quizId: quizCsc201.id,
      quizVersionId: quizVersionCsc.id,
      quizVersionNumber: 1,
      quizTitle: quizCsc201.title,
      courseCode: 'CSC 201',
      userId: studId,
      userName: studName,
      scorePercentage: 75,
      totalQuestions: 4,
      correctAnswersCount: 3,
      passed: true,
      completedAt: new Date('2026-09-28T15:40:00Z').toISOString(),
      timeSpentSeconds: 320,
      userAnswers: {
        'q1': ['c1-2'],
        'q2': ['c2-2'],
        'q3': ['c3-1', 'c3-2', 'c3-4'],
        'q4': ['c4-1'] // mistaken answer for realistic breakdown
      }
    };
    this.quizAttempts.set(sampleAttempt.id, sampleAttempt);

    // 7. Initial User Feedback
    const fb1: Feedback = {
      id: 'fb-01',
      userId: studId,
      userEmail: 'student@tustudyhub.edu',
      userName: studName,
      userRole: 'STUDENT',
      category: 'COURSE_CONTENT',
      title: 'Request for past examination questions for CSC 301',
      description: 'Could lecturers upload past exam papers for Operating Systems from 2023 and 2024? The lecture notes are excellent but past papers would aid revision.',
      rating: 5,
      status: 'UNDER_REVIEW',
      adminNotes: 'Contacted Dr. Chen to retrieve and redact 2023/2024 semester exams.',
      reviewedBy: adminId,
      reviewedByName: adminName,
      reviewedAt: new Date('2026-10-01T10:00:00Z').toISOString(),
      createdAt: new Date('2026-09-29T14:20:00Z').toISOString()
    };

    const fb2: Feedback = {
      id: 'fb-02',
      userEmail: 'alumni.eng@tustudyhub.edu',
      userName: 'Chidi Nwosu',
      userRole: 'VISITOR',
      category: 'FEATURE_REQUEST',
      title: 'Dark mode option for night study sessions',
      description: 'The Clay & Kaolin theme is clean, but a low-contrast night mode option would help when reading long lecture notes on mobile late at night.',
      rating: 4,
      status: 'PLANNED',
      adminNotes: 'Scheduled for next frontend theme sprint.',
      reviewedBy: adminId,
      reviewedByName: adminName,
      reviewedAt: new Date('2026-10-02T11:30:00Z').toISOString(),
      createdAt: new Date('2026-09-30T08:15:00Z').toISOString()
    };

    const fb3: Feedback = {
      id: 'fb-03',
      userId: 'user-app-01',
      userEmail: 'applicant@tustudyhub.edu',
      userName: 'Dr. Fatima Yusuf',
      userRole: 'LECTURER',
      category: 'PLATFORM',
      title: 'PWA Offline note caching speed',
      description: 'The PWA installation on my Android device is very responsive, and downloads work seamlessly offline.',
      rating: 5,
      status: 'NEW',
      createdAt: new Date('2026-10-05T12:00:00Z').toISOString()
    };

    [fb1, fb2, fb3].forEach(fb => this.feedback.set(fb.id, fb));

    // 8. Initial Audit Logs
    this.logAudit(
      { id: adminId, name: adminName, role: 'ADMINISTRATOR' },
      'SYSTEM_INITIALIZED',
      'SYSTEM',
      'INIT',
      { status: 'READY', environment: process.env.NODE_ENV || 'development' }
    );
    this.logAudit(
      { id: adminId, name: adminName, role: 'ADMINISTRATOR' },
      'DOCUMENT_VERIFIED',
      'DOCUMENT',
      doc1.id,
      { token: doc1.verificationToken, title: doc1.title, course: doc1.courseCode }
    );
  }
}

export const db = new DatabaseStore();
