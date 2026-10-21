# System Design Document — TuStudyHub

**Status:** Outline; complete with evidence and team decisions for the 27 October 2026 review. The concept paper recommends 8–10 pages.

1. **Problem, goals and users:** include interview findings from at least five classmates.
2. **Requirements:** use [REQUIREMENTS.md](../requirements/REQUIREMENTS.md).
3. **Architecture:** include the reviewed diagram from [ARCHITECTURE.md](ARCHITECTURE.md).
4. **Technology choices:** justify the final stack and alternatives rejected using [TECHNOLOGY_DECISIONS.md](TECHNOLOGY_DECISIONS.md).
5. **Data model and storage:** include reviewed ERD from [DATA_MODEL.md](DATA_MODEL.md).
6. **API:** endpoints, auth, `/api/v1/`, pagination, error format and interactive docs; see [API specification](../api/API_SPECIFICATION.md).
7. **Verification/integrity:** approval authority, states, unique IDs, non-guessable QR tokens, stamp fields and revocation.
8. **Security/privacy:** roles, password hashing, validation, upload controls, HTTPS and data minimization; see [threat model](../security/THREAT_MODEL.md).
9. **Scalability/failure/low bandwidth:** compressed images, upload failures, phone-first pages, health checks and backups.
10. **Infrastructure/testing/deployment:** see [infrastructure report](../operations/INFRASTRUCTURE_REPORT.md) and [test strategy](../testing/TEST_STRATEGY.md).
11. **Risks and open questions.**
12. **Role-by-role task plan with dates:** see [team plan](../planning/TEAM_AND_TASK_PLAN.md).

## Review checklist
- [ ] Interview evidence; functional/non-functional requirements.
- [ ] Architecture diagram and ERD.
- [ ] API specification and verification model.
- [ ] Security/privacy, failure and low-bandwidth plan.
- [ ] Infrastructure capacity, provider comparison, costs, testing/deployment.
- [ ] Risks, open questions and named task plan.
- [ ] Each team member can defend their section.
