# TuStudyHub Project Charter

## Purpose and problem
Provide a centralized, searchable platform for academic documents, addressing scattered, incomplete, unorganized and unverified past papers.

## Goals
- Make learning resources easier to find and download.
- Provide document approval and public verification.
- Provide multiple-choice quizzes with automatic marking and score history.
- Provide a documented public API and installable mobile-friendly PWA.
- Leave maintainable code and documentation for future cohorts.

## Mandatory scope
1. Document library for exam papers, thesis papers and course syllabi.
2. MCQ quizzes with automatic marking and student scores.
3. Unique digital identifier/stamp and QR-linked public verification page.
4. Accounts and roles, documented API, phone-friendly installable PWA, and VPS deployment under a registered domain.

## Out of scope
Live/current exams, grades or personal academic records, and payments.

## Proposed choices
- Methodology: Agile, pending team confirmation.
- Backend: Python + FastAPI.
- Database: PostgreSQL.
- Frontend: HTML, CSS and JavaScript.
- Supporting recommendations: SQLAlchemy, Alembic, pytest, HTTPX and Ruff.
- API: REST/JSON under `/api/v1/`, with generated OpenAPI documentation.
- PWA: responsive interface, web app manifest and service worker.

The technology baseline is recommended by the project lead and remains pending team confirmation. See `docs/design/TECHNOLOGY_DECISIONS.md` for the rationale, alternatives and open decisions.

## Constraints
- Week 2 deliverable due 27 October 2026; final due 17 November 2026.
- Domain bought/managed through Cloudflare; live VPS with HTTPS.
- Use only synthetic or otherwise authorized sample data in the repository.
- Every member must show and defend their contribution.
- The lecturer's acceptance checklist and submission instructions take precedence.

## Decisions to confirm
- [ ] Lecturer confirms MIT or Apache-2.0 license.
- [ ] Confirm class GitHub organization and repository ownership.
- [ ] Confirm team roster and roles.
- [ ] Confirm technology baseline and Agile workflow with the team.
- [ ] Confirm domain/VPS budget and account owner.
- [ ] Research and document the VPS provider, deployment design, capacity, cost and recovery plan.
