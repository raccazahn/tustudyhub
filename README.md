# TuStudyHub

**Learn • Share • Verify**  
*Tertiary Academic Resource and Verification Platform*

TuStudyHub is a Computer Science team project for organizing approved academic resources, supporting course-based learning, and managing document review and verification. It is designed as a responsive web application and installable Progressive Web App (PWA), backed by a versioned API and PostgreSQL.

## Project at a glance

- Academic resource library for examination papers, thesis papers and syllabi.
- College, department and course catalogue.
- Role-based accounts and approval workflows.
- Document identifiers, verification records and QR-linked status checks.
- Multiple-choice quizzes and score history.
- Feedback, ratings/reviews, notifications, academic Q&A and administrative workflows in the approved project scope.
- Shared backend and database for supported web and installed PWA clients.

TuStudyHub is **not** a full student information system and does not replace official university admissions, enrollment, grades or academic records.

## Current delivery status — 25 November 2026

The application has been deployed to the project VPS. PostgreSQL is configured, database migrations have been applied, and the application has responded successfully through the VPS/Nginx HTTP path. The production health check has reported PostgreSQL as available.

**Public domain activation is still pending.** The registered domain `tustudyhub.com` and the active Cloudflare DNS zone currently report a nameserver mismatch; DNSSEC also requires confirmation. Cloudflare was contacted on **22 November 2026** and the team is awaiting a case-specific response. The domain is therefore not yet confirmed live over HTTPS. The VPS does not need to be rebuilt solely to resolve this DNS issue.

Some final production tasks, including confirming a persistent application service, completing controlled administrator provisioning, enabling HTTPS after DNS is corrected, and validating the exact deployed commit, remain to be completed. Do not treat planned or partially implemented features as complete without current test evidence.

## Website and source code

- **GitHub repository:** https://github.com/raccazahn/tustudyhub
- **Website:** https://tustudyhub.com — *pending Cloudflare DNS resolution and HTTPS; not yet a confirmed live URL.*

## Start here

| If you are... | Read |
|---|---|
| A student, visitor or general user | [User Guide](docs/user/USER_GUIDE.md) |
| A lecturer or project reviewer | [Documentation Index](docs/README.md) |
| A developer joining the team | [Project Plan](docs/planning/PROJECT_PLAN.md), [Architecture](docs/design/ARCHITECTURE.md) and [API Specification](docs/api/API_SPECIFICATION.md) |
| Responsible for deployment | [Deployment and Recovery](docs/operations/DEPLOYMENT_AND_RECOVERY.md) |
| Reviewing quality and security | [QA Test Strategy](docs/testing/TEST_STRATEGY.md) and [Threat Model](docs/security/THREAT_MODEL.md) |

## Documentation

The `docs/` directory is the canonical location for project documentation. Start with the [Documentation Index](docs/README.md), which groups the user guide, requirements, planning, design, API, testing, security and operations documents.

## Technology

The current repository uses React 18, TypeScript, Vite, Express 4 and Bun, with PostgreSQL for persistent data. Nginx is configured as the VPS reverse proxy. See the application package manifest and [Deployment and Recovery](docs/operations/DEPLOYMENT_AND_RECOVERY.md) for the current deployment record.

## Team engineering workflow

1. Track work in GitHub Issues.
2. Use focused branches for changes.
3. Open pull requests linked to relevant requirements or issues.
4. Include tests and evidence appropriate to the change.
5. Request review from another team member before merging.
6. Update the authoritative documentation when implementation or decisions change.

## Security and academic integrity

Never commit passwords, API keys, JWT secrets, database credentials, real student data, private uploads or academic materials the team is not authorized to distribute. Use synthetic or explicitly authorized test data. A public verification result does not make the underlying document freely downloadable.

## Project information

- **Institution:** William V. S. Tubman University
- **Department:** Computer Science
- **Course:** System Design
- **Team:** Team B
- **Project lead:** Princeton R. Zahnmie

The SRS and approved lecturer instructions take precedence over assumptions in draft documents. Implementation, test and deployment claims must be supported by evidence.
