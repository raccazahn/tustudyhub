# QA Test Strategy

## Test levels
- **Unit:** validation, permission decisions, quiz marking, token/status logic.
- **API:** auth, roles, upload/list/download, approval/rejection, quizzes/scores, public verification, errors and pagination.
- **Integration:** database/file storage, migrations, backup/restore.
- **End-to-end:** student journey, lecturer/moderator approval, QR verification/revocation, quiz journey.
- **Security:** protected routes, upload constraints, input validation, no secrets, HTTPS.
- **Usability:** phone layout, readable text/contrast, basic accessibility.
- **Deployment:** health endpoint, HTTPS, PWA install, logs, backup/restore evidence.

## Minimum acceptance scenarios
- [ ] Student registers/logs in; roles are enforced.
- [ ] Allowed document uploaded with required metadata.
- [ ] Student browses by course/type and downloads.
- [ ] Lecturer/moderator approves a document.
- [ ] Approved paper has unique ID, stamp and QR.
- [ ] Public page shows Verified, then Revoked after withdrawal.
- [ ] Authorized user creates MCQ quiz; student takes it and receives score.
- [ ] Interactive API docs are available.
- [ ] PWA installs and works on a phone; live site uses HTTPS.
- [ ] Backup restore tested.

## Evidence log
| Date | Commit/build | Scenario | Result | Evidence link | Tester |
|---|---|---|---|---|---|
| | | | | | |
