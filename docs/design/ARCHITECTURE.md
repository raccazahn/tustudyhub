# Architecture Diagram

The concept paper suggests (not mandates) a PWA client, REST API with authentication/validation, logical Identity, Papers, Verification, Library, Search, Moderation and Notifications modules, relational data plus file storage, optional background jobs, and deployment with CI/logging/monitoring.

The diagram below is an initial sketch. Review and adjust it as a team; label mandatory and optional components in the final design.

```mermaid
flowchart TD
  U[Students / Lecturers / Moderators / Admins] --> PWA[Installable mobile-friendly PWA]
  PWA --> API[REST API /api/v1/]
  API --> AUTH[Identity and role permissions]
  API --> DOCS[Document library and upload]
  API --> VERIFY[Approval and verification]
  API --> QUIZ[Multiple-choice quizzes]
  AUTH --> DB[(PostgreSQL)]
  DOCS --> DB
  VERIFY --> DB
  QUIZ --> DB
  DOCS --> FILES[File storage]
  VERIFY --> PUBLIC[Public verification page]
  PUBLIC --> DB
```

Decide and document hosting/reverse proxy, file storage, auth boundaries, QR token handling, backups/monitoring/health checks, and deferred modules.
