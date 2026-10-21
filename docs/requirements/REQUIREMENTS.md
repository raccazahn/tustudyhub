# Requirements and User Stories

This working draft follows the concept paper. Record team decisions and lecturer clarifications rather than silently assuming them.

## Roles
- **Student:** register/login, upload, search, download, report and take quizzes.
- **Verified Contributor:** eligible student who may be approved to create quizzes.
- **Lecturer:** approve/reject papers for their courses, request takedown, opt a course in/out, upload syllabi and create quizzes.
- **Moderator:** handle reports, remove content and suspend abusers.
- **Admin:** manage users, courses, roles and settings.
- **External App:** use the API with appropriately scoped credentials.
- **Visitor:** may browse public metadata if the design supports it.

## Mandatory functional requirements
1. Registration/login, password reset and role-based access.
2. One upload system for exam papers, thesis papers and syllabi.
3. Metadata includes course code/title, year, semester, exam type; lecturer is optional.
4. Browse by course/type and search by course, year, semester, exam type, rating, verified status and keyword as appropriate.
5. Download documents.
6. Lecturer/moderator approval; design states and authority rules. Concept paper lists Uploaded, Under Review, Verified, Rejected and Removed.
7. Course MCQ quizzes: lecturers and approved authors create; students take, receive automatic marking, see scores and score history.
8. Each approved paper has unique ID and visible stamp showing ID, course, approval date and approving roles; QR includes a non-guessable token and opens a public page showing Verified or Revoked.
9. Public REST/JSON API under `/api/v1/`, token login, consistent errors (`code`, `message`, `request_id`), pagination on list endpoints, interactive docs.
10. Installable, mobile-friendly PWA from day one.
11. VPS deployment under registered domain with HTTPS.
12. Report incorrect/prohibited content; simple report button plus review is acceptable.

## Non-functional requirements
Low-bandwidth pages, compressed images/lazy loading where appropriate, phone-first PWA manifest/service worker, hashed passwords, input/file validation, least privilege, minimal personal data, privacy/retention rules, backups, graceful upload failures, health endpoint, readable code/tests/docs, small reviewed PRs, HTTPS.

## User stories and acceptance criteria
### Document library
As a student, I want to browse by course and type so I can find useful materials.
- [ ] A document has a type, course and year.
- [ ] Students can browse by course and type and download eligible files.
- [ ] An authorized lecturer/moderator can approve a submission.
- [ ] Invalid/oversized uploads are handled safely.

### Quizzes
As a student, I want to take a course quiz and see my score.
- [ ] Quiz belongs to a course.
- [ ] Only lecturers/approved authors create quizzes.
- [ ] Student submissions are automatically marked and score is shown.
- [ ] Score history is included in the design.

### Verification
As a user, I want to scan the QR and confirm the paper's current status.
- [ ] Approved paper has unique ID and visible stamp.
- [ ] Stamp contains ID, course, approval date and approving roles.
- [ ] QR uses a non-guessable token.
- [ ] Public page displays Verified or Revoked; withdrawn papers show Revoked.

### API/accounts
- [ ] Core endpoints use `/api/v1/` and interactive docs are available.
- [ ] Auth and role permissions are enforced server-side.
- [ ] List endpoints support pagination and errors follow one format.

## Optional extras
Ratings/reputation, advanced moderation queue/audit log, duplicate detection, unreadable-scan detection, notifications, full offline mode, Q&A/worked solutions, SMS/WhatsApp and analytics are extras unless the lecturer clarifies otherwise.

## Out of scope
Live/current exams, grades or personal academic records, payments.
