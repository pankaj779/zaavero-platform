# Assignments domain

Student assignments UI for `/dashboard/assignments`.

## Scope

- Placeholder catalog only (`lib/dashboard/mock-assignments.ts`)
- No uploads, grading, teacher workflow, or notifications
- Honest nulls for marks, feedback, and submission files

## Architecture

- Server page loads `AssignmentsView`
- Client for search, filter, sort, and selected-details state
- DTO shape mirrors future assignment API responses

## Extending

Flip `futureFeatures` and fill nullable fields when backend lands.
Do not invent grades, feedback, or uploaded files.
