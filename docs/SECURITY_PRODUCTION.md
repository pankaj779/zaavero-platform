# Production Security Notes

## Transport & headers

- API: `helmet` (CSP in production, HSTS 1y), compression, CORS allowlist, trust proxy
- Web: CSP + frame/nosniff/referrer via `next.config.ts` and `vercel.json`

## Auth tokens

- Access + refresh JWTs issued by Nest; refresh rotation on `/auth/refresh`
- Mobile stores tokens in **Expo SecureStore** (Keychain/Keystore)
- Web currently mirrors tokens in cookies (`SameSite=Lax`, `Secure` on HTTPS) and localStorage for middleware hints — **HttpOnly-only cookie migration** remains recommended technical debt (requires BFF Set-Cookie)

## Abuse protection

- Global `@nestjs/throttler` guard
- Tighter `auth` throttle on login/register
- Provider webhook signature verification (Razorpay, Resend, Zoom)

## Secrets

- Validated at boot via Zod `env.schema.ts`
- Production forbids email/storage/AI/meeting sandboxes
- `TOKEN_ENCRYPTION_KEY` required for OAuth token encryption at rest

## CSRF

- Bearer-token API (Authorization header) is not cookie-session CSRF vulnerable for API calls
- Cookie-authenticated browser routes should migrate to HttpOnly + CSRF double-submit when cookies become authoritative

## Checklist

See `docs/PRODUCTION_CREDENTIALS_CHECKLIST.md` and `docs/LAUNCH_CHECKLIST.md`.
