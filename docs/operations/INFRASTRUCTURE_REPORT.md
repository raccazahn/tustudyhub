# Infrastructure and Hosting Report

**Research required:** do not invent provider prices, VPS specifications or an unchecked domain.

## Required outcome
- Live VPS under a registered domain managed through Cloudflare.
- Valid HTTPS certificate; non-root deployment user; SSH keys; firewall; reverse proxy.
- Automated database backups and a tested restore.
- Deployment script and health-check endpoint.
- CI runs tests and linting on each pull request.

## Capacity assumptions to estimate
Expected users; uploads/week; average/max file size; 12-month storage growth; peak traffic/bandwidth; backup storage and retention.

## Compare at least two VPS providers
| Item | Provider A | Provider B |
|---|---|---|
| CPU/RAM/SSD/bandwidth | Research required | Research required |
| Monthly / annual cost | Research required | Research required |
| Backup costs | Research required | Research required |
| Other fees/limitations | Research required | Research required |
| Trade-offs | To evaluate | To evaluate |

Include checked date and source links. Budget for at least 12 months, including domain registration/renewal and backups. Separate one-time and recurring costs.

## Operations checklist
- [ ] Cloudflare domain/DNS configured.
- [ ] VPS provisioned and hardened.
- [ ] HTTPS verified; non-root account and SSH-key access.
- [ ] Firewall/reverse proxy configured.
- [ ] Secrets stored outside source control.
- [ ] Automated DB backup and tested restore.
- [ ] Deployment/rollback steps and health check documented.
- [ ] Monitoring/logging in place.
