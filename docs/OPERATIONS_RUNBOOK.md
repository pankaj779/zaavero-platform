# Operations Runbook

## Daily

- [ ] Check Render metrics (CPU, memory, restart count)
- [ ] Check Neon storage + connection count
- [ ] Skim Sentry issues (if enabled)
- [ ] Confirm `/api/v1/ready` returns 200

## Weekly

- [ ] Review failed email / AI / payment webhook logs
- [ ] Confirm backup job succeeded (Neon PITR or `scripts/backup-database.sh`)
- [ ] Rotate any leaked or expired OAuth tokens

## Deploy

1. Merge to `main` after CI green
2. API workflow runs `prisma migrate deploy` then Render hook
3. Web workflow deploys Vercel production
4. Smoke: health, ready, login, one payment webhook sandbox, one AI chat

## Incident: API down

1. `curl /api/v1/health` vs `/api/v1/ready`
2. If ready fails → Neon connectivity / exhausted pool
3. Render logs → crash loop / OOM → scale plan or reduce concurrency
4. Rollback: redeploy previous Render deploy

## Incident: Web down

1. Vercel deployment status
2. Confirm `NEXT_PUBLIC_API_URL` still points at live API
3. Rollback Vercel promotion

## Incident: Auth spike / brute force

- Global throttling is enabled (`THROTTLE_*`)
- Auth login uses tighter `auth` throttle
- Temporarily lower `THROTTLE_AUTH_LIMIT` and redeploy

## Provider switch (no code change)

| Concern | Env change |
|---------|------------|
| Email | Already Resend-only in prod |
| Storage | `STORAGE_PROVIDER=CLOUDINARY` |
| AI | `AI_PROVIDER=…` + matching API key |
| Meetings | Set Zoom and/or Google Meet OAuth envs; `MEETING_SANDBOX_MODE=false` |

## Useful endpoints

| Path | Use |
|------|-----|
| `/api/v1/health` | Liveness |
| `/api/v1/ready` | Readiness (DB) |
| `/api/v1/health/deep` | DB + provider config snapshot |
| `/api/v1/status` | Uptime |
