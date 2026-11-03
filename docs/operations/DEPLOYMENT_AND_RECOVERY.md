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


## Infrastructure planning and release prerequisites

The production environment must provide a supported Linux VPS, registered domain, HTTPS, a non-root deployment account, SSH-key access, firewall and reverse proxy, persistent PostgreSQL storage, persistent uploaded-file storage, monitoring and health checks. The exact provider, plan, price, bandwidth, storage growth and recurring cost must be researched and recorded before purchase; do not invent prices or capacity guarantees.

Before production release:
- [ ] Confirm domain ownership and DNS records.
- [ ] Select VPS based on expected concurrent users, file volume, bandwidth and budget.
- [ ] Configure PostgreSQL and versioned migrations; verify no production in-memory fallback.
- [ ] Configure persistent file storage and file/database backup coverage.
- [ ] Configure HTTPS, reverse proxy, upload-size limits and service restart policy.
- [ ] Store JWT, database and AI credentials outside Git; rotate any secret previously exposed.
- [ ] Test backup restoration of both database records and uploaded files.
- [ ] Test deployment rollback and health checks.
- [ ] Test Android and desktop PWA installation on the real production domain.

Cloud DNS/CDN services do not replace the VPS or PostgreSQL database. A successful deployment requires both application hosting and persistent data/storage services.
