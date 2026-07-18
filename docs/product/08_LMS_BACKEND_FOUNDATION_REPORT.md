# LMS Backend Foundation Report

Version: 1.0  
Status: Architecture preparation only — **no migrations applied**  
Sprint: Phase 06.14  
Related: [Teacher Portal Architecture](./07_TEACHER_PLATFORM_ARCHITECTURE.md) · [Database Schema](../03_DATABASE_SCHEMA.md) · [PROJECT_STATE](../prompts/PROJECT_STATE.md)

---

## Document purpose

This report reviews the **current Prisma schema** against the LMS entities required by both the Student Portal and Teacher Portal. It identifies gaps, recommended relations, future indexes/constraints, and RBAC needs.

**Out of scope for this sprint:** Prisma migrations, database changes, API modules, frontend changes.

---

## 1. Existing schema

### 1.1 What is implemented in Prisma today

Source: `packages/database/prisma/schema.prisma`

| Area        | Models / enums                                                   | Notes                                            |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| Identity    | `User`                                                           | Auth identity; soft-delete via `deletedAt`       |
| Tenancy     | `Organization`, `OrganizationMember`, `OrganizationMemberStatus` | Multi-org membership                             |
| RBAC        | `Role`, `Permission`, `UserRole`, `RolePermission`               | Roles include system `Admin` / `Teacher` in seed |
| Auth tokens | `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`   | Auth flows                                       |
| Ops         | `AuditLog`, `SystemSetting`                                      | Audit + key/value settings                       |

### 1.2 What is **not** in Prisma

There are **no** LMS teaching/learning tables in Prisma. Planned entities exist only as documentation in `docs/03_DATABASE_SCHEMA.md` and teacher architecture notes.

### 1.3 Seed / RBAC reality check

- Roles seeded: `Admin`, `Teacher`, `Student`, `Parent` (system roles).
- Permissions are seeded and attached to **Admin only**.
- Teacher role exists but receives **no permissions** — blocks any permission-guarded teacher API until a seed wave lands.

---

## 2. Expected LMS entities vs Prisma

Checklist from Sprint 06.14 (and related portal needs):

| Expected entity      | In Prisma?  | In schema doc?                                   | Gap                                                   |
| -------------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------- |
| Course               | **Missing** | Planned                                          | Required                                              |
| Batch                | **Missing** | Planned                                          | Required                                              |
| Enrollment           | **Missing** | Planned                                          | Required                                              |
| Lesson               | **Missing** | Planned (under modules)                          | Required                                              |
| LessonProgress       | **Missing** | Not explicit                                     | Required for student player                           |
| LiveSession          | **Missing** | Called out as schema gap in teacher architecture | Required (batch `meeting_link` alone is insufficient) |
| Attendance           | **Missing** | Planned (batch + date oriented)                  | Required; should bind to LiveSession                  |
| Assignment           | **Missing** | Planned (batch-scoped)                           | Required                                              |
| AssignmentSubmission | **Missing** | Planned                                          | Required                                              |
| Certificate          | **Missing** | Planned                                          | Required                                              |
| CertificateTemplate  | **Missing** | Not in schema doc                                | Required for teacher certificate engine               |
| Message              | **Missing** | Not in schema doc                                | Required                                              |
| Conversation         | **Missing** | Not in schema doc                                | Required                                              |
| Notification         | **Missing** | Planned                                          | Required                                              |
| CalendarEvent        | **Missing** | Not in schema doc                                | Optional projection vs first-class table (see §5)     |

### 2.1 Additional entities implied by docs / portals

| Entity                           | Why                                                                      |
| -------------------------------- | ------------------------------------------------------------------------ |
| `CourseModule`                   | Curriculum hierarchy: Course → Module → Lesson                           |
| `TeacherProfile` (or `Teachers`) | Professional fields beyond `User` (bio, qualifications, specializations) |
| `StudentProfile` (or `Students`) | Learner profile distinct from auth `User`                                |
| `Announcement`                   | Teacher one-to-many broadcast (architecture gap)                         |
| `Organization` FK on LMS rows    | Multi-tenancy (ADR / teacher architecture)                               |

---

## 3. Relationship verification

### 3.1 Required teaching chain

```text
Teacher (User + Teacher role / TeacherProfile)
        ↓ teaches / owns
Course
        ↓ contains
Batch
        ↓ enrolls
Enrollment
        ↓ links
Student (User + Student role / StudentProfile)
```

**Status:** Chain is **architecturally correct** but **entirely unimplemented** in Prisma. No foreign keys exist for Teacher→Course→Batch→Enrollment→Student.

### 3.2 Recommended extended graph (future migration wave)

```text
Organization
  └── Course (organizationId, primaryTeacherId)
        ├── CourseModule
        │     └── Lesson
        │           └── LessonProgress (studentId, lessonId, enrollmentId?)
        ├── Batch (courseId, teacherId)
        │     ├── Enrollment (batchId, courseId, studentId)
        │     ├── LiveSession (batchId)
        │     │     └── AttendanceRecord (liveSessionId, studentId)
        │     └── Assignment (batchId and/or courseId)
        │           └── AssignmentSubmission (assignmentId, studentId)
        ├── CertificateTemplate (courseId nullable for org defaults)
        └── Certificate (studentId, courseId, templateId?, batchId?)

Conversation
  ├── ConversationParticipant (userId)
  └── Message (conversationId, senderId)

Notification (userId)

Announcement (organizationId, courseId?, batchId?, authorId)

CalendarEvent — see recommendation below
```

### 3.3 Missing relations (summary)

| From                 | To                            | Relation needed                                 |
| -------------------- | ----------------------------- | ----------------------------------------------- |
| Course               | Organization                  | Many courses per org                            |
| Course               | User (teacher)                | Ownership / primary instructor                  |
| Batch                | Course                        | Batches belong to a course                      |
| Batch                | User (teacher)                | Batch instructor (may differ from course owner) |
| Enrollment           | Batch + Course + Student      | Unique student per batch (and usually course)   |
| Lesson               | CourseModule → Course         | Curriculum path                                 |
| LessonProgress       | Lesson + Student              | Progress tracking                               |
| LiveSession          | Batch                         | Per-occurrence schedule                         |
| Attendance           | LiveSession + Student         | Prefer over batch+date-only                     |
| Assignment           | Batch (and optionally Course) | Teaching unit scope                             |
| AssignmentSubmission | Assignment + Student          | Unique submission per student/assignment        |
| Certificate          | Student + Course (+ template) | Issuance ledger                                 |
| Message              | Conversation + User           | Threaded messaging                              |
| Notification         | User                          | In-app notifications                            |

---

## 4. Missing tables (migration candidates — not applied)

Ordered for a future **LMS Schema Wave** (do not run now):

1. **Profiles:** `TeacherProfile`, `StudentProfile` (1:1 with `User`)
2. **Catalog:** `Course`, `CourseModule`, `Lesson`
3. **Delivery:** `Batch`, `Enrollment`
4. **Live:** `LiveSession`, `Attendance` (or `AttendanceRecord`)
5. **Work:** `Assignment`, `AssignmentSubmission`
6. **Progress:** `LessonProgress`
7. **Credentials:** `CertificateTemplate`, `Certificate`
8. **Engage:** `Conversation`, `ConversationParticipant`, `Message`, `Announcement`, `Notification`
9. **Optional:** `CalendarEvent` (or view/materialized projection)

---

## 5. Recommended migrations (future only — DO NOT generate now)

Proposed wave names (illustrative):

| Wave                         | Contents                                                                |
| ---------------------------- | ----------------------------------------------------------------------- |
| `lms_01_profiles_org`        | Teacher/Student profiles; ensure `organizationId` strategy on LMS roots |
| `lms_02_catalog`             | Course, CourseModule, Lesson                                            |
| `lms_03_batches_enrollments` | Batch, Enrollment                                                       |
| `lms_04_live_attendance`     | LiveSession, Attendance                                                 |
| `lms_05_assignments`         | Assignment, AssignmentSubmission                                        |
| `lms_06_progress`            | LessonProgress                                                          |
| `lms_07_certificates`        | CertificateTemplate, Certificate                                        |
| `lms_08_engage`              | Conversation/Message, Announcement, Notification                        |
| `lms_09_calendar`            | CalendarEvent **or** document as derived feed                           |

### 5.1 CalendarEvent decision

**Recommendation:** Prefer a **derived calendar feed** (union of LiveSession, Assignment due dates, office-hours markers, holidays) for v1. Introduce a first-class `CalendarEvent` table only if teachers need personal reminders / org holidays that are not already modeled.

### 5.2 Attendance decision

Schema doc models Attendance as `batch_id + student_id + attendance_date`. Teacher Portal UX marks attendance **per live session**.

**Recommendation:** Model Attendance against `LiveSession` (+ student). Keep batch-level aggregates as queries, not the source of truth.

### 5.3 Assignment scope

Schema doc is batch-scoped; Teacher UI allows multi-batch assignment.

**Recommendation:** `Assignment` with `courseId` required; junction `AssignmentBatch` for one-to-many batches (or nullable `batchId` for single-batch MVP, then expand).

---

## 6. Recommended enums (future Prisma — not added this sprint)

Enums were **not** written into `schema.prisma` (no DB modification this sprint). Add in the LMS migration wave:

| Enum                      | Suggested values                                                  |
| ------------------------- | ----------------------------------------------------------------- |
| `CourseDifficulty`        | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`                            |
| `CoursePublishStatus`     | `DRAFT`, `PUBLISHED`, `ARCHIVED`                                  |
| `BatchStatus`             | `UPCOMING`, `ACTIVE`, `COMPLETED`, `CANCELLED`                    |
| `EnrollmentPaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `WAIVED`                 |
| `EnrollmentStatus`        | `ACTIVE`, `COMPLETED`, `DROPPED`, `SUSPENDED`                     |
| `LessonContentType`       | `VIDEO`, `PDF`, `READING`, `EXERCISE`, `LIVE` (align with player) |
| `LessonProgressStatus`    | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`                         |
| `LiveSessionStatus`       | `SCHEDULED`, `LIVE`, `COMPLETED`, `CANCELLED`                     |
| `MeetingProvider`         | `NONE`, `ZOOM`, `GOOGLE_MEET`, `CUSTOM`                           |
| `AttendanceStatus`        | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`                            |
| `AssignmentStatus`        | `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`                        |
| `SubmissionStatus`        | `PENDING`, `SUBMITTED`, `GRADED`, `RETURNED`, `LATE`              |
| `CertificateStatus`       | `ELIGIBLE`, `PENDING`, `ISSUED`, `REVOKED`                        |
| `ConversationType`        | `STUDENT`, `BATCH`, `SUPPORT` (course-agnostic)                   |
| `NotificationType`        | domain-specific string enum or typed string + check               |
| `AnnouncementStatus`      | `DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`                     |

---

## 7. Future indexes

| Table                | Indexes                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Course               | `(organization_id)`, `(slug)` unique per org, `(teacher_id)`, `(published/status)`, `(created_at)` |
| Batch                | `(course_id)`, `(teacher_id)`, `(status)`, `(start_date)`                                          |
| Enrollment           | unique `(batch_id, student_id)`; indexes on `(course_id)`, `(student_id)`, `(payment_status)`      |
| Lesson               | `(module_id, display_order)`                                                                       |
| LessonProgress       | unique `(lesson_id, student_id)`; `(student_id)`, `(status)`                                       |
| LiveSession          | `(batch_id, starts_at)`, `(status)`                                                                |
| Attendance           | unique `(live_session_id, student_id)`; `(student_id)`                                             |
| Assignment           | `(course_id)`, `(due_at)`, `(status)`                                                              |
| AssignmentSubmission | unique `(assignment_id, student_id)`; `(status)`, `(submitted_at)`                                 |
| Certificate          | unique `(certificate_number)`; `(student_id)`, `(course_id)`, `(status)`                           |
| Message              | `(conversation_id, created_at)`                                                                    |
| Notification         | `(user_id, read, created_at)`                                                                      |
| Announcement         | `(organization_id, published_at)`, `(course_id)`, `(batch_id)`                                     |

---

## 8. Future constraints

| Constraint                 | Purpose                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Org scoping                | Every LMS root row carries `organization_id`; queries always filter by active membership            |
| Soft deletes               | Align LMS entities with `deletedAt` where content is recoverable; hard-delete tokens/logs as today  |
| Referential actions        | Prefer `Restrict` on enrollments/submissions; `Cascade` carefully on draft content                  |
| Uniqueness                 | Slug unique per organization; certificate numbers globally unique; one enrollment per student/batch |
| Meeting URL nullability    | Keep `meetingUrl` nullable until provider provisioning exists                                       |
| Download/verification URLs | Certificate download/verification URLs nullable until engine lands                                  |
| Check constraints          | `end_at >= start_at` on sessions; non-negative marks; capacity ≥ enrolled (app or DB check)         |

---

## 9. Future RBAC needs

### 9.1 Immediate gap

Teacher role is seeded **without** permissions. Any Nest permission guard will deny teacher users until permissions are attached.

### 9.2 Recommended Teacher permission set

From Teacher Portal Architecture §6.13 (assign to Teacher role; enforce org + resource ownership in services):

- `course.view`, `course.create`, `course.update`
- `lesson.view`, `lesson.create`, `lesson.update`
- `assignment.view`, `assignment.create`, `assignment.grade`
- `live.view`, `live.create`, `live.update`
- `student.view`, `attendance.manage`
- `certificate.view`, `certificate.recommend`
- `announcement.create`, `announcement.publish`
- `message.view`, `message.send`
- `analytics.view`, `teacher.update`

### 9.3 Student permission set (portal wiring)

Separate student catalogue (examples): `course.enroll`, `lesson.view`, `assignment.submit`, `live.join`, `certificate.view`, `message.send`, `notification.view` — seed when student APIs leave mock mode.

### 9.4 Enforcement layers

1. JWT + role
2. Permission guards on controllers
3. Organization membership on every LMS query
4. Resource ownership (teacher must teach the course/batch; student must be enrolled)

---

## 10. Alignment with portal mock DTOs

| Portal mock domain                 | Future table(s)                               |
| ---------------------------------- | --------------------------------------------- |
| Teacher courses / student learning | `Course`, `CourseModule`, `Lesson`            |
| Teacher batches                    | `Batch`                                       |
| Teacher students / enrollments     | `Enrollment`, `StudentProfile`                |
| Teacher/student live               | `LiveSession`                                 |
| Teacher/student attendance         | `Attendance`                                  |
| Teacher/student assignments        | `Assignment`, `AssignmentSubmission`          |
| Certificates                       | `Certificate`, `CertificateTemplate`          |
| Messages                           | `Conversation`, `Message`                     |
| Notifications                      | `Notification`                                |
| Calendar                           | Derived feed and/or `CalendarEvent`           |
| Teacher profile/settings           | `TeacherProfile` + preference columns or JSON |

Mock DTOs remain valid until these tables and APIs exist; wiring should be a mechanical swap.

---

## 11. Explicit non-actions this sprint

- No Prisma schema edits
- No migrations generated or applied
- No database mutations
- No API module scaffolding beyond this report
- No frontend changes

---

## 12. Recommended next engineering steps

1. **RBAC seed wave** — attach Teacher (and Student) permission catalogues; add tests.
2. **LMS Schema Wave** — implement tables in the migration order above; keep course-agnostic and org-scoped.
3. **Teacher identity** — `TeacherProfile` + `/teachers/me` contract.
4. **API modules** — courses/batches first, then live/assignments/attendance, then certificates/messaging.
5. **Portal wiring** — replace mock loaders module-by-module without redesigning UI.
