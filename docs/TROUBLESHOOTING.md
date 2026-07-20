# Troubleshooting Guide

## API returns 502 / sleeping

- Render free/starter may spin down — upgrade or keep-alive `/health`
- Check deploy logs for migration failure (`RUN_MIGRATIONS=true`)

## `/ready` is 503

- Neon paused or wrong `DATABASE_URL`
- Exhausted connections — lower `connection_limit` or scale Neon
- SSL mode missing (`sslmode=require`)

## CORS errors in browser

- Add exact web origin to `CORS_ORIGIN` (no trailing slash mismatch)
- Ensure `credentials: true` requests use allowlisted origin (not `*`)

## Login works on web but API 401 on mobile

- Confirm `EXPO_PUBLIC_API_URL` points at `/api/v1`
- Device cannot use `localhost` — use LAN or public HTTPS API

## Razorpay webhook fails

- Verify `RAZORPAY_WEBHOOK_SECRET`
- Ensure raw body available (API uses `rawBody` / verify middleware)
- Replay from Razorpay dashboard

## Emails not arriving

- Domain DNS (SPF/DKIM) on Resend
- `EMAIL_SANDBOX_MODE` must be `false`
- Check Resend dashboard + `/email/admin` logs (admin)

## AI stream disconnects

- Proxy timeout — raise Render / `REQUEST_TIMEOUT_MS`
- Provider quota — check `/ai/*/quota` and provider dashboard
- `AI_PROVIDER=SANDBOX` forbidden in production

## Meetings missing join URL

- OAuth tokens expired — reconnect integration
- `TOKEN_ENCRYPTION_KEY` changed without re-auth
- `MEETING_SANDBOX_MODE` still true

## Prisma migrate errors on deploy

- Always migrate with `DIRECT_URL` (non-pooled)
- Never run migrate against PgBouncer transaction pooler

## Mobile EAS build fails

- `eas.json` profile env URLs
- Missing credentials for iOS/Android submit
- Hermes vs JSC: production profile uses Hermes; local Windows export may use JSC

## High latency

- Check Neon cold start
- Enable Sentry performance / OTEL
- Review N+1 queries in slow endpoints
