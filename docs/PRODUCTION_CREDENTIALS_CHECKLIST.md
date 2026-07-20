# Production Credentials Checklist

Supply every item below before launch. Prefer secret managers (Render / Vercel / GitHub Actions / EAS). Never commit real values.

## Neon PostgreSQL

- [ ] Project created
- [ ] Pooled connection string → `DATABASE_URL`
- [ ] Direct connection string → `DIRECT_URL`
- [ ] SSL required
- [ ] PITR / backups enabled

## Render (API)

- [ ] Web service created (Docker)
- [ ] `RENDER_DEPLOY_HOOK_URL` (optional, for GitHub Actions)
- [ ] All API env vars set (see Environment Guide)
- [ ] Health check `/api/v1/ready`
- [ ] Custom domain + TLS

## Vercel (Web)

- [ ] Project linked to monorepo
- [ ] `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` (CI)
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Custom domain + TLS

## Cloudinary

- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] Folder root / upload presets reviewed
- [ ] `STORAGE_PROVIDER=CLOUDINARY`, `STORAGE_SANDBOX_MODE=false`

## Resend

- [ ] Domain verified (SPF/DKIM)
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_WEBHOOK_SECRET`
- [ ] `EMAIL_FROM`
- [ ] `EMAIL_PROVIDER=RESEND`, `EMAIL_SANDBOX_MODE=false`

## Razorpay

- [ ] Live mode activated
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] Webhook URL → `https://api…/api/v1/payments/webhooks/razorpay` (or current path)

## Zoom

- [ ] OAuth app created
- [ ] `ZOOM_CLIENT_ID`
- [ ] `ZOOM_CLIENT_SECRET`
- [ ] `ZOOM_WEBHOOK_SECRET` (if webhooks used)
- [ ] Redirect URIs match API routes

## Google OAuth / Google Meet

- [ ] Google Cloud OAuth client
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (login, if used)
- [ ] `GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_SECRET`
- [ ] Authorized redirect URIs
- [ ] Meet / Calendar scopes enabled

## AI providers (enable only what you use)

- [ ] `AI_PROVIDER` set (not `SANDBOX`)
- [ ] OpenAI → `OPENAI_API_KEY`
- [ ] Azure OpenAI → `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, deployments
- [ ] Anthropic → `ANTHROPIC_API_KEY`
- [ ] Gemini → `GEMINI_API_KEY`
- [ ] OpenRouter → `OPENROUTER_API_KEY`
- [ ] Groq → `GROQ_API_KEY`
- [ ] Ollama → `OLLAMA_BASE_URL` (self-hosted reachable from Render)

## Expo / EAS / Firebase

- [ ] Expo account
- [ ] EAS `projectId` in `app.json`
- [ ] `EXPO_TOKEN` (GitHub Actions)
- [ ] `EXPO_PUBLIC_API_URL`
- [ ] Push credentials (Apple APNs / FCM via EAS)
- [ ] Firebase project (if using FCM outside EAS defaults)

## Sentry

- [ ] Org + projects (api / web / mobile)
- [ ] `SENTRY_DSN` (API)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (web, optional)
- [ ] Mobile DSN (optional)
- [ ] `SENTRY_AUTH_TOKEN` for release uploads (optional)

## GitHub

- [ ] Actions enabled
- [ ] Environments `production` with required secrets
- [ ] Branch protection on `main`

## Domain / DNS / SSL

- [ ] Apex + `www` → Vercel
- [ ] `api.` → Render
- [ ] `app.` (mobile deep links) → web or verified App Links
- [ ] TLS certificates issued
- [ ] CAA / SPF / DKIM / DMARC for email domain

## Encryption / Auth secrets

- [ ] `JWT_SECRET` (unique, long)
- [ ] `REFRESH_TOKEN_SECRET` (unique, long)
- [ ] `TOKEN_ENCRYPTION_KEY` (≥16 chars / preferred 32-byte material)
- [ ] `MEETING_SANDBOX_MODE=false`
