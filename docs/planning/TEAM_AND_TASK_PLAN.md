# TuStudyHub — Team Tasks and Workflow Plan

**Team size:** 9 members  
**Planning status:** Workflow alignment and Week 1 recovery  
**Original Week 1 deadline:** 20 October 2026  
**Original individual deliverable deadline:** 27 October 2026

## 1. Team Roles and Responsibilities

The existing assignments remain unchanged. Role assignments are proposed until confirmed by the team.

| Role | Responsibility | Member | Original first deliverable |
|---|---|---|---|
| PO / Project Lead | Charter, backlog, requirements, coordination and progress tracking | Princeton | Requirements review and prioritized backlog |
| ARCH / System Architect | Architecture diagram, system structure and System Design Document | Comfort | Reviewed architecture diagram |
| API Designer | REST API resources, endpoint contracts and OpenAPI documentation | Darius | API endpoint and request/response draft |
| ID / Backend Identity | Registration, login, roles and permissions | Regstopher | Authentication and permissions breakdown |
| CORE / Backend Core | Papers, verification, revocation and quizzes | Joseph | Core workflow breakdown |
| DB / Database Engineer | Entities, ERD, migrations, indexes and backup design | Madison | Entity inventory and ERD |
| UX / Frontend | Wireframes, mobile PWA and interface planning | Odasco | Initial wireframes and PWA plan |
| SEC / Security & Privacy | Threat model, privacy considerations and security review | Sieh | Initial threat list |
| QA / Test + OPS / DevOps & Documentation | Test planning, repository documentation and deployment research | Jessica | Test cases and infrastructure research |

## 2. Recommended Workflow and Dependencies

The following sequence organizes the existing work without changing who owns it.

### Phase 1 — Establish the project baseline

**Lead:** Princeton  
**Supporting members:** All team members, within their existing roles

- Review the current requirements, backlog, and project scope.
- Confirm which project documents already exist.
- Identify missing, outdated, or unreviewed sections.
- Confirm the nine members' role assignments.
- Record the evidence and status of each existing deliverable.

**Exit condition:** The team has one agreed project baseline and a clear list of completed, review-required, and outstanding work.

### Phase 2 — Align the system design

**Primary owners:** Comfort, Odasco, Madison, and Princeton

| Member | Existing responsibility | Dependency or coordination |
|---|---|---|
| Comfort | Architecture diagram and system structure | Use the agreed requirements and coordinate with the API, database, and UX workstreams. |
| Odasco | Wireframes and PWA plan | Use the same requirements and user workflows as the architecture and API design. |
| Madison | Entity inventory and ERD | Align entities and relationships with the documented workflows and API resources. |
| Princeton | Requirements and backlog review | Resolve conflicting requirements and record approved decisions. |

**Exit condition:** The architecture, wireframes, data model, and requirements describe the same system.

### Phase 3 — Align API and functional workflows

**Primary owners:** Darius, Regstopher, and Joseph

| Member | Existing responsibility | Dependency or coordination |
|---|---|---|
| Darius | API endpoint and request/response draft | Align endpoints and data contracts with the architecture and database model. |
| Regstopher | Authentication and permissions breakdown | Align registration, login, roles, and access rules with the requirements and API design. |
| Joseph | Core workflow breakdown | Align paper management, verification, revocation, and quizzes with the requirements and data model. |

**Exit condition:** The API, identity rules, and core workflows are consistent with the approved system design.

### Phase 4 — Security, testing, infrastructure, and documentation

**Primary owners:** Sieh and Jessica

| Member | Existing responsibility | Coordination |
|---|---|---|
| Sieh | Threat list and security/privacy review | Review risks arising from authentication, permissions, data handling, and core workflows. |
| Jessica | Test cases, repository documentation, and infrastructure research | Develop test coverage from the requirements and workflows; review infrastructure and deployment needs against the proposed architecture. |

These activities can begin in parallel with earlier phases where sufficient information exists. Final reviews should use the latest agreed requirements and design.

**Exit condition:** Security risks, test coverage, infrastructure findings, and documentation gaps are recorded and traceable.

### Phase 5 — Integration and team review

**Lead:** Princeton  
**Participants:** All members, according to their existing roles

- Compare the deliverables against the project requirements.
- Resolve inconsistencies between diagrams, API contracts, data models, and wireframes.
- Record outstanding decisions and blockers.
- Review evidence before changing a task's status.
- Confirm the next implementation priorities as a team.

**Exit condition:** The team agrees on what is ready, what needs revision, and what remains outstanding.

## 3. Individual Work Log

Keep this table as the source of truth for individual progress. The original deadline is retained for historical accuracy.

| Member | Deliverable | Issue/PR link | Original due date | Current status |
|---|---|---|---|---|
| Princeton | Requirements and backlog review | To create/link | 27 Oct 2026 | Verify existing work |
| Comfort | Architecture diagram | To create/link | 27 Oct 2026 | Review and improve diagram |
| Darius | API endpoint draft | To create/link | 27 Oct 2026 | Verify existing work |
| Regstopher | Authentication and permissions breakdown | To create/link | 27 Oct 2026 | Verify existing work |
| Joseph | Core workflow breakdown | To create/link | 27 Oct 2026 | Verify existing work |
| Madison | Entity inventory and ERD | To create/link | 27 Oct 2026 | Verify existing work |
| Odasco | Wireframes and PWA plan | To create/link | 27
