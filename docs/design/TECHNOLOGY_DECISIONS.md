# Technology Decisions

## Status

The project team has selected the technology stack listed below. Implementation details and operational decisions that remain unresolved are tracked separately and must be finalized before the relevant features are implemented or deployed.

## Recommended stack
- Backend: Python + FastAPI.
- Database: PostgreSQL.
- Database access: SQLAlchemy.
- Database migrations: Alembic.
- Frontend: HTML, CSS and JavaScript.
- Application: responsive, installable Progressive Web App (PWA), using a web app manifest and service worker.
- API: REST/JSON under `/api/v1/`.
- API documentation: FastAPI-generated OpenAPI schema and interactive Swagger UI.
- Testing: pytest and HTTPX for automated backend/API tests.
- Python code quality: Ruff.
- Version control and collaboration: GitHub Issues, branches and reviewed pull requests.
- Hosting: Linux VPS, registered domain, HTTPS and Cloudflare-managed DNS, as required by the concept paper.

## Rationale
This stack follows the existing project proposal and supports an API-first system without introducing a separate frontend framework unnecessarily. FastAPI provides OpenAPI documentation, PostgreSQL supports relational academic data, and the PWA approach supports mobile access through a browser and installation on compatible devices.

The stack alone does not guarantee security, performance or offline operation. Those qualities must be designed and verified through implementation and tests.

## Alternatives considered
- Django REST Framework: offers an integrated framework and administration features, but switching would depart from the existing FastAPI proposal without a demonstrated need.
- React with TypeScript: may help organize a larger interactive frontend, but introduces additional tooling and learning overhead. Reconsider only if the team identifies a clear requirement that justifies it.
- Separate microservices: not recommended for the initial release because the required features can be organized as modules in one backend application.

## Decision register

| Decision | Recommendation | Status |
|---|---|---|
| Backend | Python + FastAPI | Pending team confirmation |
| Database | PostgreSQL | Pending team confirmation |
| Database access and migrations | SQLAlchemy + Alembic | Pending team confirmation |
| Frontend | HTML, CSS and JavaScript | Pending team confirmation |
| API | REST/JSON under `/api/v1/` | Required design target; exact contract pending |
| PWA | Manifest and service worker | Required; implementation plan pending |
| Testing | pytest + HTTPX | Pending team confirmation |
| Code quality | Ruff | Pending team confirmation |
| Methodology | Agile with weekly increments and reviewed pull requests | Pending team confirmation |
| Hosting | Linux VPS + registered domain + HTTPS | Required; provider, cost and setup need research |

## Decisions still required
- Confirm the stack and workflow with the team and check the lecturer's requirements.
- Define the authentication method, password hashing, token/session lifecycle and authorization rules.
- Decide file storage, upload limits, validation and safe download behavior.
- Research VPS options, capacity, cost, backups and recovery.
- Confirm domain/VPS budget and account owner.
- Confirm CI checks and the required test coverage.

Do not record a pending decision as approved until the responsible people confirm it. Document material changes in the System Design Document.
