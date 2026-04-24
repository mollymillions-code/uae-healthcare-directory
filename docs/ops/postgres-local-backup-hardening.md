# Local Postgres Backup Hardening

## Current Production Shape

- Postgres 16 runs on the same Lightsail box as the Next.js app.
- Host: `13.234.162.47`
- Database: `zavis_landing`
- App user: `zavis_admin`
- Migration/admin user: `zavis_landing_admin`
- Port: `localhost:5432`

This keeps query latency and cost low, but the app and DB share one failure
domain. Step-two hardening keeps the DB local while reducing backup risk.

## What Is Installed

- Local nightly `pg_dump -Fc -Z 6` backups.
- SHA-256 checksum for every local dump.
- Client-side encrypted remote upload, if `DB_BACKUP_REMOTE_ENABLED=1`.
- Daily backup health check.
- Weekly restore smoke test into a throwaway database.

## Files

- `/home/ubuntu/zavis-deploy/db-backup.sh`
- `/home/ubuntu/zavis-deploy/db-restore-smoke-test.sh`
- `/home/ubuntu/zavis-deploy/db-backup-health-check.sh`
- `/home/ubuntu/zavis-deploy/db-backup.env`
- `/home/ubuntu/zavis-deploy/db-backup-encryption.key`
- `/var/backups/zavis-landing/*.dump`

Repo source:

- `scripts/ec2-deploy-infra/db-backup.sh`
- `scripts/ec2-deploy-infra/db-restore-smoke-test.sh`
- `scripts/ec2-deploy-infra/db-backup-health-check.sh`
- `scripts/ec2-deploy-infra/db-backup.env.example`

## Cron

```cron
17 2 * * * flock -n /tmp/zavis-deploy.lock /home/ubuntu/zavis-deploy/db-backup.sh >> /home/ubuntu/logs/db-backup.log 2>&1
45 2 * * 0 flock -n /tmp/zavis-deploy.lock /home/ubuntu/zavis-deploy/db-restore-smoke-test.sh >> /home/ubuntu/logs/db-restore-smoke-test.log 2>&1
5 3 * * * /home/ubuntu/zavis-deploy/db-backup-health-check.sh >> /home/ubuntu/logs/db-backup-health.log 2>&1
```

The backup and restore scripts run `pg_dump` / `pg_restore` with low CPU and
I/O priority. The cron entries also acquire the deploy lock so they do not run
during an app deploy/build.

## Manual Checks

```bash
/home/ubuntu/zavis-deploy/db-backup-health-check.sh
/home/ubuntu/zavis-deploy/db-restore-smoke-test.sh
cat /home/ubuntu/zavis-deploy/db-backup-status.json
cat /home/ubuntu/zavis-deploy/db-restore-smoke-test-status.json
cat /home/ubuntu/zavis-deploy/db-backup-health.json
```

## Disaster-Recovery Note

Encrypted remote dumps are only useful if the encryption key survives outside
the failed server. Keep the value from
`/home/ubuntu/zavis-deploy/db-backup-encryption.key` in the company password
manager or another secret manager.

This is not a substitute for a managed Postgres service with PITR and failover.
It is the reasonable hardening layer while the DB remains local.
