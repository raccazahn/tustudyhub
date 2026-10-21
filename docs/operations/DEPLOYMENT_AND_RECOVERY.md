# Deployment and Recovery Guide

Complete with actual provider details after the infrastructure is selected. Never put secrets here.

- Domain:
- Cloudflare account owner (name/role only):
- VPS provider/plan:
- OS / deployment method:
- Reverse proxy / application service:
- Database / backup location and retention:
- Health-check URL:
- Last tested restore date:

## Deployment procedure
1. Confirm reviewed commit and release notes.
2. Back up database/files before risky migrations.
3. Deploy with the documented non-root procedure.
4. Apply migrations in the approved order.
5. Restart/reload services safely.
6. Check health, HTTPS, logs, login, upload/download, quizzes and public verification.
7. Record commit, deployment time and test result.

## Recovery
Document rollback to the last known-good release, when database restore is required, backup restoration, domain/certificate renewal, secret rotation, outage response, monitoring and security updates.
