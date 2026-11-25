# Deployment and Recovery Guide

**Last updated:** 25 November 2026  
**Environment:** TuStudyHub project VPS  
**Status:** VPS application deployed; public-domain release pending DNS and HTTPS activation.

## 1. Current deployment record

| Component | Current recorded configuration |
|---|---|
| VPS operating system | Ubuntu 20.04.6 LTS |
| Application directory | `/var/www/tustudyhub` |
| Runtime | Bun 1.4.5 |
| Application start | `bun run start` |
| Application listener | `0.0.0.0:3000` |
| Reverse proxy | Nginx 1.18.0 |
| Database | PostgreSQL 12.22, local cluster |
| Database name | `tustudyhub_db` |
| Upload storage | `/var/data/tustudyhub/uploads` |
| Domain | `tustudyhub.com` |
| Domain registrar/DNS provider | Cloudflare |
| Current domain status | Cloudflare zone pending; nameserver mismatch; HTTPS not yet active |

Secrets, passwords, private keys and complete connection strings must never be placed in this document or committed to GitHub.

## 2. Deployment status

The application has been deployed to the VPS. PostgreSQL connectivity and migrations through `008_tu_academic_structure_and_documents` were verified. Nginx was configured to proxy requests for the domain to the application on localhost port 3000. The application health endpoint returned HTTP 200 and reported PostgreSQL as available during validation.

A host-override HTTP request to the VPS returned the TuStudyHub application HTML. This confirmed that the VPS and Nginx path were reachable, but it bypassed public DNS and does not establish that the custom domain is live.

**The domain is not yet released for public use.** The registrar's current nameserver delegation does not match the nameservers assigned to the pending Cloudflare zone. A DNSSEC DS record is published at the registry and requires confirmation against the active authoritative zone. Cloudflare was contacted on 22 November 2026; the team is awaiting its case-specific response.

The VPS should not be rebuilt solely because of this DNS mismatch. Revisit server configuration only if later tests identify a separate application or proxy issue.

## 3. Safe completion sequence

1. Obtain Cloudflare's written confirmation of the authoritative DNS zone and the correct nameserver/DNSSEC procedure.
2. Apply only the confirmed DNS changes.
3. Verify public authoritative and recursive DNS answers for the apex and `www` hostnames.
4. Confirm both hostnames resolve to the intended VPS.
5. Validate Nginx routing and application health using the real hostnames.
6. Obtain and configure the HTTPS certificate after DNS validation succeeds.
7. Verify HTTP-to-HTTPS behavior, certificate validity and renewal.
8. Confirm the application runs under a persistent service manager and survives a reboot.
9. Complete controlled administrator provisioning and release security checks.
10. Run the full release test suite and record the deployed Git commit.
11. Verify database and file backups and test restoration.

Do not change registrar nameservers, delete the Cloudflare zone, or modify the registry DS record without confirming the correct procedure with Cloudflare.

## 4. Operational checks

Run checks from the VPS using an account authorized to administer the server. Do not paste environment files, passwords, tokens or private logs into public issues.

- Check application health: `curl -i http://127.0.0.1:3000/api/health`
- Check Nginx syntax: `sudo nginx -t`
- Check Nginx service: `sudo systemctl status nginx`
- Check PostgreSQL service: `sudo systemctl status postgresql`
- Check application process/service using the process manager configured for the release.
- Review application and Nginx logs for startup errors, failed requests and database errors.

The application process manager/persistent service configuration must be confirmed and documented before the VPS is considered reboot-safe.

## 5. Database and file recovery

The database and uploaded files form one logical data set. A database backup without the corresponding file storage may leave records pointing to missing files.

Before release, document:
- Backup schedule and retention.
- Protected backup location and access permissions.
- Database dump procedure.
- Upload-directory backup procedure.
- Restore procedure and required service downtime.
- Last successful restore test, with date and evidence.
- Named team members responsible for backup monitoring.

Never store database passwords in shell history or in this guide. Use a protected environment or approved secret-management method.

## 6. Release and rollback

For each release, record the Git commit, deployment time, migration versions, validation results and operator.

Before applying a risky migration:
1. Confirm the release commit and review.
2. Back up the database and uploaded files.
3. Confirm the restore procedure is available.
4. Apply migrations in the documented order.
5. Build and start the application.
6. Check health, sign-in, role permissions, resource access, quizzes and verification.
7. If the release fails, stop further changes and follow the tested rollback/recovery procedure.

Do not roll back application code across an irreversible database migration unless the compatibility and recovery plan has been verified.

## 7. Outstanding production prerequisites

- [ ] Cloudflare confirms the correct authoritative zone and DNSSEC configuration.
- [ ] Apex and `www` resolve publicly to the intended VPS.
- [ ] HTTPS certificate is issued and validated.
- [ ] Persistent application service starts on reboot.
- [ ] Controlled initial administrator provisioning is completed.
- [ ] Exact GitHub commit deployed to the VPS is recorded and reconciled.
- [ ] Final tests and role-based acceptance checks pass.
- [ ] Database and uploaded-file backups are configured.
- [ ] A restore test is completed.
- [ ] Monitoring, incident contacts and domain renewal responsibility are documented.

