# TuStudyHub Project Report

**Project:** Open Student Past Papers & Library Platform  
**Working Name:** TuStudyHub  
**Institution:** William V. S. Tubman University  
**Department:** Computer Science  
**Course:** System Design  
**Project Team:** [Enter team name or members]  
**Project Supervisor:** [Enter lecturer's name]  
**Report Status:** Working Draft  
**Target Submission Date:** November 17, 2026  
**Deployment URL:** [Enter live URL when available]

---

## 1. Executive Summary

TuStudyHub is a student-focused digital platform intended to improve access to academic resources and support learning at William V. S. Tubman University. The platform will provide a searchable document library, course-based quizzes, and a verification system for approved academic documents.

The project combines requirements analysis, system design, application development, testing, documentation, deployment, and collaborative software engineering practices. GitHub will be used to manage source code, documentation, task contributions, and peer reviews.

This report defines the project's scope, proposed schedule, team responsibilities, deliverables, development workflow, testing approach, communication practices, and major risks. It is a planning document; completed work and test results must be recorded only when supported by actual evidence.

## 2. Project Scope and Objectives

### 2.1 Objectives

The main objectives are to:

- Provide a central library for approved examination papers, thesis papers, and course syllabi.
- Allow users to search and filter documents by course, academic year, semester, and document type.
- Support course-based multiple-choice quizzes with automatic marking and score history.
- Assign approved documents unique identifiers and visible verification stamps.
- Provide QR-based verification pages showing whether a document is currently verified or revoked.
- Deliver a documented REST API under `/api/v1/`.
- Provide a responsive, installable Progressive Web App (PWA).
- Deploy the system on a VPS with HTTPS, appropriate access controls, backups, and a tested recovery procedure.

### 2.2 Main User Groups

- **Students:** Browse and download approved resources, take quizzes, and verify documents.
- **Lecturers and approved authors:** Submit or create academic resources and quizzes, subject to assigned permissions.
- **Moderators:** Review submitted documents and manage approval or revocation decisions.
- **Administrators:** Manage platform configuration, access, security, and operational maintenance.

### 2.3 Scope Boundaries

The three core feature areas are the document library, quizzes, and document verification. Optional features—such as advanced analytics, messaging, ratings, and full offline functionality—will be considered only if time and resources permit or the lecturer confirms that they are required.

Full student enrollment and add/drop management are not treated as mandatory requirements unless the approved project requirements are updated.

## 3. Project Timeline and Milestones

| Milestone | Target Date | Expected Evidence |
|---|---|---|
| Design and infrastructure review | October 27, 2026 | Reviewed design and infrastructure notes |
| Foundation and document library | November 3, 2026 | Working foundation and document library demonstration |
| Verification stamp and quizzes | November 10, 2026 | Demonstration of document verification and quizzes |
| Final submission | November 17, 2026 | Integrated system, documentation, deployment, and demonstration |

Dates represent planned milestones. The team should update progress and record evidence as work is completed. Any schedule changes should be discussed and documented.

## 4. Team Roles and Responsibilities

Team members should be assigned by agreement. Replace the placeholders below with the actual names and agreed responsibilities.

| Role | Assigned Member | Main Responsibilities | Expected Output |
|---|---|---|---|
| Project Coordinator | [Name] | Track milestones, coordinate meetings, monitor blockers | Updated project plan and progress notes |
| Requirements and Documentation Lead | [Name] | Maintain requirements, design documents, and user documentation | Reviewed project documents |
| Backend and API Developer | [Name] | Implement application logic, permissions, API endpoints, and validation | Tested backend and API |
| Frontend and PWA Developer | [Name] | Implement responsive screens, navigation, and user interactions | Working web interface |
| Database and Infrastructure Lead | [Name] | Maintain data design, deployment configuration, backups, and recovery procedures | Database and deployment evidence |
| Testing and Quality Lead | [Name] | Prepare test cases, reproduce defects, and record test results | Test report and defect log |

These are proposed responsibilities, not claims that specific members have already completed the work. If the team is smaller, members may hold multiple roles. Each task should still have a clearly identified owner and reviewer.

### 4.1 Task Assignment Register

| Task | Owner | Reviewer | Due Date | Status / Evidence |
|---|---|---|---|---|
| Confirm requirements and scope | [Name] | [Name] | [Date] | [Update] |
| Review architecture and data model | [Name] | [Name] | [Date] | [Update] |
| Implement document library | [Name] | [Name] | Nov. 3 | [Update] |
| Implement document verification | [Name] | [Name] | Nov. 10 | [Update] |
| Implement quizzes and scoring | [Name] | [Name] | Nov. 10 | [Update] |
| Complete API documentation | [Name] | [Name] | [Date] | [Update] |
| Test, deploy, and verify backups | [Name] | [Name] | Nov. 17 | [Update] |
| Prepare final report and demonstration | [Name] | [Name] | Nov. 17 | [Update] |

Each member should keep evidence of contributions, such as reviewed pull requests, commits, tests, documentation changes, or deployment records.

## 5. Development Approach and GitHub Workflow

The team will use an iterative development approach. Work will be divided into small tasks, implemented, reviewed, tested, and integrated incrementally.

### 5.1 Repository Workflow

1. Pull the latest changes from the appropriate remote branch.
2. Create a separate branch for a specific task.
3. Make focused changes and run relevant checks.
4. Commit with a clear, descriptive message.
5. Push the branch to GitHub and open a pull request.
6. Ask another team member to review the changes.
7. Resolve review comments and checks before merging.
8. Update the task register with the resulting evidence.

Direct commits to `main` should be avoided. Secrets, passwords, private keys, real student records, and copyrighted examination files without permission must not be committed.

### 5.2 Definition of Done

A task is considered complete when its agreed requirements are implemented, relevant checks have passed, documentation is updated where necessary, and the change has been reviewed and merged according to the team's workflow. A feature should not be marked complete merely because its interface exists.

## 6. Deliverables

| Deliverable | Expected Contents | Evidence |
|---|---|---|
| Requirements documentation | Functional and non-functional requirements | Reviewed requirements file |
| System design documentation | Architecture, data model, and technology decisions | Design review |
| Document library | Submission, moderation, search, and download functionality | Demonstration and test results |
| Quiz module | Question creation, quiz attempts, marking, and score history | Test cases and demonstration |
| Verification module | Unique document identifiers, stamps, QR codes, and status pages | Verification tests |
| REST API | Versioned JSON endpoints, consistent errors, pagination, and interactive documentation | API documentation and test results |
| PWA | Responsive, installable phone-friendly interface | Browser and installation checks |
| Deployment and recovery | VPS configuration, HTTPS, access controls, automated backups, and tested restoration | Deployment and recovery evidence |
| Final documentation | User guidance, test results, project report, and submission checklist | Completed documents |

The final submission should identify any incomplete requirements and explain their status honestly.

## 7. Risk Management

| Risk | Possible Effect | Mitigation |
|---|---|---|
| Limited time | Features or documentation remain incomplete | Prioritize core requirements and review progress frequently |
| Unclear task ownership | Duplicate work or missed responsibilities | Assign an owner and reviewer to each task |
| Integration conflicts | Changes break existing functionality | Use small pull requests and test before merging |
| Unauthorized document sharing | Copyright or privacy concerns | Upload only authorized files and apply appropriate permissions |
| Weak access control | Unauthorized changes or disclosure | Enforce role-based permissions and validate requests on the server |
| Data loss | Loss of accounts, documents, or scores | Automate backups and test restoration |
| Unreliable connectivity | Difficulties accessing the service | Optimize the interface and test under realistic network conditions |
| Unverified completion claims | Incorrect final report | Record actual test outcomes and link to supporting evidence |

Risks should be reviewed during team meetings. New risks, their owners, and the actions taken should be added to the project records.

## 8. Quality Assurance and Testing Strategy

Testing should cover individual components, API behavior, integration between modules, user workflows, security, and deployment.

Key test scenarios include:

- Search and filter approved documents using their metadata.
- Confirm that unapproved documents are not publicly accessible.
- Confirm that authorized users can submit documents and permitted reviewers can approve or reject them.
- Verify that quiz answers are marked correctly and scores are saved.
- Confirm that each approved document has the expected identifier and verification information.
- Confirm that verification pages display current verified or revoked status.
- Confirm that unauthorized requests are rejected and errors follow the documented format.
- Check pagination, input validation, and relevant access permissions.
- Test the interface on desktop and mobile-sized screens.
- Verify HTTPS, backup creation, and restoration from a backup.

Actual results should be recorded as **Pass**, **Fail**, or **Not Tested**, with the date, tester, and supporting evidence. No test should be reported as passed before it has been performed.

## 9. Communication Plan

The team should use agreed communication channels for task coordination, technical questions, and announcements. A short progress update should identify:

- Work completed since the previous update.
- Work planned next.
- Blockers or decisions requiring help.
- Pull requests awaiting review.
- Risks that could affect a milestone.

Important decisions—including requirement changes, changes to responsibilities, and schedule adjustments—should be recorded in the repository. Team members should raise blockers early rather than waiting until a milestone is missed.

## 10. Approval and Sign-Off

The following section should be completed when the relevant people have reviewed the report.

| Approval Role | Name | Signature / Confirmation | Date |
|---|---|---|---|
| Project Coordinator | [Name] | [Pending] | [Date] |
| Team Representative | [Name] | [Pending] | [Date] |
| Project Supervisor / Lecturer | [Name] | [Pending] | [Date] |

Approval must not be implied until it has actually been given.

## 11. Final Review Checklist

Before submission, the team should confirm the following:

- [ ] Actual team members and responsibilities are recorded.
- [ ] Requirements and design documents reflect the agreed scope.
- [ ] The three core feature areas are integrated and tested.
- [ ] API documentation and error formats are checked.
- [ ] The PWA has been tested on relevant screen sizes.
- [ ] Deployment uses HTTPS and appropriate access controls.
- [ ] Automated backups and restoration have been tested.
- [ ] Test outcomes and known limitations are documented.
- [ ] GitHub contributions and pull-request reviews are available as evidence.
- [ ] The live deployment URL and final supporting documents are included.
- [ ] The lecturer's license decision and any other outstanding approvals are confirmed.

### Supporting Documents

Refer to the repository's `docs/` directory for the detailed requirements, system design, architecture, data model, API specification, testing strategy, threat model, deployment and recovery procedures, and planning documents.

---

**Document Control:** This report is a working project plan. Replace placeholders, verify dates and responsibilities, and update progress using actual project evidence before submitting it as a final report.
