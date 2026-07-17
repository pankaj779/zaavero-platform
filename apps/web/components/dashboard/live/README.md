# Live Classes domain

Student Live Classes UI for `/dashboard/live`.

## Scope

- Placeholder catalog only (`lib/dashboard/mock-live.ts`)
- No Google Meet / Zoom join
- No notifications, attendance, or recording playback

## Architecture

- Server page loads `LivePageView`
- Client only for countdown timer and calendar month navigation
- DTO shape mirrors future live-class API responses

## Extending

Add fields to `LiveClassDto` / `futureFeatures` first, then wire UI.
Do not invent meeting URLs.
