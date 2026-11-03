# TuStudyHub — REST API Specification

| Field | Value |
|---|---|
| Document type | API Specification |
| Status | Proposed — pending team review |
| API designer | Darius |
| Reviewer | Princeton (Project Lead) |
| Architecture owner | Comfort |
| API version | v1 (first release) |
| Related documents | ARCHITECTURE.md, SYSTEM_DESIGN_DOCUMENT.md, REQUIREMENTS.md, DATA_MODEL.md |
| Machine-readable contract | `docs/api/openapi.yaml` |

> **Review note.** This contract was derived from the Architecture Specification. `REQUIREMENTS.md`, `DATA_MODEL.md`, and the previous `API_SPECIFICATION.md` were not available when drafting. Field names, enumerations, and limits are therefore **provisional** and must be reconciled with `DATA_MODEL.md` before approval. Anything not confirmed is marked **[PENDING]** and listed in Section 14. Nothing marked pending should be implemented as if it were decided.

---

## 1. Conventions

### 1.1 Base URL and versioning
- Base path: `/api/v1`. All traffic must use HTTPS.
- Breaking changes require a new version path (`/api/v2`).

### 1.2 Format
- Requests and responses use `application/json; charset=utf-8`, except paper upload (`multipart/form-data`) and file download (binary).
- Field names use `snake_case`. Identifiers are opaque strings (ID format **[PENDING]**: UUID vs integer, per DATA_MODEL.md).
- Timestamps use ISO 8601 in UTC, e.g. `2026-11-01T09:30:00Z`.

### 1.3 Authentication
- Protected endpoints require `Authorization: Bearer <access_token>`.
- Token type, lifetime, and refresh strategy are **[PENDING]** (see Section 14).
- Authorization is always enforced on the server. Frontend visibility of a button is never a security control.

### 1.4 Roles
`student`, `contributor`, `lecturer`, `moderator`, `administrator`. A higher-privilege role does not automatically inherit others unless stated; the final permission matrix is **[PENDING]**. The "Access" column below states the minimum proposed rule.

### 1.5 Access notation
| Symbol | Meaning |
|---|---|
| Public | No authentication required |
| Auth | Any authenticated, active user |
| Contributor | `contributor`, `lecturer`, `moderator`, `administrator` |
| Lecturer | `lecturer` (and approved authors **[PENDING]**), `administrator` |
| Moderator | `moderator`, `administrator` |
| Admin | `administrator` |

### 1.6 Pagination
List endpoints accept `page` (default `1`) and `page_size` (default `20`, max `100`; final values **[PENDING]**).

```json
{
  "data": [ ],
  "meta": { "page": 1, "page_size": 20, "total_items": 134, "total_pages": 7 }
}
```

### 1.7 Success envelope
- Single resource: `{ "data": { ... } }`
- List: `{ "data": [ ... ], "meta": { ... } }`
- `204 No Content` responses have no body.

### 1.8 Error format
All errors use one structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "email", "issue": "must be a valid email address" }
    ],
    "request_id": "req_8f3a1c"
  }
}
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON or missing required parameter |
| 401 | `UNAUTHENTICATED` | Missing, invalid, or expired token |
| 403 | `FORBIDDEN` | Authenticated but not permitted, or account suspended |
| 404 | `NOT_FOUND` | Resource does not exist or is not visible to the caller |
| 409 | `CONFLICT` | Duplicate resource or invalid state transition |
| 413 | `PAYLOAD_TOO_LARGE` | Upload exceeds size limit |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Disallowed file type |
| 422 | `VALIDATION_ERROR` | Well-formed request with invalid field values |
| 429 | `RATE_LIMITED` | Too many requests; `Retry-After` header is returned |
| 500 | `INTERNAL_ERROR` | Unexpected server error (no internal details exposed) |

Responses must never include stack traces, passwords, tokens, or storage paths.

### 1.9 Rate limiting
Rate limits apply to all endpoints, with stricter limits on login, registration, password reset, upload, and verification. Numeric limits are **[PENDING]**. Limited responses return `429` with `Retry-After`.

### 1.10 Common request headers
| Header | Notes |
|---|---|
| `Authorization` | Required on protected endpoints |
| `Content-Type` | `application/json` or `multipart/form-data` (upload) |
| `Accept-Language` | Optional; localisation is **[PENDING]** |

---

## 2. Paper lifecycle (shared by several workflows)

Proposed `status` values for a paper:

| Status | Meaning | Visible in public browse/search |
|---|---|---|
| `pending_review` | Submitted, awaiting moderator decision | No (owner and moderators only) |
| `approved` | Reviewed and accepted; has a verification identifier and stamp | Yes |
| `rejected` | Reviewed and declined, with reason | No (owner and moderators only) |
| `revoked` | Previously approved, later withdrawn | No; verification reports it as revoked |

Allowed transitions: `pending_review → approved | rejected`; `approved → revoked`. Any other transition returns `409 CONFLICT`. Whether rejected papers can be resubmitted, and whether a revoked paper can be reinstated, is **[PENDING]**.

`verification_status` (public-facing) is derived from `status`: `verified` when `approved`, `revoked` when `revoked`, otherwise not exposed publicly.

---

## 3. Endpoint summary

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 1 | POST | `/auth/register` | Create account | Public |
| 2 | POST | `/auth/login` | Obtain access token | Public |
| 3 | POST | `/auth/logout` | Invalidate session | Auth |
| 4 | POST | `/auth/refresh` | Refresh token **[PENDING]** | Public (refresh token) |
| 5 | POST | `/auth/password-reset/request` | Start account recovery | Public |
| 6 | POST | `/auth/password-reset/confirm` | Complete account recovery | Public |
| 7 | GET | `/users/me` | Current profile | Auth |
| 8 | PATCH | `/users/me` | Update own profile | Auth |
| 9 | GET | `/users` | List users | Admin |
| 10 | GET | `/users/{user_id}` | Get a user | Admin |
| 11 | PATCH | `/users/{user_id}/role` | Change role | Admin |
| 12 | PATCH | `/users/{user_id}/status` | Activate/suspend account | Admin |
| 13 | GET | `/courses` | List courses | Auth* |
| 14 | POST | `/courses` | Create course | Admin |
| 15 | GET | `/courses/{course_id}` | Get course | Auth* |
| 16 | PATCH | `/courses/{course_id}` | Update course | Admin |
| 17 | DELETE | `/courses/{course_id}` | Remove course | Admin |
| 18 | GET | `/papers` | Browse and search approved papers | Auth* |
| 19 | POST | `/papers` | Submit paper with file | Contributor |
| 20 | GET | `/papers/{paper_id}` | Paper details | Auth* |
| 21 | PATCH | `/papers/{paper_id}` | Edit paper metadata | Owner / Moderator |
| 22 | DELETE | `/papers/{paper_id}` | Remove paper | Owner (pending only) / Admin |
| 23 | GET | `/papers/{paper_id}/file` | Download file | Auth* |
| 24 | GET | `/users/me/papers` | Own submissions | Contributor |
| 25 | GET | `/moderation/papers` | Review queue | Moderator |
| 26 | POST | `/papers/{paper_id}/review` | Approve or reject | Moderator |
| 27 | POST | `/papers/{paper_id}/revoke` | Revoke verified paper | Moderator |
| 28 | GET | `/verify/{identifier}` | Public QR verification | Public |
| 29 | POST | `/papers/{paper_id}/reports` | Report a paper | Auth |
| 30 | GET | `/reports` | List reports | Moderator |
| 31 | GET | `/reports/{report_id}` | Report details | Moderator |
| 32 | PATCH | `/reports/{report_id}` | Resolve report | Moderator |
| 33 | GET | `/quizzes` | List quizzes | Auth* |
| 34 | POST | `/quizzes` | Create quiz | Lecturer |
| 35 | GET | `/quizzes/{quiz_id}` | Get quiz to take | Auth* |
| 36 | PATCH | `/quizzes/{quiz_id}` | Update quiz | Quiz author / Admin |
| 37 | DELETE | `/quizzes/{quiz_id}` | Delete quiz | Quiz author / Admin |
| 38 | POST | `/quizzes/{quiz_id}/attempts` | Submit answers, get score | Auth |
| 39 | GET | `/quizzes/{quiz_id}/attempts` | Own attempts for a quiz | Auth |
| 40 | GET | `/users/me/quiz-attempts` | Own score history | Auth |
| 41 | GET | `/audit-logs` | Audit records | Admin |
| 42 | GET | `/health` | Service health | Public |

\* Whether anonymous (logged-out) browsing of courses, papers, and quizzes is allowed is **[PENDING]**. This draft requires authentication. Only `/verify/{identifier}` and `/health` are public.

---

## 4. Identity and access

### 4.1 `POST /auth/register`
Creates an account. Access: Public.

Request:
```json
{
  "full_name": "Ama Mensah",
  "email": "ama@example.edu",
  "password": "S3cure-passphrase!",
  "student_number": "optional"
}
```
Validation: `email` valid and unique; `password` meets policy (**[PENDING]**: minimum length/complexity); `full_name` required, 1–120 chars. New accounts receive role `student`. Email verification before login is **[PENDING]**.

Responses:
- `201 Created`
```json
{ "data": { "user_id": "usr_1", "full_name": "Ama Mensah", "email": "ama@example.edu", "role": "student", "status": "active", "created_at": "2026-11-01T09:30:00Z" } }
```
- `409 CONFLICT` email already registered (a generic message may be used to avoid account enumeration; **[PENDING]**), `422`, `429`.

### 4.2 `POST /auth/login`
Access: Public.

Request: `{ "email": "...", "password": "..." }`

- `200 OK`
```json
{ "data": { "access_token": "<token>", "token_type": "Bearer", "expires_in": 900, "user": { "user_id": "usr_1", "role": "student" } } }
```
- `401 UNAUTHENTICATED` wrong credentials (same message for unknown email and wrong password).
- `403 FORBIDDEN` account suspended or deactivated.
- `422`, `429`.

### 4.3 `POST /auth/logout`
Access: Auth. Invalidates the current session or token (mechanism **[PENDING]**). Response `204`. `401` if not authenticated.

### 4.4 `POST /auth/refresh` **[PENDING]**
Included only if a refresh-token strategy is adopted. Request `{ "refresh_token": "..." }`; `200` returns a new access token; `401` if invalid or expired.

### 4.5 `POST /auth/password-reset/request`
Access: Public. Request `{ "email": "..." }`. Always returns `202 Accepted` regardless of whether the email exists. `429` when limited. Delivery channel is email (**[PENDING]**: provider).

### 4.6 `POST /auth/password-reset/confirm`
Access: Public. Request `{ "token": "...", "new_password": "..." }`. `204` on success; `400` invalid or expired token; `422` weak password.

### 4.7 `GET /users/me`
Access: Auth. `200`:
```json
{ "data": { "user_id": "usr_1", "full_name": "Ama Mensah", "email": "ama@example.edu", "role": "student", "status": "active", "created_at": "2026-11-01T09:30:00Z" } }
```

### 4.8 `PATCH /users/me`
Access: Auth. Body (any subset): `full_name`, `password` with `current_password`. Users cannot change their own `role` or `status`. `200` returns updated user; `403` if attempting restricted fields; `422`.

### 4.9 `GET /users`
Access: Admin. Query: `role`, `status`, `q` (name/email), `page`, `page_size`. `200` list of user objects.

### 4.10 `GET /users/{user_id}`
Access: Admin. `200` user; `404`.

### 4.11 `PATCH /users/{user_id}/role`
Access: Admin. Request `{ "role": "moderator" }`. `200` updated user; `404`; `422` invalid role. Recorded in audit log.

### 4.12 `PATCH /users/{user_id}/status`
Access: Admin. Request `{ "status": "suspended", "reason": "optional" }`. Allowed statuses: `active`, `suspended` (further states **[PENDING]**). `200`; `404`; `422`. Recorded in audit log.

---

## 5. Course catalogue

Course object:
```json
{ "course_id": "crs_1", "code": "CSC201", "title": "Data Structures", "created_at": "2026-11-01T09:30:00Z" }
```
Additional attributes (department, level, faculty) are **[PENDING]** per DATA_MODEL.md. Student enrollment is out of first-release scope and has no endpoints.

| Endpoint | Behaviour | Success | Errors |
|---|---|---|---|
| `GET /courses` | Query: `q` (code/title), `page`, `page_size` | `200` list | 401, 422 |
| `POST /courses` | Body: `code` (unique), `title` | `201` course | 401, 403, 409, 422 |
| `GET /courses/{course_id}` | Single course | `200` | 401, 404 |
| `PATCH /courses/{course_id}` | Body: `code`, `title` (subset) | `200` | 401, 403, 404, 409, 422 |
| `DELETE /courses/{course_id}` | Blocked if papers/quizzes exist, `409` | `204` | 401, 403, 404, 409 |

Delete vs. archive behaviour for courses with linked materials is **[PENDING]**.

---

## 6. Papers and files

Paper object:
```json
{
  "paper_id": "pap_1",
  "course": { "course_id": "crs_1", "code": "CSC201", "title": "Data Structures" },
  "title": "CSC201 End of Semester Exam",
  "academic_year": "2024/2025",
  "semester": "1",
  "exam_type": "final",
  "file": { "mime_type": "application/pdf", "size_bytes": 482133, "page_count": null },
  "status": "approved",
  "verification_status": "verified",
  "verification_identifier": "TSH-2026-000123",
  "submitted_by": { "user_id": "usr_7", "full_name": "K. Owusu" },
  "submitted_at": "2026-11-01T09:30:00Z",
  "reviewed_at": "2026-11-02T10:00:00Z"
}
```
Notes:
- `verification_identifier` and `reviewed_at` are `null` until approval.
- `semester` and `exam_type` enumerations (e.g. `mid_semester`, `final`, `quiz`, `resit`) are **[PENDING]** per DATA_MODEL.md.
- `submitted_by` is shown only to the owner and moderators, unless the team decides contributor names are public (**[PENDING]**).
- The `file` object never exposes storage paths or direct storage URLs.

### 6.1 `GET /papers` — browse and search
Access: Auth. Returns only `approved` papers to normal users. Moderators may add `status`.

Query parameters (all optional, combined with AND):

| Param | Type | Description |
|---|---|---|
| `q` | string | Keyword search across title and course code/title |
| `course_id` | string | Filter by course |
| `academic_year` | string | e.g. `2024/2025` |
| `semester` | string | See enumeration (pending) |
| `exam_type` | string | See enumeration (pending) |
| `verification_status` | string | `verified` (default for public results) |
| `sort` | string | `submitted_at`, `-submitted_at` (default), `academic_year`, `title` |
| `status` | string | Moderator/Admin only |
| `page`, `page_size` | int | Pagination |

Responses: `200` list with `meta`; `401`; `422` invalid filter value. A dedicated search index is not in scope; this endpoint covers search for the first release.

### 6.2 `POST /papers` — submit
Access: Contributor. Content type `multipart/form-data`.

| Part | Type | Required | Notes |
|---|---|---|---|
| `file` | binary | Yes | PDF or image (`image/jpeg`, `image/png`); max size **[PENDING]** |
| `course_id` | string | Yes | Must exist |
| `title` | string | Yes | 3–200 chars |
| `academic_year` | string | Yes | Format `YYYY/YYYY` |
| `semester` | string | Yes | |
| `exam_type` | string | Yes | |

Responses:
- `201 Created` with the paper object, `status: "pending_review"`.
- `401`, `403`, `404` (unknown course), `413`, `415`, `422`, `429`.
- `409` if a duplicate is detected (duplicate checks may run in background; behaviour **[PENDING]**: reject immediately vs. flag for moderator).
- Multi-file or multi-page image submissions are **[PENDING]**.

### 6.3 `GET /papers/{paper_id}`
Access: Auth. Non-approved papers are visible only to the owner and moderators; others receive `404`. `200` paper object; `401`; `404`.

### 6.4 `PATCH /papers/{paper_id}`
Access: Owner while `pending_review`; Moderator/Admin at any time. Body (subset): `title`, `course_id`, `academic_year`, `semester`, `exam_type`. The file cannot be replaced through this endpoint (replacement flow **[PENDING]**). `200`; `401`; `403`; `404`; `409` if status disallows edits; `422`. Edits to approved papers are audit-logged.

### 6.5 `DELETE /papers/{paper_id}`
Access: Owner (only while `pending_review`); Admin. `204`; `401`; `403`; `404`; `409`. Deleting an approved paper is not supported; use revoke (Section 8). Whether deletion is hard or soft is **[PENDING]**.

### 6.6 `GET /papers/{paper_id}/file`
Access: Auth, subject to the same visibility rules as 6.3. Streams the file with `Content-Type` and `Content-Disposition`. `200`; `401`; `403`; `404`. Access is checked on every request; file URLs must not bypass authorization. Supports low-bandwidth use via `Range` requests (`206 Partial Content`) — support level **[PENDING]**. Whether download of approved papers is permitted for anonymous users is **[PENDING]**.

### 6.7 `GET /users/me/papers`
Access: Contributor. Query: `status`, `page`, `page_size`. `200` list of own submissions with any rejection reason.

---

## 7. Moderation and review

### 7.1 `GET /moderation/papers`
Access: Moderator. Query: `status` (default `pending_review`), `course_id`, `sort` (oldest first by default), `page`, `page_size`. `200` list. Advanced queue features (assignment, priority, appeals) are **[PENDING]** and not part of this contract.

### 7.2 `POST /papers/{paper_id}/review`
Access: Moderator. Request:
```json
{ "decision": "approve", "reason": "Meets requirements" }
```
- `decision`: `approve` or `reject`.
- `reason` is required when `decision` is `reject`; optional for approve.

On `approve` the server assigns a unique `verification_identifier`, sets `status: "approved"`, and makes the stamp/QR available. On `reject` it sets `status: "rejected"` and stores the reason.

`200 OK`:
```json
{ "data": { "paper_id": "pap_1", "status": "approved", "verification_identifier": "TSH-2026-000123", "reviewed_by": "usr_3", "reviewed_at": "2026-11-02T10:00:00Z" } }
```
Errors: `401`, `403`, `404`, `409` (paper not in `pending_review`), `422`. A moderator reviewing their own submission is **[PENDING]** (proposed: `403`). The decision is audit-logged.

---

## 8. QR verification and revocation

### 8.1 `GET /verify/{identifier}`
Access: Public. Used by the QR code on the stamp. Returns the **current authoritative** status, only with fields approved for public access.

`200 OK` (verified):
```json
{
  "data": {
    "verification_identifier": "TSH-2026-000123",
    "verification_status": "verified",
    "course_code": "CSC201",
    "title": "CSC201 End of Semester Exam",
    "academic_year": "2024/2025",
    "semester": "1",
    "exam_type": "final",
    "verified_at": "2026-11-02T10:00:00Z"
  }
}
```

`200 OK` (revoked): same identifier with `"verification_status": "revoked"`, `revoked_at`, and no paper metadata beyond the identifier.

`404 NOT_FOUND`: identifier unknown. `429` when rate limited.

Rules:
- Revoked papers must never return `verified`.
- Public responses exclude uploader identity, reviewer identity, internal IDs, file locations, and revocation reasons.
- Whether a revoked identifier returns `200` with `revoked` (proposed) or `404` is **[PENDING]**.
- Identifier format and whether QR encodes the API URL or a web page URL are **[PENDING]**.

### 8.2 `POST /papers/{paper_id}/revoke`
Access: Moderator. Request: `{ "reason": "Found to be a duplicate of an unverified source" }` (required, 5–500 chars).

`200 OK`:
```json
{ "data": { "paper_id": "pap_1", "status": "revoked", "revoked_by": "usr_3", "revoked_at": "2026-11-05T08:00:00Z" } }
```
Errors: `401`, `403`, `404`, `409` (paper not `approved`), `422`. Effects: paper is removed from browse/search and downloads, and verification reports `revoked` immediately. Audit-logged. Reinstatement is **[PENDING]**.

---

## 9. Reporting

Report object:
```json
{ "report_id": "rep_1", "paper_id": "pap_1", "reason_code": "incorrect_content", "details": "Question 3 is missing.", "status": "open", "reported_by": "usr_9", "created_at": "2026-11-03T12:00:00Z", "resolved_at": null, "resolution": null }
```
`reason_code` enumeration (e.g. `incorrect_content`, `copyright`, `duplicate`, `inappropriate`, `other`) is **[PENDING]**. Report `status`: `open`, `resolved`, `dismissed`.

| Endpoint | Access | Behaviour | Success | Errors |
|---|---|---|---|---|
| `POST /papers/{paper_id}/reports` | Auth | Body: `reason_code`, `details` (≤1000 chars) | `201` | 401, 404, 409 (duplicate open report by same user), 422, 429 |
| `GET /reports` | Moderator | Query: `status`, `paper_id`, `page`, `page_size` | `200` list | 401, 403 |
| `GET /reports/{report_id}` | Moderator | Single report | `200` | 401, 403, 404 |
| `PATCH /reports/{report_id}` | Moderator | Body: `status` (`resolved`/`dismissed`), `resolution` note | `200` | 401, 403, 404, 409, 422 |

Taking action on the paper (e.g. revoke) uses endpoint 8.2; resolving a report does not change paper status automatically (**[PENDING]**).

---

## 10. Quizzes

Quiz object (for taking; correct answers are never included):
```json
{
  "quiz_id": "qz_1",
  "course_id": "crs_1",
  "title": "Stacks and Queues",
  "created_by": "usr_2",
  "question_count": 2,
  "questions": [
    { "question_id": "q_1", "text": "Which structure is LIFO?", "options": [ { "option_id": "o_1", "text": "Stack" }, { "option_id": "o_2", "text": "Queue" } ] }
  ],
  "created_at": "2026-11-01T09:30:00Z"
}
```
Only multiple-choice questions are in scope. Single vs. multiple correct answers per question, time limits, and question randomisation are **[PENDING]**; this draft assumes exactly one correct option per question.

### 10.1 `GET /quizzes`
Access: Auth. Query: `course_id`, `q`, `page`, `page_size`. `200` list (without `questions`).

### 10.2 `POST /quizzes`
Access: Lecturer. Request (author view includes answers):
```json
{
  "course_id": "crs_1",
  "title": "Stacks and Queues",
  "questions": [
    { "text": "Which structure is LIFO?", "options": [ { "text": "Stack", "is_correct": true }, { "text": "Queue", "is_correct": false } ] }
  ]
}
```
Validation: at least 1 question; each question has 2–6 options (limits **[PENDING]**) and exactly one `is_correct: true`. Responses: `201` (author view); `401`; `403`; `404` unknown course; `422`.

### 10.3 `GET /quizzes/{quiz_id}`
Access: Auth. Students receive the quiz without `is_correct`. The quiz author and Admin receive the author view. `200`; `401`; `404`.

### 10.4 `PATCH /quizzes/{quiz_id}` and 10.5 `DELETE /quizzes/{quiz_id}`
Access: quiz author or Admin. PATCH accepts `title`, `questions` (full replacement). Editing a quiz that already has attempts: behaviour **[PENDING]** (proposed: allowed; past scores unchanged). `200` / `204`; `401`; `403`; `404`; `422`.

### 10.6 `POST /quizzes/{quiz_id}/attempts`
Access: Auth. Submits answers and returns the marked result in one call.

Request:
```json
{ "answers": [ { "question_id": "q_1", "option_id": "o_1" } ] }
```
Validation: each `question_id` belongs to the quiz; each `option_id` belongs to that question; no duplicate questions. Unanswered questions score zero.

`201 Created`:
```json
{
  "data": {
    "attempt_id": "att_1",
    "quiz_id": "qz_1",
    "score": 1,
    "total": 2,
    "percentage": 50.0,
    "submitted_at": "2026-11-03T12:00:00Z",
    "results": [ { "question_id": "q_1", "selected_option_id": "o_1", "correct": true } ]
  }
}
```
Whether `results` reveals the correct option for wrong answers is **[PENDING]**. Errors: `401`, `404`, `422`, `429`. Retake limits are **[PENDING]**.

### 10.7 `GET /quizzes/{quiz_id}/attempts`
Access: Auth. Own attempts for the quiz, newest first. `200` list; `401`; `404`.

### 10.8 `GET /users/me/quiz-attempts`
Access: Auth. Own score history across quizzes. Query: `quiz_id`, `course_id`, `page`, `page_size`. `200` list of attempt summaries (no per-question detail). Lecturer-side views of student results are **[PENDING]** and not specified.

---

## 11. Audit records

### 11.1 `GET /audit-logs`
Access: Admin. Query: `event_type`, `actor_id`, `target_type`, `target_id`, `from`, `to`, `page`, `page_size`.

`200`:
```json
{ "data": [ { "audit_id": "aud_1", "event_type": "paper.revoked", "actor_id": "usr_3", "target_type": "paper", "target_id": "pap_1", "occurred_at": "2026-11-05T08:00:00Z", "metadata": { "reason": "duplicate" } } ], "meta": { } }
```
Proposed `event_type` values: `user.role_changed`, `user.status_changed`, `paper.approved`, `paper.rejected`, `paper.revoked`, `paper.edited`, `paper.deleted`, `report.resolved`. Audit records are read-only through the API and must never contain passwords or tokens. Retention is **[PENDING]**.

---

## 12. Operational endpoint

### 12.1 `GET /health`
Access: Public. `200 {"status":"ok"}` if the service can serve requests; `503` otherwise. Must not expose versions, hostnames, or dependency details.

---

## 13. Traceability to the architecture

| Architecture module | API sections |
|---|---|
| 3.1 Identity and Access | 4 |
| 3.2 Course Catalogue | 5 |
| 3.3 Paper and File Management | 6 |
| 3.4 Review and Verification | 7, 8 |
| 3.5 Search and Discovery | 6.1 |
| 3.6 Quiz Service | 10 |
| 3.7 Reporting and Moderation | 7, 9 |
| 3.8 Audit Records | 11 |

Excluded from this contract (optional or unconfirmed per Architecture Section 8): dedicated search index, notifications/webhooks, advanced moderation queues and appeals, reputation and ratings, offline reading, additional clients, student enrollment.

---

## 14. Unresolved API decisions

| # | Decision | Needed from | Proposed default |
|---|---|---|---|
| 1 | Reconcile all field names, enums, and ID format with `DATA_MODEL.md` | Comfort / Darius | Use data model as source of truth |
| 2 | Token mechanism, lifetime, refresh, logout invalidation | Team | Short-lived bearer token + refresh token |
| 3 | Final permission matrix; are approved quiz authors a separate role? | Princeton | Table in 1.5 |
| 4 | Is anonymous browsing/download of approved papers allowed? | Princeton | Authentication required |
| 5 | Password policy and email verification before login | Team | Min 8 chars; email verification pending |
| 6 | Upload limits (size, count, MIME list) and multi-page image submissions | Team | PDF/JPEG/PNG, single file |
| 7 | Duplicate detection behaviour (reject vs. flag) and background-job status endpoint | Team | Flag for moderator |
| 8 | Allowed values for `semester`, `exam_type`, report `reason_code` | Data model owner | See Section 6 and 9 |
| 9 | Rejected-paper resubmission and revoked-paper reinstatement | Princeton | Resubmit as new paper; no reinstatement |
| 10 | Verification response for revoked/removed items (`200 revoked` vs `404`), identifier format, QR target | Team | `200` with `revoked` |
| 11 | Moderator reviewing own submission | Princeton | Forbidden |
| 12 | Hard vs. soft delete for papers and courses | Team | Soft delete |
| 13 | Rate-limit numbers per endpoint group | Infrastructure | TBD from load estimates |
| 14 | Pagination default/max values | Team | 20 / 100 |
| 15 | Quiz rules: multi-answer, time limits, retake limits, editing after attempts, revealing correct answers | Lecturers / Team | One correct answer; reveal after submit |
| 16 | Lecturer view of student quiz results | Team | Out of scope |
| 17 | `Range`/partial download support for low-bandwidth use | Team | Support `Range` on file download |
| 18 | Audit event list and retention period | Team | Section 11 list |
| 19 | Whether resolving a report can auto-revoke the paper | Princeton | No; separate action |
| 20 | Localisation (`Accept-Language`) | Team | Out of scope |

---

## 15. Review checklist

- [ ] Every endpoint has method, path, purpose, and access rule
- [ ] Request/response shapes match `DATA_MODEL.md`
- [ ] Success and error status codes documented
- [ ] Pending items match Section 14 and are not implemented as decided
- [ ] `openapi.yaml` validates and matches this document
- [ ] Terminology consistent with architecture, requirements, and wireframes
- [ ] Approved by Project Lead (Princeton)
