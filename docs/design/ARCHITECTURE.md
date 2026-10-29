# TuStudyHub — System Architecture and Structure

**Document type:** Architecture Specification  
**Status:** Proposed — pending team review  
**Architecture owner:** Comfort  
**Project lead:** Princeton  
**Related documents:** `SYSTEM_DESIGN_DOCUMENT.md`, `REQUIREMENTS.md`, `DATA_MODEL.md`, and `API_SPECIFICATION.md`

## 1. Architecture Overview

TuStudyHub is designed as an API-first academic past-paper platform. A responsive Progressive Web App (PWA) provides the primary user interface, while a versioned REST API handles application requests, authorization, validation, and access to platform services.

The logical design separates the client, API access, application services, data storage, and operational concerns. This separation supports maintainability, independent testing, and future clients without requiring each client to implement its own business rules.

This diagram describes the proposed logical architecture, not proof that every component has already been implemented.

## 2. Architectural Layers

| Layer | Responsibility |
|---|---|
| Client | Provides responsive interfaces for students, contributors, lecturers, moderators, and administrators. |
| Access and API | Receives HTTPS requests, authenticates users, enforces authorization, validates input, and applies request limits. |
| Application services | Implements identity, course management, paper workflows, verification, search, quizzes, and reporting. |
| Data and file storage | Stores structured records separately from uploaded document files. |
| Operations | Supports background processing, backups, logging, monitoring, and recovery. |

## 3. Application Modules

### 3.1 Identity and Access

Handles registration, authentication, account recovery, account status, roles, and permissions. Protected actions must be authorized by the backend rather than relying on frontend visibility.

### 3.2 Course Catalogue

Maintains course codes, titles, and the course information used to organize academic materials. Full student enrollment management is not part of the required first-release scope.

### 3.3 Paper and File Management

Handles document metadata, PDF and image uploads, file validation, storage, browsing, and downloads. Upload limits, access rules, and failure handling must be defined before implementation.

### 3.4 Review and Verification

Manages paper review decisions and verification status. Approved papers receive a unique digital identifier and a visible verification stamp. QR verification must report the current authoritative status; removed or revoked papers must not continue to appear as verified.

### 3.5 Search and Discovery

Supports finding eligible materials by course, keyword, academic year, semester, examination type, and verification status. Results must respect access and publication rules.

### 3.6 Quiz Service

Supports multiple-choice quizzes, attempts, automatic marking, and score history. Quiz creation is restricted to lecturers and approved authors, subject to the final permissions policy.

### 3.7 Reporting and Moderation

Provides a way to report questionable material and allows authorized personnel to review reports and take permitted actions. Advanced moderation queues, appeals, ratings, and reputation features require confirmation if they exceed the agreed release scope.

### 3.8 Audit Records

Records important security and workflow events where required, including relevant review decisions, publication changes, revocations, and administrative actions. Logs must not contain passwords or authentication tokens.

## 4. Data and File Storage

The design separates structured application data from uploaded files.

- **Relational database:** users, roles, courses, paper metadata, review decisions, quiz records, reports, and audit records.
- **File storage:** uploaded PDFs, images, and related document files.
- **File references:** database records link authorized application records to their stored files.
- **Backups:** database and file backups must be planned together and restoration tested for consistency.

The final database engine, file-storage provider, backup frequency, and retention policy must be documented in the approved technology and infrastructure decisions.

## 5. Request and Processing Flow

A typical protected document request follows this sequence:

1. A user performs an action in the PWA.
2. The request reaches the application through HTTPS and the configured web entry point.
3. The API validates the request and checks authentication and permissions.
4. The relevant application module applies the business rules.
5. The module reads or updates the database and, where needed, accesses file storage.
6. The API returns a consistent response to the client.
7. Relevant actions are recorded for audit purposes.

Long-running work, such as file compression or duplicate checks, may be handled by background jobs. The job-processing mechanism must be confirmed before implementation.

## 6. Security and Trust Boundaries

- All public application traffic must use HTTPS.
- Authorization must be enforced on the server for every protected operation.
- Uploads must be validated for permitted type, size, and other agreed safety checks.
- Public verification must reveal only information approved for public access.
- File identifiers or URLs must not bypass access restrictions.
- API requests must use consistent error handling and appropriate rate limits.
- Secrets and credentials must be stored securely and excluded from source control.
- Backups, deployment access, and administrative operations must be protected.

## 7. Deployment Structure

The proposed production request path is:

**User or API client → HTTPS → Reverse proxy → Application/API → Database and file storage**

The deployment must include a registered domain managed through Cloudflare, a provisioned VPS, HTTPS, restricted server access, automated database backups, and a tested recovery procedure. The exact VPS size, provider, deployment tooling, and file-storage arrangement belong in the Infrastructure Report and must be supported by evidence.

## 8. Optional and Unconfirmed Components

The following must not be treated as guaranteed first-release functionality until the team confirms the scope:

- Dedicated search index
- Notifications and webhooks
- Advanced moderation queues and appeals
- Reputation scoring and advanced ratings
- Full offline document reading
- Additional mobile or chat clients
- Container orchestration or a CI/CD pipeline beyond agreed deployment requirements

## 9. Review and Acceptance Criteria

The architecture is ready for team review when:

- [ ] Every major component has a defined responsibility.
- [ ] The diagram agrees with the requirements and System Design Document.
- [ ] The API, data model, and wireframes use consistent terminology.
- [ ] Authentication and authorization boundaries are clear.
- [ ] Document storage and verification flows are represented.
- [ ] Security, low-bandwidth behavior, backups, and recovery are addressed.
- [ ] Optional features are clearly distinguished from required functionality.
- [ ] Technology and infrastructure decisions are documented or marked as pending.
- [ ] Comfort's diagram has been reviewed by the team and its acceptance recorded.

**Approval status:** Proposed. The team must review and approve this architecture before it is treated as the final implementation specification.
