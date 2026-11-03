# TuStudyHub

**Learn • Share • Verify**  
*Tertiary Academic Resource and Verification Platform*

TuStudyHub is a Computer Science team project for organizing approved academic resources, supporting course-based learning, and providing public verification of approved documents. It is designed as a responsive web application and installable PWA backed by one versioned API and a central PostgreSQL database.

## Project scope

- Academic library for examination papers, thesis papers and syllabi.
- College, department and course catalogue.
- Role-based accounts, review and approval workflows.
- Unique document identifiers, verification stamps, QR codes and public status pages.
- MCQ quizzes, automatic marking and score history.
- Ratings/reviews, notifications, academic Q&A, feedback and administrative analytics.
- Hybrid AI-assisted quiz drafting with deterministic validation and lecturer approval.
- Secure offline access and synchronization for eligible data.
- Shared backend and database for web, desktop and Android PWA clients.

The project is **not** a full student information system and does not replace official university admissions, enrollment or academic-record systems.

## Current implementation status

The Copilot Stage 1 audit supplied on 3 November 2026 reports that the application currently uses an in-memory runtime store rather than PostgreSQL. It also identifies visitor-permission gaps and missing ratings, notifications, Q&A and full offline synchronization. These are open implementation tasks, not completed features. TypeScript and production-build checks were not run because dependencies were not installed in that workspace.

See the [Project Plan](docs/planning/PROJECT_PLAN.md) for the audit baseline, delivery phases, risks and acceptance criteria.

## Authoritative project documents

| Document | Purpose |
|---|---|
| [Project Plan](docs/planning/PROJECT_PLAN.md) | Scope, work breakdown, team ownership, milestones, risks and delivery controls |
| [Software Requirements Specification](docs/requirements/REQUIREMENTS.md) | Functional/non-functional requirements and acceptance criteria |
| [System Design Document](docs/design/SYSTEM_DESIGN_DOCUMENT.md) | System design, workflows and technical structure |
| [Architecture](docs/design/ARCHITECTURE.md) | Component boundaries and system architecture |
| [Data Model](docs/design/DATA_MODEL.md) | Core entities and relationships |
| [Technology Decisions](docs/design/TECHNOLOGY_DECISIONS.md) | Audited stack baseline and unresolved engineering decisions |
| [REST API Specification](docs/api/API_SPECIFICATION.md) | Versioned API contract and access rules |
| [UX Wireframes and PWA](docs/ux/WIREFRAMES_AND_PWA.md) | Screen flows and PWA behavior |
| [Design System](docs/ux/DESIGN_SYSTEM.md) · [Color Scheme](docs/ux/COLOR_SCHEME.md) | Visual standards and brand tokens |
| [QA Test Strategy](docs/testing/TEST_STRATEGY.md) | Test levels and acceptance scenarios |
| [Threat Model](docs/security/THREAT_MODEL.md) | Security and privacy risks |
| [Deployment and Recovery](docs/operations/DEPLOYMENT_AND_RECOVERY.md) | Production setup, backup and recovery |
| [Responsible AI Use](docs/contributing/AI_USE.md) | AI assistance and disclosure guidance |

See the [documentation index](docs/README.md) for the canonical document set.

## Team engineering workflow

1. Track tasks and decisions in GitHub Issues.
2. Create a focused branch for each task; do not commit directly to `main`.
3. Open a pull request linked to the relevant issue and SRS requirement IDs.
4. Include tests, screenshots or other evidence appropriate to the change.
5. Obtain review from another team member before merging.
6. Update the authoritative documents when behavior, data structures or API contracts change.

## Security and academic integrity

Never commit passwords, API keys, JWT secrets, database credentials, real student data, private uploads or academic materials the team is not authorized to distribute. Use synthetic or explicitly authorized test data. Public visibility of a verification page does not make the underlying document downloadable to anonymous visitors.

## Project administration

- **Institution:** William V. S. Tubman University
- **Department:** Computer Science
- **Course:** System Design
- **Team:** Team B
- **Project lead:** Princeton R. Zahnmie
- **Lecturer/supervisor:** Confirm against the course submission instructions
- **Target submission date:** 17 November 2026, subject to lecturer confirmation

The SRS and approved lecturer instructions take precedence over assumptions in draft documents. Implementation and deployment status must be supported by evidence.
