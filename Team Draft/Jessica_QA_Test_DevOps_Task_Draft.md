# QA, Testing, DevOps and Documentation Task Draft

**Project:** TuStudyHub — Open Student Past Papers & Library Platform  
**Task owner:** Jessica N. Younge  
**Contact:** youngejessican@gmail.com  
**Role:** QA / Test + OPS / DevOps & Documentation  
**Repository:** https://github.com/raccazahn/tustudyhub  
**Status:** Draft — planned work; test results and deployment details must be added only after verification.  
**Prepared:** 27 October 2026  
**Project deadline:** 17 November 2026

---

## 1. Purpose of My Task

My responsibility is to help the team deliver a reliable, secure, well-documented and deployable TuStudyHub platform. I will prepare test cases, record test evidence, review documentation, research hosting options, and help document deployment, backup and recovery procedures.

The repository currently describes Python with FastAPI, PostgreSQL, HTML, CSS and JavaScript as the proposed technology stack. The team must confirm the final choices before implementation and deployment decisions are treated as final.

## 2. Scope of Work

### QA and testing
- Prepare test scenarios and expected results for the platform's main features.
- Test registration, login, role permissions, document uploads and downloads, approval, QR verification, quizzes and scores.
- Check validation, error messages, access control, phone layout and basic accessibility.
- Record actual results and evidence in the test log.
- Report defects through GitHub Issues and retest fixes.

### Operations / DevOps
- Compare at least two VPS hosting providers using current, dated sources.
- Research domain registration, DNS, HTTPS, server security, storage, bandwidth and backup costs.
- Recommend a practical deployment approach after the team confirms its budget and technical requirements.
- Document deployment checks, health checks, rollback, backup and recovery.
- Recommend automated tests and linting for pull requests.

### Documentation
- Keep test plans, results and infrastructure findings understandable and up to date.
- Record assumptions, decisions, blockers and links to relevant GitHub issues or pull requests.
- Never document unverified test results, unselected providers or a deployment as completed.

## 3. Test Approach

Testing will be performed as the relevant features become available. Until the application is implemented, the cases below are **planned test cases**, not evidence that the application currently passes.

| Test level | What I will check | Evidence to keep |
|---|---|---|
| Unit | Input validation, permission decisions, quiz marking, document status and identifier logic | Test output and commit/build |
| API | Authentication, roles, upload/list/download, approval, quizzes, scores, public verification, errors and pagination | Request/response or automated test report |
| Integration | Database operations, file storage, migrations, backup and restore | Logs and test notes |
| End-to-end | Student, lecturer/moderator and quiz user journeys | Steps, expected/actual result and screenshots where appropriate |
| Security | Protected routes, file restrictions, input validation, HTTPS and secret handling | Findings and remediation issue |
| Usability | Mobile layout, readable text, contrast and keyboard/accessibility basics | Browser/device and observations |
| Deployment | Health endpoint, HTTPS, PWA installation, logs and recovery | Deployment checklist and verification date |

## 4. Planned Functional Test Cases

**Result key:** Not Run, Pass, Fail, Blocked. Update the result only after executing the test against a named build or environment.

| ID | Feature / scenario | Test steps (summary) | Expected result | Initial status |
|---|---|---|---|---|
| TC-01 | Student registration | Submit valid required registration details | Account is created and a clear success response is shown | Not Run |
| TC-02 | Login | Sign in with valid credentials, then try invalid credentials | Valid login succeeds; invalid login is rejected without exposing sensitive details | Not Run |
| TC-03 | Role permissions | Try student-only and restricted lecturer/moderator actions with different roles | Each role can perform only authorized actions | Not Run |
| TC-04 | Upload a permitted document | Upload a supported file with required title, course and document type | File and metadata are accepted and stored safely | Not Run |
| TC-05 | Reject invalid upload | Try an unsupported, oversized or malformed file | Upload is rejected safely with a useful error message | Not Run |
| TC-06 | Browse and search library | Search/filter documents by course and document type | Matching documents appear; empty results are handled clearly | Not Run |
| TC-07 | Download document | Download an approved document as an authorized student | Correct file downloads and is readable | Not Run |
| TC-08 | Approval workflow | Submit a document, then approve/reject it using an authorized reviewer account | Only authorized reviewers can change the review status | Not Run |
| TC-09 | Identifier and stamp | Approve a paper and inspect its identifier/stamp | The paper receives a unique identifier and the expected visible stamp | Not Run |
| TC-10 | Public QR verification | Scan/open the QR code for an approved paper | Public verification page shows the correct paper as **Verified** | Not Run |
| TC-11 | Revoked paper | Revoke/withdraw a previously approved paper and open its QR link again | Public page shows **Revoked**, not Verified | Not Run |
| TC-12 | Create a quiz | An authorized lecturer/author creates a multiple-choice quiz | Authorized user can save a valid quiz; unauthorized users are blocked | Not Run |
| TC-13 | Quiz marking and score | Submit answers to a quiz with known correct answers | Answers are marked correctly and the score is displayed/stored as specified | Not Run |
| TC-14 | API documentation | Open the documented API documentation endpoint in the deployed/test environment | Documentation loads and describes the implemented endpoints accurately | Not Run |
| TC-15 | Phone-friendly PWA | Open the site on a phone-sized viewport and test installation where supported | Layout is usable and installation works on a supported browser/device | Not Run |
| TC-16 | HTTPS and health check | Open the deployed HTTPS site and call the agreed health endpoint | Certificate is valid and health check reports the service state accurately | Not Run |
| TC-17 | Backup and restore | Create a backup, restore it in a safe test environment and verify records/files | Restore completes and required data is available; evidence is recorded | Not Run |
| TC-18 | Error handling | Submit missing, invalid or duplicate values where applicable | The system responds safely and clearly without exposing secrets or stack traces | Not Run |

### Test execution procedure

1. Confirm the feature is available and identify the test environment.
2. Record the date, build/commit, tester and any required test account or sample data.
3. Follow the test steps using synthetic or authorized data only.
4. Compare the actual result with the expected result.
5. Mark Pass, Fail, Blocked or Not Run.
6. For a failure, open a GitHub Issue with reproduction steps, expected result, actual result, severity and safe evidence.
7. Retest after the fix and link the issue or pull request.

## 5. Test Evidence Log

Add one row for each executed test. Do not mark a test as Pass without running it.

| Date | Build / commit | Test ID | Actual result | Status | Issue / evidence link | Tester |
|---|---|---|---|---|---|---|
| Pending | Pending | Pending | Not yet executed | Not Run | Pending | Jessica N. Younge |

## 6. Defect Reporting Template

When a test fails, create a GitHub Issue with the following details:

- **Title:** `[BUG] Short description of the problem`
- **Environment:** Test/development/staging/production, browser/device and build/commit
- **Preconditions:** Account role and sample data needed
- **Steps to reproduce:** Numbered steps that another teammate can follow
- **Expected result:** What should happen
- **Actual result:** What happened
- **Severity:** Critical / High / Medium / Low, with a short reason
- **Evidence:** Screenshot, safe log excerpt or test output; remove passwords, tokens and personal data
- **Related requirement/test:** Requirement ID and test case ID
- **Retest result:** Fill in after a fix is available

## 7. Infrastructure and Deployment Research Plan

The repository's infrastructure notes call for a live VPS under a registered domain, Cloudflare DNS, valid HTTPS, a non-root deployment account, SSH keys, a firewall, a reverse proxy, automated database backups, a tested restore, a deployment script, a health-check endpoint, and CI checks for tests and linting.

### Provider comparison

I will compare at least two VPS providers using their official pricing and documentation pages. I will record the date checked and link each source. I will not invent prices or claim a provider has been selected before the team agrees.

| Comparison item | Provider A | Provider B |
|---|---|---|
| Provider and plan | To research | To research |
| CPU / RAM / SSD | To verify from official source | To verify from official source |
| Bandwidth / transfer limits | To verify from official source | To verify from official source |
| Monthly and annual VPS cost | To research; include currency and checked date | To research; include currency and checked date |
| Backup / snapshot cost | To research | To research |
| Additional fees and limitations | To research | To research |
| Region and expected latency for intended users | To assess | To assess |
| Support and recovery options | To assess | To assess |
| Advantages and disadvantages | To evaluate | To evaluate |
| Source links and date checked | Pending | Pending |

### Capacity questions to confirm with the team

- Expected number of students, lecturers and moderators.
- Estimated document uploads per week and average/maximum file size.
- Expected traffic at peak times and required bandwidth.
- Estimated storage growth over 12 months.
- Required backup frequency, retention period and separate backup storage.
- Project budget and who will own/manage the domain, DNS and hosting account.

### Preliminary deployment design

Subject to team approval and implementation compatibility:

1. **Domain and DNS:** register an available domain and manage DNS through Cloudflare.
2. **Application hosting:** run the FastAPI application on a selected VPS.
3. **Database:** use PostgreSQL with restricted access; do not expose the database directly to the public internet.
4. **Web access:** configure a reverse proxy and valid HTTPS certificate.
5. **Server security:** use a non-root deployment user, SSH key authentication, firewall rules, timely updates and least-privilege access.
6. **Secrets:** store credentials and API keys in environment configuration or a suitable secret manager, never in committed source files.
7. **Backups:** automate database and required file backups, define retention, and test restoration.
8. **Continuous integration:** run tests and linting on pull requests; block merging when required checks fail, if the team enables that policy.
9. **Monitoring:** capture service logs, monitor availability and disk space, and document who responds to failures.
10. **Recovery:** document rollback to the last known-good release and the steps for restoring data when needed.

**Current status:** Hosting provider, domain, final infrastructure configuration and live deployment must be confirmed by the team. The above is a research and implementation plan, not a claim that the system is deployed.

## 8. Deployment Verification Checklist

- [ ] Team has approved the provider, plan, budget and domain.
- [ ] DNS points to the intended deployment.
- [ ] HTTPS certificate is valid and renewal is documented.
- [ ] Application runs using the documented non-root deployment process.
- [ ] Firewall and reverse proxy rules have been reviewed.
- [ ] Database is not publicly exposed and access is restricted.
- [ ] Production secrets are not committed to GitHub.
- [ ] Database migrations are applied in the approved order.
- [ ] Health endpoint responds as expected.
- [ ] Login, roles, upload, approval, download, QR verification and quizzes are smoke-tested.
- [ ] PWA is checked on a supported phone/browser.
- [ ] Backup automation and retention are configured.
- [ ] A restore test has been completed and recorded.
- [ ] Logs, monitoring, rollback and incident contacts are documented.

## 9. Documentation and GitHub Workflow

- Track work in GitHub Issues and link each deliverable to its issue.
- Create a task branch instead of committing directly to `main`.
- Use focused commits with clear messages, for example `docs: add QA and deployment task draft`.
- Open a pull request, describe the changes and include relevant test or research evidence.
- Request review from at least one teammate before merging, following the repository workflow.
- Update documentation whenever requirements, endpoints, data structures or behavior change.
- Never commit passwords, API keys, real student records, unauthorized examination papers or other confidential information.

## 10. Proposed Work Schedule

The dates below are a proposed recovery plan for the remaining project period. Adjust them to the team's actual backlog and agreed deadlines.

| Target period | Planned deliverable | Completion evidence |
|---|---|---|
| 27–28 October 2026 | Review requirements, repository documents and current implementation; confirm QA scope with team | GitHub issue/comment and updated test plan |
| 29–31 October 2026 | Prepare/execute available functional tests and report defects | Test log, issues and safe evidence |
| 1–4 November 2026 | Research two VPS providers, domain/DNS, storage and 12-month cost | Dated comparison with official source links |
| 5–8 November 2026 | Review deployment security, CI, backups and recovery procedure with developers | Updated operations checklist and review notes |
| 9–12 November 2026 | Retest fixes and verify staging/deployment features that are available | Updated results and linked bug fixes |
| 13–16 November 2026 | Complete documentation, final smoke-test checklist and handover | Reviewed documents and evidence links |
| 17 November 2026 | Support final acceptance and submission | Final checklist and handover record |

## 11. Dependencies and Risks

| Dependency / risk | Response |
|---|---|
| Features are not implemented or test environment is unavailable | Mark tests Blocked/Not Run and coordinate with developers; do not invent results |
| Requirements or technology choices change | Confirm decisions with the team and update test cases and documents |
| Hosting budget is unclear | Compare options transparently and ask the team to approve a budget before purchase |
| Sensitive data or credentials are exposed | Use synthetic data, restrict access, and report the exposure promptly without copying secrets into issues |
| Backup exists but has never been restored | Schedule a restore test in a safe environment and record the result |
| Defects are found near submission | Prioritize by severity and impact; document unresolved issues honestly |

## 12. Completion Criteria

My task can be considered ready for team review when:

- [ ] The test plan and test cases are committed and reviewed.
- [ ] Executed tests have dated results and build/commit references.
- [ ] Failed tests are linked to GitHub Issues and retests are recorded.
- [ ] At least two VPS providers have been compared using dated sources and a 12-month cost estimate.
- [ ] Deployment, security, backup and recovery requirements are documented.
- [ ] Documentation accurately distinguishes proposed, in-progress and completed work.
- [ ] A teammate has reviewed the pull request and the final evidence is linked.

## 13. Questions to Explain During the Project Review

I should be prepared to explain:

1. Why testing is needed before the platform is accepted.
2. The difference between unit, API, integration, end-to-end, security and usability testing.
3. How test cases, expected results, actual results and defect reports work together.
4. Why role permissions and document approval matter.
5. How the QR verification page should distinguish Verified from Revoked.
6. Why HTTPS, a firewall, SSH keys and non-root deployment improve security.
7. Why backups must be restored in a test before they can be trusted.
8. Why hosting costs must include storage, bandwidth, backups, domain renewal and other fees.
9. How GitHub Issues, branches, pull requests and review evidence show individual contribution.

---

**Important:** This file is a working draft. Replace every “Pending,” “To research,” or “Not Run” entry only when you have real evidence. Confirm the filename and folder with the team before uploading so this draft does not overwrite an existing repository document.
