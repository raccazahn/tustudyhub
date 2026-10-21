# Initial Security Threat Register

Expand this into the Week 2 threat model with assets, attack paths, likelihood, impact, prevention, detection, recovery and residual risk.

| Threat | Impact | Initial mitigation | Owner/status |
|---|---|---|---|
| Unauthorized account access | Exposure or misuse | Password hashing, secure tokens, least privilege | SEC/ID — review |
| Role bypass | Unauthorized approvals or quiz creation | Server-side permission checks | SEC/ID/CORE — review |
| Unsafe upload | Harmful files or service compromise | Type/size validation, safe storage and server checks | SEC/CORE — review |
| Copyright complaint | Unauthorized material remains available | Opt-out/takedown process and clear policy | PO/SEC/lecturer — define |
| Wrong/incomplete paper | Misleading study material | Approval workflow and visible status | CORE/lecturer — define |
| Forged stamp/QR | False trust | Unique ID, non-guessable token, public status/revocation | CORE/SEC — design |
| Secret committed | Account/server compromise | No secrets in repo, PR review, rotate exposed keys | All/OPS — ongoing |
| Data loss | Service/record loss | Automated backups and tested restore | DB/OPS — implement |
| Poor connection/upload failure | Students cannot submit | Lightweight pages, limits, graceful errors; resumable upload if feasible | UX/CORE — design |
| Excessive personal data | Privacy risk | Minimize data and define retention/deletion | SEC/PO — define |
