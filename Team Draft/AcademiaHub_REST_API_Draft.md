# AcademiaHub

**REST API Resources, Endpoint Contracts and OpenAPI Documentation**
Draft v0.1 | 27 October 2026 | Base path: `/api/v1/`

## 1. Purpose and Scope

This draft defines the REST API between the installable, mobile-friendly PWA and the PostgreSQL database. It covers the resource model, endpoint contracts for each module, and how the API is documented through OpenAPI. Everything here is a starting point to be refined during build.

## 2. System Architecture

Four user groups (students, lecturers, moderators, admins) use one PWA. The PWA talks only to the REST API at `/api/v1/`, organised into four modules. All persistent data lives in PostgreSQL; uploaded files go to file storage.

![System architecture](architecture.png)

## 3. API Conventions

- **Format:** JSON over HTTPS; UTF-8; snake_case field names; ISO 8601 UTC timestamps.
- **Versioning:** major version in the path (`/api/v1/`). Breaking changes ship as `/api/v2/`.
- **Authentication:** short-lived JWT access token (`Authorization: Bearer <token>`) plus rotating refresh token.
- **Authorisation:** role-based (student, lecturer, moderator, admin). Each endpoint lists its minimum role.
- **Pagination:** `?page=1&page_size=20` (max 100). Responses include `meta.total` and `meta.page`.
- **Filtering and sorting:** `?q=`, `?status=`, `?sort=-created_at`.
- **Idempotency:** PUT and DELETE are idempotent; POST create endpoints accept an optional `Idempotency-Key` header.
- **Rate limiting:** per-user and per-IP; `429` with `Retry-After`. Public verification endpoints are limited more strictly.

### 3.1 Standard error format

```json
{
  "error": {
    "code": "validation_error",
    "message": "title is required",
    "details": [{ "field": "title", "issue": "required" }],
    "request_id": "req_8f3a21"
  }
}
```

| Status | Code | Meaning |
|---|---|---|
| 400 | `validation_error` | Malformed or invalid input |
| 401 | `unauthenticated` | Missing, invalid or expired token |
| 403 | `forbidden` | Authenticated but role lacks permission |
| 404 | `not_found` | Resource does not exist or is not visible to caller |
| 409 | `conflict` | Duplicate or invalid state transition |
| 413 | `file_too_large` | Upload exceeds the size limit |
| 422 | `unprocessable` | Valid syntax but fails business rules |
| 429 | `rate_limited` | Too many requests |
| 500 | `server_error` | Unexpected failure |

## 4. Resource Overview

| Module | Resource | Description |
|---|---|---|
| Identity and roles | users, roles, sessions | Accounts, role assignment, login sessions |
| Document library | documents, document-files, categories | Metadata, uploaded files, subject and course grouping |
| Approval and verification | approvals, verifications | Moderation workflow and public authenticity checks |
| Quizzes | quizzes, questions, attempts | Multiple-choice quiz definition, delivery and scoring |

## 5. Endpoint Contracts

### 5.1 Identity and Role Permissions

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a student account |
| POST | `/auth/login` | Public | Exchange credentials for access and refresh tokens |
| POST | `/auth/refresh` | Public | Rotate tokens |
| POST | `/auth/logout` | Any | Revoke the refresh token |
| GET | `/users/me` | Any | Current profile and role |
| PATCH | `/users/me` | Any | Update own profile |
| GET | `/users` | Admin | List users (filter by role, status) |
| PATCH | `/users/{id}/role` | Admin | Assign or change role |
| PATCH | `/users/{id}/status` | Admin | Activate or suspend account |

**POST /auth/login**

```json
// Request
{ "email": "ada@example.com", "password": "********" }

// 200 Response
{
  "access_token": "eyJ...",
  "refresh_token": "rt_...",
  "expires_in": 900,
  "user": { "id": "usr_01", "name": "Ada K.", "role": "student" }
}
```
Errors: 400, 401, 429

### 5.2 Document Library and Upload

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/documents` | Student+ | List approved documents (search, filter, paginate) |
| GET | `/documents/{id}` | Student+ | Document metadata and download link |
| POST | `/documents` | Lecturer+ | Create a document record (status: draft) |
| POST | `/documents/{id}/file` | Lecturer+ | Upload the file (multipart/form-data) |
| PATCH | `/documents/{id}` | Owner, Mod | Edit metadata |
| DELETE | `/documents/{id}` | Owner, Admin | Remove document and stored file |
| GET | `/documents/{id}/download` | Student+ | Signed, time-limited download URL |
| GET | `/categories` | Student+ | Subjects and course groupings |

**POST /documents**

```json
// Request
{
  "title": "CSC 301 Lecture Notes",
  "category_id": "cat_12",
  "description": "Week 1-6",
  "tags": ["networks"]
}

// 201 Response
{
  "id": "doc_77",
  "status": "draft",
  "title": "CSC 301 Lecture Notes",
  "owner_id": "usr_09",
  "created_at": "2026-10-27T09:50:00Z"
}
```
Errors: 400, 401, 403, 422

Upload rules (draft): PDF, DOCX, PPTX; maximum 20 MB; server-side type and size check; files stored outside the database with only the storage key kept in PostgreSQL.

### 5.3 Approval and Verification

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/documents/{id}/submit` | Owner | Submit draft for review (draft to pending) |
| GET | `/approvals` | Moderator+ | Review queue (filter by status) |
| POST | `/approvals/{id}/approve` | Moderator+ | Approve; issues a verification code |
| POST | `/approvals/{id}/reject` | Moderator+ | Reject with a required reason |
| GET | `/documents/{id}/approvals` | Owner, Mod | Approval history |
| GET | `/verify/{code}` | Public | Public verification page data: title, approver, date, status |

**POST /approvals/{id}/approve**

```json
// Request
{ "note": "Content checked against syllabus." }

// 200 Response
{
  "id": "apr_31",
  "document_id": "doc_77",
  "status": "approved",
  "verification_code": "AH-7Q2K-91XD",
  "verify_url": "https://<host>/verify/AH-7Q2K-91XD"
}
```
Errors: 401, 403, 404, 409 (already decided)

Status flow: `draft` > `pending` > `approved` or `rejected`. Rejected documents can be edited and resubmitted. `GET /verify/{code}` returns no private user data.

### 5.4 Multiple-Choice Quizzes

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/quizzes` | Student+ | List published quizzes |
| GET | `/quizzes/{id}` | Student+ | Quiz details (questions without answers) |
| POST | `/quizzes` | Lecturer+ | Create a quiz |
| PATCH | `/quizzes/{id}` | Owner | Edit, publish or unpublish |
| POST | `/quizzes/{id}/questions` | Owner | Add a question with options and correct answer |
| POST | `/quizzes/{id}/attempts` | Student+ | Start an attempt |
| POST | `/attempts/{id}/submit` | Student | Submit answers; returns score |
| GET | `/attempts/{id}` | Student, Owner | Attempt result and review |

**POST /attempts/{id}/submit**

```json
// Request
{
  "answers": [
    { "question_id": "q_1", "option_id": "o_3" },
    { "question_id": "q_2", "option_id": "o_7" }
  ]
}

// 200 Response
{
  "attempt_id": "att_5",
  "score": 8,
  "total": 10,
  "submitted_at": "2026-10-27T10:20:00Z"
}
```
Errors: 401, 403, 404, 409 (already submitted), 422

## 6. Role Access Matrix

| Action | Student | Lecturer | Moderator | Admin |
|---|---|---|---|---|
| Browse and download approved documents | Yes | Yes | Yes | Yes |
| Upload documents | No | Yes | Yes | Yes |
| Approve or reject documents | No | No | Yes | Yes |
| Take quizzes | Yes | Yes | Yes | Yes |
| Create quizzes | No | Yes | Yes | Yes |
| Manage users and roles | No | No | No | Yes |

Public verification lookup (`GET /verify/{code}`) needs no login.

## 7. OpenAPI Documentation

- **Specification:** OpenAPI 3.1, generated from route definitions and validation schemas so code and docs cannot drift.
- **Served at:** `/api/v1/openapi.json` and `/api/v1/openapi.yaml`.
- **Interactive docs:** Swagger UI or Redoc at `/api/v1/docs`, enabled in development and staging; restricted or disabled in production.
- **Reusable components:** Error, Pagination, User, Document, Approval, Quiz, Attempt, plus a `bearerAuth` security scheme.
- **Per operation:** `operationId`, summary, tags (Identity, Documents, Approvals, Quizzes, Verification), request and response examples, and error responses.
- **CI:** the spec is validated in CI and used to generate a typed client for the PWA.

### 7.1 Spec skeleton

```yaml
openapi: 3.1.0
info:
  title: AcademiaHub API
  version: 1.0.0
servers:
  - url: https://<host>/api/v1
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          properties:
            code: { type: string }
            message: { type: string }
            request_id: { type: string }
security:
  - bearerAuth: []
paths:
  /auth/login:
    post:
      operationId: login
      tags: [Identity]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        "200": { description: Tokens issued }
        "401": { description: Invalid credentials }
```

## 8. Open Items

- Confirm file size limit and allowed file types.
- Decide whether quiz questions can be reused across quizzes.
- Define verification code format and whether codes can be revoked.
- Choose file storage provider and signed-URL lifetime.
- Confirm login method (email, student ID, or both).
