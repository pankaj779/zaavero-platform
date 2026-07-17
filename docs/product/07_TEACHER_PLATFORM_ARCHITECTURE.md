# Teacher Portal Architecture

Version: 1.0  
Status: Architecture approved for implementation planning  
Sprint origin: Phase 06.00  
Related: [Project Vision](../00_PROJECT_VISION.md) · [PRD](../01_PRODUCT_REQUIREMENTS.md) · [System Architecture](../02_SYSTEM_ARCHITECTURE.md) · [Database Schema](../03_DATABASE_SCHEMA.md) · [Student Platform Blueprint](./06_STUDENT_PLATFORM_BLUEPRINT%20copy.md) · [PROJECT_STATE](../prompts/PROJECT_STATE.md)

---

## Document purpose

This document defines the **Teacher Portal** for the Zaavero learning platform (engineering package still named Graphology Platform). It is architecture only: no UI implementation, no API code, no Prisma migrations.

**Non-negotiable product rule:** the portal is course-agnostic. Graphology is the first program content, never an architectural constant, route segment, permission string, DTO field enum, or hardcoded copy key that blocks future courses.

---

## 1. Teacher Portal Vision

### 1.1 What it is

The Teacher Portal is the **authoring, delivery, and evaluation surface** for instructors on Zaavero Learn. Where the Student Portal is consumption-oriented (learn, submit, join, download), the Teacher Portal is production-oriented (create, schedule, review, grade, certify, communicate, measure).

### 1.2 Product framing

| Layer | Name | Rule |
| --- | --- | --- |
| Parent brand | Zaavero | Config-driven; never domain logic |
| Product | Zaavero Learn | LMS shell for many programs |
| First program content | Graphology (and future titles) | Data only |
| Engineering role | `Teacher` | Matches RBAC seed / planned `Teachers` profile |
| Student-facing language | Mentor | Marketing / student UX; same user, different voice |

### 1.3 Design principles

1. **Course-agnostic LMS** — courses, modules, lessons, batches, and materials are generic entities.
2. **Batch as teaching unit** — enrollment, live delivery, attendance, and many assignments are batch-scoped (aligns with planned schema).
3. **Org multi-tenancy** — every teacher action is scoped to active organization membership (ADR-003 / ADR-006).
4. **Mirror student engineering patterns** — separate route tree, domain folders, mock DTOs first, shared shells, then APIs.
5. **Permission-first** — UI routes map to fine-grained permissions; Teacher role must receive a real permission set (today seed assigns permissions only to Admin).
6. **Progressive depth** — UI shells and mock workflows before uploads, Meet generation, grading APIs, messaging backends.
7. **Accessibility and performance parity** with the student portal stabilization bar (05.10).

### 1.4 Out of scope for Teacher Portal itself

- Public marketing site
- Admin portal (approve teachers/courses, payments, coupons, blogs)
- Student payment flows
- Platform-wide user administration
- Hardcoded Graphology curriculum templates as system defaults

---

## 2. User Journey

```text
Teacher Login (existing auth)
        ↓
Org context resolved (active membership)
        ↓
Teacher Dashboard (today’s work)
        ↓
Course / Batch selection (workspace context)
        ↓
Teaching workflow
  • Curriculum & lessons
  • Materials upload
  • Live class schedule
  • Assignments & grading
  • Attendance & certificates
        ↓
Student interaction
  • Roster & progress
  • Announcements
  • Messages
        ↓
Reports / Analytics
        ↓
Profile & Settings
```

### 2.1 Journey stages (detail)

**Login**  
Reuse existing authentication (JWT + refresh). Post-login router sends `Teacher` (and Admin-as-teacher if allowed) to `/teacher`, not `/dashboard`. Students remain on `/dashboard`.

**Dashboard**  
Operational home: upcoming live classes, grading queue, attendance owed, announcement drafts, unread messages, enrollment deltas — always aggregated across the teacher’s assigned courses/batches within the org.

**Course selection**  
Teacher picks a **course** and optionally a **batch**. Deep links and “Continue teaching” widgets restore last-used course/batch context (client preference + future API).

**Teaching workflow**  
Primary loop: structure curriculum → attach materials → schedule live sessions → publish assignments → review submissions → mark attendance → issue / recommend certificates.

**Student interaction**  
Roster, progress, announcements (one-to-many), messages (threaded / one-to-one or cohort), feedback on submissions.

**Reports**  
Completion, performance, attendance rates, submission latency, certificate readiness — first as mock charts, later as query-backed analytics.

---

## 3. Information Architecture

### 3.1 Portal shell (parallel to student dashboard)

| Chrome | Responsibility |
| --- | --- |
| **Sidebar** | Primary IA for all teacher modules; config-driven labels; course-agnostic |
| **Topbar** | Global search entry, notifications bell, theme, profile menu, org switcher (when multi-org) |
| **Breadcrumbs** | Hierarchical path: Module → Course → Batch → Entity → Action |
| **Search** | Progressive: local filter → global command search across courses, students, assignments, live sessions |
| **Notifications** | Teacher-oriented events (submission received, class starting, certificate request, message) |
| **Profile** | Teacher professional profile (bio, specialization, qualification) distinct from student learner profile |

### 3.2 Context bar (teacher-specific)

Below topbar / above page content when a course (and optionally batch) is selected:

- Course title (generic)
- Batch name / schedule summary
- Quick actions: New lesson, Schedule class, New assignment, Announce

Context is sticky on desktop; collapsible on mobile.

### 3.3 Sidebar groups (recommended)

1. **Overview** — Dashboard, Analytics  
2. **Teaching** — Courses, Lessons, Live Classes, Assignments  
3. **Learners** — Students, Attendance, Certificates  
4. **Engage** — Announcements, Messages, Notifications  
5. **Account** — Profile, Settings  

Calendar can surface as a view inside Live Classes + Assignments deadlines, or as a later convenience route (`/teacher/calendar`) without being MVP-critical.

---

## 4. Navigation Tree

Every route is under `/teacher`. IDs are opaque UUIDs. No course-title or “graphology” path segments.

```text
/teacher
├── /                          Dashboard
├── /courses
│   ├── /                      Course list
│   ├── /new                   Create course
│   ├── /[courseId]
│   │   ├── /                  Course overview (teacher)
│   │   ├── /edit              Edit course metadata
│   │   ├── /curriculum        Modules & lesson outline
│   │   ├── /batches
│   │   │   ├── /              Batch list for course
│   │   │   ├── /new           Create batch
│   │   │   └── /[batchId]
│   │   │       ├── /          Batch overview
│   │   │       └── /edit      Edit batch
│   │   └── /materials         Course-level materials library
├── /lessons
│   ├── /                      Cross-course lesson index (optional filters)
│   └── /… (primary authoring is nested below)
│   Preferred nested:
│   /teacher/courses/[courseId]/modules/[moduleId]/lessons
│   ├── /                      Lessons in module
│   ├── /new                   Create lesson
│   └── /[lessonId]
│       ├── /                  Lesson detail / preview
│       ├── /edit              Edit lesson + content blocks
│       └── /materials         Lesson attachments
├── /live
│   ├── /                      Live class calendar / list
│   ├── /new                   Schedule live class
│   └── /[sessionId]
│       ├── /                  Session detail
│       ├── /edit              Edit schedule / meeting link
│       └── /attendance        Mark attendance for session
├── /assignments
│   ├── /                      Assignment inbox (all courses)
│   ├── /new                   Create assignment
│   └── /[assignmentId]
│       ├── /                  Assignment detail
│       ├── /edit              Edit assignment
│       ├── /submissions       Submission queue
│       └── /submissions/[submissionId]
│           ├── /              Review submission
│           └── /grade         Grade + feedback
├── /students
│   ├── /                      Student roster (filter by course/batch)
│   └── /[studentId]
│       ├── /                  Student teaching profile (for this teacher’s courses)
│       ├── /progress          Progress across shared courses
│       └── /submissions       Submissions subset
├── /attendance
│   ├── /                      Attendance home (pick batch/session)
│   └── /batches/[batchId]
│       ├── /                  Attendance register
│       └── /sessions/[sessionId]  Session attendance detail
├── /certificates
│   ├── /                      Certificate candidates / issued list
│   ├── /[certificateId]       Certificate detail
│   └── /recommend             Recommend / request issue (admin may approve)
├── /announcements
│   ├── /                      Announcement list
│   ├── /new                   Create announcement
│   └── /[announcementId]
│       ├── /                  Announcement detail
│       └── /edit              Edit / unpublish
├── /messages
│   ├── /                      Inbox / threads
│   └── /[threadId]            Thread view
├── /analytics
│   ├── /                      Analytics overview
│   ├── /courses/[courseId]    Course analytics
│   └── /batches/[batchId]     Batch analytics
├── /notifications             Teacher notifications center
├── /profile
│   ├── /                      View teacher profile
│   └── /edit                  Edit profile
└── /settings
    ├── /                      Settings hub
    ├── /preferences           Theme, locale, density
    ├── /notifications         Notification preferences
    └── /security              Password / sessions (reuse auth capabilities)
```

**Shortcuts (aliases, not duplicate domains):**

- “Grade now” deep link → `/teacher/assignments/[id]/submissions/[id]/grade`
- “Start class” → `/teacher/live/[sessionId]`
- Lessons may also be listed at `/teacher/lessons` as a filtered index into nested edit routes

---

## 5. Module Breakdown

### 5.1 Dashboard

**Purpose:** Daily command center for teaching load.  
**Surfaces:** Upcoming live sessions, grading queue count, attendance gaps, recent enrollments, draft announcements, unread messages, quick continue-course.  
**States:** loading / empty (no courses assigned) / error / populated.  
**Constraints:** Aggregations must be org- and teacher-scoped; never global catalog.

### 5.2 Courses

**Purpose:** CRUD for course metadata, curriculum structure, batches, and course materials.  
**Key entities:** Course, CourseModule, Batch, CourseMaterial.  
**Workflows:** Create → draft → publish (publish may require Admin approval later) → archive.  
**Course-agnostic fields:** title, slug, difficulty, language, duration, price (if shown), thumbnail, description — no subject-specific mandatory fields.

### 5.3 Lessons

**Purpose:** Author lesson content of multiple types (video URL/reference, reading, PDF, exercise placeholder) matching the student lesson engine concepts.  
**Workflows:** Create under module → edit blocks → attach materials → set visibility / unlock rules (future) → preview as student-readable structure.  
**Note:** Full rich video hosting can remain external URL references in early phases.

### 5.4 Assignments

**Purpose:** Define work, collect submissions, grade, feedback.  
**Workflows:** Create (batch/course scoped) → publish → review queue → grade → release grades.  
**Future sibling:** Quizzes (roadmap) — architecturally an Assessment type; implement after core assignment grading unless product prioritizes quizzes earlier.

### 5.5 Live Classes

**Purpose:** Schedule and manage live sessions (platform-agnostic meeting URL; Google Meet generation is a future integration).  
**Workflows:** Schedule → notify → start/join (external) → mark attendance → archive recording link (future).  
**Schema gap:** Planned DB emphasizes `Batches.meeting_link`; architecture introduces **LiveSession** (or equivalent) for per-occurrence scheduling beyond a single batch meeting link.

### 5.6 Students

**Purpose:** Roster of learners in the teacher’s courses/batches; progress and risk signals.  
**Not:** Global CRM or admin user management.  
**Privacy:** Teachers see only students enrolled in their assignments/batches within the org.

### 5.7 Attendance

**Purpose:** Mark present / absent / late / excused per session or date register.  
**Workflows:** Open session → mark → save → export (future).  
**Aligns with:** planned `Attendance` entity (`batch_id`, `student_id`, `attendance_date`, status).

### 5.8 Certificates

**Purpose:** Track eligibility, recommend issuance, show issued records for the teacher’s courses.  
**Teacher vs Admin:** Teachers recommend / confirm completion criteria; Admin or automated pipeline may own final PDF generation, numbering, and public verification (per existing certificate future work).

### 5.9 Announcements

**Purpose:** One-to-many broadcast to a course, batch, or session cohort.  
**Schema gap:** Not in current schema doc — add `Announcements` (+ optional targets) before backend integration.  
**Delivery:** In-app notification fan-out; email optional later.

### 5.10 Messages

**Purpose:** Bounded mentor–student or teacher–cohort messaging (not a general social network).  
**Schema gap:** Needs `MessageThread` / `Message` (or reuse notifications poorly — do not).  
**MVP:** UI + mocks; later REST + optional websocket.

### 5.11 Analytics

**Purpose:** Teaching effectiveness and cohort health.  
**MVP metrics:** enrollment, completion %, avg grade, attendance rate, submission on-time rate.  
**Later:** content engagement, drop-off, cohort comparisons — cached aggregates, not live scans of raw rows at 10k teachers scale.

### 5.12 Profile

**Purpose:** Teacher professional profile mapped to planned `Teachers` table + user identity fields.  
**Fields:** bio, experience, specialization, qualification, avatar (upload later).

### 5.13 Settings

**Purpose:** Preferences (theme, notifications, privacy of contact channels), security shortcuts.  
**Reuse patterns** from student settings IA; preference keys must be role-aware.

---

## 6. Future Backend Integration

**Shared conventions (all modules):**

- Base path: `/api/v1/...` per API standards  
- Envelope: `{ success, message, data }`  
- Auth: JWT; `@Roles('Teacher'|'Admin')` + `@Permissions(...)`  
- Tenancy: resolve `organizationId` from membership; never trust client org id alone  
- Soft delete where appropriate  
- Audit: write `AuditLog` for create/update/grade/issue/attendance mutations  
- Idempotency: important for grade submit and attendance save  

### 6.1 Dashboard

| Concern | Plan |
| --- | --- |
| **API** | `GET /teachers/me/dashboard` aggregate DTO |
| **Database** | Read models over courses, batches, submissions, live sessions, messages |
| **Storage** | None |
| **Caching** | Short TTL cache per teacher+org (e.g. 30–60s) |
| **Notifications** | Counts from notifications service |
| **Search** | Not primary |
| **Logging** | Access log optional |
| **Permissions** | `dashboard.view` (or derive from any teaching permission) |

### 6.2 Courses

| Concern | Plan |
| --- | --- |
| **API** | `/courses` CRUD; `/courses/:id/modules`; `/courses/:id/batches` |
| **Database** | `Courses`, `CourseModules`, `Batches` (+ `organization_id` on all) |
| **Storage** | Thumbnails, materials → S3/Cloudinary |
| **Caching** | Invalidate on publish/update; CDN for thumbnails |
| **Notifications** | Student: course published / curriculum updated |
| **Search** | Title/slug full-text within org |
| **Logging** | Audit course publish/archive |
| **Permissions** | `course.create`, `course.update`, `course.view` (seed today incomplete for Teacher) |

### 6.3 Lessons

| Concern | Plan |
| --- | --- |
| **API** | `/modules/:id/lessons`, `/lessons/:id`, content block PATCH |
| **Database** | `Lessons` (+ future content JSON / blocks table) |
| **Storage** | PDF/notes binaries; video references not necessarily hosted |
| **Caching** | Lesson detail cache; purge on edit |
| **Notifications** | Optional: new lesson available |
| **Search** | Lesson title within course |
| **Logging** | Audit content edits |
| **Permissions** | `lesson.create`, `lesson.update`, `lesson.view` |

### 6.4 Assignments

| Concern | Plan |
| --- | --- |
| **API** | `/assignments`, `/assignments/:id/submissions`, `POST .../grade` |
| **Database** | `Assignments`, `AssignmentSubmissions` |
| **Storage** | Submission files |
| **Caching** | Queue counts on dashboard |
| **Notifications** | Student: assigned / graded; Teacher: submitted |
| **Search** | By title, student name |
| **Logging** | Audit grades (immutable grade history recommended) |
| **Permissions** | `assignment.create`, `assignment.grade`, `assignment.view` |

### 6.5 Live Classes

| Concern | Plan |
| --- | --- |
| **API** | `/live-sessions` CRUD; join metadata endpoint |
| **Database** | New `LiveSessions` (+ batch/course FKs); optional Meet credential store |
| **Storage** | Optional recordings later |
| **Caching** | Upcoming sessions list |
| **Notifications** | Reminder fans (email/push later) |
| **Search** | By title/date |
| **Logging** | Schedule changes audited |
| **Permissions** | `live.create`, `live.update`, `live.view` |

### 6.6 Students

| Concern | Plan |
| --- | --- |
| **API** | `GET /teachers/me/students`, `GET /students/:id/teaching-summary` |
| **Database** | `Students`, `Enrollments`, progress tables (future) |
| **Storage** | Avatar via user profile |
| **Caching** | Roster pages |
| **Notifications** | N/A |
| **Search** | Name/email within allowed enrollments |
| **Logging** | Privacy-sensitive access may be audited |
| **Permissions** | `student.view` (exists in seed; assign to Teacher) |

### 6.7 Attendance

| Concern | Plan |
| --- | --- |
| **API** | `PUT /batches/:id/attendance`, `PUT /live-sessions/:id/attendance` |
| **Database** | `Attendance` |
| **Storage** | None |
| **Caching** | Invalidate analytics |
| **Notifications** | Optional parent/student absentee alerts (future) |
| **Search** | Minimal |
| **Logging** | Audit bulk mark |
| **Permissions** | `attendance.manage` |

### 6.8 Certificates

| Concern | Plan |
| --- | --- |
| **API** | `GET /certificates`, `POST /certificates/recommend`, Admin issue pipeline separate |
| **Database** | `Certificates` |
| **Storage** | PDF artifacts |
| **Caching** | Issued list |
| **Notifications** | Student: issued |
| **Search** | Certificate number / student |
| **Logging** | Strong audit on issue |
| **Permissions** | `certificate.recommend`, `certificate.view` (issue may be Admin-only) |

### 6.9 Announcements

| Concern | Plan |
| --- | --- |
| **API** | `/announcements` CRUD + publish |
| **Database** | New `Announcements`, `AnnouncementTargets` |
| **Storage** | Optional attachments |
| **Caching** | Recent feed |
| **Notifications** | Fan-out to enrolled students |
| **Search** | Title/body |
| **Logging** | Publish/unpublish audit |
| **Permissions** | `announcement.create`, `announcement.publish` |

### 6.10 Messages

| Concern | Plan |
| --- | --- |
| **API** | `/message-threads`, `/messages`; later websocket channel |
| **Database** | New messaging tables |
| **Storage** | Optional attachments |
| **Caching** | Unread counts |
| **Notifications** | New message events |
| **Search** | Thread participants / body (careful PII) |
| **Logging** | Retention policy required |
| **Permissions** | `message.send`, `message.view` |

### 6.11 Analytics

| Concern | Plan |
| --- | --- |
| **API** | `/teachers/me/analytics`, course/batch scoped |
| **Database** | Prefer aggregate tables / materialized views over raw scans |
| **Storage** | None |
| **Caching** | Aggressive (5–15 min) |
| **Notifications** | Weekly digest (future) |
| **Search** | N/A |
| **Logging** | Query cost monitoring |
| **Permissions** | `analytics.view` |

### 6.12 Profile & Settings

| Concern | Plan |
| --- | --- |
| **API** | `/teachers/me`, `/users/me/preferences` |
| **Database** | `Teachers`, `Users`, preferences JSON / table |
| **Storage** | Avatar |
| **Caching** | Profile GET |
| **Notifications** | Preference-gated |
| **Search** | N/A |
| **Logging** | Profile changes |
| **Permissions** | `teacher.update` (self), `profile.view` |

### 6.13 Recommended permission catalogue (Teacher seed)

Assign to **Teacher** role (org-scoped enforcement later):

`course.view`, `course.create`, `course.update`,  
`lesson.view`, `lesson.create`, `lesson.update`,  
`assignment.view`, `assignment.create`, `assignment.grade`,  
`live.view`, `live.create`, `live.update`,  
`student.view`, `attendance.manage`,  
`certificate.view`, `certificate.recommend`,  
`announcement.create`, `announcement.publish`,  
`message.view`, `message.send`,  
`analytics.view`, `teacher.update`

Admin retains broader set including issue/approve/payment.

---

## 7. Component Strategy

Reuse `@graphology/ui` primitives. Do not fork Button/Badge/Card.

| Layer | Location (proposed) | Examples |
| --- | --- | --- |
| **Layout** | `components/teacher/layout/` | `TeacherShell`, sidebar, topbar, context bar, breadcrumbs |
| **Shared** | `components/teacher/shared/` + reuse `components/dashboard/shared` patterns | Search, filters, empty/error/skeleton, stat grids |
| **Domain** | `components/teacher/<module>/` | Course card (teacher), submission row, attendance matrix |
| **Forms** | Domain + shared form controls | Course form, lesson editor form, grade form (RHF + Zod later) |
| **Tables** | Shared data-table wrapper | Submissions, roster, attendance |
| **Dialogs** | Shared confirm / form dialogs | Delete lesson, publish announcement |
| **Charts** | `components/teacher/analytics/` | Completion, attendance — library TBD (lightweight) |
| **Editors** | Lesson content editor (block list first; rich text later) | Reading blocks, PDF attach metadata |
| **Uploaders** | Shared uploader shell (disabled until storage) | Thumbnail, materials, submissions (teacher re-upload rare) |

**Reuse from Student Portal:** design tokens, EmptyState/ErrorState patterns, badge vocabularies where semantics match (status, difficulty).  
**Do not reuse:** student “My Learning” consumption cards as-is; teacher needs authoring CTAs and draft/publish states.

---

## 8. Folder Structure

Proposed frontend (apps/web) — parallel to student dashboard, not nested inside it:

```text
apps/web/
├── app/teacher/
│   ├── layout.tsx
│   ├── page.tsx                          # dashboard
│   ├── courses/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [courseId]/
│   │       ├── page.tsx
│   │       ├── edit/page.tsx
│   │       ├── curriculum/page.tsx
│   │       ├── materials/page.tsx
│   │       ├── batches/...
│   │       └── modules/[moduleId]/lessons/...
│   ├── live/...
│   ├── assignments/...
│   ├── students/...
│   ├── attendance/...
│   ├── certificates/...
│   ├── announcements/...
│   ├── messages/...
│   ├── analytics/...
│   ├── notifications/page.tsx
│   ├── profile/...
│   └── settings/...
├── components/teacher/
│   ├── layout/
│   ├── shared/
│   ├── dashboard/
│   ├── courses/
│   ├── lessons/
│   ├── live/
│   ├── assignments/
│   ├── students/
│   ├── attendance/
│   ├── certificates/
│   ├── announcements/
│   ├── messages/
│   ├── analytics/
│   ├── profile/
│   └── settings/
└── lib/teacher/
    ├── index.ts
    ├── nav.config.ts
    ├── routes.ts
    ├── permissions.ts                    # client gate map (future)
    ├── format-date.ts                    # or reuse dashboard formatters
    └── mock-*.ts                         # mock DTOs until APIs exist
```

Proposed backend (later, Nest modules — names only):

```text
apps/api/src/modules/
├── teachers/
├── courses/
├── batches/
├── lessons/
├── live-sessions/
├── assignments/
├── attendance/
├── certificates/
├── announcements/
├── messages/
└── analytics/
```

Proposed schema additions (conceptual): `LiveSessions`, `Announcements`, messaging tables, `organization_id` on LMS entities, grade history.

---

## 9. Routing Strategy

### 9.1 Portal separation

| Audience | Base path | Shell |
| --- | --- | --- |
| Student | `/dashboard` | Existing student shell |
| Teacher | `/teacher` | New teacher shell |
| Admin (future) | `/admin` | Separate |

**Post-login routing:** role-aware redirect. Users with multiple roles need an account switcher or explicit portal picker (decide in 06.01).

### 9.2 Guards (frontend)

- Auth required for `/teacher/**`
- Role/permission client checks for UX; server is authoritative
- Missing course access → not-found or forbidden page (do not leak titles)

### 9.3 Route tree

Full tree as in §4. Dynamic segments only: `courseId`, `moduleId`, `lessonId`, `batchId`, `sessionId`, `assignmentId`, `submissionId`, `studentId`, `certificateId`, `announcementId`, `threadId`.

### 9.4 Deep linking

All grading and attendance URLs must be bookmarkable for support and notifications.

---

## 10. DTO Strategy

No implementation in this phase. Naming conventions:

- Suffix `Dto` for transport shapes (`TeacherCourseDto`, `SubmissionGradeDto`)
- Separate **list**, **detail**, **create**, **update**, **mutate response** types
- Never embed Graphology-specific enums (`HandwritingTrait` etc.) in core DTOs
- Prefer string unions for statuses that match student portal language where shared (`draft | published | archived`)
- Money, dates: ISO-8601 strings; display formatting in UI helpers
- Multi-tenancy: `organizationId` on server entities; omit from client create payloads when inferred from session

### 10.1 Illustrative DTO families (names only)

- `TeacherDashboardDto`
- `TeacherCourseSummaryDto` / `TeacherCourseDetailDto` / `UpsertCourseDto`
- `ModuleDto` / `LessonDetailDto` / `UpsertLessonDto` / `LessonMaterialDto`
- `BatchDto` / `UpsertBatchDto`
- `LiveSessionDto` / `UpsertLiveSessionDto`
- `AssignmentDto` / `SubmissionDto` / `GradeSubmissionDto`
- `StudentRosterItemDto` / `StudentTeachingProfileDto`
- `AttendanceRecordDto` / `UpsertAttendanceDto`
- `CertificateCandidateDto` / `CertificateDto`
- `AnnouncementDto` / `UpsertAnnouncementDto`
- `MessageThreadDto` / `MessageDto`
- `TeacherAnalyticsOverviewDto` / `CourseAnalyticsDto`
- `TeacherProfileDto` / `TeacherSettingsDto`

Mock modules in `lib/teacher/mock-*.ts` should mirror these names so API swap is mechanical.

---

## 11. Accessibility Strategy

Align with student portal 05.10 bar and platform UI guidelines:

1. Semantic landmarks for shell (nav, main, complementary context bar)
2. Keyboard complete paths for tables, dialogs, editors, attendance grids
3. Visible focus rings on all interactive controls
4. Status not by color alone (badges + text)
5. ARIA labels on icon-only actions (grade, publish, join)
6. Live regions for save/grade success/error toasts
7. `prefers-reduced-motion` honored for transitions
8. Charts: text summary + tabular alternative
9. Forms: associated labels, error linkage, disabled upload affordances clearly stated as “coming soon” when mocked
10. Attendance matrices: row/column headers announced for screen readers

---

## 12. Performance Strategy

1. **Route-level code splitting** per teacher module  
2. **List virtualization** for large rosters / submission queues  
3. **Paginated APIs** from day one of backend wiring  
4. **Dashboard aggregate endpoint** instead of 8 client waterfalls  
5. **Optimistic UI carefully** for attendance toggles; **pessimistic** for grades until confirmed  
6. **Asset pipelines** for images (responsive thumbnails)  
7. **Prefetch** next likely route (course → curriculum) on hover where cheap  
8. **Analytics pre-aggregation** — never compute 10k-teacher rollups in request path from raw submissions  
9. Match transition timing to design tokens (200ms + reduced motion)  
10. Avoid shipping student portal mock bundles into teacher routes (separate `lib/teacher`)

---

## 13. Scalability Strategy

### 10 teachers (single academy)

- Modular monolith is enough  
- Mock-first UI then CRUD APIs  
- Single-region Postgres  
- Direct queries with indexes on FKs  

### 100 teachers (multi-batch pressure)

- Permission caching (ADR-006 consequence)  
- Dashboard and analytics caching  
- Object storage for materials/submissions  
- Background jobs for announcement fan-out and certificate PDF  
- Connection pooling; ranked indexes for `(organization_id, teacher_id)`, `(batch_id, due_date)`  

### 10,000 teachers (SaaS)

- Strict org partitioning on every query  
- Read replicas for analytics  
- Queue workers (notifications, email, PDFs, Meet provisioning)  
- Consider extracting messaging / notifications services later without rewriting domain modules  
- Rate limits on grade/attendance bulk writes  
- Multi-org teacher accounts with explicit org switcher  
- Observability: per-module latency, queue depth, storage growth  
- Optional: shard or region strategies only when metrics demand — keep modular monolith until then  

---

## 14. Technical Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| LMS tables not in Prisma yet | Blocks real APIs | Schema sprint before teacher API wiring; UI mocks unblock UX |
| Teacher role has zero seeded permissions | Authz always 403 or over-reliance on roles alone | Seed Teacher permission set; tests for `/api/v1/test/teacher` + future controllers |
| Graphology hardcoding drift | Platform cannot launch new courses cleanly | Lint/content review; config-driven copy; no subject enums in core |
| Student `/dashboard` vs teacher confusion | Wrong shell, leaked nav | Separate `/teacher` tree + role redirect |
| Batch vs LiveSession ambiguity | Fragile scheduling | Introduce explicit LiveSession entity early in schema design |
| Announcements/Messages missing in schema | Feature fake forever | Add tables in same LMS schema wave |
| File upload + malware / cost | Storage abuse | Signed uploads, size/type limits, virus scan later |
| Grade disputes / audit gaps | Trust failure | Immutable grade history events |
| Meet link generation coupling | Vendor lock | Store opaque `meetingUrl` + `meetingProvider` |
| Dual role users | Ambiguous home | Portal picker / last-used portal preference |
| Analytics expensive queries | Outages at scale | Aggregate tables from start of analytics backend |
| Over-building quizzes early | Delay MVP teaching loop | Keep quizzes as explicit later sprint |
| Sharing student components incorrectly | Wrong UX states | Separate `components/teacher`; share only primitives/patterns |

---

## 15. Recommended Engineering Sprint Breakdown

UI-first where useful (match student Phase 04), with a schema/RBAC foundation early so APIs are not blocked.

| Sprint | Name | Outcome |
| --- | --- | --- |
| **06.01** | Teacher Portal Shell | `/teacher` layout, sidebar/topbar/context bar, nav config, auth role redirect, empty dashboard shell, mock nav pages Coming Soon |
| **06.02** | RBAC & Teacher Identity Foundation | Seed Teacher permissions; `Teachers` profile model plan/impl; `/teachers/me` contract; client permission map (docs + backend minimal) |
| **06.03** | LMS Schema Wave | Prisma: courses, modules, lessons, batches, enrollments, assignments, submissions, attendance, certificates (+ org ids); migrations; no full UI required |
| **06.04** | Courses & Batches UI | Course list/detail/create/edit, curriculum outline, batch CRUD — mock first, wire list/detail when schema ready |
| **06.05** | Lessons & Materials UI | Lesson create/edit/preview, materials uploader shell (disabled or signed-upload stub) |
| **06.06** | Live Classes UI | Schedule list/detail, meeting URL fields, reminders UX; LiveSession model alignment |
| **06.07** | Assignments & Grading UI | Assignment CRUD, submission queue, grade/feedback views |
| **06.08** | Students & Attendance UI | Roster, student teaching profile, attendance register/matrix |
| **06.09** | Certificates UI | Candidates, issued list, recommend flow (issue may stay Admin) |
| **06.10** | Announcements & Messages UI | Broadcast composer + inbox/thread mocks |
| **06.11** | Analytics UI | Overview + course/batch charts with mock series |
| **06.12** | Profile, Settings, Notifications | Teacher profile/settings + teacher notification center |
| **06.13** | API Integration Wave A | Courses, lessons, batches, live sessions wired |
| **06.14** | API Integration Wave B | Assignments grading, attendance, certificates recommend |
| **06.15** | API Integration Wave C | Announcements, messages, analytics aggregates, uploads |
| **06.16** | Teacher Portal Stabilization | Consistency, a11y, performance, dead code — mirror 05.10 |

**Optional stretch (post-completion or interleaved):** Quizzes / Assessments (06.17), Calendar unified view, Google Meet provisioning, recording attachments.

---

## Engineering recommendations

1. **Keep portals separate** (`/dashboard` vs `/teacher` vs future `/admin`) — shared design system, not shared shells.  
2. **Fix Teacher RBAC in or before 06.02** — otherwise every “backend integration” sprint stalls on 403s.  
3. **Treat Batches as first-class** even though the 06.00 module list folds them under Courses — they drive attendance, live delivery, and many assignments.  
4. **Close schema gaps early:** LiveSession, Announcements, Messages, `organization_id` on LMS tables.  
5. **Mock DTOs named for production** (`lib/teacher`) so integration is rename-and-fetch, not redesign.  
6. **Defer quizzes** until assignment grading works end-to-end.  
7. **Certificate PDF generation stays shared platform service** — teacher recommends; pipeline issues.  
8. **Reuse student shared primitive ideas**, not student domain components.  
9. **Brand** remains Zaavero Learn in UI; Graphology only as sample course data.  
10. **Update** `PROJECT_STATE` and add sprint prompts `06.01+` under `docs/prompts/phase-05-teacher-portal/` after this architecture is accepted.

---

## Suggested sprint plan (summary)

```text
06.01 Shell
06.02 RBAC + Teacher identity
06.03 LMS schema
06.04 Courses + batches UI
06.05 Lessons + materials UI
06.06 Live classes UI
06.07 Assignments + grading UI
06.08 Students + attendance UI
06.09 Certificates UI
06.10 Announcements + messages UI
06.11 Analytics UI
06.12 Profile + settings + notifications
06.13–06.15 API integration waves
06.16 Stabilization
```

---

## Acceptance of this architecture document

This file is the source of truth for Teacher Portal planning until superseded by ADR or a later architecture revision. Implementation sprints must not introduce Graphology-specific domain hardcoding and must not merge teacher IA into the student `/dashboard` tree.
