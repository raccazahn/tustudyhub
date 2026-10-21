# Technology Decisions

## Current proposal — not final
- Backend: Python + FastAPI
- Database: PostgreSQL
- Frontend: HTML, CSS, JavaScript
- Application: responsive, installable PWA
- API: REST/JSON under `/api/v1/`
- API docs: generated OpenAPI / interactive Swagger UI
- Hosting: VPS; domain managed through Cloudflare as required by the concept paper

The concept paper recommends a simple web application serving website and API, a framework that generates API docs (FastAPI is an example), a relational database such as PostgreSQL, and a single VPS. Teams may choose differently if they justify the decision.

| Decision | Current position | Reason to assess | Status |
|---|---|---|---|
| Backend | FastAPI proposed | Python familiarity and generated OpenAPI | Pending team confirmation |
| Database | PostgreSQL proposed | Relational core data | Pending confirmation |
| Frontend | HTML/CSS/JS proposed | Lightweight mobile-first client | Pending confirmation |
| Methodology | Agile proposed | Weekly increments and reviews | Pending confirmation |
| Hosting | VPS + Cloudflare-managed domain required | Required by brief | Research required |

Document alternatives considered, reasons, and the final team's decision in the SDD.
