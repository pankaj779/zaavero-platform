# Notifications domain

Student notifications center for `/dashboard/notifications`.

## Scope

- Placeholder catalog only (`lib/dashboard/mock-notifications.ts`)
- No WebSockets, push, email, or deep links
- `actionUrl` always `null`; Open / Mark as Read / Archive disabled

## Architecture

- Server page loads `NotificationsView`
- Client for search, filter, sort, and selection
- DTO mirrors future `/student/notifications` responses
