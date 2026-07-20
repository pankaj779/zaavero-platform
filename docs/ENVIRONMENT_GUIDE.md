# Environment Guide (Production)

Providers are selected **only** via environment variables. No code changes are required to switch email, storage, AI, or meeting providers.

## Core

| Variable | Required (prod) | Notes |
|----------|-----------------|-------|
| `NODE_ENV` | yes | `production` |
| `PORT` | yes | Render sets this; default `3001` |
| `HOST` | yes | `0.0.0.0` |
| `APP_URL` / `FRONTEND_URL` | yes | Public web origin |
| `API_URL` | yes | Public API origin |
| `CORS_ORIGIN` | yes | Comma-separated allowlist |
| `TRUST_PROXY` | recommended | `true` behind Render |
| `BODY_LIMIT_BYTES` | optional | Default 1MB JSON |
| `REQUEST_TIMEOUT_MS` | optional | Default 60000 |
| `THROTTLE_*` | optional | Global + auth limits |
| `AUDIT_RETENTION_DAYS` | optional | Default 365 |

## Database (Neon)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | **Pooled** Neon URL |
| `DIRECT_URL` | yes | **Direct** Neon URL for migrations |

## Auth

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | yes | Long random |
| `REFRESH_TOKEN_SECRET` | yes | Distinct from JWT |
| `JWT_EXPIRES_IN` | optional | Default `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | optional | Default `7d` |
| `TOKEN_ENCRYPTION_KEY` | yes | Meeting OAuth token encryption |

## Email — Resend

| Variable | Required | Notes |
|----------|----------|-------|
| `EMAIL_PROVIDER` | yes | `RESEND` |
| `EMAIL_SANDBOX_MODE` | yes | `false` |
| `RESEND_API_KEY` | yes | |
| `RESEND_WEBHOOK_SECRET` | yes | |
| `EMAIL_FROM` | yes | Verified domain |

## Storage — Cloudinary

| Variable | Required | Notes |
|----------|----------|-------|
| `STORAGE_PROVIDER` | yes | `CLOUDINARY` |
| `STORAGE_SANDBOX_MODE` | yes | `false` |
| `CLOUDINARY_*` | yes | cloud / key / secret |

## Payments — Razorpay

| Variable | Required | Notes |
|----------|----------|-------|
| `RAZORPAY_KEY_ID` | yes | Live key |
| `RAZORPAY_SECRET` | yes | |
| `RAZORPAY_WEBHOOK_SECRET` | yes | |

## Meetings

| Variable | Required | Notes |
|----------|----------|-------|
| `MEETING_SANDBOX_MODE` | yes | `false` |
| `ZOOM_CLIENT_ID` / `SECRET` | if Zoom | OAuth app |
| `GOOGLE_MEET_CLIENT_ID` / `SECRET` | if Meet | OAuth app |
| `ZOOM_WEBHOOK_SECRET` | recommended | |

## AI (pick one chat provider)

| Variable | Notes |
|----------|-------|
| `AI_PROVIDER` | `OPENAI` \| `AZURE_OPENAI` \| `ANTHROPIC` \| `GOOGLE_GEMINI` \| `OPENROUTER` \| `GROQ` \| `OLLAMA` |
| `AI_EMBEDDING_PROVIDER` | Optional override |
| Provider API keys | Only the selected provider’s keys are required |

## Observability

| Variable | Notes |
|----------|-------|
| `SENTRY_DSN` | Enables Sentry when set |
| `SENTRY_TRACES_SAMPLE_RATE` | Default `0.1` |
| `OTEL_ENABLED` | `true` to prepare tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector URL |

## Web (Vercel)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api…/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Site origin |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional |

## Mobile (EAS)

| Variable | Notes |
|----------|-------|
| `EXPO_PUBLIC_API_URL` | Production API |
| EAS `projectId` | In `app.json` → `extra.eas` |
