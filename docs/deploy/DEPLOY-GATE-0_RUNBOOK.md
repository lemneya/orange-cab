# DEPLOY-GATE-0: Deployment Runbook

## Release Information

| Field | Value |
|-------|-------|
| **Release Tag** | `oc-ids-rg0-20260117` |
| **Source of Truth** | `main@oc-ids-rg0-20260117` |
| **Gate ID** | DEPLOY-GATE-0 |
| **Created** | 2026-01-17 |

> **IMPORTANT**: Always deploy from the exact tag above. Never deploy "latest main" or HEAD.

---

## 1. Prerequisites

### 1.1 Required Environment Variables

The following environment variables MUST be configured before deployment:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string (staging/prod) | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `NODE_ENV` | Environment: `staging` or `production` | Yes |
| `PORT` | Server port (default: 3000) | Yes |
| `VITE_API_URL` | Frontend API base URL | Yes |

### 1.2 Optional Storage Variables (if applicable)

| Variable | Description | Required |
|----------|-------------|----------|
| `S3_BUCKET` | S3/MinIO bucket name for file storage | If using S3 |
| `S3_ACCESS_KEY` | S3/MinIO access key | If using S3 |
| `S3_SECRET_KEY` | S3/MinIO secret key | If using S3 |
| `S3_ENDPOINT` | S3/MinIO endpoint URL | If using MinIO |

### 1.3 Access Requirements

- [ ] SSH access to deployment target (or platform CLI access)
- [ ] Database credentials with migration privileges
- [ ] Backup storage location available

---

## 2. Pre-Deployment

### 2.1 Verify Release Tag

```bash
# Clone or update repository
git fetch origin --tags
git checkout oc-ids-rg0-20260117

# Verify you are on the correct tag
git describe --tags --exact-match
# Expected output: oc-ids-rg0-20260117
```

### 2.2 Create Database Backup

**CRITICAL**: Always backup before migration.

```bash
# MySQL backup command
mysqldump -h <HOST> -u <USER> -p<PASSWORD> <DATABASE> \
  --single-transaction \
  --routines \
  --triggers \
  > evidence/DEPLOY-GATE-0/db-backup-$(date +%Y%m%d-%H%M%S).sql

# Log the backup
echo "Backup created at $(date)" >> evidence/DEPLOY-GATE-0/db-backup.log
echo "File: db-backup-$(date +%Y%m%d-%H%M%S).sql" >> evidence/DEPLOY-GATE-0/db-backup.log
echo "Size: $(ls -lh db-backup-*.sql | tail -1 | awk '{print $5}')" >> evidence/DEPLOY-GATE-0/db-backup.log
```

For large databases, store backup externally and record the path:
```bash
echo "Backup stored at: s3://backups/orangecab/db-backup-YYYYMMDD.sql" >> evidence/DEPLOY-GATE-0/db-backup.log
```

---

## 3. Deployment Steps

### 3.1 Install Dependencies

```bash
# Ensure correct Node.js version (check .nvmrc if present)
node --version

# Install dependencies
pnpm install --frozen-lockfile
```

### 3.2 Run Database Migration

> **WARNING**: Never use `db:push` for staging/production. It is for local/dev schema sync only and can be destructive. Always use versioned migrations.

```bash
# Discover the repo's production-safe migration command (DO NOT use db:push in staging/prod)
pnpm -s run | grep -E "db:|drizzle|migrate" | tee evidence/DEPLOY-GATE-0/migrate.log

# Run the migration command that applies versioned migrations.
# Use ONE of these based on what the repo provides:
#   pnpm db:migrate
#   pnpm drizzle:migrate
#   pnpm drizzle-kit migrate
#
# Example:
pnpm db:migrate 2>&1 | tee -a evidence/DEPLOY-GATE-0/migrate.log

# Verify migration success
echo "Migration exit code: $?" >> evidence/DEPLOY-GATE-0/migrate.log
echo "Completed at: $(date)" >> evidence/DEPLOY-GATE-0/migrate.log
```

**If the repo only has `db:push`, STOP**: Do not deploy. Create and merge a PR that adds versioned migrations and a `db:migrate` command first. Deploying with `db:push` is forbidden in staging/production.

### 3.3 Build Application

```bash
# Build for production
pnpm build
```

### 3.4 Deploy to Target Platform

#### Option A: Docker-based deployment
```bash
docker build -t orangecab:oc-ids-rg0-20260117 .
docker push <registry>/orangecab:oc-ids-rg0-20260117

# Update deployment with new image tag
kubectl set image deployment/orangecab orangecab=<registry>/orangecab:oc-ids-rg0-20260117
# OR
docker-compose up -d
```

#### Option B: Direct deployment (PM2, systemd, etc.)
```bash
# Stop current version
pm2 stop orangecab

# Start new version
NODE_ENV=production pm2 start dist/index.js --name orangecab

# Verify running
pm2 status orangecab
```

#### Option C: Platform-as-a-Service (Railway, Render, Fly.io)
```bash
# Deploy via platform CLI
flyctl deploy --image-label oc-ids-rg0-20260117
# OR
railway up
# OR
render deploy
```

---

## 4. Post-Deployment Verification

### 4.1 Health Check

```bash
# Basic uptime check
curl -I https://<BASE_URL>/ 2>&1 | tee evidence/DEPLOY-GATE-0/health.log

# Expected: 2xx or 3xx (many apps redirect /)
echo "Health check completed at: $(date)" >> evidence/DEPLOY-GATE-0/health.log
```

### 4.2 Smoke Tests

Capture screenshots for each route. Save to `evidence/DEPLOY-GATE-0/`.

| # | Route | Screenshot File | Verification |
|---|-------|-----------------|--------------|
| 1 | `/owner` | `smoke_01_owner.png` | KPI cards visible, timeline loads |
| 2 | `/admin/broker-accounts` | `smoke_02_admin_broker_accounts.png` | Broker accounts table loads |
| 3 | `/admin/rate-cards` | `smoke_03_admin_rate_cards.png` | Rate cards table loads |
| 4 | `/ids/shadow-runs/:id/map` | `smoke_04_ids_map.png` | Map renders, route ribbons visible, drawer opens |
| 5 | `/simulator/day` (Step 4) | `smoke_05_simulator_roi.png` | ROI card populated with savings data |
| 6 | `/reports/runs/:id` | `smoke_06_reports_run.png` | Narrative panel visible, checksum footer present |

#### Manual Screenshot Capture
```bash
# Using Playwright (if available)
npx playwright screenshot https://<BASE_URL>/owner evidence/DEPLOY-GATE-0/smoke_01_owner.png

# Or use browser DevTools:
# 1. Open each URL
# 2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
# 3. Type "screenshot" and select "Capture full size screenshot"
# 4. Save to evidence/DEPLOY-GATE-0/
```

### 4.3 Verify No PHI in Evidence

```bash
# Check screenshots don't contain real patient data
# Manual review required - look for:
# - Real names (not synthetic like "John Smith Demo")
# - Real addresses
# - Real phone numbers
# - Real dates of birth

echo "PHI review completed by: <YOUR_NAME>" >> evidence/DEPLOY-GATE-0/phi-review.log
echo "Date: $(date)" >> evidence/DEPLOY-GATE-0/phi-review.log
echo "Result: PASS / FAIL" >> evidence/DEPLOY-GATE-0/phi-review.log
```

---

## 5. Rollback Procedure

### 5.1 When to Rollback

- [ ] Migration failed
- [ ] Health check returns non-200
- [ ] Critical smoke tests fail
- [ ] Application errors in logs

### 5.2 Rollback Steps

```bash
# Define previous tag
PREV_TAG="<previous-known-good-tag>"

# 1. Checkout previous version
git checkout $PREV_TAG

# 2. Rebuild and redeploy
pnpm install --frozen-lockfile
pnpm build

# 3. Deploy previous version (use same method as deployment)
# Docker:
docker build -t orangecab:$PREV_TAG .
kubectl set image deployment/orangecab orangecab=<registry>/orangecab:$PREV_TAG

# 4. Restore database if migration is not backward compatible
mysql -h <HOST> -u <USER> -p<PASSWORD> <DATABASE> < evidence/DEPLOY-GATE-0/db-backup-YYYYMMDD-HHMMSS.sql

# 5. Log rollback
echo "Rollback executed at: $(date)" >> evidence/DEPLOY-GATE-0/rollback.log
echo "Rolled back from: oc-ids-rg0-20260117" >> evidence/DEPLOY-GATE-0/rollback.log
echo "Rolled back to: $PREV_TAG" >> evidence/DEPLOY-GATE-0/rollback.log
echo "DB restored: YES / NO" >> evidence/DEPLOY-GATE-0/rollback.log
```

### 5.3 Post-Rollback Verification

```bash
# Re-run health check
curl -I https://<BASE_URL>/ >> evidence/DEPLOY-GATE-0/rollback.log

# Re-run critical smoke tests
# Capture smoke_rollback_*.png if needed
```

---

## 6. Evidence Artifacts

All evidence must be saved to `evidence/DEPLOY-GATE-0/`:

| File | Description | Required |
|------|-------------|----------|
| `db-backup.log` | Database backup log/reference | Yes |
| `migrate.log` | Migration output | Yes |
| `health.log` | Health check output | Yes |
| `smoke_01_owner.png` | Owner cockpit screenshot | Yes |
| `smoke_02_admin_broker_accounts.png` | Broker accounts screenshot | Yes |
| `smoke_03_admin_rate_cards.png` | Rate cards screenshot | Yes |
| `smoke_04_ids_map.png` | IDS map screenshot | Yes |
| `smoke_05_simulator_roi.png` | Simulator Step 4 screenshot | Yes |
| `smoke_06_reports_run.png` | Reports run screenshot | Yes |
| `rollback.log` | Rollback execution log | If rollback executed |
| `phi-review.log` | PHI review confirmation | Yes |

---

## 7. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Deployer | | | |
| Reviewer | | | |
| QA | | | |

---

## Appendix A: Troubleshooting

### Migration Fails
1. Check DATABASE_URL is correct
2. Verify database user has ALTER, CREATE, DROP privileges
3. Check for pending locks: `SHOW PROCESSLIST;`

### Health Check Fails
1. Check application logs: `pm2 logs orangecab` or `docker logs <container>`
2. Verify PORT matches deployment config
3. Check firewall/security group rules

### Smoke Test Fails
1. Check browser console for JavaScript errors
2. Verify API endpoints are responding
3. Check database connectivity from application

---

*This runbook is the single source of truth for DEPLOY-GATE-0. Do not modify deployment procedures without updating this document.*
