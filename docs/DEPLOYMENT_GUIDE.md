# Production Deployment Guide

Stack targets for Graphology Platform:

| Layer | Provider |
|-------|----------|
| Web | Vercel (`apps/web`) |
| API | Render Docker (`apps/api` + `render.yaml`) |
| Database | Neon PostgreSQL (pooled `DATABASE_URL` + `DIRECT_URL`) |
| Storage | Cloudinary |
| Email | Resend |
| Payments | Razorpay |
| AI | Env-selected provider (`AI_PROVIDER`) |
| Meetings | Zoom / Google Meet |
| Mobile | Expo EAS (`apps/mobile/eas.json`) |

## Prerequisites

1. GitHub repo with Actions enabled
2. Neon project with **pooled** + **direct** connection strings
3. Render service linked to the repo (or deploy hook secret)
4. Vercel project pointing at `apps/web`
5. Expo account + EAS project ID
6. All credentials from `docs/PRODUCTION_CREDENTIALS_CHECKLIST.md`

## First-time setup

### 1. Neon

```bash
# Use DIRECT_URL for migrations; DATABASE_URL for the app (pooled).
pnpm --filter @graphology/database exec prisma migrate deploy
```

Recommended pooled URL params:

```
?pgbouncer=true&connection_limit=5&pool_timeout=10&connect_timeout=15&sslmode=require
```

### 2. Render (API)

1. Create a Web Service from `render.yaml` or Dockerfile `apps/api/Dockerfile`
2. Set health check path: `/api/v1/ready`
3. Set every production secret listed in the credentials checklist
4. Enable auto-deploy from `main` or use `RENDER_DEPLOY_HOOK_URL` with GitHub Actions

### 3. Vercel (Web)

1. Import the monorepo; root directory may stay `/` with `apps/web/vercel.json`
2. Set `NEXT_PUBLIC_API_URL` to the Render public API (`https://…/api/v1`)
3. Set `NEXT_PUBLIC_APP_URL` to the production site origin
4. Connect the custom domain and enable HTTPS

### 4. Expo EAS (Mobile)

```bash
cd apps/mobile
eas login
eas build:configure   # writes projectId into app.json
eas build --profile production --platform all
eas submit --profile production
```

Set `EXPO_PUBLIC_API_URL` in EAS secrets to the production API.

## CI/CD

| Workflow | Purpose |
|----------|---------|
| `.github/workflows/ci.yml` | Lint, typecheck, build, migrate, test, mobile checks, prisma validate |
| `deploy-api.yml` | Prisma migrate deploy + Render hook |
| `deploy-web.yml` | Vercel production deploy |
| `deploy-mobile.yml` | EAS build |
| `release.yml` | Tag `v*.*.*` → GitHub Release + artifacts |

## Post-deploy smoke checks

```bash
curl -fsS https://api.example.com/api/v1/health
curl -fsS https://api.example.com/api/v1/ready
curl -fsS https://api.example.com/api/v1/health/deep
curl -fsS https://www.example.com/
```

Login as Student / Teacher / Admin and verify AI, payments webhook, and a live session join URL.
