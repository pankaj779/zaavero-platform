# Graphology Mobile

Production React Native (Expo) application for the Graphology Platform.

The mobile app talks to the **exact same NestJS backend** used by the web app:

```
React Native → apiFetch() → NestJS /api/v1 → Auth → RBAC → DTOs → Business logic
```

No backend logic is duplicated. No mock data. No fake providers.

## Tech stack

- Expo SDK 52 + Expo Router
- TypeScript (strict)
- React Query (offline persistence + queued mutations)
- React Hook Form + Zod
- Expo Secure Store (tokens)
- Expo Notifications (push)
- Expo Image / Camera / FileSystem
- React Native Reanimated + Gesture Handler

## Role portals

| Role    | Route group   |
|---------|---------------|
| Student | `/(student)`  |
| Teacher | `/(teacher)`  |
| Admin   | `/(admin)`    |

Unauthenticated users land on `/(auth)`.

## Getting started

```bash
# From the monorepo root
pnpm install
pnpm --filter @graphology/mobile start
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your NestJS API
(use your machine LAN IP for physical devices — not `localhost`).

## Scripts

| Script       | Purpose                              |
|--------------|--------------------------------------|
| `pnpm start` | Expo dev server                      |
| `pnpm typecheck` | TypeScript check                 |
| `pnpm lint`  | ESLint                               |
| `pnpm test`  | Jest unit / API / auth / nav tests   |
| `pnpm build` | Production export (`expo export`)    |

## Architecture highlights

- **Auth**: SecureStore-backed tokens, single-flight refresh, biometric unlock, session restore
- **API**: Shared `apiFetch` with the same envelope unwrapping / 401 refresh as web
- **AI**: Authenticated SSE streaming via `expo/fetch` against `/ai/student/chat/stream`
- **Payments / Video / Media / PDF / Email**: All reused from existing NestJS providers
- **Offline**: React Query persistence + downloadable lessons/PDFs/certificates/invoices
- **Security**: No localStorage for secrets; certificate-pinning ready via `getSecureFetch()`

## Documentation

See `docs/prompts/phase-17-mobile/17.00_COMPLETE_REACT_NATIVE_MOBILE_APP.md`.
