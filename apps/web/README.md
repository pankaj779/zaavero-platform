# @graphology/web

Next.js app for the Graphology / Zaavero platform — public marketing site and student portal UI.

## Current scope

- Global marketing layout (header, footer, skip link)
- Homepage foundation: hero + sections + CTA + SEO
- Student dashboard shell and learning domains (mock DTO–driven UI)
  - My Learning, Course Details, Lesson Player
  - Live Classes, Assignments, Certificates
  - Profile, Settings, Notifications
- Shared dashboard primitives under `components/dashboard/shared`

## Scripts

```bash
pnpm --filter @graphology/web dev
pnpm --filter @graphology/web build
pnpm --filter @graphology/web lint
pnpm --filter @graphology/web typecheck
pnpm --filter @graphology/web test
```

## Notes

- UI primitives come from `@graphology/ui` — do not duplicate components here.
- Student portal pages use mock data in `lib/dashboard/`; no learning APIs yet.
- Auth flows and backend integration remain separate from portal UI mocks.
- Set `NEXT_PUBLIC_APP_URL` for canonical URLs and sitemap (see `.env.example`).
