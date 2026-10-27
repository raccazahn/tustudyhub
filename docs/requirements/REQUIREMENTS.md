# Software Requirements Specification (SRS) — TuStudyHub

**Document status:** Working specification for team review  
**Project:** TuStudyHub — Open Student Past Papers & Library Platform  
**Review target:** 27 October 2026  
**Final project deadline:** 17 November 2026  
**Version:** Draft 1.1

## 1. Purpose and Scope

TuStudyHub is a student-focused academic platform for discovering, managing, verifying and studying from academic materials. It provides a searchable document library, a course catalogue, multiple-choice quizzes, public verification of approved papers, and a documented REST API.

The platform must work on mobile devices and be designed for users with limited internet connectivity. It is intended to be deployed to a supported hosting environment using a registered domain and HTTPS.

### 1.1 In scope

- User registration, authentication, account recovery and role-based permissions.
- Student applications for elevated contributor access.
- Course catalogue and course-related metadata.
- PDF and image/photo upload, review, approval, search and download.
- Academic document categories and required metadata.
- Quiz creation, review, versioning, attempts and automatic marking.
- Content reports, moderation and essential review/audit history.
- Unique document identifiers, visible stamps and QR verification.
- Public REST/JSON API under `/api/v1/`.
- Responsive, installable Progressive Web App (PWA).
- Administrative dashboard and agreed basic reports.
- Testing, security, deployment, backup and recovery requirements.

### 1.2 Optional or subject to team confirmation

The following are not mandatory for the first release unless the team and lecturer explicitly approve them:

- Full student enrollment management, including add/drop, enrollment deadlines and exceptions.
- Formal appeals workflows.
- Document version history beyond the review and decision records needed for traceability.
- Automated duplicate detection and duplicate warnings.
- Ratings and reputation features.
- Advanced moderation queues, appeals and extended moderation tools.
- In-app, email and browser-push notification services beyond essential interface feedback.
- Saved offline reading and advanced offline synchronization.
- Advanced analytics and expanded administrative reports.
- Additional academic-calendar management beyond what the approved course catalogue requires.

Essential security controls, review decisions, access restrictions and audit records remain mandatory even when advanced moderation features are optional.

### 1.3 Out of scope for the first release

- Live or current examination distribution.
- Student grades and private academic records from institutional systems.
- Payment processing.
- Q&A forums and worked-solution communities.
- SMS/WhatsApp notification delivery.
- Full institutional student information system integration.

## 2. Stakeholders and User Roles

### 2.1 Visitor

May browse publicly available course information and approved materials. Restricted information and files must not be accessible without authorization.

### 2.2 Student

May register, sign in, manage permitted profile information, browse and download eligible materials, take available quizzes, view personal quiz history and submit reports.

Enrollment-specific access is required only if the team approves the optional enrollment module. Formal appeals are optional; any available account-review process must follow the approved policy.

Basic access is available after registration. Access to protected features depends on account status and permissions.

### 2.3 Verified Contributor

A student whose contributor application has been approved. May perform explicitly authorized contribution activities. Contributor status does not grant lecturer, moderator or administrator privileges.

### 2.4 Lecturer

May manage authorized course-related activities, upload syllabi and academic materials, review submissions within assigned courses, create quizzes and request takedowns. Quiz and document approval permissions must follow the configured review policy.

### 2.5 Moderator

May investigate reports, restrict or remove content under the moderation policy, document decisions and suspend accounts when authorized. Moderator actions must be auditable.

### 2.6 Administrator

May manage accounts, roles, courses, categories, platform settings, review queues and agreed administrative reports. Management of academic-calendar periods, course offerings, formal appeals and advanced moderation features depends on the approved scope.

Restoration of removed content requires authorization, review and a recorded reason.

### 2.7 External API Client

May access only the API resources and actions permitted by its scoped credentials. API access must not bypass platform authorization.

### 2.8 Role and permission rules

- Each account has one primary role at a time.
- Elevated contributor access requires an application and administrator review.
- Lecturer permissions are limited to authorized courses and actions.
- Permissions must be enforced on the server, not only in the user interface.
- Suspended or deactivated users must be prevented from performing protected actions. Where account-status access is supported, users should receive a safe explanation of their status and available next steps.
- A formal appeal process is optional and must not be assumed to exist until approved.
- The initial administrator account must be provisioned securely. Public administrator self-registration is not permitted.

## 3. Functional Requirements

Requirements are identified using stable IDs for traceability to design and testing.

### 3.1 Accounts and Authentication

**FR-001 — Registration:** The system shall allow users to register with the required account details and validate submitted information.

**FR-002 — Authentication:** The system shall provide secure sign-in and sign-out.

**FR-003 — Password recovery:** Users shall be able to request a self-service password reset through a verified recovery channel. Administrators shall have an authorized recovery procedure that does not require knowing the user's existing password.

**FR-004 — Access control:** The system shall enforce role-based permissions on protected operations and resources.

**FR-005 — Contributor applications:** Students shall be able to apply for contributor access. Authorized administrators shall approve or reject applications.

**FR-006 — Reapplication:** Rejected applicants shall be able to correct their details and reapply. Previous application decisions shall remain recorded.

**FR-007 — Decision explanations:** Rejection decisions shall include a reason and explain what the applicant needs to correct when applicable.

**FR-008 — Account status:** The system shall enforce suspension and deactivation restrictions. Where account-status access is implemented, affected users shall receive an appropriate status message without gaining access to protected actions.

**FR-009 — Formal appeals:** A formal appeal workflow may be implemented if approved by the team. If included, appeals and their outcomes shall be recorded.

**FR-010 — Initial administrator:** The platform shall support secure initial administrator provisioning and require secure credential changes during initial setup.

### 3.2 Course Catalogue

**FR-011 — Course catalogue:** The system shall maintain a catalogue of courses and their identifying information.

**FR-012 — Course management:** Authorized administrators shall be able to create and manage course records.

**FR-013 — Course metadata:** Course records shall support relevant identifying information, such as course title and code. Additional fields shall be determined by the approved data model.

**FR-014 — Course changes:** Authorized users shall be able to request or make course-information changes according to the approved permission policy. Changes requiring review shall retain a record of the decision.

Full academic-calendar management, term-specific course offerings, enrollment records, student self-enrollment, add/drop and enrollment exceptions are optional extensions rather than mandatory first-release requirements.

### 3.3 Academic Document Library

**FR-015 — Document categories:** The system shall support academic materials including examination papers, thesis papers and syllabi. Administrators shall be able to configure document categories where required.

**FR-016 — Supported formats:** The first release shall accept PDF documents and appropriate image/photo formats approved by the implementation's file-validation policy.

**FR-017 — Required metadata:** A document submission shall include the applicable course, title, category and year. Semester and examination-specific metadata shall be collected when relevant. Lecturer information may be optional where appropriate.

**FR-018 — Course association:** Materials shall be associated with the relevant course record. A separate course-offering record shall not be required unless the team approves the optional course-offering module.

**FR-019 — Upload validation:** The system shall validate uploaded files and enforce approved file-size limits. Invalid, unsupported or oversized uploads shall produce a clear error and safe retry guidance.

**FR-020 — Search and browse:** Users shall be able to search or filter eligible materials by available metadata, including title, course, course code, year, semester, material category and examination type where relevant.

**FR-021 — Download:** Users shall be able to download documents for which they have permission. Restricted, removed or unapproved files shall not be exposed through direct file URLs.

**FR-022 — Reports on materials:** Users shall be able to report incorrect, prohibited or potentially infringing content. Reports shall enter an authorized review process.

**FR-023 — Duplicate detection (optional):** If approved and implemented, the system may compare file hashes and relevant metadata to warn authorized submitters or reviewers about likely duplicate submissions. A warning shall not automatically establish that two papers are identical.

**FR-024 — Document version history (optional):** If approved and implemented, an update to an existing paper may be stored as a new version. Previous versions and their review decisions shall remain traceable where version history is enabled.

**FR-025 — Version review (conditional):** If document versioning is enabled, a new version shall be reviewed before becoming the approved current version. An unapproved update shall not silently replace the currently approved version.

**FR-026 — Ratings (optional):** If approved and implemented, users may rate eligible materials. Ratings shall not replace formal review or verification status.

**FR-027 — Basic review status:** Users shall be shown appropriate publication or availability status for materials they are permitted to view. Internal moderation notes and restricted information shall remain private.

### 3.4 Review and Publication

**FR-028 — Submission workflow:** Newly submitted documents shall enter a review workflow before public approval.

**FR-029 — Document states:** The system shall support the states Submitted, Under Review, Approved, Rejected, Restricted, Removed and Revoked where applicable. The implementation shall define valid transitions and permissions for each state.

**FR-030 — Review authority:** Lecturers shall review academic materials within their authorized course scope. Moderators shall handle content reports and moderation restrictions. Administrative overrides shall be permission-controlled and audited.

**FR-031 — Review history:** The system shall record review decisions, responsible accounts, timestamps and reasons. These records shall remain traceable when a document is restricted, removed or revoked.

**FR-032 — Rejected submissions:** Rejection decisions shall include a reason. Submitters shall be able to correct and resubmit material when the policy permits.

**FR-033 — Urgent restrictions:** Authorized moderators shall be able to restrict access while a serious copyright, privacy or safety complaint is reviewed. The reason and review history shall be recorded.

**FR-034 — Restoration:** Administrators may authorize restoration of removed material after reviewing the moderator's reason and resolving the relevant concern. Academic reapproval shall also be required when the content or version requires it.

**FR-035 — Permanent deletion:** The system shall support authorized permanent deletion when permitted by the approved retention policy. Required audit and legal or institutional records shall be handled according to that policy.

**FR-036 — Deletion requests:** Users shall be able to request deletion of eligible account information. Requests shall be reviewed against applicable retention obligations before completion.

Advanced moderation queues, formal appeals, document version history and extended moderation workflows remain optional. Their absence shall not remove the requirement for basic review controls, access restrictions and essential audit records.

### 3.5 Quiz Management and Assessment

**FR-037 — Quiz creation:** Lecturers and explicitly authorized contributors shall be able to create multiple-choice quizzes for courses within their permitted scope.

**FR-038 — Quiz review:** A lecturer or designated quiz reviewer shall approve a quiz before publication. Authors shall not approve their own quizzes.

**FR-039 — Quiz versions:** Published quiz content shall be versioned. Changes to a published quiz shall require review before the revised version is published.

**FR-040 — Published version continuity:** A revision awaiting review shall not silently replace the existing published version. If a revision is rejected, the previous approved version shall remain available when it is still valid.

**FR-041 — Quiz attempts:** Students shall be able to attempt available quizzes without an artificial attempt limit unless a later team-approved policy specifies otherwise.

**FR-042 — Automatic marking:** The system shall automatically mark submitted multiple-choice answers and show the score and correct answers after submission.

**FR-043 — Attempt history:** The system shall retain permitted attempt records and scores for each student.

**FR-044 — Version-linked results:** Every attempt and score shall reference the exact quiz version used for that attempt.

**FR-045 — Quiz access:** Only authorized users shall create, review, publish or manage quizzes. Students shall access only quizzes available to them under the platform's access rules.

### 3.6 Document Identity and Public Verification

**FR-046 — Unique identifier:** Each approved document shall receive a unique identifier.

**FR-047 — Visible stamp:** The generated or applied verification stamp shall display the identifier, course, approval date and approving role information.

**FR-048 — QR token:** Each approved document shall have a QR code containing or resolving through a non-guessable verification token. Verification shall be checked by the server.

**FR-049 — Public verification page:** Scanning a valid QR code shall open a public verification page showing the document's current verification status and limited public metadata.

**FR-050 — Status changes:** A valid verification page shall distinguish current approval from revoked or otherwise invalid status. Restricted or removed material shall not continue to appear as currently approved.

**FR-051 — Privacy:** Public verification shall not expose private user information, internal moderation notes, restricted files or other non-public data.

**FR-052 — Verification audit:** Approval, revocation and relevant status changes shall be traceable through authorized records.

Approval for academic study shall not automatically grant permission for unrestricted public distribution. Publication and indexing rights must follow the platform's approved content policy.

### 3.7 API

**FR-053 — API base path:** The platform shall provide a REST/JSON API under `/api/v1/`.

**FR-054 — API documentation:** The API shall provide interactive documentation describing supported operations, parameters, responses and authentication requirements.

**FR-055 — Authentication:** Protected API operations shall require valid authentication. Token handling shall support expiry and revocation under the selected authentication design.

**FR-056 — API authorization:** API clients and users shall be restricted to their assigned permissions and scopes.

**FR-057 — Pagination:** List endpoints shall support pagination and appropriate filtering where relevant.

**FR-058 — Error format:** API errors shall use a consistent structure containing `code`, `message` and `request_id`.

**FR-059 — Validation:** The API shall validate incoming data and return safe, consistent error responses without exposing secrets or internal stack traces.

**FR-060 — Server-side enforcement:** Business rules, access controls and state transitions shall be enforced by the server for both web and API clients.

### 3.8 PWA, Notifications and Discoverability

**FR-061 — Responsive interface:** The web interface shall work on supported mobile and desktop screen sizes.

**FR-062 — Installability:** The application shall include the configuration required for installation as a Progressive Web App where supported by the browser.

**FR-063 — Low-bandwidth operation:** Pages and assets shall be designed to minimize unnecessary data transfer and remain usable on slower connections.

**FR-064 — Offline reading (optional):** If approved and implemented, users may save explicitly selected eligible public materials for offline reading where technically supported.

**FR-065 — Offline restrictions (conditional):** If offline reading is implemented, restricted documents and protected personal information shall not be cached for offline access. The interface shall communicate when offline actions cannot be synchronized.

**FR-066 — Notifications (optional):** If approved and implemented, the system may support in-app or email notifications for applicable events. Browser push notifications may be offered where supported and permitted by user settings.

**FR-067 — Public indexing:** Public course pages and eligible approved materials may be indexed by search engines according to publication permissions and visibility settings.

### 3.9 Administration, Reporting and Auditing

**FR-068 — Administrative dashboard:** Authorized administrators shall see relevant account and content counts, review queues and recent activity where applicable.

**FR-069 — Basic reports:** Authorized administrators shall be able to view agreed basic administrative reports. Export formats and advanced reporting features shall be determined by the approved scope.

**FR-070 — Audit history:** The system shall record security-relevant and administrative actions, including permission changes, review decisions, restrictions, restorations and other defined events.

**FR-071 — Audit protection:** Audit records shall be access-controlled and protected against unauthorized modification or disclosure.

**FR-072 — Health monitoring:** The system shall provide a health-check mechanism and record relevant failures. Administrative alerts shall be supported where monitoring is configured.
## 4. Non-Functional Requirements

**NFR-001 — Security:** Passwords shall be stored using an appropriate password-hashing algorithm. Plain-text passwords shall never be stored.

**NFR-002 — Authorization:** The system shall follow least-privilege principles and deny unauthorized access by default.

**NFR-003 — File safety:** Upload handling shall validate supported file types and sizes, use safe storage practices and prevent unauthorized execution or exposure of uploaded files.

**NFR-004 — Transport security:** Production application and API traffic shall use HTTPS.

**NFR-005 — Data minimization:** The platform shall collect only information needed for defined functions and restrict access to personal information.

**NFR-006 — Privacy and retention:** Retention and deletion shall follow documented policies approved by the team or relevant institution. Specific retention periods remain to be confirmed.

**NFR-007 — Reliability:** The system shall handle database, file-storage and network failures safely, record useful diagnostic information and avoid reporting incomplete operations as successful.

**NFR-008 — Upload resilience:** Failed uploads shall produce understandable feedback and allow a safe retry where technically feasible.

**NFR-009 — Performance:** Performance targets shall be measurable and agreed after the hosting environment and test conditions are established. Numeric targets remain open.

**NFR-010 — Low bandwidth:** The interface shall minimize unnecessary downloads, compress appropriate assets, use pagination and provide clear loading, empty and error states.

**NFR-011 — Accessibility:** Pages shall use readable typography, meaningful labels, keyboard-accessible controls and sufficient visual distinction for important states.

**NFR-012 — Maintainability:** Code, requirements, architecture, API documentation and test instructions shall be kept understandable and consistent.

**NFR-013 — Testing:** Automated tests shall cover unit behavior, API integration and key end-to-end workflows.

**NFR-014 — Change control:** Changes shall use branches and reviewed pull requests. Automated checks shall pass where configured, and authors shall not approve their own changes.

**NFR-015 — Backup and recovery:** The deployed service shall have documented backup, restoration and recovery procedures covering the database and stored files.

**NFR-016 — Deployment:** The production environment shall use a supported hosting setup, registered domain and HTTPS. Provider selection and cost comparison remain open until the team decides.

## 5. Acceptance Criteria

### 5.1 Accounts and permissions

- [ ] A user can register and sign in using valid details.
- [ ] Invalid authentication attempts do not disclose sensitive account information.
- [ ] Contributor applications can be approved or rejected with recorded decisions.
- [ ] Rejected applicants can correct details and reapply.
- [ ] Suspended or deactivated accounts cannot perform protected actions.
- [ ] Unauthorized API and web actions are rejected server-side.
- [ ] Formal appeals are required only if the optional appeals workflow is approved.

### 5.2 Course catalogue

- [ ] Authorized users can create and manage course records.
- [ ] Course information includes the identifying fields required by the approved data model.
- [ ] Users cannot modify course records without the required permissions.
- [ ] Separate course offerings and enrollment records are required only if the optional enrollment module is approved.

### 5.3 Library and review

- [ ] An eligible PDF or supported image/photo can be submitted with the required metadata.
- [ ] Invalid, unsupported or oversized files are rejected safely with understandable feedback.
- [ ] Newly submitted documents enter the review workflow before public approval.
- [ ] Unapproved submissions and restricted files are not publicly downloadable.
- [ ] Authorized users can search, filter and download eligible documents.
- [ ] Reports can be submitted and reviewed by authorized personnel.
- [ ] Review decisions retain the responsible account, timestamp and reason.
- [ ] Duplicate warnings and document version history are required only if their optional features are approved.

### 5.4 Quizzes

- [ ] Only authorized authors can create quizzes.
- [ ] A quiz cannot be approved by its own author.
- [ ] A submitted attempt is automatically marked.
- [ ] The result references the exact quiz version attempted.
- [ ] Previous permitted attempts and results remain available in the student's history.

### 5.5 Verification and moderation

- [ ] Every approved document receives its unique identifier, visible verification stamp and QR verification token.
- [ ] A valid QR opens the public verification page.
- [ ] Revoked, restricted or removed material is not displayed as currently approved.
- [ ] Private information and restricted files are not exposed publicly.
- [ ] Restriction, restoration and revocation actions leave an authorized audit trail.
- [ ] Historical approval and revocation records remain traceable after a document's verification status changes.

### 5.6 API, PWA and operations

- [ ] Core API routes use `/api/v1/` and documented response formats.
- [ ] List endpoints support pagination where applicable.
- [ ] Protected API operations enforce authentication and authorization.
- [ ] The interface is usable on supported mobile and desktop screens.
- [ ] Pages and assets minimize unnecessary data transfer on slower connections.
- [ ] Health checks, backups and restoration procedures are documented and tested before production release.
- [ ] The deployed application uses HTTPS.
- [ ] Offline reading and notifications are required only if their optional features are approved.

## 6. Constraints and Dependencies

- The first release supports PDF and approved image/photo formats.
- The system depends on a database and a suitable file-storage approach.
- Internet availability may be unreliable for some users.
- Production deployment depends on selecting a hosting provider, domain and backup arrangement.
- External email or push notifications depend on the selected providers and user permissions.
- Course offerings and enrollment management depend on explicit team approval if they are to be included.
- Some features depend on the team confirming permissions, retention rules and institutional policies.
- Interview findings and team decisions must be documented accurately; unconfirmed assumptions shall not be presented as approved requirements.

## 7. Open Questions Requiring Team Confirmation

1. Which technology stack will the team formally approve?
2. Which hosting provider, domain registrar and file-storage arrangement will be used, and what are the costs?
3. What are the maximum file sizes and supported image/photo formats?
4. What are the retention periods for accounts, papers, audit records and deleted content?
5. Will the first release include academic-calendar management, term-specific course offerings and student enrollment?
6. What are the precise basic-access features for pending or unapproved accounts?
7. Which role approves each document category, and what are the final state-transition rules?
8. What public distribution and indexing permissions apply to submitted academic materials?
9. Will document version history, automated duplicate warnings, ratings, formal appeals, notifications or offline reading be included?
10. Which numeric performance targets and load-test conditions will be adopted?
11. Which email and optional browser-push services will be used?
12. What backup schedule, recovery objectives and monitoring arrangements are feasible?
13. Which class-wide software license will the lecturer approve?
14. What evidence from user interviews and team review supports the final requirements?

These questions shall be resolved by the team or documented as accepted limitations. They must not be silently treated as confirmed decisions.

## 8. Traceability and Supporting Documents

This SRS defines required behavior. Supporting documents describe implementation and verification:

- System design: `../design/SYSTEM_DESIGN_DOCUMENT.md`
- Architecture: `../design/ARCHITECTURE.md`
- Data model: `../design/DATA_MODEL.md`
- Technology decisions: `../design/TECHNOLOGY_DECISIONS.md`
- API specification: `../api/API_SPECIFICATION.md`
- Threat model: `../security/THREAT_MODEL.md`
- Test strategy: `../testing/TEST_STRATEGY.md`
- Deployment and recovery: `../operations/DEPLOYMENT_AND_RECOVERY.md`
- User interviews: `USER_INTERVIEWS.md`

Requirement IDs shall be referenced in design decisions and test cases where practical. The team shall update the documents when approved decisions change.

## 9. Approval

This document is a working specification until reviewed by the project team and lecturer. Approval, interview evidence, technology choices, hosting details and other open decisions must be recorded when actually confirmed.
