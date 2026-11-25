# TuStudyHub Documentation

This directory is the **single, organized entry point** for the project's user and engineering documentation. The root README links here so reviewers can find the most important material without searching through draft files.

## Start with these documents

1. **[User Guide](user/USER_GUIDE.md)** — how visitors and approved users navigate the platform, use learning features and troubleshoot common issues.
2. **[Project Plan](planning/PROJECT_PLAN.md)** — project scope, delivery approach, responsibilities, risks and acceptance criteria.
3. **[Software Requirements Specification](requirements/REQUIREMENTS.md)** — functional and non-functional requirements.
4. **[System Design Document](design/SYSTEM_DESIGN_DOCUMENT.md)** — system design, workflows and technical structure.
5. **[Architecture](design/ARCHITECTURE.md)** — application components, boundaries and interactions.
6. **[REST API Specification](api/API_SPECIFICATION.md)** — API resources, access rules and contract.
7. **[Deployment and Recovery](operations/DEPLOYMENT_AND_RECOVERY.md)** — current VPS/DNS status and operational procedures.

## Supporting engineering documents

| Area | Documents |
|---|---|
| Planning | [Project Plan](planning/PROJECT_PLAN.md), [Final Submission Checklist](planning/FINAL_SUBMISSION_CHECKLIST.md) |
| Requirements | [SRS](requirements/REQUIREMENTS.md), [User Interviews](requirements/USER_INTERVIEWS.md) |
| Design and data | [System Design](design/SYSTEM_DESIGN_DOCUMENT.md), [Architecture](design/ARCHITECTURE.md), [Data Model](design/DATA_MODEL.md), [Technology Decisions](design/TECHNOLOGY_DECISIONS.md), [ERD source](design/erd.mmd), [Schema reference](design/schema_reference.sql) |
| API | [API Specification](api/API_SPECIFICATION.md) |
| User experience | [Wireframes and PWA](ux/WIREFRAMES_AND_PWA.md), [Design System](ux/DESIGN_SYSTEM.md), [Color Scheme](ux/COLOR_SCHEME.md) |
| Quality | [Test Strategy](testing/TEST_STRATEGY.md), [Implementation Audit](operations/IMPLEMENTATION_AUDIT.md), [Implementation Progress](operations/IMPLEMENTATION_PROGRESS.md) |
| Security | [Threat Model](security/THREAT_MODEL.md) |
| Operations | [Deployment and Recovery](operations/DEPLOYMENT_AND_RECOVERY.md) |
| Team practice | [Responsible AI Use](contributing/AI_USE.md) |

## How to read the documentation

- The **SRS** defines what the system is required to do.
- The **Project Plan** explains how the team organizes and delivers that scope.
- The **System Design, Architecture, Data Model and API Specification** describe the technical solution.
- The **User Guide** explains user-facing workflows.
- The **Test Strategy** defines how requirements should be verified.
- The **Implementation Audit and Progress Log** record what has been inspected, tested, completed or left open.
- The **Deployment and Recovery Guide** records the actual hosting state and the remaining operational steps.

## Document control

The documents in this index are the maintained project references. Files in `Team Draft/` are retained as working/contribution history and are not the authoritative specification. If a draft conflicts with the SRS or a reviewed project decision, follow the authoritative document and record the correction.

Status labels matter: **proposed** means awaiting review; **implemented** means present in the code; **tested** means supported by recorded test evidence; **deployed** means running in the target environment. Do not use these labels interchangeably.

Keep screenshots, dates, infrastructure details and completion claims evidence-based. Screenshots added for assessment must come from the actual application and must not expose private user information.
