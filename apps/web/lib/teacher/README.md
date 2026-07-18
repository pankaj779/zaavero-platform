# Teacher Portal data (`lib/teacher`)

Teacher Portal view-model types for the production-ready Teacher Portal. Module workspaces load through `lib/api/` and NestJS. Only fields that the backend truly does not expose remain honest unsupported defaults.

## Core files

| File                      | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `copy.ts`                 | Shared coming-soon copy (`TEACHER_COMING_SOON`) for unsupported integrations |
| `nav.config.ts`           | Sidebar navigation (`teacherNavItems`) and per-route page metadata           |
| `dashboard-types.ts`      | Dashboard DTOs and loading/error copy                                        |
| `analytics-types.ts`      | Analytics DTOs, copy, and overview aggregation helpers                       |
| `course-types.ts`         | Course workspace DTOs, copy, stats helpers, API query mappers                |
| `batch-types.ts`          | Batch workspace DTOs, copy, stats helpers, API query mappers                 |
| `student-types.ts`        | Student workspace DTOs, copy, stats helpers, API query mappers               |
| `lesson-types.ts`         | Lesson workspace DTOs, copy, stats helpers, API query mappers                |
| `live-session-types.ts`   | Live-class workspace DTOs, copy, stats helpers, API query mappers            |
| `attendance-types.ts`     | Attendance workspace DTOs, copy, stats helpers, API query mappers            |
| `assignment-types.ts`     | Assignment workspace DTOs, copy, stats helpers, API query mappers            |
| `submission-types.ts`     | Submission workspace DTOs, copy, stats helpers, API query mappers            |
| `certificate-types.ts`    | Certificate workspace DTOs, copy, stats helpers, API query mappers           |
| `calendar-types.ts`       | Calendar workspace DTOs, copy, month helpers, API query mappers              |
| `notification-types.ts`   | Notification workspace DTOs, copy, stats helpers, API query mappers          |
| `message-types.ts`        | Conversation/message DTOs, copy, filtering, API query mappers                |
| `mock-teacher-profile.ts` | Profile/settings DTO defaults for fields auth does not expose yet            |
| `index.ts`                | Public barrel — import Teacher Portal helpers from here                      |

## Live modules

| Module             | Route                                   | Data source                                       |
| ------------------ | --------------------------------------- | ------------------------------------------------- |
| Dashboard          | `/teacher`                              | `lib/api/dashboard.ts` (aggregates existing APIs) |
| Courses            | `/teacher/courses`                      | `lib/api/course.ts`                               |
| Batches            | `/teacher/batches`                      | `lib/api/batch.ts`                                |
| Students           | `/teacher/students`                     | `lib/api/enrollment.ts`                           |
| Lessons            | `/teacher/lessons`                      | `lib/api/lesson.ts`                               |
| Live Classes       | `/teacher/live`                         | `lib/api/live-session.ts`                         |
| Attendance         | `/teacher/attendance`                   | `lib/api/attendance.ts`                           |
| Assignments        | `/teacher/assignments`                  | `lib/api/assignment.ts`                           |
| Submissions        | `/teacher/submissions`                  | `lib/api/submission.ts`                           |
| Certificates       | `/teacher/certificates`                 | `lib/api/certificate.ts`                          |
| Calendar           | `/teacher/calendar`                     | `lib/api/calendar.ts`                             |
| Notifications      | `/teacher/notifications`                | `lib/api/notification.ts`                         |
| Messages           | `/teacher/messages`                     | `lib/api/messaging.ts`                            |
| Analytics          | `/teacher/analytics`                    | `lib/api/analytics.ts` (aggregates existing APIs) |
| Profile / Settings | `/teacher/profile`, `/teacher/settings` | Auth identity + unsupported-field defaults        |

## Remaining unsupported surfaces

These stay disabled or empty because the NestJS backend does not expose them yet:

- Avatar upload, bio/qualifications editing, OAuth linking, password/2FA
- Report export/email/compare for Analytics
- Attachment downloads / storage metadata
- Meeting-provider provisioning and calendar sync
- Student satisfaction surveys

Import teacher helpers from `lib/teacher`. Import NestJS clients from `lib/api`.
