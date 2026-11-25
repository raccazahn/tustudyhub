# TuStudyHub Deployment Documentation

The canonical, current deployment record is maintained in:

**[Deployment and Recovery Guide](docs/operations/DEPLOYMENT_AND_RECOVERY.md)**

That document records the actual VPS stack, current DNS/HTTPS status, safe completion sequence, operational checks, backup/recovery requirements and release prerequisites.

Do not use older setup commands copied from this file's history. The deployed project uses Bun and PostgreSQL on the configured VPS; it is not the older Node.js/PostgreSQL 16 example previously described here. Never commit real credentials or copy example secrets into production.
