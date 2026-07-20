# Scaling Guide

## Vertical first

| Service | Scale signal | Action |
|---------|--------------|--------|
| Render API | CPU > 70% sustained / restarts | Larger plan |
| Neon | Compute / storage alerts | Larger compute + storage |
| Vercel | Usually auto | Edge / ISR as needed |

## Horizontal (API)

1. Raise Render instance count behind the load balancer
2. Keep `TRUST_PROXY=true`
3. Ensure Neon pooler `connection_limit` × instances < Neon max connections
4. Stateless API — no sticky sessions required (JWT)

## Database

- Prefer Neon **pooled** URL for app traffic
- Keep migrations on `DIRECT_URL`
- Add indexes only via Prisma migrations (never ad-hoc in prod without migration)

## Queues / workers

Email + AI job pollers run in-process via `@nestjs/schedule`.

When volume grows:

1. Split worker process (same Docker image, different start command) — future work
2. Or increase poll interval / batch sizes via env (`EMAIL_QUEUE_*`, `AI_QUEUE_*`)

## Caching

- API: HTTP compression + ETag exposure
- Web: Next static asset `Cache-Control` immutable
- CDN: Vercel edge cache for static

## Mobile

- Use EAS Update channels for JS-only fixes
- Store binaries only for native dependency changes
