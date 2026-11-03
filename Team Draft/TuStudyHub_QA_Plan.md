# TuStudyHub – QA Test Plan, Test Cases & Coverage

| | |
|---|---|
| **Document status** | DRAFT v0.1 – pending reconciliation with approved requirements/API spec |
| **Owner** | QA |
| **Last updated** | 2026-11-03 |

> ⚠️ **Important – read first.** This draft was written **without access to the approved requirements, API specification, architecture, or workflow documents.** Requirement IDs (`REQ-*`), roles, endpoints, status names and error codes below are **assumptions** based on the issue's feature list. Every assumption is listed in [Section 7 – Blockers](#7-blockers-and-open-questions). Before execution, QA must map each `REQ-*` to the real requirement ID and correct expected results against the API spec.

---

## Table of Contents
1. [Test Plan](#1-test-plan)
2. [Roles & Test Data](#2-roles--test-data)
3. [Test Cases](#3-test-cases)
4. [Requirement Coverage Checklist](#4-requirement-coverage-checklist)
5. [Defect Reporting](#5-defect-reporting)
6. [Entry / Exit Criteria](#6-entry--exit-criteria)
7. [Blockers and Open Questions](#7-blockers-and-open-questions)
8. [Pull Request Description](#8-pull-request-description)

---

## 1. Test Plan

### 1.1 Objective
Verify that TuStudyHub meets the agreed requirements and that its core user workflows work correctly, securely and consistently for every user role.

### 1.2 Scope

**In scope**
- Authentication, session handling and role-based permissions
- Course and material access (browse, view, download, upload where applicable)
- Paper submission and moderation workflow
- QR code generation, verification and revocation
- Search (courses, materials, papers)
- Quiz workflows (create, attempt, submit, score, review)
- API contract validation (status codes, schemas, error handling)
- Input validation and role/permission boundaries

**Out of scope (unless approved scope says otherwise)**
- Load/stress testing and penetration testing (basic security checks only)
- Third-party service internals (email provider, storage provider)
- Native mobile apps (web/responsive only)
- Data migration from legacy systems

### 1.3 Test Approach

| Level | Approach | Tooling (suggested) |
|---|---|---|
| API testing | Contract + functional tests per endpoint, including auth headers and negative payloads | Postman/Newman or REST Client; OpenAPI schema validation |
| UI / E2E | Core workflows end-to-end through the UI, per role | Manual first; Playwright/Cypress for regression candidates |
| Role & permission | Every protected action tried with each role and with no session | API + UI matrix (Section 3.1) |
| Validation | Boundary, empty, oversized, wrong-type and malicious inputs | Manual + API |
| Exploratory | Time-boxed sessions on moderation and QR flows | Charters recorded in the test log |
| Regression | Re-run Priority P1 cases on every release candidate | Automated where stable |
| Basic security | Authorization bypass (IDOR), token expiry/tamper, XSS in text fields, file-type spoofing | Manual + browser dev tools |

**Prioritisation:** P1 = core workflow / security / data integrity; P2 = important but with workaround; P3 = cosmetic or low-risk.

### 1.4 Test Environment Assumptions
- Dedicated **staging/QA environment**, isolated from production, with a seeded database that can be reset.
- Test accounts exist for every role (Section 2) with known credentials.
- Email/notification service is sandboxed (e.g. mail catcher) so verification and notification emails can be inspected.
- File storage is available for upload tests; supported file types and size limits are known (see Blockers).
- System clock can be controlled or tokens can be configured to short expiry for expiry tests.
- Browsers: latest Chrome, Firefox, Safari/Edge (desktop) plus one mobile viewport.
- A mobile device or emulator with a QR scanner is available for QR tests.
- API base URL, OpenAPI spec and Postman collection are available.

### 1.5 Deliverables
This file (plan, cases, coverage checklist, defect template), plus execution results recorded in a test log (template in Section 5.3).

### 1.6 Risks
| Risk | Mitigation |
|---|---|
| Requirements/API spec unclear or changing | Track in Blockers; re-baseline cases each spec revision |
| Role model not fully defined | Confirm role matrix before executing permission tests |
| QR flow depends on device/camera | Test both API token verification and scanner-based verification |
| Test data pollution | Reset staging DB between cycles; prefix test data with `QA_` |

---

## 2. Roles & Test Data

> Roles are **assumed**; confirm against requirements.

| Role | Description | Test account |
|---|---|---|
| Guest | Not logged in | – |
| Student | Standard registered user | `qa.student1`, `qa.student2` |
| Instructor | Owns/teaches courses, creates quizzes | `qa.instructor1`, `qa.instructor2` |
| Moderator | Reviews submitted papers | `qa.moderator1` |
| Admin | Full administration | `qa.admin1` |

**Seed data needed:** 2 courses (Course A owned by instructor1, Course B by instructor2); student1 enrolled in A only; materials in each course; papers in each status (Pending, Approved, Rejected); one valid, one revoked and one expired QR code; a quiz with 5 questions (mixed types); a deactivated user; a locked user.

---

## 3. Test Cases

**Legend:** Type = **P** positive, **N** negative, **V** validation, **R** role/permission. Priority P1–P3.
`Req` values are placeholders – see Section 4.

### 3.1 Role / Permission Matrix (expected – to be confirmed)

| Action | Guest | Student | Instructor | Moderator | Admin |
|---|---|---|---|---|---|
| Register / log in | ✅ | ✅ | ✅ | ✅ | ✅ |
| View public course list | ✅ | ✅ | ✅ | ✅ | ✅ |
| View/download materials of enrolled course | ❌ | ✅ | ✅ (own) | ✅ | ✅ |
| View materials of non-enrolled course | ❌ | ❌ | ❌ (not own) | ✅ | ✅ |
| Upload/edit/delete materials | ❌ | ❌ | ✅ (own course) | ❌ | ✅ |
| Submit paper | ❌ | ✅ | ✅ | ❌ | ✅ |
| Approve/reject paper | ❌ | ❌ | ❌ | ✅ | ✅ |
| Verify QR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Revoke QR | ❌ | ❌ | ❌ | ✅ | ✅ |
| Search | ✅ (public only) | ✅ | ✅ | ✅ | ✅ |
| Create/edit quiz | ❌ | ❌ | ✅ (own course) | ❌ | ✅ |
| Attempt quiz | ❌ | ✅ (enrolled) | ❌ | ❌ | ❌ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.2 Authentication & Permissions (AUTH)

| ID | Req | Type | Pri | Role | Steps | Expected result |
|---|---|---|---|---|---|---|
| TC-AUTH-001 | REQ-AUTH-01 | P | P1 | Guest | Register with valid name, unique email, compliant password | Account created; confirmation/next step shown; password not returned in response; stored hashed |
| TC-AUTH-002 | REQ-AUTH-01 | N | P1 | Guest | Register with an already-used email | Rejected (e.g. 409/400); clear message; no duplicate account |
| TC-AUTH-003 | REQ-AUTH-01 | V | P1 | Guest | Register with invalid email formats (`abc`, `a@b`, spaces, 255+ chars) | Each rejected with field-level validation error |
| TC-AUTH-004 | REQ-AUTH-01 | V | P2 | Guest | Register with password below min length / missing required complexity / empty | Rejected with message stating the password policy |
| TC-AUTH-005 | REQ-AUTH-02 | P | P1 | Student | Log in with valid credentials | Success; token/session issued; user lands on correct home page for role |
| TC-AUTH-006 | REQ-AUTH-02 | N | P1 | Guest | Log in with wrong password | 401; generic message (does not reveal whether email exists) |
| TC-AUTH-007 | REQ-AUTH-02 | N | P1 | Guest | Log in with non-existent email | Same generic error as TC-AUTH-006 |
| TC-AUTH-008 | REQ-AUTH-02 | V | P2 | Guest | Submit login with empty email/password | Validation errors; no request processed |
| TC-AUTH-009 | REQ-AUTH-03 | N | P2 | Student | Make N consecutive failed logins (N per policy) | Lockout or throttling applied per policy; legitimate login blocked/limited as specified |
| TC-AUTH-010 | REQ-AUTH-02 | N | P1 | Deactivated user | Log in with a deactivated account | Rejected with appropriate message; no session |
| TC-AUTH-011 | REQ-AUTH-04 | P | P1 | Student | Log out | Session/token invalidated; reusing old token returns 401 |
| TC-AUTH-012 | REQ-AUTH-04 | N | P1 | Student | Call protected API with expired token | 401; UI redirects to login |
| TC-AUTH-013 | REQ-AUTH-04 | N | P1 | Any | Call protected API with tampered/malformed token | 401; no data leaked |
| TC-AUTH-014 | REQ-AUTH-05 | P | P2 | Student | Request password reset with registered email; follow link; set new password | Reset email received; link works once; new password works; old password fails |
| TC-AUTH-015 | REQ-AUTH-05 | N | P2 | Guest | Use expired or already-used reset link | Rejected with clear message |
| TC-AUTH-016 | REQ-AUTH-05 | N | P2 | Guest | Request reset for unregistered email | Same neutral response as registered email (no account enumeration) |
| TC-AUTH-017 | REQ-PERM-01 | R | P1 | Guest | Open protected page/API URL directly without logging in | Redirect to login (UI) / 401 (API) |
| TC-AUTH-018 | REQ-PERM-01 | R | P1 | Student | Call an admin-only endpoint (e.g. user management) | 403; no action taken; attempt logged if logging is required |
| TC-AUTH-019 | REQ-PERM-01 | R | P1 | Student | Manually navigate to moderator/instructor UI URLs | Access denied; protected controls not rendered |
| TC-AUTH-020 | REQ-PERM-02 | R | P1 | Student | Modify own role via profile update request (add `role: admin` to payload) | Field ignored or rejected; role unchanged (privilege escalation blocked) |
| TC-AUTH-021 | REQ-PERM-03 | R | P1 | Admin | Change a user's role; that user logs in again | New permissions apply; previous-role permissions removed |
| TC-AUTH-022 | REQ-AUTH-06 | P | P3 | Student | Update own profile with valid data | Saved and reflected; email change (if allowed) follows verification flow |

### 3.3 Course & Material Access (CRS)

| ID | Req | Type | Pri | Role | Steps | Expected result |
|---|---|---|---|---|---|---|
| TC-CRS-001 | REQ-CRS-01 | P | P1 | Student | Open course list | Courses displayed per visibility rules; pagination works |
| TC-CRS-002 | REQ-CRS-02 | P | P1 | Student (enrolled in A) | Open Course A and its materials list | All published materials shown with title, type, date |
| TC-CRS-003 | REQ-CRS-03 | P | P1 | Student (enrolled in A) | Download/view a material | File opens/downloads intact (checksum matches uploaded file) |
| TC-CRS-004 | REQ-CRS-03 | R | P1 | Student (not enrolled in B) | Open Course B material URL directly / call API by material ID | 403/404; file not served (IDOR check) |
| TC-CRS-005 | REQ-CRS-03 | R | P1 | Guest | Request a material file URL without session | 401/redirect; no file content |
| TC-CRS-006 | REQ-CRS-04 | P | P1 | Instructor (owner of A) | Upload a valid material (allowed type/size) to Course A | Upload succeeds; appears in list; metadata correct |
| TC-CRS-007 | REQ-CRS-04 | V | P1 | Instructor | Upload disallowed file type (`.exe`) | Rejected with clear error; nothing stored |
| TC-CRS-008 | REQ-CRS-04 | V | P1 | Instructor | Upload file exceeding max size | Rejected with size-limit message |
| TC-CRS-009 | REQ-CRS-04 | V | P2 | Instructor | Upload file with spoofed extension (`.exe` renamed `.pdf`) | Rejected via content/MIME check |
| TC-CRS-010 | REQ-CRS-04 | V | P2 | Instructor | Upload with empty title / title over max length / script tag in title | Validation error; script text escaped on display (no XSS) |
| TC-CRS-011 | REQ-CRS-04 | R | P1 | Instructor (owner of B) | Upload/edit/delete material in Course A | 403; no change |
| TC-CRS-012 | REQ-CRS-04 | R | P1 | Student | Call upload endpoint | 403 |
| TC-CRS-013 | REQ-CRS-05 | P | P2 | Instructor (owner) | Edit material metadata; delete material | Changes persisted; deleted material no longer accessible (404 on old URL) |
| TC-CRS-014 | REQ-CRS-06 | P | P2 | Student | Enrol in a course (if self-enrolment exists) | Enrolment recorded; access granted immediately |
| TC-CRS-015 | REQ-CRS-06 | N | P2 | Student | Enrol twice in same course / enrol in closed course | Duplicate rejected / closed course blocked with message |
| TC-CRS-016 | REQ-CRS-06 | R | P2 | Student | Un-enrol (or admin removes enrolment), then open previous material URL | Access revoked immediately |
| TC-CRS-017 | REQ-CRS-02 | N | P3 | Student | Open non-existent course ID | 404 page/response; no stack trace |
| TC-CRS-018 | REQ-CRS-02 | P | P3 | Student | Course with no materials | Friendly empty state |

### 3.4 Paper Submission & Moderation (PAP)

Assumed status flow: `Draft → Pending → Approved | Rejected (→ Resubmitted)`.

| ID | Req | Type | Pri | Role | Steps | Expected result |
|---|---|---|---|---|---|---|
| TC-PAP-001 | REQ-PAP-01 | P | P1 | Student | Submit paper with all required fields and valid file | Submission accepted; status = Pending; confirmation shown; appears in "My submissions" |
| TC-PAP-002 | REQ-PAP-01 | V | P1 | Student | Submit with required fields empty (title, course, file) | Per-field errors; no record created |
| TC-PAP-003 | REQ-PAP-01 | V | P1 | Student | Submit with disallowed file type / oversized file | Rejected with clear message |
| TC-PAP-004 | REQ-PAP-01 | V | P2 | Student | Submit with metadata at max length and over max length (title, abstract) | Max accepted; over-max rejected |
| TC-PAP-005 | REQ-PAP-02 | N | P2 | Student | Double-click submit / resend same request | Only one submission created (idempotent or duplicate prevented) |
| TC-PAP-006 | REQ-PAP-01 | R | P1 | Guest | Call submission endpoint without login | 401 |
| TC-PAP-007 | REQ-PAP-03 | R | P1 | Student | View own submission status | Correct status; only own submissions listed |
| TC-PAP-008 | REQ-PAP-03 | R | P1 | Student2 | Open student1's submission by ID | 403/404 (IDOR) |
| TC-PAP-009 | REQ-PAP-04 | P | P1 | Moderator | Open moderation queue | Pending papers listed (oldest first or per spec); file/preview accessible |
| TC-PAP-010 | REQ-PAP-04 | R | P1 | Student / Instructor | Open moderation queue UI/API | 403 |
| TC-PAP-011 | REQ-PAP-05 | P | P1 | Moderator | Approve a pending paper | Status = Approved; author notified; paper visible per publication rules; action logged with moderator and time |
| TC-PAP-012 | REQ-PAP-06 | P | P1 | Moderator | Reject a pending paper with reason | Status = Rejected; reason stored and visible to author; author notified |
| TC-PAP-013 | REQ-PAP-06 | V | P1 | Moderator | Reject without a reason (if reason mandatory) | Blocked with validation message |
| TC-PAP-014 | REQ-PAP-05 | N | P1 | Moderator | Approve an already-approved paper / act on a paper concurrently with another moderator | Second action rejected or handled; final state consistent; no duplicate notification |
| TC-PAP-015 | REQ-PAP-05 | R | P1 | Student | Call approve endpoint on own paper | 403; status unchanged |
| TC-PAP-016 | REQ-PAP-05 | R | P2 | Moderator | Approve paper they authored (if conflict-of-interest rule exists) | Blocked per rule *(blocker: rule unconfirmed)* |
| TC-PAP-017 | REQ-PAP-07 | P | P2 | Student | Resubmit rejected paper after fixes | New version/Pending status per spec; history retained |
| TC-PAP-018 | REQ-PAP-07 | N | P2 | Student | Edit/delete a paper after it is Approved | Blocked or follows spec; status unchanged |
| TC-PAP-019 | REQ-PAP-08 | P | P2 | Student | Approved paper visible to intended audience; Pending/Rejected papers are not | Visibility matches status for Guest, other students, instructors |
| TC-PAP-020 | REQ-PAP-09 | P | P2 | Admin/Moderator | Review audit log for a paper | Every state change shows actor, timestamp, old/new status |

### 3.5 QR Verification & Revocation (QR)

> Assumes a QR code encodes a verification token/URL for an approved paper (or credential). **Confirm what the QR represents** (Blocker B-06).

| ID | Req | Type | Pri | Role | Steps | Expected result |
|---|---|---|---|---|---|---|
| TC-QR-001 | REQ-QR-01 | P | P1 | System / Student | Paper approved (or QR requested) | QR generated and linked to the correct record; image scannable |
| TC-QR-002 | REQ-QR-01 | N | P1 | Student | Request QR for a Pending/Rejected paper | Not generated; clear message |
| TC-QR-003 | REQ-QR-02 | P | P1 | Guest | Scan valid QR / open verification URL | Verification page shows "Valid" plus expected non-sensitive details (title, author, date, status) |
| TC-QR-004 | REQ-QR-02 | N | P1 | Guest | Verify a token that does not exist / is malformed | "Invalid" result; 404/400; no server error |
| TC-QR-005 | REQ-QR-02 | N | P1 | Guest | Modify a character in a valid token | "Invalid"; no data leaked |
| TC-QR-006 | REQ-QR-02 | N | P2 | Guest | Verify an expired QR (if expiry exists) | "Expired" status distinct from "Invalid" |
| TC-QR-007 | REQ-QR-03 | P | P1 | Moderator | Revoke a valid QR with reason | Status = Revoked; action logged; author notified if specified |
| TC-QR-008 | REQ-QR-03 | P | P1 | Guest | Verify the QR revoked in TC-QR-007 | Shows "Revoked"; not shown as valid; effective immediately (no caching delay) |
| TC-QR-009 | REQ-QR-03 | R | P1 | Student | Call revoke endpoint | 403; QR remains valid |
| TC-QR-010 | REQ-QR-03 | R | P1 | Guest | Call revoke endpoint without session | 401 |
| TC-QR-011 | REQ-QR-03 | N | P2 | Moderator | Revoke an already-revoked QR | Idempotent or clear message; state unchanged |
| TC-QR-012 | REQ-QR-03 | V | P2 | Moderator | Revoke without reason (if mandatory) | Blocked with validation message |
| TC-QR-013 | REQ-QR-04 | N | P2 | Moderator | After revoking, attempt to re-activate (if supported) / regenerate | Behaviour per spec; old QR stays revoked |
| TC-QR-014 | REQ-QR-02 | P | P2 | Mobile user | Scan QR with phone camera in good and low light | Correct verification page loads on mobile layout |
| TC-QR-015 | REQ-QR-05 | R | P2 | Guest | Check verification response for sensitive data (email, internal IDs) | Only approved public fields exposed |
| TC-QR-016 | REQ-QR-02 | N | P3 | Guest | Hit verification endpoint rapidly (e.g. 100 requests/min) | Rate limiting applied if specified; service remains stable |
| TC-QR-017 | REQ-QR-01 | P | P3 | Student | Revoked paper (paper rejected after approval, if possible) | Related QR becomes invalid per spec |

### 3.6 Search (SRCH)

| ID | Req | Type | Pri | Role | Steps | Expected result |
|---|---|---|---|---|---|---|
| TC-SRCH-001 | REQ-SRCH-01 | P | P1 | Student | Search by exact course/material title | Matching item in results, ranked first or near top |
| TC-SRCH-002 | REQ-SRCH-01 | P | P1 | Student | Search by partial keyword | Relevant results returned |
| TC-SRCH-003 | REQ-SRCH-01 | P | P2 | Student | Search with different letter case / accents | Case-insensitive (and accent behaviour per spec) |
| TC-SRCH-004 | REQ-SRCH-02 | P | P2 | Student | Apply filters (course, type, date, status if available) and combine them | Results satisfy all selected filters; clearing filters restores results |
| TC-SRCH-005 | REQ-SRCH-03 | N | P1 | Student | Search for a term found only in a non-enrolled course's private material | Result not shown (no permission leak) |
| TC-SRCH-006 | REQ-SRCH-03 | N | P1 | Guest | Search for term in Pending/Rejected papers | Not returned |
| TC-SRCH-007 | REQ-SRCH-03 | R | P1 | Moderator | Search for Pending papers | Visible per moderator permissions |
| TC-SRCH-008 | REQ-SRCH-01 | N | P2 | Student | Search term with no matches | "No results" empty state; no error |
| TC-SRCH-009 | REQ-SRCH-04 | V | P2 | Student | Empty query / whitespace only / 500+ characters | Handled gracefully (message or all results per spec); no 500 error |
| TC-SRCH-010 | REQ-SRCH-04 | V | P1 | Student | Query with special characters and injection strings (`' OR 1=1 --`, `<script>`, `%`, `*`) | Treated as plain text; no error, no script execution |
| TC-SRCH-011 | REQ-SRCH-05 | P | P2 | Student | Large result set; page through results; change page size/sort | Pagination consistent, no duplicates/missing items; sort order correct |
| TC-SRCH-012 | REQ-SRCH-06 | P | P2 | Instructor | Upload a new material then search for it | Appears in results within the specified indexing delay |
| TC-SRCH-013 | REQ-SRCH-06 | P | P2 | Instructor | Delete material then search for it | No longer returned |

### 3.7 Quiz Workflows (QZ)

| ID | Req | Type | Pri | Role | Steps | Expected result |
|---|---|---|---|---|---|---|
| TC-QZ-001 | REQ-QZ-01 | P | P1 | Instructor (owner) | Create quiz with title, questions, correct answers, time/attempt limit | Quiz saved; in draft or published per choice |
| TC-QZ-002 | REQ-QZ-01 | V | P1 | Instructor | Create quiz with no questions / question with no correct answer / empty text | Blocked with validation errors |
| TC-QZ-003 | REQ-QZ-01 | V | P2 | Instructor | Boundary values: time limit 0, negative, max+1; attempts 0 | Rejected; valid boundary values accepted |
| TC-QZ-004 | REQ-QZ-01 | R | P1 | Student | Call create/edit quiz endpoint | 403 |
| TC-QZ-005 | REQ-QZ-01 | R | P1 | Instructor (not owner) | Edit/delete another instructor's quiz | 403 |
| TC-QZ-006 | REQ-QZ-02 | P | P1 | Student (enrolled) | Open published quiz and start attempt | Attempt created; questions shown; timer starts (if timed) |
| TC-QZ-007 | REQ-QZ-02 | R | P1 | Student (not enrolled) | Start attempt by direct URL/ID | 403/404 |
| TC-QZ-008 | REQ-QZ-02 | N | P1 | Student | Open unpublished/draft quiz | Not visible; direct access blocked |
| TC-QZ-009 | REQ-QZ-02 | R | P1 | Student | Inspect API response of a quiz in progress | Correct answers **not** included in payload |
| TC-QZ-010 | REQ-QZ-03 | P | P1 | Student | Answer all questions and submit | Submission recorded once; score computed correctly against known answers |
| TC-QZ-011 | REQ-QZ-03 | P | P1 | Student | Submit with some questions unanswered | Allowed (or warned) per spec; unanswered scored 0 |
| TC-QZ-012 | REQ-QZ-03 | V | P2 | Student | Tamper with request: answer ID not belonging to question, extra questions | Rejected or ignored; score not affected |
| TC-QZ-013 | REQ-QZ-04 | N | P1 | Student | Let the timer expire | Auto-submit or lock per spec; answers up to expiry kept; late submissions rejected |
| TC-QZ-014 | REQ-QZ-04 | N | P1 | Student | Start more attempts than allowed | Blocked with message once limit reached |
| TC-QZ-015 | REQ-QZ-04 | N | P2 | Student | Submit same attempt twice / replay request | Second submission rejected; score unchanged |
| TC-QZ-016 | REQ-QZ-05 | P | P1 | Student | View result and feedback after submission | Score, correct/incorrect marks shown according to review settings |
| TC-QZ-017 | REQ-QZ-05 | R | P1 | Student2 | View student1's attempt/result by ID | 403/404 |
| TC-QZ-018 | REQ-QZ-06 | P | P2 | Instructor (owner) | View results/statistics for own quiz | Correct counts, averages; only own course's students |
| TC-QZ-019 | REQ-QZ-02 | N | P2 | Student | Refresh/close browser mid-attempt then return | Attempt state restored per spec (or consistent failure handling); timer not reset |
| TC-QZ-020 | REQ-QZ-01 | P | P2 | Instructor | Edit quiz after attempts exist | Behaviour per spec (locked, versioned, or warned); existing scores unaffected |
| TC-QZ-021 | REQ-QZ-07 | P | P3 | Student | Each supported question type (MCQ single/multi, true/false, short answer) | Rendering, answering and scoring correct for each type |

### 3.8 Cross-Cutting (API / Non-Functional basics)

| ID | Req | Type | Pri | Steps | Expected result |
|---|---|---|---|---|---|
| TC-API-001 | REQ-API-01 | P | P1 | For each endpoint, validate success response against OpenAPI schema | Status code and body match the spec |
| TC-API-002 | REQ-API-02 | N | P1 | Send malformed JSON / wrong content type / missing required fields | 400 with consistent error format; no stack trace or internal info |
| TC-API-003 | REQ-API-02 | N | P2 | Call nonexistent route; unsupported HTTP method | 404 / 405 in standard error format |
| TC-API-004 | REQ-NFR-01 | N | P2 | Inject `<script>` into all free-text fields; view where displayed | Output encoded; no script execution |
| TC-API-005 | REQ-NFR-02 | P | P3 | Open core pages at mobile, tablet and desktop widths | Layout usable; no content cut off |
| TC-API-006 | REQ-NFR-03 | P | P3 | Keyboard-only navigation of login, search, and quiz | All controls reachable; focus visible; labels present |
| TC-API-007 | REQ-NFR-04 | P | P3 | Measure response time of search and material list under normal load | Within agreed threshold *(threshold not yet defined – blocker)* |

---

## 4. Requirement Coverage Checklist

> `REQ-*` IDs are **placeholders**. Replace with real IDs from the requirements document. Status: ⬜ not yet executed · ✅ covered (case written) · ⚠️ partially covered / blocked · ❌ cannot be tested yet.

| Req ID (placeholder) | Requirement summary (assumed) | Test cases | Coverage |
|---|---|---|---|
| REQ-AUTH-01 | User registration with validation | TC-AUTH-001–004 | ✅ |
| REQ-AUTH-02 | Login with credentials; deactivated users blocked | TC-AUTH-005–008, 010 | ✅ |
| REQ-AUTH-03 | Brute-force protection / lockout | TC-AUTH-009 | ⚠️ policy unknown (B-03) |
| REQ-AUTH-04 | Session/token lifecycle and logout | TC-AUTH-011–013 | ⚠️ expiry duration unknown (B-04) |
| REQ-AUTH-05 | Password reset | TC-AUTH-014–016 | ⚠️ existence unconfirmed (B-05) |
| REQ-AUTH-06 | Profile management | TC-AUTH-022 | ⚠️ |
| REQ-PERM-01 | Role-based access control enforced on UI and API | TC-AUTH-017–019 + Section 3.1 matrix | ⚠️ role matrix unconfirmed (B-01) |
| REQ-PERM-02 | No self privilege escalation | TC-AUTH-020 | ✅ |
| REQ-PERM-03 | Admin role management takes effect | TC-AUTH-021 | ⚠️ |
| REQ-CRS-01 | Course listing | TC-CRS-001 | ✅ |
| REQ-CRS-02 | Course detail and material listing | TC-CRS-002, 017, 018 | ✅ |
| REQ-CRS-03 | Material view/download restricted by enrolment | TC-CRS-003–005 | ✅ |
| REQ-CRS-04 | Material upload with type/size validation, owner-only | TC-CRS-006–012 | ⚠️ limits unknown (B-07) |
| REQ-CRS-05 | Material edit/delete | TC-CRS-013 | ✅ |
| REQ-CRS-06 | Enrolment management | TC-CRS-014–016 | ⚠️ enrolment model unclear (B-02) |
| REQ-PAP-01 | Paper submission with validation | TC-PAP-001–004, 006 | ⚠️ fields/limits unknown (B-07) |
| REQ-PAP-02 | Duplicate-submission prevention | TC-PAP-005 | ⚠️ |
| REQ-PAP-03 | Author sees only own submissions/status | TC-PAP-007–008 | ✅ |
| REQ-PAP-04 | Moderation queue (moderator-only) | TC-PAP-009–010 | ✅ |
| REQ-PAP-05 | Approve paper | TC-PAP-011, 014–016 | ⚠️ COI rule unknown (B-08) |
| REQ-PAP-06 | Reject paper with reason | TC-PAP-012–013 | ⚠️ reason mandatory? (B-08) |
| REQ-PAP-07 | Resubmission/edit rules | TC-PAP-017–018 | ⚠️ workflow undefined (B-09) |
| REQ-PAP-08 | Visibility by status | TC-PAP-019 | ✅ |
| REQ-PAP-09 | Moderation audit trail | TC-PAP-020 | ⚠️ |
| REQ-QR-01 | QR generation for approved items | TC-QR-001–002, 017 | ⚠️ QR purpose unclear (B-06) |
| REQ-QR-02 | Public QR verification | TC-QR-003–006, 014, 016 | ⚠️ |
| REQ-QR-03 | QR revocation (authorised roles only) | TC-QR-007–012 | ✅ |
| REQ-QR-04 | Re-activation / regeneration rules | TC-QR-013 | ❌ undefined (B-06) |
| REQ-QR-05 | Verification page exposes only public data | TC-QR-015 | ⚠️ field list unknown |
| REQ-SRCH-01 | Keyword search | TC-SRCH-001–003, 008 | ✅ |
| REQ-SRCH-02 | Filters | TC-SRCH-004 | ⚠️ filters unknown (B-10) |
| REQ-SRCH-03 | Search respects permissions/status | TC-SRCH-005–007 | ✅ |
| REQ-SRCH-04 | Query validation/sanitisation | TC-SRCH-009–010 | ✅ |
| REQ-SRCH-05 | Pagination/sorting | TC-SRCH-011 | ⚠️ |
| REQ-SRCH-06 | Index freshness | TC-SRCH-012–013 | ⚠️ SLA unknown (B-10) |
| REQ-QZ-01 | Quiz creation (owner instructor) | TC-QZ-001–005, 020 | ✅ |
| REQ-QZ-02 | Quiz access for enrolled students; no answer leakage | TC-QZ-006–009, 019 | ✅ |
| REQ-QZ-03 | Submission and scoring | TC-QZ-010–012 | ✅ |
| REQ-QZ-04 | Time and attempt limits | TC-QZ-013–015 | ⚠️ rules unconfirmed (B-11) |
| REQ-QZ-05 | Results/feedback | TC-QZ-016–017 | ⚠️ |
| REQ-QZ-06 | Instructor result statistics | TC-QZ-018 | ⚠️ |
| REQ-QZ-07 | Question types | TC-QZ-021 | ⚠️ types unknown (B-11) |
| REQ-API-01/02 | API conformance & error handling | TC-API-001–003 | ⚠️ spec needed |
| REQ-NFR-01–04 | Security, responsive, accessibility, performance | TC-API-004–007 | ⚠️ thresholds undefined (B-12) |

---

## 5. Defect Reporting

### 5.1 Severity & Priority

| Severity | Definition | Example |
|---|---|---|
| **S1 – Critical** | Security breach, data loss, or core workflow completely broken; no workaround | Student can approve papers; revoked QR verifies as valid |
| **S2 – Major** | Major feature fails or wrong behaviour; workaround is difficult | Quiz score calculated incorrectly |
| **S3 – Minor** | Feature partly affected; workaround exists | Filter resets after pagination |
| **S4 – Trivial** | Cosmetic, text, minor UI | Typo, misalignment |

| Priority | Meaning |
|---|---|
| P1 | Fix before release / blocks testing |
| P2 | Fix in current release |
| P3 | Fix when capacity allows |

### 5.2 Defect Template (copy into a GitHub issue)

```markdown
**Title:** [Area] Short, specific description (e.g. [QR] Revoked QR still shows "Valid")

**Defect ID / Issue #:**
**Reported by:** 
**Date:** 
**Build / Version / Commit:** 
**Environment:** (Staging / URL, browser + version, OS, device)

**Severity:** S1 / S2 / S3 / S4
**Priority:** P1 / P2 / P3
**Related test case(s):** TC-XXX-000
**Related requirement(s):** REQ-XXX-00

**Role / account used:** (Guest / Student / ...)

**Preconditions:**
- 

**Steps to reproduce:**
1. 
2. 
3. 

**Expected result:**

**Actual result:**

**Reproducibility:** Always / Intermittent (x of y) / Once

**Evidence:** (screenshots, screen recording, API request/response, console/server logs)

**Workaround (if any):**

**Additional notes:**
```

### 5.3 Defect Lifecycle
`New → Triaged → Assigned → In Progress → Fixed → Ready for Retest → Verified → Closed`
Alternate end states: `Rejected (not a defect)`, `Duplicate`, `Deferred`, `Reopened` (retest failed).

Suggested labels: `bug`, `qa`, `sev-1…sev-4`, `area-auth`, `area-course`, `area-paper`, `area-qr`, `area-search`, `area-quiz`, `blocked`.

### 5.4 Test Execution Log Template

| Test case ID | Date | Tester | Build | Env | Result (Pass/Fail/Blocked/Skip) | Defect # | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

---

## 6. Entry / Exit Criteria

### Entry criteria
- Requirements, API spec and workflow docs are approved and versioned; `REQ-*` IDs mapped (Section 4 updated).
- Build deployed to QA environment and smoke test (login, load course list, search) passes.
- Test accounts and seed data are available (Section 2).
- Blockers rated "Critical" in Section 7 are resolved or have an agreed workaround.

### Exit criteria
- 100% of P1 test cases executed; ≥ 95% of all planned cases executed.
- 100% pass rate on P1 role/permission and security cases.
- No open S1 or S2 defects; any open S3/S4 defects are accepted by the product owner and documented.
- All requirements show coverage status in Section 4; uncovered items have documented justification.
- Regression of P1 cases passes on the release candidate.
- Test summary report (pass/fail counts, open defects, residual risk) is shared.

### Suspension / resumption
Testing is suspended if the environment is unavailable, login is broken, or smoke test fails; resumed after a fix build passes smoke testing.

---

## 7. Blockers and Open Questions

| # | Area | Blocker / question | Impact | Severity | Owner (suggested) |
|---|---|---|---|---|---|
| B-00 | All | Approved requirements, API spec, architecture and workflow docs were not available when this draft was written; all `REQ-*` IDs, endpoints and expected results are assumed | All cases need re-baselining | **Critical** | Product / Tech lead |
| B-01 | Auth | Final role list and permission matrix (Section 3.1) not confirmed | Role tests may be wrong or missing | **Critical** | Product |
| B-02 | Course | How are enrolments created (self, instructor, admin, automatic by university data)? Are courses public or private? | Cannot finalise access tests | High | Product |
| B-03 | Auth | Lockout/throttling policy (attempts, duration) undefined | TC-AUTH-009 not executable | Medium | Product / Dev |
| B-04 | Auth | Token/session lifetime, refresh behaviour undefined | Expiry tests need values | Medium | Dev |
| B-05 | Auth | Is password reset / email verification / SSO (e.g. university login) in scope? | Possible missing or irrelevant cases | High | Product |
| B-06 | QR | What does the QR code represent (approved paper, certificate, user credential)? Does it expire? Can it be re-activated? Who can revoke? What data does verification display? | QR cases (TC-QR-*) partly unverifiable | **Critical** | Product / Dev |
| B-07 | Upload | Allowed file types, max size, and required submission fields not defined | Validation boundary values unknown | High | Product |
| B-08 | Moderation | Is a rejection reason mandatory? Conflict-of-interest rule? Multiple-moderator workflow? Are notifications in scope? | TC-PAP-013/014/016 unverifiable | High | Product |
| B-09 | Paper | Resubmission/versioning workflow and status model undefined | TC-PAP-017/018 unverifiable | Medium | Product |
| B-10 | Search | Searchable fields, filters, ranking, indexing delay, and language support not defined | Search expected results unclear | Medium | Product / Dev |
| B-11 | Quiz | Question types, time/attempt rules, review policy (when answers are revealed), and editing after attempts not defined | Quiz expected results unclear | High | Product |
| B-12 | NFR | No measurable performance, accessibility (e.g. WCAG level), browser support or availability targets | NFR cases cannot pass/fail objectively | Medium | Product |
| B-13 | Env | No QA environment URL, seed-data scripts or mail sandbox confirmed | Cannot execute | **Critical** | DevOps |
| B-14 | API | Standard error response format and status-code conventions not documented | Negative-case expected results are assumed | Medium | Dev |
| B-15 | Data | Privacy/retention rules (account deletion, audit-log retention) undefined | Cannot test deletion/retention | Low | Product |

---

## 8. Pull Request Description

**Title:** `docs(qa): add TuStudyHub QA test plan, test cases and coverage checklist`

**Summary**
Adds the QA plan covering scope, approach, environment assumptions, entry/exit criteria and defect reporting; test cases for auth/permissions, courses/materials, paper submission and moderation, QR verification/revocation, search and quizzes; a requirement-to-test coverage checklist; and a blockers list.

**Files**
- `docs/qa/TuStudyHub_QA_Plan.md`

**Reviewer notes**
- Requirement IDs and expected results are assumptions pending the approved spec (see Section 7, B-00). Please review the blockers and confirm/replace the `REQ-*` mappings.
- Please confirm the role matrix (Section 3.1).

**Checklist**
- [ ] Test cases map to requirements or workflows
- [ ] Positive and negative scenarios included
- [ ] Role/permission boundaries covered
- [ ] Expected results are clear and verifiable
- [ ] Untestable or unclear requirements recorded as blockers
- [ ] Defect template included

Closes #<issue-number>
