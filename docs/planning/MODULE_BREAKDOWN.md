# ID and CORE Module Breakdown

This is a planning template for the backend Identity (ID) and Core (CORE) roles. Confirm boundaries after the API contract and data model are discussed.

## Identity module (ID)
- Registration and login (school email or approved alternative).
- Password reset.
- Role-based permissions for students, verified contributors, lecturers, moderators and admins.
- Lecturer/contributor permissions across paper approvals and quiz creation, coordinated with CORE.
- Token authentication and secure session/token handling.
- Tests: registration/login, invalid credentials, role access and protected routes.

## Core module (CORE)
- Academic document metadata and upload flow.
- Document types: exam paper, thesis paper and course syllabus.
- Browse/search/download by course and type.
- Review/approval workflow and state transitions.
- Unique paper ID, stamp, QR token, public verification and revocation.
- Multiple-choice quiz creation, attempts, automatic marking and score history.
- Tests: upload validation, document permissions, approval, verification/revocation and quiz marking.

## Contract and dependencies
- Agree endpoint methods, paths, schemas and error format with API designer before implementation.
- Agree entities/relationships with DB role.
- Use mock responses where helpful so frontend work can proceed in parallel.
- Define small issues and acceptance criteria for each module.
- Do not implement optional extras before all required live features work.
