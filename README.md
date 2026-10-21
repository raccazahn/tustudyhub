# TuStudyHub — Open Student Past Papers & Library Platform

**Course:** System Design  
**Project Type:** Group Software Engineering Project  
**Project Status:** Planning and Development  
**Final Submission:** November 17, 2026

## 1. Project Overview

TuStudyHub is a student-focused academic platform designed to provide a centralized, searchable library of past examination papers and other academic resources.

The platform aims to make reliable learning materials easier to access, share, review, and verify. It will support document verification, digital identification of approved papers, and multiple-choice quizzes with automatic marking.

The system will prioritize mobile accessibility, low-bandwidth performance, security, and maintainability.

## 2. Core Features

### Academic Document Library
- Upload, browse, search, and download academic documents.
- Support examination papers, thesis papers, and course syllabi.
- Organize documents by course and relevant academic metadata.
- Allow authorized lecturers or moderators to review and approve submissions.

### Multiple-Choice Quizzes
- Allow lecturers and approved contributors to create quizzes.
- Allow students to take quizzes and receive automatically calculated scores.
- Maintain quiz score history.

### Digital Paper Verification
- Assign a unique identifier to every approved paper.
- Generate a QR code linking to its public verification page.
- Display the paper's verification status, including whether it has been revoked.

### Accounts and Access Control
- Support user accounts and role-based permissions.
- Provide appropriate access for students, lecturers, moderators, and administrators.

### Progressive Web Application (PWA)
- Provide a mobile-friendly, installable web application.
- Optimize pages and file handling for users with limited internet connectivity.

## 3. Proposed Technology Stack

The following stack is proposed and remains subject to confirmation by the project team.

- **Backend:** Python with FastAPI
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, and JavaScript
- **API:** REST with JSON, versioned under `/api/v1/`
- **API Documentation:** OpenAPI documentation generated through FastAPI
- **Application Type:** Responsive web application and installable PWA
- **Hosting:** VPS deployment with a registered domain managed through Cloudflare, as required by the project concept paper.

## 4. Development Methodology

The team proposes an Agile development approach based on short iterations, prioritized tasks, regular reviews, continuous testing, and incremental delivery.

The team will use an API-first workflow to help frontend and backend development proceed in parallel. GitHub issues, branches, pull requests, code reviews, and meaningful commit messages will support collaboration and traceable contributions.

## 5. Project Development Priorities

Development will prioritize the mandatory requirements in the project concept paper:

1. Establish the system architecture, requirements, database design, and API contract.
2. Implement accounts, roles, and the academic document library.
3. Implement multiple-choice quizzes and automatic marking.
4. Implement unique paper identifiers, QR codes, and public verification.
5. Test, secure, document, and deploy the integrated platform.

## 6. Repository Contribution Rules

- Keep the repository private until after project submission.
- Do not commit directly to the `main` branch.
- Submit changes through pull requests and obtain review from at least one other team member.
- Link relevant GitHub issues to development work.
- Test changes and document important decisions.
- Never commit passwords, API keys, real student data, or copyrighted examination materials without authorization.
- Use synthetic or otherwise authorized sample data.
- Team members must understand and be able to explain their contributions.

## 7. Project Documentation

The repository will contain the documentation required by the course, including:

- System Design Document
- Architecture diagram
- Database Entity-Relationship Diagram (ERD)
- API specification
- Infrastructure and hosting report
- Contribution guidelines and security policy
- Testing documentation
- User manual and deployment/recovery guide

## 8. Project Team

TuStudyHub is a collaborative System Design course project. Each team member will have identifiable responsibilities and evidence of their contribution through project documentation, GitHub activity, reviews, and deliverables.

## 9. Project Timeline

- **Week 2:** System Design Document, architecture, ERD, API specification, and hosting preparation.
- **Week 3:** Accounts, document library, verification workflow, and PWA foundation.
- **Week 4:** Digital verification and multiple-choice quizzes.
- **Week 5:** Integration, final testing, documentation, handover, and submission.

**Final submission deadline:** November 17, 2026.

## 10. Project Goals

TuStudyHub aims to deliver a working, secure, mobile-friendly academic resource platform that students can use to access learning materials and verify approved papers. The completed project should be maintainable, documented, and understandable by future student developers.

---

*TuStudyHub is being developed as an academic System Design project. Final technology choices, team responsibilities, and implementation details will be confirmed and documented as the project progresses.*
