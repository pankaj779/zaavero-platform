# Current Project State

## Current Phase

Phase 05 — Teacher Portal (shell implemented; feature modules pending)

## Status

Student portal shell and learning domains are implemented with mock DTOs and stabilized for engineering consistency. Teacher Portal shell is implemented (independent `/teacher` tree), with Teacher Courses at `/teacher/courses`, Teacher Batches at `/teacher/batches`, and Teacher Students at `/teacher/students` (mock DTOs; grid/list views; actions disabled). Public marketing homepage and design system are in place. Backend auth/RBAC remain available; learning APIs and LMS schema are not implemented yet.

## Current Version

`0.3.0` (web app)

## Completed Modules

- Project bootstrap (pnpm, Turborepo, NestJS, Next.js)
- Database foundation (Prisma, migrations, seed, multi-tenancy models)
- Organization foundation
- Backend core (config, validation, filters, interceptors, health)
- Authentication (register, login, email verification, refresh rotation, password reset)
- RBAC (JWT/roles/permissions guards, permission lookup, test routes)
- Architecture Decision Records (`docs/adr/`)
- Engineering stabilization
- **Design system** (`@graphology/ui` tokens + component library)
- **Public website foundation** (layout, nav, footer, homepage sections, SEO, brand config)
- **Student dashboard shell** (05.01) — sidebar, topbar, widgets, Coming Soon routes
- **My Learning** (05.02) — enrolled courses grid, filters, stats
- **Course Details** (05.03) — `/dashboard/learning/[courseId]`
- **Lesson Player** (05.04) — content engine at `/dashboard/learning/[courseId]/lesson/[lessonId]`
- **Live Classes** (05.05) — `/dashboard/live`
- **Assignments** (05.06) — `/dashboard/assignments`
- **Certificates** (05.07) — `/dashboard/certificates`
- **Profile & Settings** (05.08) — `/dashboard/profile`, `/dashboard/settings`
- **Notifications Center** (05.09) — `/dashboard/notifications`
- **Student Portal Stabilization** (05.10) — shared dashboard primitives, consistent states/animations, dead export cleanup
- **Teacher Portal Architecture** (06.00) — course-agnostic teacher IA, routes, modules, RBAC/schema plan, sprint map
- **Teacher Portal Shell** (06.01) — `/teacher` layout, navigation, topbar, placeholder dashboard, Coming Soon module routes (UI only)
- **Teacher Courses** (06.02) — `/teacher/courses` workspace: course cards (grid/list), stats, search/filter/sort, view states (UI + DTO mocks; actions disabled)
- **Teacher Batches** (06.03) — `/teacher/batches` workspace: batch cards (grid/list), stats, search/filter/sort, view states (UI + DTO mocks; actions disabled)
- **Teacher Students** (06.04) — `/teacher/students` workspace: student cards (grid/list), stats, search/filter/sort, view states (UI + DTO mocks; actions disabled)
- **Teacher Attendance** (06.05) — `/teacher/attendance` workspace: session cards (grid/list), stats, search/filter/sort, session details panel with roster, view states (UI + DTO mocks; actions disabled)
- **Teacher Live Classes** (06.06) — `/teacher/live` workspace: batch-scoped live class cards (grid/list), stats, search/filter/sort, schedule/meeting/attendance details panel, view states (UI + DTO mocks; actions disabled)
- **Teacher Assignments** (06.07) — `/teacher/assignments` workspace: course-scoped assignment cards (grid/list), stats, search/filter/sort, submission/grading/timeline details panel, view states (UI + DTO mocks; actions disabled)
- **Teacher Analytics** (06.08) — `/teacher/analytics` workspace: placeholder KPIs, chart-placeholder sections, course search, time-range filter, metric details panel (UI + DTO mocks; read-only; actions disabled)
- **Teacher Messages** (06.09) — `/teacher/messages` workspace: conversation list/thread/details, search/filter, disabled compose (UI + DTO mocks; no websocket/backend)
- **Teacher Calendar** (06.10) — `/teacher/calendar` workspace: month grid, mini calendar, agenda, event details, search/filter (UI + DTO mocks; integrations disabled)

## Pending Modules

- Teacher Portal feature modules (sprints 06.11+): RBAC/identity, LMS schema, lessons, grading, certificates, announcements
- Remaining student portal pages (Calendar, Messages, Payments depth)
- Admin dashboard
- Courses / batches / enrollments (backend + LMS schema wave)
- Teacher RBAC permission seeding (role exists; permissions Admin-only today)
- Payments (Razorpay)
- Real-time / email / push notifications (architecture prepared only)
- Google OAuth
- Mobile app implementation
- Full E2E suite expansion
- Production deployment hardening
- Certificate PDF / QR / verification / LinkedIn (architecture prepared only)
- Profile avatar upload / editing / 2FA / OAuth linking (architecture prepared only)

## Last Completed Step

Task 06.10 — Teacher Calendar module (UI + DTO mocks; no Google/Outlook/Zoom/Meet/reminders/backend; actions disabled)

## Next Step

Continue Teacher Portal feature modules (lessons, certificates, announcements, RBAC & identity foundation, LMS schema wave) per the Teacher Portal Architecture sprint map.

## Key References

- [ADRs](../adr/README.md)
- [System Architecture](../02_SYSTEM_ARCHITECTURE.md)
- [Database Schema](../03_DATABASE_SCHEMA.md)
- [API Standards](../07_API_STANDARDS.md)
- [Environment Variables](../ENVIRONMENT.md)
- [Auth Module README](../../apps/api/src/modules/auth/README.md)
- [Student Portal prompts](./phase-04-student-portal/)
- [Teacher Portal Architecture](../product/07_TEACHER_PLATFORM_ARCHITECTURE.md)
- [Teacher Portal prompts](./phase-05-teacher-portal/)
