# TuStudyHub
### Open Student Past Papers & Library Platform

**Course:** System Design · **Final deadline:** 17 November 2026  
**Repository:** [raccazahn/tustudyhub](https://github.com/raccazahn/tustudyhub)  
**Status:** Planning and requirements  
**Methodology:** Agile is proposed, pending team confirmation.  
**Proposed stack:** Python + FastAPI, PostgreSQL, HTML, CSS and JavaScript; final choices must be confirmed and justified.

TuStudyHub aims to provide a searchable academic document library, multiple-choice quizzes, and public verification for approved papers.

## Required live features
1. **Document library:** upload, browse by course and type, and download examination papers, thesis papers and course syllabi; lecturer or moderator approval.
2. **Quizzes:** multiple-choice quizzes created by lecturers and approved authors, with automatic marking and student scores.
3. **Digital identifier and stamp:** unique ID and visible stamp with a QR code leading to a public **Verified** or **Revoked** page.

Also required: accounts and roles, documented public API, installable phone-friendly PWA, and live VPS deployment under a registered domain.

## Documentation hub

| Document | Purpose |
|---|---|
| [Project charter](docs/planning/PROJECT_CHARTER.md) | Purpose, scope, constraints and decisions |
| [Team roles and task plan](docs/planning/TEAM_AND_TASK_PLAN.md) | Roles and individual evidence |
| [Backlog and weekly deliverables](docs/planning/BACKLOG_AND_DELIVERABLES.md) | Priority tasks, dates and acceptance checks |
| [Personal task plan template](docs/planning/PERSONAL_TASK_PLAN_TEMPLATE.md) | Individual graded task plan |
| [ID/CORE module breakdown](docs/planning/MODULE_BREAKDOWN.md) | Backend module planning |
| [Final submission checklist](docs/planning/FINAL_SUBMISSION_CHECKLIST.md) | Final package and handover checklist |
| [Requirements and user stories](docs/requirements/REQUIREMENTS.md) | Source-based requirements and acceptance criteria |
| [Interview guide](docs/requirements/USER_INTERVIEWS.md) | Interview at least five classmates; findings pending |
| [Technology decisions](docs/design/TECHNOLOGY_DECISIONS.md) | Proposed stack and decisions to confirm |
| [System Design Document](docs/design/SYSTEM_DESIGN_DOCUMENT.md) | SDD outline for the Week 2 review |
| [Architecture](docs/design/ARCHITECTURE.md) | Architecture diagram task |
| [Data model / ERD](docs/design/DATA_MODEL.md) | Entity inventory and ERD task |
| [API contract](docs/api/API_SPECIFICATION.md) | API-first resource and endpoint draft |
| [Mock server plan](docs/api/MOCK_SERVER_PLAN.md) | API-first parallel development |
| [Wireframes and PWA shell](docs/ux/WIREFRAMES_AND_PWA.md) | Week 2 mobile-first UX deliverable |
| [Infrastructure report](docs/operations/INFRASTRUCTURE_REPORT.md) | Domain, VPS, capacity, cost and hardening |
| [Deployment and recovery guide](docs/operations/DEPLOYMENT_AND_RECOVERY.md) | Runbook template |
| [Threat register](docs/security/THREAT_MODEL.md) | Initial risks and mitigations |
| [QA test strategy](docs/testing/TEST_STRATEGY.md) | Test levels and acceptance scenarios |
| [AI-assisted work guide](docs/contributing/AI_USE.md) | Responsible use and disclosure |
| [Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [License status](LICENSE_STATUS.md) | Repository policies |
| [Issue template](.github/ISSUE_TEMPLATE/task-or-bug.md) · [Pull request template](.github/pull_request_template.md) | Consistent work tracking and review |

## Team workflow
1. Track work in a GitHub Issue linked to a backlog item.
2. Work on a branch; do not commit directly to `main`.
3. Open a focused pull request with test evidence and AI-use disclosure when applicable.
4. Obtain review from at least one other team member before merging.
5. Update docs when requirements, endpoints, data structures or behaviour change.

**Never commit** passwords, API keys, real student data, real exam files, or copyrighted materials the team is not authorized to share. Use synthetic or authorized sample data.

## Timeline from the concept paper
| Week | Dates | Deliverable |
|---|---|---|
| 1 | 14–20 Oct | Team setup and requirements — due date has passed; track recovery honestly |
| 2 | 21–27 Oct | System Design Document; domain and VPS live |
| 3 | 28 Oct–3 Nov | Foundations and document library live |
| 4 | 4–10 Nov | Digital stamp and quizzes live |
| 5 | 11–17 Nov | Final platform, docs, user manual, promotion strategy and handover |

The lecturer's acceptance checklist and submission time take precedence. Keep the repository private until after submission; the lecturer should have access from day one. The concept paper says the lecturer will confirm MIT or Apache-2.0 for the class before the final `LICENSE` is selected.
