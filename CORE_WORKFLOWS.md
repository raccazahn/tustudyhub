# Core Application Workflows

This document outlines the core application workflows for the TuStudyHub first release. It covers the paper lifecycle, learning materials, and quizzes, aligning with the approved architecture, data model, and API specifications.

## 1. Paper Lifecycle (Verification & Moderation)

### Status Transitions
- **DRAFT**: Initial state when a user starts an upload but hasn't submitted.
- **PENDING_REVIEW**: User submits the paper. It enters the moderation queue.
- **APPROVED**: Moderator/Lecturer approves the paper. QR token is generated.
- **REJECTED**: Moderator/Lecturer rejects the paper (requires a reason).
- **PUBLISHED**: Paper is made publicly visible and verifiable via QR.
- **REVOKED**: Admin/Moderator revokes a previously published paper.

### Workflow Steps
1. **Submission**: 
   - Student/Lecturer uploads document (PDF/DOCX) via the PWA.
   - File is stored in **File Storage**.
   - API creates a record in **PostgreSQL** with status `PENDING_REVIEW`.
2. **Review**: 
   - Moderators/Lecturers view the `PENDING_REVIEW` queue.
   - Reviewer opens the document and evaluates it against academic standards.
3. **Approval/Rejection**: 
   - *If Approved*: Status changes to `APPROVED`. System generates a unique QR token (UUID).
   - *If Rejected*: Status changes to `REJECTED`. Reviewer must provide a rejection reason. User is notified.
4. **Publication**: 
   - Approved papers are transitioned to `PUBLISHED`. 
   - The QR token is embedded into a public verification URL (e.g., `tustudyhub.app/verify/{token}`).
5. **QR Verification**: 
   - Anyone scans the QR code or visits the public URL.
   - The **Public verification page** queries the DB using the token.
   - Returns paper metadata (Title, Author, Status, Approval Date).
6. **Revocation**: 
   - Admin/Moderator can revoke a paper (e.g., due to plagiarism discovered later).
   - Status changes to `REVOKED`. 
   - Public verification page will now display "Document Revoked" instead of active metadata.

### Business Rules & Edge Cases
- **Validation**: File type must be PDF/DOCX. Max size limit applies (TBD).
- **Edge Case**: If a file is deleted from File Storage but remains in DB, the system should handle missing file errors gracefully on the public page.
- **Edge Case**: User attempts to edit a paper after `PENDING_REVIEW`. *Rule*: Editing is locked once submitted. Must withdraw and resubmit.

---

## 2. Course / Learning Material Workflows

### Workflow Steps
1. **Upload & Creation**: 
   - Lecturer creates a learning material entry (Title, Description, Course Link).
   - File is uploaded to **File Storage**.
   - DB record is created with status `PUBLISHED` (or `DRAFT` if draft saving is supported).
2. **Access & Distribution**: 
   - Students enrolled in the specific course can view the material in the **Document Library**.
   - Students can stream (for PDFs) or download the file.
3. **Search**: 
   - Users can search materials via the API using keywords, course codes, or author names.

### Business Rules & Edge Cases
- **Validation**: Materials must be linked to at least one valid Course ID.
- **Access Control**: Students can only access materials for courses they are enrolled in (enforced via Identity module).
- **Edge Case**: Course is archived. *Rule*: Materials remain accessible in read-only mode for historical reference.

---

## 3. Quiz Workflows

### Workflow Steps
1. **Creation**: 
   - Lecturer creates a quiz (Title, Course Link, Time Limit).
   - Lecturer adds multiple-choice questions, options, and marks the correct answers.
   - Quiz status transitions from `DRAFT` to `PUBLISHED`.
2. **Taking**: 
   - Student selects the quiz and clicks "Start".
   - System records the attempt start time.
   - Student answers questions and submits (or time expires).
3. **Automatic Marking**: 
   - Upon submission, the backend compares student answers against the correct answers.
   - Calculates the score and saves the attempt record.
4. **Score History**: 
   - Student can view a history of all quiz attempts, including scores, dates, and correct/incorrect feedback.

### Business Rules & Edge Cases
- **Validation**: A quiz must have at least 1 question to be published.
- **Marking**: Only multiple-choice questions are supported in the first release.
- **Edge Case**: Network drops during quiz submission. *Rule*: PWA should cache the submission locally and retry, or the backend should accept partial submissions if the attempt was started.
- **Edge Case**: Student takes quiz on multiple devices. *Rule*: Only one active attempt per student per quiz is allowed at a time.

---

## 4. Unresolved Decisions / Open Questions

*To be resolved with Darius, Madison, and the team:*

1. **File Limits**: What are the exact maximum file size limits for Papers and Learning Materials?
2. **Quiz Retakes**: Are students allowed to retake quizzes? If so, does the score history show all attempts or just the highest/latest?
3. **Revocation Visibility**: When a paper is `REVOKED`, should it be completely hidden from search results, or remain visible but marked as revoked?
4. **QR Token Format**: Should the QR token be a simple UUID, or a signed JWT to prevent tampering with the public verification URL?
5. **Quiz Timeouts**: How should the system handle a student whose internet drops exactly at the deadline? Do we enforce strict server-side timeouts, or allow a grace period?