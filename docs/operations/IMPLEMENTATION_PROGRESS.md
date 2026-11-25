# TuStudyHub Implementation and Deployment Progress

**Last updated:** 25 November 2026  
**Purpose:** Current evidence-based status for the project team and course reviewers.

## 1. Executive status

The application has been deployed to the project VPS and has responded successfully through the Nginx HTTP reverse-proxy path. PostgreSQL is installed and connected, migrations through `008_tu_academic_structure_and_documents` were applied on the VPS, and the health endpoint previously reported PostgreSQL as available.

The custom domain is not yet confirmed live. The Cloudflare zone reports a nameserver mismatch with the nameservers currently delegated for the registered domain. A DNSSEC DS record is also present at the registry and needs to be reconciled with the authoritative DNS configuration. Cloudflare was contacted on **22 November 2026**; as of this update, the team is still awaiting a case-specific response.

The current blocker is domain DNS/registrar alignment and subsequent HTTPS activation, not a demonstrated need to rebuild the VPS.

## 2. Verified implementation and infrastructure work

| Area | Recorded evidence/status |
|---|---|
| VPS | Ubuntu VPS provisioned and reachable at the project server address. |
| Application | TuStudyHub deployed under `/var/www/tustudyhub`; application listens on port 3000. |
| Runtime | Bun installed; production start command is `bun run start`. |
| Reverse proxy | Nginx installed, active and configured to proxy the domain host to the application on localhost:3000. |
| Database | PostgreSQL 12 installed; application database and dedicated database role configured. |
| Migrations | VPS migration registry includes migrations 001–008; migration 008 was successfully applied. |
| Persistent uploads | Application upload storage is configured under `/var/data/tustudyhub/uploads`. |
| Health check | `/api/health` returned HTTP 200 and reported PostgreSQL as UP during deployment validation. |
| External HTTP check | A request using a host override to the VPS IP returned HTTP 200 and the TuStudyHub application HTML. This bypasses public DNS and does not prove that the domain resolves normally. |
| HTTPS | Not yet activated; certificate issuance must wait until domain DNS is correctly resolved. |

## 3. Application validation recorded

After the PostgreSQL integration work, the development validation record reported lint passing, six automated tests passing, and the production build passing. The Stage 6 visitor-access update also reported lint and build passing, with the security tests passing.

These results are historical project validation evidence. Before final release, rerun the checks against the exact commit selected for deployment and record the command, date, commit and result. The production health check is separate from a full end-to-end acceptance test.

## 4. Access-control direction

The current release work enforces the visitor read-only policy at the backend for protected document access. Protected operations must be checked server-side; hiding buttons in the interface is not sufficient.

The intended policy is:
- Visitors can browse only permitted public information.
- Protected actions require authentication and the appropriate role/permission.
- Pending, rejected or suspended accounts must not perform protected actions.
- Administrative provisioning must be controlled; public administrator self-registration is not allowed.

The initial production administrator provisioning and final role-by-role acceptance checks remain outstanding.

## 5. Current blockers and remaining work

1. Obtain Cloudflare's case-specific guidance and reconcile the domain's nameserver delegation and DNSSEC configuration without guessing or making unverified changes.
2. Confirm public DNS resolution for both the apex domain and `www`.
3. Activate HTTPS only after DNS points to the intended VPS and validation succeeds.
4. Complete the controlled first-administrator provisioning process.
5. Confirm the application runs as a persistent service and starts correctly after a VPS reboot.
6. Reconcile VPS-only changes with the GitHub `main` branch; the deployment source must be traceable to a reviewed commit.
7. Run final lint, tests, production build, health checks and browser-based role/workflow tests against the release candidate.
8. Verify database and uploaded-file backups and perform a restore test.
9. Add screenshots captured from the actual application to the user guide and complete lecturer/team review.

## 6. DNS incident record

- **Domain:** `tustudyhub.com`
- **Registrar:** Cloudflare Registrar
- **Cloudflare zone status:** Pending, with a nameserver mismatch reported.
- **Nameservers currently delegated at the registry:** `kyree.ns.cloudflare.com` and `vita.ns.cloudflare.com`.
- **Nameservers assigned in the pending zone:** `alexis.ns.cloudflare.com` and `uma.ns.cloudflare.com`.
- **DNSSEC:** A DS record is published at the `.com` registry. The correct active authoritative DNSSEC configuration must be confirmed before changing or removing it.
- **Support contact:** Initial support email sent 22 November 2026; no case-specific technical resolution had been received by 25 November 2026.

Do not change nameserver delegation, delete the zone, or alter the DS record until Cloudflare confirms the correct authoritative zone and DNSSEC procedure.

## 7. Release status

**Deployment classification:** VPS application deployment completed for HTTP validation; public-domain production release remains pending.

The project must not publish `https://tustudyhub.com` as a working live website until public DNS resolution and HTTPS have been independently verified. The GitHub repository is available for review now.

