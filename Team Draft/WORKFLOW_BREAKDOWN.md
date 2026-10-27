# Workflow Breakdown

## 1. User Access
- Students, lecturers, moderators, and administrators open the installable, mobile-friendly Progressive Web App (PWA).
- Users access system features through the REST API at `/api/v1/`.

## 2. Identity and Permissions
- The API routes identity-related requests to the Identity module.
- Identity and role permissions determine which features each user can access.
- Identity information is stored in PostgreSQL.

## 3. Document Library and Upload
- Users send document-library and upload requests through the API.
- The Documents module handles document information and uploaded files.
- Document information is stored in PostgreSQL.
- Uploaded files are stored in file storage.

## 4. Approval and Verification
- Verification requests pass through the API to the Approval and Verification module.
- Verification records are stored in PostgreSQL.
- The module connects to a public verification page.
- The public verification page checks the related information in PostgreSQL.

## 5. Multiple-Choice Quizzes
- Quiz requests pass through the API to the Multiple-Choice Quizzes module.
- Quiz data is stored in PostgreSQL.

## 6. Data and File Storage
- PostgreSQL stores identity, document, verification, and quiz data.
- File storage holds uploaded documents and other supported files.

## 7. Deployment and Operational Decisions
The architecture document leaves these items for the team to decide and document:
- Hosting and reverse proxy.
- File-storage approach.
- Authentication boundaries.
- QR-token handling.
- Backups, monitoring, and health checks.
- Which modules will be deferred.

## Workflow Summary
User → Mobile-friendly PWA → REST API (`/api/v1/`) → Identity / Documents / Verification / Quizzes → PostgreSQL and file storage, with verification also available through the public verification page.

## Note
The source architecture describes this as an initial sketch. The team should review it and label mandatory and optional components in the final design.
