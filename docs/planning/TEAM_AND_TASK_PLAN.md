# TuStudyHub — Team Tasks and Workflow Plan

**Team size:** 10 members  
**Planning status:** Workflow alignment and Week 1 recovery  
**Original Week 1 deadline:** 20 October 2026  
**Original individual deliverable deadline:** 27 October 2026  
**Revised recovery deadline:** 3 November 2026

---

## 1. Team Roles and Responsibilities

The original nine assignments remain in place. The new member, Prince, has been assigned the Operations, DevOps and Documentation responsibilities previously grouped under Jessica's role.

| Role | Responsibility | Member | Expected deliverable |
|---|---|---|---|
| PO / Project Lead | Charter, backlog, requirements, coordination and progress tracking | Princeton | Requirements review and prioritized backlog |
| ARCH / System Architect | Architecture diagram, system structure and System Design Document | Comfort | Reviewed architecture diagram |
| API Designer | REST API resources, endpoint contracts and OpenAPI documentation | Darius | API endpoint and request/response draft |
| ID / Backend Identity | Registration, login, roles and permissions | Regstopher | Authentication and permissions breakdown |
| CORE / Backend Core | Papers, verification, revocation and quizzes | Joseph | Core workflow breakdown |
| DB / Database Engineer | Entities, ERD, migrations, indexes and backup design | Madison | Entity inventory and ERD |
| UX / Frontend | Wireframes, mobile PWA and interface planning | Odasco | Initial wireframes and PWA plan |
| SEC / Security & Privacy | Threat model, privacy considerations and security review | Sieh | Initial threat list |
| QA / Testing | Test planning, test cases, test execution and defect reporting | Jessica | Test cases and test coverage checklist |
| OPS / DevOps & Documentation | Repository documentation, setup instructions and deployment research | Prince | Documentation review and infrastructure research |

**Role ownership:** Each member is responsible for completing their assigned deliverables and communicating with other members when their work has dependencies.

---

## 2. Recommended Workflow and Dependencies

The following sequence organizes the existing work while preserving individual responsibilities.

### Phase 1 — Establish the project baseline

**Lead:** Princeton  
**Supporting members:** All team members

- Review the current requirements, backlog and project scope.
- Confirm which project documents already exist.
- Identify missing, outdated or unreviewed sections.
- Confirm all ten members' role assignments.
- Record the evidence and status of each existing deliverable.
- Identify blockers and outstanding decisions.

**Exit condition:** The team has one agreed project baseline and a clear list of completed, review-required and outstanding work.

### Phase 2 — Align the system design

**Primary owners:** Comfort, Odasco, Madison and Princeton

| Member | Existing responsibility | Dependency or coordination |
|---|---|---|
| Comfort | Architecture diagram and system structure | Use the agreed requirements and coordinate with API, database and UX workstreams. |
| Odasco | Wireframes and PWA plan | Use the same requirements and user workflows as the architecture and API design. |
| Madison | Entity inventory and ERD | Align entities and relationships with documented workflows and API resources. |
| Princeton | Requirements and backlog review | Resolve conflicting requirements and record approved decisions. |

**Exit condition:** The architecture, wireframes, data model and requirements describe the same system.

### Phase 3 — Align API and functional workflows

**Primary owners:** Darius, Regstopher and Joseph

| Member | Existing responsibility | Dependency or coordination |
|---|---|---|
| Darius | API endpoint and request/response draft | Align endpoints and data contracts with the architecture and database model. |
| Regstopher | Authentication and permissions breakdown | Align registration, login, roles and access rules with requirements and API design. |
| Joseph | Core workflow breakdown | Align paper management, verification, revocation and quizzes with requirements and the data model. |

**Exit condition:** The API, identity rules and core workflows are consistent with the approved system design.

### Phase 4 — Security, testing, infrastructure and documentation

**Primary owners:** Sieh, Jessica and Prince

| Member | Responsibility | Coordination |
|---|---|---|
| Sieh | Threat list and security/privacy review | Review risks arising from authentication, permissions, data handling and core workflows. |
| Jessica | Test planning and test execution | Develop test cases from requirements and workflows, execute available tests and document defects. |
| Prince | Repository documentation and deployment research | Review existing documentation, identify gaps, prepare setup instructions and research deployment requirements against the proposed architecture. |

These activities can begin in parallel with earlier phases where sufficient information exists.

**Exit condition:** Security risks, test coverage, infrastructure findings and documentation gaps are recorded and traceable.

### Phase 5 — Integration and team review

**Lead:** Princeton  
**Participants:** All members

- Compare deliverables against project requirements.
- Resolve inconsistencies between diagrams, API contracts, data models and wireframes.
- Review test results and confirmed defects.
- Check repository documentation and deployment findings.
- Record outstanding decisions and blockers.
- Review evidence before changing a task's status.
- Confirm the next implementation priorities as a team.

**Exit condition:** The team agrees on what is ready, what needs revision and what remains outstanding before the final presentation.

---

## 3. Individual Deliverables and Acceptance Criteria

### 1. Princeton — PO / Project Lead

**Tasks:**
- Review project requirements and scope.
- Prioritize the project backlog.
- Track team progress and blockers.
- Coordinate reviews and resolve conflicting requirements.

**Completion criteria:**
- Requirements and backlog have been reviewed.
- Priorities are documented.
- Team progress is recorded.

### 2. Comfort — System Architect

**Tasks:**
- Review the system structure.
- Prepare or improve the architecture diagram.
- Ensure the architecture agrees with the requirements and technical decisions.

**Completion criteria:**
- Architecture diagram is available in the repository.
- Main components and their relationships are understandable.
- Design inconsistencies are recorded.

### 3. Darius — API Designer

**Tasks:**
- Review the API specification.
- Prepare endpoint definitions.
- Document request and response structures.
- Identify authentication and permission requirements for endpoints.

**Completion criteria:**
- API endpoint draft is documented.
- Request and response examples are included.
- API contracts agree with the data model and workflows.

### 4. Regstopher — Backend Identity

**Tasks:**
- Document registration and login workflows.
- Define user roles and permissions.
- Explain authentication and authorization requirements.

**Completion criteria:**
- Authentication workflow is documented.
- Role permissions are clearly defined.
- Access rules agree with the project requirements.

### 5. Joseph — Backend Core

**Tasks:**
- Document paper submission and management workflows.
- Document verification and revocation workflows.
- Document quiz creation and attempt workflows.

**Completion criteria:**
- Core workflows are documented.
- Important actors and system actions are identified.
- Workflows agree with the requirements and data model.

### 6. Madison — Database Engineer

**Tasks:**
- Prepare an entity inventory.
- Review and improve the ERD.
- Identify relationships and constraints.
- Document migration, indexing and backup considerations.

**Completion criteria:**
- Entity inventory is available.
- ERD is documented.
- Relationships and important constraints are explained.

### 7. Odasco — UX / Frontend

**Tasks:**
- Prepare initial wireframes.
- Review mobile responsiveness.
- Document the PWA interface and installation experience.
- Align screens with the approved user workflows.

**Completion criteria:**
- Initial wireframes are available.
- Main user screens and navigation are represented.
- Mobile and PWA considerations are documented.

### 8. Sieh — Security & Privacy

**Tasks:**
- Prepare an initial threat list.
- Review authentication and authorization risks.
- Identify privacy and data-handling concerns.
- Review document access and verification security.

**Completion criteria:**
- Threat list is documented.
- Risks include their possible impact.
- Recommended mitigations are recorded.

### 9. Jessica — QA / Testing

**Tasks:**
- Prepare test cases based on project requirements.
- Identify functional and non-functional tests.
- Create a requirements-to-test coverage checklist.
- Execute available tests.
- Record test results and confirmed defects.
- Create GitHub issues for identified bugs.

**Completion criteria:**
- Test cases are available in the repository.
- Important requirements have corresponding tests.
- Test results and defects are documented.

### 10. Prince — OPS / DevOps & Documentation

**Tasks:**
- Review the existing repository documentation.
- Identify missing, outdated or unclear documentation.
- Prepare or improve project setup instructions.
- Research deployment requirements based on the proposed architecture.
- Document deployment options, requirements, limitations and recommendations.
- Coordinate with Comfort on architecture and Madison on database and backup requirements.

**Completion criteria:**
- Repository documentation has been reviewed.
- Setup instructions are documented.
- Deployment research is available.
- Infrastructure findings agree with the proposed architecture.

---

## 4. Three-Day Recovery Schedule

The original deadlines are retained for historical accuracy. The following schedule is the revised recovery plan.

| Day | Main activities | Expected outcome |
|---|---|---|
| Day 1 — 31 October 2026 | All members review their assignments, inspect existing work and report missing deliverables or blockers. | Confirmed task status and clear outstanding work. |
| Day 2 — 1 November 2026 | Members complete their assigned deliverables, update repository documents and open pull requests. | Individual deliverables submitted for review. |
| Day 3 — 2 November 2026 | Review pull requests, correct inconsistencies, test available work and prepare presentation materials. | Reviewed and integrated project deliverables. |
| Final deadline — 3 November 2026 | Final status check, outstanding corrections and presentation readiness review. | Agreed submission and presentation baseline. |

---

## 5. GitHub Contribution and Workflow Rules

Every team member must follow the repository contribution workflow.

1. Pull the latest changes from the main branch.
2. Create a separate branch for the assigned task.
3. Create or update the relevant GitHub issue.
4. Complete the assigned work.
5. Commit changes using clear and meaningful commit messages.
6. Push the branch to GitHub.
7. Open a pull request.
8. Include a summary of the work and reference the relevant issue.
9. Request a review from another team member.
10. Merge only after the required review and corrections.

**Branch naming examples:**

- `docs/princeton-requirements-review`
- `docs/comfort-architecture`
- `docs/darius-api-contracts`
- `docs/regstopher-auth-workflow`
- `docs/joseph-core-workflows`
- `docs/madison-data-model`
- `docs/odasco-ux-wireframes`
- `docs/sieh-security-review`
- `test/jessica-test-plan`
- `docs/prince-ops-deployment`

**Important:** Team members must not push directly to `main`. All assigned work should be submitted through pull requests so that contributions can be reviewed and tracked.

---

## 6. Individual Work Log

This table is the team's source of truth for individual progress.

| Member | Deliverable | Issue / PR link | Original due date | Revised deadline | Current status |
|---|---|---|---|---|---|
| Princeton | Requirements and backlog review | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Comfort | Architecture diagram | To create/link | 27 Oct 2026 | 3 Nov 2026 | Review and improve diagram |
| Darius | API endpoint draft | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Regstopher | Authentication and permissions breakdown | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Joseph | Core workflow breakdown | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Madison | Entity inventory and ERD | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Odasco | Wireframes and PWA plan | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Sieh | Initial threat list | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Jessica | Test cases and test coverage checklist | To create/link | 27 Oct 2026 | 3 Nov 2026 | Verify existing work |
| Prince | Repository documentation and deployment research | To create/link | New assignment | 3 Nov 2026 | Newly assigned |

---

## 7. Progress Reporting

Each member should provide a short progress update containing:

- **Completed:** What has been finished?
- **In progress:** What is currently being worked on?
- **Blocked:** What is preventing completion?
- **Evidence:** GitHub issue, commit, pull request or document link.
- **Next step:** What remains to be done?

A task should only be marked completed when its deliverable is available and the team can review the evidence.

---

## 8. Final Presentation Readiness

Before the final presentation, the team should confirm:

- Project requirements and scope are documented.
- Architecture and system design are consistent.
- API documentation is available.
- Database design is available.
- Authentication and role permissions are documented.
- Core workflows are explained.
- Wireframes and PWA plans are available.
- Security and privacy risks are documented.
- Test cases and test results are available.
- Repository setup and deployment documentation are available.
- GitHub contributions and pull requests can be reviewed.

**Final objective:** Every team member should have a clear, traceable contribution to TuStudyHub and be able to explain their assigned responsibility during the final presentation.
