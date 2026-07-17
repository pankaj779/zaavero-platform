# Teacher Portal data (`lib/teacher`)

Mock, course-agnostic data for the Teacher Portal shell (Sprint 06.01).

- `nav.config.ts` — sidebar navigation (`teacherNavItems`) and per-route page metadata (`teacherPageMeta`, `getTeacherPageMeta`).
- `dashboard-placeholder.ts` — honest placeholder DTOs for the dashboard: profile identity, greeting, statistics, and section lists (today's classes, recent activity, upcoming work), plus notification placeholders.

## Rules

- No fabricated metrics — numeric stats render neutral placeholders (`—`) until backend integration.
- DTO shapes are future-ready so wiring real APIs later is a mechanical swap, not a redesign.
- Never hardcode a specific program (e.g. Graphology); all copy is course-agnostic.
- Routes come from `lib/constants/routes.ts` (`TEACHER_ROUTES`).
