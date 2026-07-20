# Disaster Recovery & Backup Strategy

## RPO / RTO targets (recommended)

| Tier | RPO | RTO |
|------|-----|-----|
| Database | ≤ 24h (Neon PITR ideally minutes) | ≤ 4h |
| Object storage (Cloudinary) | Provider durability | Restore via Cloudinary console |
| Secrets | GitHub / Render / Vercel vaults | ≤ 1h rotate + redeploy |

## Database backups

### Neon managed

1. Enable **Point-in-Time Recovery** on the Neon project
2. Document the earliest restore point weekly
3. Test restore into a branch monthly

### Manual dump

```bash
export DIRECT_URL="postgresql://…neon.tech/neondb?sslmode=require"
./scripts/backup-database.sh ./backups
```

Store dumps in an encrypted object store off-platform.

### Restore

```bash
export DIRECT_URL="postgresql://…target…"
./scripts/restore-database.sh ./backups/graphology-YYYYMMDD.dump
pnpm --filter @graphology/database exec prisma migrate status
```

Always restore to a **new** Neon branch first, verify, then cut over DNS / env URLs.

## Application rollback

1. **API:** Render → previous successful deploy
2. **Web:** Vercel → previous deployment promote
3. **Mobile:** EAS Update channel rollback or previous store build

## Secrets compromise

1. Rotate JWT / refresh secrets (forces re-login)
2. Rotate Razorpay, Resend, Cloudinary, OAuth, AI keys
3. Rotate `TOKEN_ENCRYPTION_KEY` only with a planned meeting reconnect (tokens re-encrypted / re-auth)

## Full region outage

1. Create Neon branch / replica in alternate region if available
2. Point `DATABASE_URL` / `DIRECT_URL` at new host
3. Redeploy Render + Vercel with updated env
4. Update mobile `EXPO_PUBLIC_API_URL` via EAS Update if API hostname changes
