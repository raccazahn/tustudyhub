# TuStudyHub Project Plan

**Document status:** Working plan for team and lecturer review  
**Version:** 1.0  
**Prepared:** 3 November 2026  
**Project submission target:** 17 November 2026 (as recorded in the repository; confirm against the lecturer's latest instruction)  
**Project lead:** Princeton R. Zahnmie  
**Planning basis:** SRS at `docs/requirements/REQUIREMENTS.md`  
**Delivery approach:** Iterative, evidence-based development with reviewed pull requests

---

## 1. Project overview

TuStudyHub is a tertiary academic resource, learning and verification platform built around **Learn • Share • Verify**. It helps users discover approved academic materials, contribute eligible resources through controlled review, practise through multiple-choice quizzes, and verify the current status of approved documents.

The product is not intended to become a full institutional student information system. Its academic structure supports colleges, departments and courses for organizing resources and learning activities; it does not replace institutional admissions, registration, grades or student-record systems.

The project must deliver a usable, responsive web experience, an installable PWA, a documented versioned API, persistent database-backed operation, and a production deployment with appropriate security, backups and recovery procedures.

## 2. Objectives and success criteria

The project will be considered ready for submission only when the team can demonstrate evidence for the following:

1. Visitors can browse permitted public information and approved resources in read-only mode. Protected actions require an account and server-side authorization.
2. Registered users can sign in and use only the features permitted by their role and account status.
3. Academic resources can be submitted, validated, reviewed, approved, searched and downloaded according to publication permissions.
4. Approved resources have a unique identifier, visible verification mark and QR-linked public status page. Revoked, restricted or removed resources are not represented as currently verified.
5. Students can take published MCQ quizzes, receive automatic scores and view their permitted attempt history.
6. Administrators can manage users, roles, colleges, departments, courses, review queues, feedback, notifications and authorized reports.
7. Ratings/reviews, academic Q&A, advanced analytics and hybrid AI-assisted quiz generation are included in the approved product scope and have defined permissions and acceptance tests.
8. Offline behavior is deliberately designed and tested. Previously synchronized/saved eligible content may be available offline; actions requiring server authority are queued safely or clearly disabled until reconnection.
9. Web, desktop-installed PWA and Android-installed PWA use the same backend API and central PostgreSQL database. Local/offline data is a controlled cache, not a competing source of truth.
10. Development and production setup are documented; persistent data and files survive application restarts; backups can be restored; HTTPS and production secrets are configured safely.
11. The repository accurately describes the implementation, contains no committed secrets or unnecessary generated artifacts, and preserves team contributions and review history.

A feature is not complete merely because a screen exists. Completion requires backend enforcement, persistence where applicable, error handling, tests and documented evidence.

## 3. Scope

### 3.1 Included product capabilities

- Account registration, authentication, recovery, account status and role-based access control.
- Visitor/read-only browsing with public verification access; no guest upload, download, quiz participation, rating, review, Q&A posting or other protected mutation.
- Academic structure management: colleges, departments and courses.
- Academic resource library for examination papers, thesis papers, syllabi and approved resource categories.
- PDF and approved image/photo uploads, metadata, validation, moderation, version history where required, search and permission-checked downloads.
- Unique document identifiers, visible verification stamps, QR codes and public Verified/Revoked status.
- MCQ quiz authoring, review, approval, automatic marking, score history and version control.
- Ratings and reviews for eligible resources, subject to moderation and anti-abuse controls.
- In-app notifications and configured delivery channels, with user preferences and failure handling.
- Academic Q&A with moderation, reporting and role-based participation.
- Advanced administrative analytics with privacy-aware aggregation and permission-controlled access.
- Hybrid AI-assisted quiz generation: AI-generated drafts plus deterministic validation, syllabus relevance checks, and lecturer/authorized reviewer approval before publication.
- User feedback submission and administrative triage/status management.
- Responsive React frontend where React is already the application's frontend framework; preserve and improve the existing application rather than creating a duplicate frontend or performing an unnecessary framework migration.
- Versioned REST/JSON API under `/api/v1/`.
- Installable PWA with offline shell, eligible offline reading, queued actions where safe, synchronization, retry/idempotency and conflict handling.
- Shared backend and PostgreSQL source of truth for web, desktop and Android PWA clients.
- Admin dashboard aligned with the SRS and actual role workflows.
- Professional homepage contact entry/icon that uses a verified, configured contact destination. Contact details must not be invented.
- Deployment, monitoring, backups, recovery, user feedback and maintenance documentation.

### 3.2 Explicit exclusions

- Full institutional student information system, admissions, official student records, grades or integration with university systems.
- Live/current examination distribution.
- Payments, unless separately approved through formal scope change.
- Any public access to private student data, internal moderation notes, restricted files or administrator-only information.

## 4. Requirements baseline and traceability

The SRS is the authoritative source for product behavior. This plan does not replace it. The SRS must be updated when the team approves a scope change; implementation, API, data model, wireframes and tests must then be updated to match.

The baseline requirements include:
- **FR-001–FR-010:** identity, authentication, account status and contributor permissions.
- **FR-011–FR-014:** academic course catalogue and course metadata.
- **FR-015–FR-036:** academic library, upload validation, search, download, review, moderation and audit.
- **FR-037–FR-045:** quiz authoring, review, versioning, attempts and scoring.
- **FR-046–FR-052:** unique identifiers, stamp, QR verification, status and privacy.
- **FR-053–FR-060:** versioned API, authentication, authorization, pagination and validation.
- **FR-061–FR-067:** responsive PWA, low bandwidth, offline behavior and discoverability.
- **FR-068–FR-072:** administration, reporting, audit and health monitoring.
- **FR-073 onward:** approved scope extensions for visitor restrictions, ratings/reviews, notifications, Q&A, analytics, AI-assisted quiz generation, feedback, academic hierarchy, shared persistence and offline synchronization. The SRS must assign stable IDs and acceptance criteria to each.

Every issue and pull request should reference one or more requirement IDs. Every major requirement should have at least one verification method in the QA plan. If a requirement is deferred, the team must record the reason, impact, owner and approval rather than silently dropping it.

## 5. Deliverables

| Deliverable | Required contents / evidence | Primary coordination |
|---|---|---|
| Approved SRS | Functional/non-functional requirements, roles, constraints, acceptance criteria, traceability | Project Lead with all owners |
| Project Plan | Scope, work breakdown, schedule, roles, risks, quality and change control | Project Lead |
| Architecture | Components, boundaries, data flow, deployment and client synchronization | System Architect |
| Data model | PostgreSQL entities, relationships, constraints, indexes and migration strategy | Database Engineer |
| API specification | Versioned routes, schemas, permissions, errors, pagination and OpenAPI | API Designer |
| Identity and access design | Authentication lifecycle, roles, guest restrictions and permission matrix | Backend Identity |
| Core workflows | Resource lifecycle, verification, quiz lifecycle, Q&A, feedback and notifications | Backend Core |
| UX and wireframes | Screens matching actual system workflows; responsive and PWA states | UX / Frontend |
| Security and privacy review | Threats, mitigations, data access, upload safety and secret handling | Security & Privacy |
| QA plan and results | Requirement-based tests, defects, regression and release evidence | QA / Testing |
| Operations package | Local setup, VPS deployment, HTTPS, PostgreSQL, storage, backups and recovery | DevOps / Documentation |
| User guide and handover | Role-based instructions, screenshots from actual build, maintenance and support | Project Lead + Documentation |

Do not label a design or feature “implemented”, “tested” or “deployed” without evidence from the current build.

## 6. Work breakdown and execution sequence

### Phase 0 — Repository and implementation baseline

- Inspect repository structure, active branches, pull requests and current team contributions.
- Identify the application source repository/folder and keep it distinct from documentation until its integration strategy is agreed.
- Compare the current implementation with the SRS and record each feature as implemented, partial, missing, blocked or not verified.
- Identify the actual framework and package scripts. If the application already uses React/TSX, retain it; do not add a second React application.
- Inventory generated files, build output, local databases, uploads and environment files before proposing cleanup.
- Protect credentials, user data, source assets and team work.

**Exit evidence:** repository inventory, implementation gap matrix, verified SRS version and approved cleanup proposal.

### Phase 1 — Local application foundation and persistence

- Make the complete application run locally on the documented localhost address.
- Confirm frontend and backend startup commands and environment configuration.
- Connect every runtime data path to PostgreSQL; do not rely on an in-memory store for production data.
- Review schema, migrations, constraints, indexes, connection handling and transaction boundaries before applying migrations.
- Configure persistent file storage outside the public executable application directory.
- Confirm restart persistence, error handling and safe development seed data.
- Ensure development credentials and sample accounts cannot be used in production.

**Exit evidence:** clean setup on a second environment, migration evidence, persistence test after restart and documented local run instructions.

### Phase 2 — Core user and academic workflows

- Implement visitor read-only restrictions in both frontend and backend.
- Complete authentication, role/permission checks and account status.
- Complete college → department → course management.
- Complete resource upload, metadata, review, approval, search, authorized download and QR verification.
- Complete quiz creation, review, publication, attempts and scoring.
- Align the admin dashboard to actual requirements and backend data.

**Exit evidence:** end-to-end tests for each role and core workflow, including direct API authorization tests.

### Phase 3 — Required supporting capabilities

- Resource ratings and reviews with moderation.
- Notifications with persistence, preferences and delivery-failure handling.
- Academic Q&A with moderation and reporting.
- Advanced analytics with role-appropriate, privacy-aware aggregation.
- User feedback submission and admin triage.
- Hybrid AI quiz generation with deterministic validation and lecturer approval; AI output remains untrusted until validated and reviewed.

**Exit evidence:** requirement-linked tests, abuse/permission checks, audit records and documented limitations for any external AI/provider dependency.

### Phase 4 — PWA and cross-client synchronization

- Verify manifest, service worker, installability and secure HTTPS context.
- Implement local storage for explicitly permitted offline data.
- Define which actions can be queued offline and which must wait for server confirmation.
- Implement synchronization queue, retry policy, idempotency keys, conflict resolution and user-visible sync state.
- Prevent private/admin data and restricted resources from leaking through shared or unprotected caches.
- Test Android Chrome installed PWA and desktop-installed PWA against the production domain.
- Confirm all clients use the same API and PostgreSQL-backed records.

**Exit evidence:** offline/online test matrix, Android and desktop installation evidence, synchronization tests and conflict/retry tests.

### Phase 5 — Production readiness and release

- Complete security review, dependency checks, access-control tests and upload validation.
- Configure production environment variables and rotate any credentials previously exposed.
- Configure domain, DNS, HTTPS, reverse proxy, application service and PostgreSQL.
- Configure persistent file storage, database/file backups, monitoring and health checks.
- Test restore and release rollback.
- Run regression and acceptance tests on the deployed domain.
- Collect feedback, fix release-blocking issues and prepare handover.

**Exit evidence:** release checklist, deployment record, test report, backup/restore evidence and maintainer handover.

## 7. Team roles and accountability

The current team-role assignments recorded in the repository are the planning baseline. Confirm names, GitHub handles and availability with the team before changing assignments.

| Member | Role | Main accountability |
|---|---|---|
| Princeton | Project Lead / Product Owner | Scope, priorities, decisions, integration and lecturer communication |
| Comfort Dalieh | System Architect | Architecture and cross-module consistency |
| Darius | API Designer | REST contract, schemas and endpoint permissions |
| Regstopher Jarsor | Backend Identity | Authentication, roles and access control |
| Joseph | Backend Core | Resource, verification and quiz workflows |
| Madison Juah | Database Engineer | PostgreSQL model, migrations, integrity and backups |
| Odasco Sallison | UX / Frontend | Responsive UI, wireframes, PWA and frontend integration |
| Sieh Seton | Security & Privacy | Threat review, privacy and security controls |
| Jessica N. Younge | QA / Testing | Test strategy, execution, defect evidence and regression |
| Prince Nagbe | DevOps & Documentation | Setup, deployment research, operations and documentation |

A person may assist another workstream, but ownership and review evidence must remain clear. No task is complete solely because an issue was assigned.

## 8. Schedule and milestones

The repository records **17 November 2026** as the course final deadline. The project lead must confirm that date and any presentation or live-deployment checkpoint with the lecturer.

| Milestone | Target window | Completion evidence |
|---|---|---|
| M0 — Baseline confirmed | 3 November 2026 onward | Repo inventory, SRS alignment and gap matrix |
| M1 — Local app and persistent DB | Next agreed working window | Reproducible localhost setup and PostgreSQL persistence |
| M2 — Core workflows | Before feature freeze | Role-based end-to-end tests for library, verification and quizzes |
| M3 — Supporting capabilities | Before feature freeze | Ratings, notifications, Q&A, analytics, feedback and AI quiz tests |
| M4 — PWA and synchronization | Before production acceptance | Android/desktop install and offline sync evidence |
| M5 — Production release candidate | Before final submission | HTTPS deployment, security and recovery tests |
| M6 — Final handover | 17 November 2026, subject to lecturer confirmation | User guide, final report, test evidence and maintainer handover |

A three-day deployment goal may be used as a planning target only after the team confirms the VPS, domain, application source, PostgreSQL readiness and responsible owners. It is not a guarantee that every feature will be production-ready within three days. Prioritize a safe, testable release over an unverified launch.

## 9. Quality assurance and acceptance

- Derive test cases from SRS requirement IDs.
- Test backend authorization independently of UI visibility.
- Test guest access against every protected read and write endpoint.
- Test resource upload validation, review transitions, direct-download protection and QR status changes.
- Test quiz scoring, version references and approval controls.
- Test persistence after process restart and database reconnection.
- Test notification and feedback workflows, moderation and audit records.
- Test AI-generated quiz drafts for schema correctness, duplicates, syllabus relevance and reviewer approval; never auto-publish unreviewed output.
- Test offline cache boundaries, queue retry, duplicate prevention, synchronization conflicts and account isolation.
- Test responsive layouts, accessibility basics, low-bandwidth behavior and Android/desktop installation.
- Test database and file restoration together.
- Record environment, build/commit, steps, expected result, actual result and evidence for each test.
- Block release on unresolved critical security, data-loss, authorization or verification-integrity defects.

## 10. Repository and change management

1. Keep `main` protected by team review practice; do not push directly to it.
2. Use focused branches and pull requests linked to GitHub Issues.
3. Require at least one team-member review before merging, consistent with the course workflow.
4. Keep commits focused and descriptive.
5. Do not delete files based only on filename or apparent age. First inventory, classify, identify references and obtain team approval for destructive cleanup.
6. Preserve source, documentation, team deliverables, assets, issue history and contribution evidence.
7. Keep `.env`, API keys, JWT secrets, database passwords, private uploads and real student data out of Git.
8. Keep generated build output, dependency folders and local runtime data out of Git unless there is a documented reason to track them.
9. Update README, API, architecture, data model, wireframes and user guide when implementation behavior changes.
10. Record scope changes, decision owner, reason, impact, affected requirements and approval.

## 11. Risks and mitigations

| Risk | Impact | Mitigation / response |
|---|---|---|
| SRS and implementation diverge | Incorrect delivery and presentation | Maintain requirement-to-feature-to-test traceability |
| App source is separate from docs repository | Changes cannot be implemented from docs-only repo | Identify source location and agree monorepo/separate-repo approach |
| In-memory runtime data | Data loss on restart | Complete PostgreSQL integration and persistence tests before production |
| Database schema mismatch | Failed migrations or missing features | Review schema and runtime queries; use versioned migrations and backups |
| Unreliable mobile connectivity | Interrupted use and sync errors | Offline cache, retry/idempotency, conflict handling and clear status |
| Guest access leaks protected actions | Unauthorized content access | Enforce access control on every backend route and direct file request |
| AI-generated quiz errors | Incorrect learning content | Deterministic validation, syllabus checks and lecturer approval |
| Copyright/privacy complaint | Legal and trust risk | Permission-aware publication, reporting, restriction and audit trail |
| Secret exposure | Account/system compromise | Rotate exposed secrets; keep secrets out of Git and logs |
| Tight delivery window | Incomplete or unsafe launch | Prioritize release-critical workflows; defer only with documented approval |
| Team integration conflicts | Rework and delayed delivery | Shared contracts, small PRs, review and integration tests |
| Backup not restorable | Irrecoverable data loss | Test database and file restore together before release |

## 12. Communication and progress reporting

Each workstream reports:
- Completed work and links to commits/PRs.
- Work currently in progress.
- Blockers and decisions required.
- Requirements affected.
- Test evidence and known limitations.
- Next action and expected completion window.

The project lead maintains the shared status in GitHub Issues and updates this plan when approved changes affect scope, schedule, ownership or risk.

## 13. Open decisions

The following must be confirmed rather than guessed:
- Final hosting provider, VPS capacity, costs and domain ownership.
- Final authentication/session and token lifecycle.
- Maximum upload sizes, allowed image formats and malware-scanning capability.
- File-storage and backup-retention arrangement.
- Exact offline actions, cache expiry and conflict policy.
- AI provider/model, API budget, data handling and fallback behavior.
- Notification delivery providers and user preferences.
- Q&A moderation rules and analytics privacy boundaries.
- Contact destination displayed on the homepage.
- Final release date, acceptance authority and license decision.

## 14. Approval

| Reviewer | Name / role | Status | Date / evidence |
|---|---|---|---|
| Project Lead | Princeton | Pending | |
| System Architect | Comfort Dalieh | Pending | |
| Team review | All members | Pending | |
| Lecturer | Course lecturer | Pending | |

**Approval note:** This is a project plan, not proof of implementation or deployment. Update status only when the corresponding evidence exists.
